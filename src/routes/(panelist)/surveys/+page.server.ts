import type { PageServerLoad } from './$types';
import type { AvailableSurveysResponse, SurveyTransactionItem, SurveyTransactionsResponse } from '$types/api-responses';
import { requirePanelist } from '$lib/server/auth/guards';
import { getAllAvailableSurveys } from '$lib/db/repositories/survey.repository.server';
import { getPanelistSurveyTransactions } from '$lib/db';

export const load: PageServerLoad = async (event) => {
	const user = await requirePanelist(event);

	const [surveys, rawTransactions] = await Promise.all([
		getAllAvailableSurveys(),
		getPanelistSurveyTransactions(user.id),
	]);

	const availableSurveyData: AvailableSurveysResponse = surveys.map((s) => ({
		id: s.id,
		title: s.title,
		description: s.description ?? '',
		points: s.points,
		link: s.link,
		priority: s.priority,
	}));

	const transactions: SurveyTransactionItem[] = rawTransactions.map((txn) => ({
		id: String(txn.id),
		surveyId: String(txn.surveyId),
		surveyTitle: txn.survey?.title ?? 'Survey',
		status: txn.status as SurveyTransactionItem['status'],
		pointsEarned: txn.awardedPoints ?? txn.survey?.points ?? 0,
		startedAt: txn.startedAt,
		completedAt: txn.completedAt ?? undefined,
	}));

	const surveyTransactions: SurveyTransactionsResponse = {
		transactions,
		totalCompleted: transactions.filter((t) => t.status === 'completed').length,
		totalEarned: transactions.reduce((sum, t) => sum + (t.pointsEarned ?? 0), 0),
	};

	return { availableSurveyData, surveyTransactions };
};
