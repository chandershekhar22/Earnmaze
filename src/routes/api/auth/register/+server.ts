import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';
import { createSession, createUser, getUserByEmail, db } from '$lib/db';
import { claimExplorationEntries } from '$lib/server/exploration-points.server';
import { validateTurnstileToken } from '$lib/server/turnstile';
import type { RegisterResponse, AuthUserResponse } from '$lib/types/api-responses';
import { getUserByReferralCode } from '$lib/db/repositories/auth.repository.server';
import { referrals } from '$lib/db/schema/transactions';
import { user as userTable } from '$lib/db/schema/auth';
import { eq } from 'drizzle-orm';
import { recordConsent } from '$lib/server/email-consent';
import { Logger } from '$lib/utils/app-logger';
import { authRateLimit } from '$lib/server/rate-limit';
import { registerSchema, validateInput } from '$lib/validation/api-schemas';
import { getClientIP } from '$lib/server/geo-restriction';
import { notifyUpdate } from '$lib/utils/telegram';
import { maskEmail } from '$lib/utils/mask';
import { sendWelcomeEmail } from '$lib/server/email-service';

const REFERRER_BONUS = 50; // survey points, credited to the referrer
const REFERRED_BONUS = 50; // exploration points, credited to the new signup

export const POST: RequestHandler = async (event) => {
	const rateLimited = await authRateLimit(event);
	if (rateLimited) return rateLimited;

	const { request, cookies, getClientAddress } = event;
	try {
		const body = await request.json();
		const validation = await validateInput(registerSchema, body);
		if (!validation.success) {
			return json({ error: validation.error }, { status: 400 });
		}

		const {
			email,
			password,
			name,
			turnstileToken,
			referralCode,
			utmSource,
			utmMedium,
			utmCampaign,
			registrationSource,
			marketingConsent,
		} = validation.data;

		// Verify Turnstile token
		const turnstileError = await validateTurnstileToken(turnstileToken, getClientIP(event));
		if (turnstileError) {
			return json({ error: turnstileError }, { status: 400 });
		}

		const normalizedEmail = email; // loginSchema already lowercases + trims

		// Check if user already exists
		const existingUser = await getUserByEmail(normalizedEmail);
		if (existingUser) {
			return json({ error: 'User with this email already exists' }, { status: 409 });
		}

		const referrer = await getUserByReferralCode(referralCode || '');
		if (referralCode && !referrer) {
			Logger.root.warn({ context: 'auth', email, referralCode }, 'Invalid referral code used during registration');
		}

		// Prevent self-referral (same email as referrer)
		if (referrer && referrer.email.toLowerCase() === normalizedEmail.toLowerCase()) {
			Logger.root.warn({ context: 'auth', email, referralCode }, 'Self-referral attempt blocked');
			return json({ error: 'Cannot use your own referral code' }, { status: 400 });
		}


		// Create new user (with referral link if valid)
		await createUser({
			email: normalizedEmail,
			password,
			name,
			userType: 'panelist',
			registrationSource: registrationSource || 'registration-page',
			utmSource: utmSource || null,
			utmMedium: utmMedium || null,
			utmCampaign: utmCampaign || null,
			referredBy: referrer?.id ?? null,
		});

		// Get the created user
		const user = await getUserByEmail(email);
		if (!user) {
			return json({ error: 'Failed to create user' }, { status: 500 });
		}

		// Credit any exploration points earned anonymously in the last hour
		// (see $lib/utils/exploration-points). The welcome signup bonus itself
		// is already handled inside createUser() above (shared with the guest
		// upgrade flow) — do not award it again here.
		try {
			await claimExplorationEntries(user.id, body?.explorationEntries);
		} catch (explorationErr) {
			Logger.root.error(
				{ context: 'points', userId: user.id, error: explorationErr },
				'Failed to claim pending exploration points at registration'
			);
		}

		// Stamp age + legal acceptance + (optionally) marketing consent.
		// The form already validated that ageVerified/tosAccepted/privacyAccepted
		// were true; these timestamps are the audit trail.
		const now = new Date();
		const ipAddress = getClientIP(event);
		const userAgent = request.headers.get('user-agent') ?? null;
		try {
			await db
				.update(userTable)
				.set({
					ageVerified: true,
					ageVerifiedAt: now,
					tosAcceptedAt: now,
					privacyAcceptedAt: now,
					updatedAt: now,
				})
				.where(eq(userTable.id, user.id));

			if (marketingConsent) {
				await recordConsent(user.id, 'marketing', true, {
					source: 'register-form',
					ipAddress,
					userAgent,
				});
			}
		} catch (consentErr) {
			// Don't fail registration if consent stamping fails — the user is
			// already created. Surface in Loki so it can be back-filled.
			Logger.root.error(
				{ context: 'consent', userId: user.id, error: consentErr },
				'Failed to stamp age/ToS/consent at registration'
			);
		}

		// Create referral record if user was referred
		if (referrer && referralCode) {
			try {
				await db.insert(referrals).values({
					referrerId: referrer.id,
					referredId: user.id,
					referralCode,
					status: 'pending',
					referrerBonus: REFERRER_BONUS,
					referredBonus: REFERRED_BONUS,
				});
				Logger.root.info(
					{ context: 'referral', referrerId: referrer.id, referredId: user.id, referralCode },
					'Referral record created'
				);
			} catch (refError) {
				Logger.root.error({ context: 'referral', error: refError }, 'Failed to create referral record');
			}
		}

		// Create session
		const sessionId = await createSession(user.id);

		// Set session cookie
		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30, // 30 days
		});

		// Return only safe user fields (no password or sensitive data)
		const response: RegisterResponse = {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				userType: user.userType,
				createdAt: user.createdAt,
				emailVerified: user.emailVerified,
				image: user.image,
			} satisfies AuthUserResponse,
		};

		// Best-effort welcome email — fire-and-forget. Existing flows handle
		// retries and rate-limits at the worker level.
		try {
			sendWelcomeEmail(user.email, name ?? null).catch((err) => {
				Logger.root.warn(
					{ context: 'email', email: user.email, error: err },
					'Welcome email dispatch failed'
				);
			});
		} catch {
			/* swallow sync throw — email failure must not block the response */
		}

		// Best-effort signup notification to the Telegram updates channel.
		// "/register" funnel — full account creation with password. Earn-points
		// captures show up as "🎯 New lead (earn-points)" instead.
		// Email is masked for privacy; full address stays in DB / Loki.
		try {
			const utmTag = utmSource ? ` · src=${utmSource}` : '';
			const refTag = referralCode ? ` · ref` : '';
			notifyUpdate(
				`✨ New signup (register): <code>${maskEmail(user.email)}</code>${utmTag}${refTag}`
			).catch(() => {
				/* swallow — signal is in Loki */
			});
		} catch {
			/* swallow sync throw too */
		}

		return json(response);
	} catch (error) {
		Logger.root.error({ context: 'errors', error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, 'Registration error');
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
