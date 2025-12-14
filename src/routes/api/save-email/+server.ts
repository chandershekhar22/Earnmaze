import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateTurnstileToken } from '$lib/server/turnstile';
import { Logger } from '$lib/utils/app-logger';
import { isValidEmail, normalizeEmail } from '$lib/utils/validation';
import { 
	getUserByEmail, 
	createUser,
	getUserByReferralCode,
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
	addBonusPoints,
	initializePanelistPoints
} from '$db';
import {
	getAppSettings
} from '$lib/db/repositories/settings.repository.server';
import {
	getFirstAvailableSurvey
} from '$lib/db/repositories/survey.repository.server';

export const POST: RequestHandler = async ({ request, getClientAddress, cookies }) => {
	try {
		const { 
			email, 
			visitorId, 
			sessionId: analyticsSessionId, 
			utmParams, 
			timeToConvert, 
			turnstileToken,

		} = await request.json();

		// Validate Turnstile token
		if (!turnstileToken) {
			return json({ error: 'Verification required' }, { status: 400 });
		}

		const turnstileError = await validateTurnstileToken(turnstileToken, getClientAddress());
		if (turnstileError) {
			return json({ error: turnstileError }, { status: 400 });
		}

		// Validate email with utility function
		if (!isValidEmail(email)) {
			Logger.root.warn({ context: 'auth', email }, 'Invalid email format attempted');
			return json({ error: 'Invalid email address' }, { status: 400 });
		}

		const normalizedEmail = normalizeEmail(email);

		// Find the visit ID for this session using repository
		const visitData = await getVisitBySessionId(analyticsSessionId);

	
		// Track the email conversion using repository
		await createEmailConversion({
			email: normalizedEmail,
			visitorId,
			sessionId: analyticsSessionId,
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

			// Initialize points with welcome bonus using repository
			const settings = await getAppSettings([
				'welcome_panelist_points',
				'bonus_panelist_points'
			]);
			
			const welcomePoints = parseInt(settings.welcome_panelist_points || '0') || 0;
	
			await addBonusPoints(userId, welcomePoints, 'Welcome bonus for new panelist');

			Logger.root.info({ context: 'auth', email: normalizedEmail, userId }, 'Created new user and panelist');
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
