import { createHash, timingSafeEqual } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { Logger } from '$lib/utils/app-logger';
import { addPoints, db } from '$lib/db';
import { pointsTransactions } from '$lib/db/schema/panelist-points';
import {
	getSurveyById,
	getSurveyTransactionByRespondentId,
	completeSurveyTransaction,
} from '$lib/db/repositories/survey.repository.server';
import { getGuestActivityByTransactionId, updateGuestSessionStats } from '$lib/db/repositories';
import { notifyUpdate } from '$lib/utils/telegram';

/**
 * Bolts the +10 "exploration" bonus onto today's featured survey, on top of
 * whatever real survey points it pays out. Unlike the other five sections
 * (anonymous, held client-side pending signup), a survey completion here is
 * already tied to a real session and already server-verified via the HMAC
 * hash above — so it's credited immediately, with no pending/claim step.
 * Guarded against double-credit on any retry/replay of this redirect URL.
 */
async function awardTodaySurveyExplorationBonus(panelistId: string, transactionId: number) {
	const referenceId = `expl-survey:${transactionId}`;
	const [existing] = await db
		.select({ id: pointsTransactions.id })
		.from(pointsTransactions)
		.where(and(eq(pointsTransactions.referenceType, 'exploration'), eq(pointsTransactions.referenceId, referenceId)))
		.limit(1);
	if (existing) return;

	await addPoints(
		panelistId,
		10,
		"Exploration: completed today's survey",
		'completed',
		'exploration',
		referenceId,
		{ kind: 'paid-surveys', surveyTransactionId: transactionId }
	);
}

type CompletionStatus = 'completed' | 'terminated' | 'quota_full' | 'disqualified';

// Map status codes from external survey portal to internal values
function parseStatusCode(code: string | null): CompletionStatus | null {
	switch (code) {
		case '1': return 'completed';
		case '2': return 'terminated';
		case '3': return 'quota_full';
		case '4': return 'disqualified';
		default: return null;
	}
}

/**
 * Survey Completion Redirect Handler
 * 
 * URL: /redirect?rid=<respondentId>&status=<statusCode>
 * 
 * Status codes:
 * - 1 = completed
 * - 2 = terminated
 * - 3 = quota full
 * - 4 = disqualified
 * 
 * Called by external survey portal after user completes survey.
 * Updates transaction and redirects to appropriate dashboard.
 */
export const load: PageServerLoad = async ({ url, locals }) => {
	try {
		// If no query params at all, this is a direct visit — redirect to dashboard
		const hash = url.searchParams.get('hash');
		const rid = url.searchParams.get('rid');
		if (!hash && !rid) {
			throw redirect(302, locals.user ? '/surveys' : locals.guestSession ? '/guest/dashboard' : '/login');
		}

		// verify url hash — qs-service computes sha3-256 over the raw redirect URL string (before appending &hash=)
		// We must strip the hash param from the raw URL string to match, NOT parse/re-serialize with new URL()
		const privateKey = process.env.HASH_KEY;
		if (!privateKey) throw error(500, 'Server configuration error');

		if (!rid || !hash) {
			throw error(400, 'Missing required parameters');
		}

		const rawUrl = url.toString();
		const urlWithoutHash = rawUrl.replace(/[&?]hash=[^&]*/, '');
		const expectedHash = createHash('sha3-256').update(urlWithoutHash + privateKey).digest('hex');

		const hashValid = hash.length === expectedHash.length
			&& timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));

		if (!hashValid) {
			Logger.root.warn(
				{ context: 'surveys', reason: 'invalid_hash' },
				'Survey redirect: invalid or missing hash'
			);
			throw error(403, 'Invalid request signature');
		}

		const respondentId = rid;
		const statusCode = url.searchParams.get('status');

		const status = parseStatusCode(statusCode);
		if (!status) {
			Logger.root.warn(
				{ context: 'surveys', respondentId, statusCode, reason: 'invalid_status_code' },
				'Survey redirect: invalid status code'
			);
			throw error(400, 'Invalid status code');
		}

		// Find survey transaction
		const transaction = await getSurveyTransactionByRespondentId(respondentId);
		if (!transaction) {
			Logger.root.warn(
				{ context: 'surveys', respondentId, reason: 'transaction_not_found' },
				'Survey redirect: transaction not found'
			);
			throw error(404, 'Survey transaction not found');
		}

		// Get survey to determine points
		const surveyData = await getSurveyById(transaction.surveyId, true);
		if (!surveyData) {
			Logger.root.warn(
				{ context: 'surveys', surveyId: transaction.surveyId, reason: 'survey_not_found' },
				'Survey redirect: survey not found'
			);
			throw error(404, 'Survey not found');
		}

		// Determine awarded points based on completion status
		let  awardedPoints =  0
		switch (status) {
			case 'completed':
				awardedPoints = surveyData.points;
				break;
			case 'terminated':
				awardedPoints = surveyData.terminatedPoints || 0; // Example: half points for terminated surveys
				break;
			case 'quota_full':
				awardedPoints = surveyData.quotaFullPoints || 0; // Example: some points for quota full
				break;
			case 'disqualified':
				awardedPoints = 0;
				break;	
		}

		// Update transaction with completion data and add pending points if applicable
		const completedTransaction = await completeSurveyTransaction(
			respondentId,
			status,
			awardedPoints,
			transaction.panelistId,
			transaction.surveyId,
			transaction.id
		);
		if (!completedTransaction) {
			throw error(500, 'Failed to update survey completion');
		}

		// Today's featured survey additionally earns the flat exploration bonus,
		// same as the other five "Ways to Earn" sections.
		if (status === 'completed' && surveyData.isTodaySurvey) {
			try {
				await awardTodaySurveyExplorationBonus(transaction.panelistId, transaction.id);
			} catch (bonusErr) {
				Logger.root.error(
					{ context: 'surveys', error: bonusErr, transactionId: transaction.id },
					'Failed to award today-survey exploration bonus'
				);
			}
		}

		// Best-effort Telegram update — only for actual completions, not screen-outs.
		if (status === 'completed') {
			try {
				notifyUpdate(
					`✅ Survey completed: <code>${surveyData.title ?? transaction.surveyId}</code> · +${awardedPoints} pts`
				).catch(() => {
					/* swallow */
				});
			} catch {
				/* swallow sync throw */
			}
		}

		// Determine where to redirect the user.
		// hooks.server.ts resolves both session types:
		//   locals.user        → regular panelist/admin session
		//   locals.guestSession → guest session
		let dashboardUrl: string;

		if (locals.user) {
			dashboardUrl = '/surveys';
		} else if (locals.guestSession) {
			// Update guest session stats (points, surveys viewed/completed)
			try {
				await updateGuestSessionStats(locals.guestSession.id);
			} catch {
				// Don't block redirect if stats update fails
			}
			dashboardUrl = '/guest/dashboard';
		} else {
			// No active session — look up whether this was a guest via
			// the guest_survey_activity link table, then redirect to
			// the appropriate login page.
			const guestActivity = await getGuestActivityByTransactionId(transaction.id);

			const loginPath = guestActivity ? '/guest/login' : '/login';
			const returnTo = guestActivity ? '/guest/dashboard' : '/surveys';

			Logger.root.info(
				{ context: 'surveys', respondentId, status, reason: 'no_session', isGuest: !!guestActivity },
				'Survey completed but no session found — redirecting to login'
			);
			throw redirect(302, `${loginPath}?redirect=${encodeURIComponent(returnTo)}`);
		}

		Logger.root.info(
			{
				context: 'surveys',
				respondentId,
				panelistId: transaction.panelistId,
				surveyId: transaction.surveyId,
				status,
				awardedPoints
			},
			'Survey completion processed and redirecting'
		);

		const sep = dashboardUrl.includes('?') ? '&' : '?';
		throw redirect(302, `${dashboardUrl}${sep}completed=${status}&pts=${awardedPoints}`);

	} catch (err) {
		// Re-throw HTTP and redirect errors
		if (err && typeof err === 'object' && 'location' in err) {
			throw err;
		}

		Logger.root.error(
			{ context: 'surveys', error: err },
			'Survey redirect error'
		);

		// Re-throw all other errors
		throw err;
	}
};
