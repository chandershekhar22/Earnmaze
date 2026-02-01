import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { Logger } from '$lib/utils/app-logger';
import {
	getSurveyById,
	getSurveyTransactionByRespondentId,
	completeSurveyTransaction,
	getUserById
} from '$lib/db/repositories/survey.repository.server';

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
		const respondentId = url.searchParams.get('rid');
		const statusCode = url.searchParams.get('status');

		// Validate required parameters
		if (!respondentId) {
			Logger.root.warn(
				{ context: 'surveys', reason: 'missing_respondent_id' },
				'Survey redirect: missing respondentId'
			);
			throw error(400, 'respondentId is required');
		}

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
		const surveyData = await getSurveyById(transaction.surveyId);
		if (!surveyData) {
			Logger.root.warn(
				{ context: 'surveys', surveyId: transaction.surveyId, reason: 'survey_not_found' },
				'Survey redirect: survey not found'
			);
			throw error(404, 'Survey not found');
		}

		// Determine awarded points based on completion status
		const awardedPoints = status === 'completed' ? surveyData.points : 0;

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

		// Validate session exists
		if (!locals.user) {
			Logger.root.warn(
				{ context: 'surveys', respondentId, reason: 'no_session' },
				'Survey completed but user has no active session'
			);
			throw error(401, 'Please log in to view your survey completion status');
		}

		// Determine redirect destination based on user type
		const dashboardUrl = locals.user.userType === 'guest'
			? '/guest/dashboard'
			: '/surveys';

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

		throw redirect(302, dashboardUrl);

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
