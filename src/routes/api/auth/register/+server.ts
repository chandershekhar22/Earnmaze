import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';
import { createSession, createUser, getUserByEmail, db } from '$lib/db';
import { validateTurnstileToken } from '$lib/server/turnstile';
import type { RegisterResponse, AuthUserResponse } from '$lib/types/api-responses';
import { getUserByReferralCode } from '$lib/db/repositories/auth.repository.server';
import { referrals } from '$lib/db/schema/transactions';
import { Logger } from '$lib/utils/app-logger';
import { authRateLimit } from '$lib/server/rate-limit';
import { registerSchema, validateInput } from '$lib/validation/api-schemas';
import { getClientIP } from '$lib/server/geo-restriction';

const REFERRER_BONUS = 50;
const REFERRED_BONUS = 25;

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

		const { email, password, name, turnstileToken, referralCode, utmSource, utmMedium, utmCampaign, registrationSource } = validation.data;

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

		return json(response);
	} catch (error) {
		Logger.root.error({ context: 'errors', error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, 'Registration error');
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
