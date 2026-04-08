/**
 * Panelist History Repository
 * Combined activity history for a panelist: points transactions, survey activity, redemptions
 */

import { db } from '..';
import { pointsTransactions } from '../schema/panelist-points';
import { surveyTransaction, survey } from '../schema/surveys';
import { redemptions } from '../schema/transactions';
import { eq, desc } from 'drizzle-orm';

/**
 * Fetch the raw activity rows for a panelist (parallel DB queries)
 */
export async function getPanelistActivityHistory(panelistId: string, limit = 50) {
	const [pointsTxs, surveyTxs, redemptionTxs] = await Promise.all([
		db
			.select({
				id: pointsTransactions.id,
				type: pointsTransactions.type,
				points: pointsTransactions.points,
				description: pointsTransactions.description,
				createdAt: pointsTransactions.createdAt,
			})
			.from(pointsTransactions)
			.where(eq(pointsTransactions.panelistId, panelistId))
			.orderBy(desc(pointsTransactions.createdAt))
			.limit(limit),

		db
			.select({
				id: surveyTransaction.id,
				surveyId: surveyTransaction.surveyId,
				surveyTitle: survey.title,
				status: surveyTransaction.status,
				awardedPoints: surveyTransaction.awardedPoints,
				startedAt: surveyTransaction.startedAt,
				completedAt: surveyTransaction.completedAt,
			})
			.from(surveyTransaction)
			.leftJoin(survey, eq(surveyTransaction.surveyId, survey.id))
			.where(eq(surveyTransaction.panelistId, panelistId))
			.orderBy(desc(surveyTransaction.createdAt))
			.limit(limit),

		db
			.select({
				id: redemptions.id,
				provider: redemptions.provider,
				amount: redemptions.amount,
				value: redemptions.value,
				status: redemptions.status,
				createdAt: redemptions.createdAt,
			})
			.from(redemptions)
			.where(eq(redemptions.panelistId, panelistId))
			.orderBy(desc(redemptions.createdAt))
			.limit(limit),
	]);

	return { pointsTxs, surveyTxs, redemptionTxs };
}
