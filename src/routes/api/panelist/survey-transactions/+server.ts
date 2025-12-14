import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPanelistSurveyTransactions } from '$lib/db';
import { Logger } from '$lib/utils/app-logger';
import type { SurveyTransactionItem, SurveyTransactionsResponse } from '$types/api-responses';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const user = locals.user;

		if (!user) {
			Logger.root.warn({ context: 'api', path: '/api/panelist/survey-transactions' }, 'Unauthorized access to survey transactions');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (user.userType !== 'panelist') {
			Logger.root.warn({ context: 'api', path: '/api/panelist/survey-transactions', userType: user.userType, userId: user.id }, 'Forbidden access to survey transactions');
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const rawTransactions = await getPanelistSurveyTransactions(user.id);

		const transactions: SurveyTransactionItem[] = rawTransactions.map((txn) => ({
			id: String(txn.id),
			surveyId: String(txn.surveyId),
			surveyTitle: txn.survey?.title ?? 'Survey',
			status: txn.status as SurveyTransactionItem['status'],
			pointsEarned: txn.awardedPoints ?? txn.survey?.points ?? 0,
			timeSpentMinutes: txn.timeSpentSeconds != null ? Math.round(txn.timeSpentSeconds / 60) : undefined,
			invitedAt: txn.startedAt,
			completedAt: txn.completedAt ?? undefined
		}));

		const response: SurveyTransactionsResponse = {
			transactions,
			totalCompleted: transactions.filter((t) => t.status === 'completed').length,
			totalEarned: transactions.reduce((sum, t) => sum + (t.pointsEarned ?? 0), 0)
		};

		Logger.root.info({ context: 'api', userId: user.id, count: transactions.length }, 'Fetched survey transactions');

		return json(response);
	} catch (error) {
		Logger.root.error({ context: 'api', error }, 'Error fetching survey transactions');
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};