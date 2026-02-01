import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createHmac } from 'crypto';
import { getAuthUser } from '$lib/server/auth';
import { db, getSurveyById, getOrCreateStartedSurveyTransaction, getUserByEmail } from '$lib/db';
import { surveyTransactionDetails } from '$lib/db/schema/surveys';
import { nanoid } from 'nanoid';
import { Logger } from '$lib/utils/app-logger';
import { validateGuestSession, linkSurveyTransactionToSession } from '$lib/db/repositories/guest-session.repository.server';

type UserContext = {
	panelistId: string;
	email: string | null;
	guestSessionId: string | null;
};

type DeviceInfo = {
	deviceType: 'mobile' | 'tablet' | 'desktop';
	browserInfo: string;
	ipAddress: string;
	userAgent: string;
};

// Helper: Hash email with HMAC-SHA256
function hashEmail(email: string | null): string {
	if (!email) return '';
	const secret = process.env.UID_SECRET || 'default-secret-key';
	return createHmac('sha256', secret).update(email.toLowerCase()).digest('hex');
}

// Helper: Detect device type from user agent
function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
	if (/mobile/i.test(userAgent)) return 'mobile';
	if (/tablet|ipad/i.test(userAgent)) return 'tablet';
	return 'desktop';
}

// Helper: Resolve user from auth session or guest session
async function resolveUser(event: Parameters<PageServerLoad>[0]): Promise<UserContext | null> {
	const { cookies } = event;
	const authUser = await getAuthUser(event);

	if (authUser?.userType === 'panelist') {
		return {
			panelistId: authUser.id,
			email: authUser.email ?? null,
			guestSessionId: null
		};
	}

	const guestToken = cookies.get('guest_session');
	if (!guestToken) return null;

	const guestSession = await validateGuestSession(guestToken);
	if (!guestSession) return null;

	const userRecord = await getUserByEmail(guestSession.email);
	return {
		panelistId: userRecord?.id ?? guestSession.upgradedToUserId ?? null,
		email: guestSession.email,
		guestSessionId: guestSession.id
	};
}

// Helper: Extract device info from request
function extractDeviceInfo(request: Request, ipAddress: string): DeviceInfo {
	const userAgent = request.headers.get('user-agent') || '';
	return {
		deviceType: detectDeviceType(userAgent),
		browserInfo: userAgent.substring(0, 500),
		ipAddress,
		userAgent: userAgent.substring(0, 1000)
	};
}

export const load: PageServerLoad = async (event) => {
	const { url, request, getClientAddress } = event;
	const surveyId = url.searchParams.get('surveyId');

	if (!surveyId) {
		throw error(400, 'surveyId is required');
	}

	// Resolve user context
	const userContext = await resolveUser(event);
	if (!userContext?.panelistId) {
		Logger.root.warn({ context: 'surveys', surveyId, reason: 'unauthorized' }, 'Start survey blocked');
		throw error(401, 'Unauthorized');
	}

	try {
		// Validate survey exists
		const surveyData = await getSurveyById(surveyId);
		if (!surveyData) {
			Logger.root.warn({ context: 'surveys', surveyId, userId: userContext.panelistId }, 'Survey not found or unavailable');
			throw error(404, 'Survey not found or not available');
		}

		// Create or resume survey transaction
		const { transactionId, respondentId, isNew } = await getOrCreateStartedSurveyTransaction({
			panelistId: userContext.panelistId,
			surveyId,
			fallbackRespondentId: nanoid()
		});
		
		Logger.root.info(
			{
				context: 'surveys',
				userId: userContext.panelistId,
				surveyId,
				transactionId,
				respondentId,
				guestSessionId: userContext.guestSessionId,
				isNew,
				action: isNew ? 'createdTransaction' : 'resumedTransaction'
			},
			'Creating or resuming survey transaction'
		);

		// Record device/browser details for new transactions
		if (isNew) {
			const ipAddress = getClientAddress();
			const deviceInfo = extractDeviceInfo(request, ipAddress);
			await db.insert(surveyTransactionDetails).values({
				surveyTransactionId: transactionId,
				...deviceInfo
			});
			Logger.root.info(
				{
					context: 'surveys',
					transactionId,
					surveyId,
					userId: userContext.panelistId,
					ipAddress: deviceInfo.ipAddress,
					deviceType: deviceInfo.deviceType
				},
				'Captured device profile for survey transaction'
			);
		}

		// Link guest session for tracking (if applicable)
		if (userContext.guestSessionId) {
			await linkSurveyTransactionToSession(userContext.guestSessionId, transactionId);
			Logger.root.info(
				{
					context: 'surveys',
					transactionId,
					surveyId,
					guestSessionId: userContext.guestSessionId
				},
				'Linked guest session to survey transaction'
			);
		}

		// Build redirect URL with tracking parameters
		const surveyUrl = new URL(surveyData.link);
		surveyUrl.searchParams.set('rid', respondentId);
		surveyUrl.searchParams.set('uid', hashEmail(userContext.email));

		Logger.root.info(
			{
				context: 'surveys',
				userId: userContext.panelistId,
				guestSessionId: userContext.guestSessionId,
				surveyId,
				transactionId,
				isNew
			},
			'Showing survey interstitial page'
		);

		return {
			surveyUrl: surveyUrl.toString(),
			surveyTitle: surveyData.title || 'Survey',
			email: userContext.email,
			isNewTransaction: isNew
		};
	} catch (err) {
		// Re-throw HTTP errors
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		Logger.root.error(
			{ context: 'surveys', error: err, surveyId, userId: userContext?.panelistId },
			'Start survey error'
		);

		throw error(500, 'Failed to start survey');
	}
};
