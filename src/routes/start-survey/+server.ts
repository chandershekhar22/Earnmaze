import { redirect, error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUser } from '$lib/server/auth/session';
import { db, getSurveyById, getOrCreateStartedSurveyTransaction, getUserByEmail, createUser } from '$lib/db';
import { surveyTransactionDetails } from '$lib/db/schema/surveys';
import { nanoid } from 'nanoid';
import { Logger } from '$lib/utils/app-logger';
import { validateGuestSession, linkSurveyTransactionToSession } from '$lib/db/repositories/guest-session.repository.server';

// Entry link: /start-survey?surveyId=<uuid>
// Handles auth, transaction creation/resume, and redirects to external survey
export const GET: RequestHandler = async (event) => {
	const { url, request, getClientAddress, cookies } = event;
	const surveyId = url.searchParams.get('surveyId');

	if (!surveyId) {
		throw error(400, 'surveyId is required');
	}

	// Resolve user: authenticated panelist or guest session-linked user
	const authUser = await getAuthUser(event);
	let panelistId: string | null = authUser?.userType === 'panelist' ? authUser.id : null;
	let guestSessionId: string | null = null;

	if (!panelistId) {
		const guestToken = cookies.get('guest_session');
		if (guestToken) {
			const guestSession = await validateGuestSession(guestToken);
			if (guestSession) {
				panelistId = guestSession.upgradedToUserId || null;
				guestSessionId = guestSession.id;

				if (!panelistId) {
					const userRecord = await getUserByEmail(guestSession.email);
					panelistId = userRecord?.id ?? null;
				}
			}
		}
	}

	if (!panelistId) {
		Logger.root.warn({ context: 'surveys', reason: 'unauthorized', surveyId }, 'Start survey blocked');
		throw error(401, 'Unauthorized');
	}

	try {
		// Fetch survey via repository
		const surveyData = await getSurveyById(surveyId);

		if (!surveyData) {
			throw error(404, 'Survey not found or not available');
		}

		// Resume or create transaction via repository helper
		const { transactionId, respondentId, isNew } = await getOrCreateStartedSurveyTransaction({
			panelistId,
			surveyId,
			fallbackRespondentId: nanoid()
		});

		// Capture device/browser details only when a new transaction is created
		if (isNew) {
			const userAgent = request.headers.get('user-agent') || '';
			const ipAddress = getClientAddress();

			let deviceType = 'desktop';
			if (/mobile/i.test(userAgent)) {
				deviceType = 'mobile';
			} else if (/tablet|ipad/i.test(userAgent)) {
				deviceType = 'tablet';
			}

			await db
				.insert(surveyTransactionDetails)
				.values({
					surveyTransactionId: transactionId,
					deviceType,
					browserInfo: userAgent.substring(0, 500),
					ipAddress,
					userAgent: userAgent.substring(0, 1000)
				});
		}

		// Link guest session to survey transaction for tracking
		if (guestSessionId) {
			await linkSurveyTransactionToSession(guestSessionId, transactionId);
		}

		// Build redirect URL with tracking params
		const surveyUrl = new URL(surveyData.link);
		surveyUrl.searchParams.set('rid', respondentId);
        surveyUrl.searchParams.set('pid', panelistId);
		Logger.root.info({ context: 'surveys', userId: panelistId, guestSessionId, surveyId, transactionId, isNew }, 'Starting survey redirect');
		throw redirect(302, surveyUrl.toString());

	} catch (err) {
		if (err && typeof err === 'object' && ('status' in err || 'location' in err)) {
			throw err;
		}
		Logger.root.error({ context: 'surveys', error: err, surveyId, userId: panelistId ?? undefined }, 'Start survey error');
		throw error(500, 'Failed to start survey');
	}
};
