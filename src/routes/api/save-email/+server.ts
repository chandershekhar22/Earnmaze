import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateTurnstileToken } from '$lib/server/turnstile';
import { Logger } from '$lib/utils/app-logger';
import { getClientIP } from '$lib/server/geo-restriction';
import {
	getUserByEmail,
	createUser,
} from '$lib/db/repositories/auth.repository.server';
import { 
	createGuestSessionForUser, 
	findActiveGuestSessionByEmail 
} from '$lib/db/repositories/guest-session.repository.server';
import {
	getVisitBySessionId,
	createEmailConversion
} from '$lib/db/repositories/analytics.repository.server';
import {
	getFirstAvailableSurvey
} from '$lib/db/repositories/survey.repository.server';
import { saveEmailSchema, validateInput } from '$lib/validation/api-schemas';
import { sendWelcomeEmail } from '$lib/server/email-service';
import { notifyUpdate } from '$lib/utils/telegram';
import { maskEmail } from '$lib/utils/mask';
import { recordConsent } from '$lib/server/email-consent';
import { user as userTable } from '$lib/db/schema/auth';
import { db as dbConn } from '$lib/db';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
	const { request, cookies, getClientAddress } = event;
	try {
		const body = await request.json();

		// Validate and sanitize input
		const validation = await validateInput(saveEmailSchema, body);
		if (!validation.success) {
			return json({ error: validation.error }, { status: 400 });
		}

		const {
			email,
			visitorId,
			sessionId: analyticsSessionId,
			utmParams,
			timeToConvert,
			turnstileToken,
			marketingConsent,
		} = validation.data;

		// Validate Turnstile token
		const turnstileError = await validateTurnstileToken(turnstileToken, getClientIP(event));
		if (turnstileError) {
			return json({ error: turnstileError }, { status: 400 });
		}

		const normalizedEmail = email; // schema already lowercases + trims

		// Find the visit ID for this session using repository
		const visitData = analyticsSessionId ? await getVisitBySessionId(analyticsSessionId) : null;

	
		// Track the email conversion using repository
		await createEmailConversion({
			email: normalizedEmail,
			visitorId: visitorId ?? '',
			sessionId: analyticsSessionId ?? '',
			visitId: visitData?.id || null,
			utmSource: utmParams?.utm_source || visitData?.utmSource || null,
			utmMedium: utmParams?.utm_medium || visitData?.utmMedium || null,
			utmCampaign: utmParams?.utm_campaign || visitData?.utmCampaign || null,
			timeToConvertSeconds: timeToConvert,
		});

		// Check if user already exists using repository
		let existingUser = await getUserByEmail(normalizedEmail);
		let userId: string;
		let isNewUser = false;

		if (existingUser) {
			// Use existing user account
			userId = existingUser.id;
			Logger.root.info({ context: 'auth', email, userId }, 'Existing user found for email');
		} else {
			// Create new user account without password using repository
			const result = await createUser({
				email: normalizedEmail,
				name: null,
				userType: 'panelist',
				registrationSource: 'earn-money-page',
				utmSource: utmParams?.utm_source || visitData?.utmSource || null,
				utmMedium: utmParams?.utm_medium || visitData?.utmMedium || null,
				utmCampaign: utmParams?.utm_campaign || visitData?.utmCampaign || null,
			});

			userId = result.user.id;
			isNewUser = true;

			// Signup bonus is credited on guest upgrade (set-password), not on initial guest creation
			Logger.root.info({ context: 'auth', email: normalizedEmail, userId }, 'Created new guest user');

			// Stamp implicit-consent timestamps. The form's "By continuing..." notice
			// line is the affirmative-action moment for ToS/Privacy/age-18+. Marketing
			// consent is the explicit checkbox (separate audit-log entry below).
			const now = new Date();
			try {
				await dbConn
					.update(userTable)
					.set({
						ageVerified: true,
						ageVerifiedAt: now,
						tosAcceptedAt: now,
						privacyAcceptedAt: now,
						updatedAt: now,
					})
					.where(eq(userTable.id, userId));

				if (marketingConsent) {
					await recordConsent(userId, 'marketing', true, {
						source: 'earn-points-form',
						ipAddress: getClientIP(event),
						userAgent: request.headers.get('user-agent') ?? null,
					});
				}
			} catch (consentErr) {
				// Don't fail lead capture if consent stamping fails — surface in Loki.
				Logger.root.error(
					{ context: 'consent', userId, error: consentErr },
					'Failed to stamp consent for earn-points lead'
				);
			}
		}

		// Create or reuse guest session using repository
		let existingSession = await findActiveGuestSessionByEmail(normalizedEmail);
		let sessionToken: string;
		let guestSessionId: string;

		if (existingSession) {
			// Reuse existing active session
			sessionToken = existingSession.token;
			guestSessionId = existingSession.id;

			Logger.root.info({ context: 'auth', email, sessionId: guestSessionId }, 'Reusing existing guest session');
		} else {
			// Create new guest session linked to user using repository
			const newSession = await createGuestSessionForUser({
				email: normalizedEmail,
				userId,
				ipAddress: getClientAddress(),
				userAgent: request.headers.get('user-agent') || undefined,
			});

			sessionToken = newSession.token;
			guestSessionId = newSession.sessionId;

			Logger.root.info({ context: 'auth', email, sessionId: guestSessionId, userId }, 'Created new guest session');
		}

		// Set guest session cookie (24 hours)
		cookies.set('guest_session', sessionToken, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24, // 24 hours
		});

		// Get first available survey to redirect to using repository
		const firstSurvey = await getFirstAvailableSurvey();

		let redirectUrl = '/guest/dashboard'; // Default fallback

		if (firstSurvey) {
			// Redirect to survey - user will return to dashboard after completion
			redirectUrl = `/start-survey?surveyId=${firstSurvey.id}`;
			Logger.root.info({ context: 'auth', surveyId: firstSurvey.id, surveyTitle: firstSurvey.title }, 'Redirecting to survey');
		} else {
			Logger.root.warn({ context: 'auth' }, 'No surveys available, redirecting to dashboard');
		}

		Logger.root.info({ context: 'auth', userId, isNewUser, sessionId: guestSessionId, redirectUrl }, 'User registration complete');

		// Best-effort welcome email — only on first capture, not on resume.
		// Existing users hitting earn-points again don't get re-welcomed.
		if (isNewUser) {
			try {
				sendWelcomeEmail(normalizedEmail, null).catch((err) => {
					Logger.root.warn({ context: 'email', email: normalizedEmail, error: err }, 'Welcome email dispatch failed');
				});
			} catch {
				/* swallow sync throw — email failure must not block the redirect */
			}
		}

		// Best-effort Telegram update — differentiated from /register so the
		// channel shows funnel source. Earn-points flows are guest captures
		// that may convert to full signups via /guest/upgrade later.
		try {
			const label = isNewUser ? '🎯 New lead (earn-points)' : '↩️ Returning lead (earn-points)';
			const utmTag = utmParams?.utm_source ? ` · src=${utmParams.utm_source}` : '';
			notifyUpdate(
				`${label}: <code>${maskEmail(normalizedEmail)}</code>${utmTag}`
			).catch(() => {
				/* swallow */
			});
		} catch {
			/* swallow sync throw */
		}

		// Return success and redirect URL
		return json({
			success: true,
			userId,
			sessionId: guestSessionId,
			isNewUser,
			redirectUrl
		});

	} catch (error) {
		Logger.root.error({ context: 'errors', error }, 'Save email failed');
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
