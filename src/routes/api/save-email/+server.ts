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
