import { eq, and, desc, sql } from "drizzle-orm";
import { pointsTransactions } from "../schema/panelist-points";
import { survey, surveyTransaction } from "../schema/surveys";
import { db } from "..";
import { nanoid } from 'nanoid';


/**
 * Get survey transactions for a panelist
 * @param panelistId - Panelist ID
 * @param limit - Maximum number of transactions to return
 * @returns Array of survey transactions with survey details
 */
export async function getPanelistSurveyTransactions(panelistId: string, limit: number = 20) {
    return db
        .select({
            id: surveyTransaction.id,
            surveyId: surveyTransaction.surveyId,
            status: surveyTransaction.status,
            awardedPoints: surveyTransaction.awardedPoints,
            timeSpentSeconds: surveyTransaction.timeSpentSeconds,
            startedAt: surveyTransaction.startedAt,
            completedAt: surveyTransaction.completedAt,
            survey: {
                id: survey.id,
                title: survey.title,
                description: survey.description,
                points: survey.points,
            },
        })
        .from(surveyTransaction)
        .leftJoin(survey, eq(surveyTransaction.surveyId, survey.id))
        .where(eq(surveyTransaction.panelistId, panelistId))
        .orderBy(desc(surveyTransaction.createdAt))
        .limit(limit);
}

export async function getOrCreateStartedSurveyTransaction(params: { panelistId: string; surveyId: string; fallbackRespondentId?: string }) {
    const { panelistId, surveyId, fallbackRespondentId } = params;
    console.log('getOrCreateStartedSurveyTransaction', params);
    const [existing] = await db
        .select()
        .from(surveyTransaction)
        .where(
            and(
                eq(surveyTransaction.panelistId, panelistId),
                eq(surveyTransaction.surveyId, surveyId),
                eq(surveyTransaction.status, 'started')
            )
        )
        .limit(1);

    if (existing) {
        const respondentId = existing.respondentId || fallbackRespondentId || nanoid();
        if (!existing.respondentId) {
            await db
                .update(surveyTransaction)
                .set({ respondentId })
                .where(eq(surveyTransaction.id, existing.id));
        }
        return { transactionId: existing.id, respondentId, isNew: false } as const;
    }

    const respondentId = fallbackRespondentId || nanoid();
    const [created] = await db
        .insert(surveyTransaction)
        .values({
            panelistId,
            surveyId,
            respondentId,
            status: 'started',
            awardedPoints: 0
        })
        .returning();

    return { transactionId: created.id, respondentId, isNew: true } as const;
}

// /**
//  * Get recent activity for a panelist dashboard
//  * @param userId - User ID
//  * @param limit - Maximum number of activities to return
//  * @returns Combined array of recent points and survey activities
//  */
// export async function getPanelistRecentActivity(userId: string, limit: number = 5) {
//   // First get the panelist ID from user ID
//   const [panelistData] = await db
//     .select({ id: panelist.id })
//     .from(panelist)
//     .where(eq(panelist.userId, userId))
//     .limit(1);

//   if (!panelistData) {
//     return [];
//   }

//   const panelistId = panelistData.id;

//   // Get recent points transactions
//   const pointsActivity = await db
//     .select({
//       id: pointsTransactions.id,
//       type: pointsTransactions.type,
//       amount: pointsTransactions.amount,
//       description: pointsTransactions.description,
//       createdAt: pointsTransactions.createdAt,
//       category: sql<string>`'points'`.as('category')
//     })
//     .from(pointsTransactions)
//     .where(eq(pointsTransactions.panelistId, panelistId))
//     .orderBy(desc(pointsTransactions.createdAt))
//     .limit(limit);

//   // Get recent survey transactions
//   const surveyActivity = await db
//     .select({
//       id: surveyTransaction.id,
//       type: sql<string>`'survey'`.as('type'),
//       amount: surveyTransaction.awardedPoints,
//       description: sql<string>`CONCAT('Completed "', ${survey.title}, '"')`.as('description'),
//       createdAt: surveyTransaction.completedAt,
//       category: sql<string>`'survey'`.as('category')
//     })
//     .from(surveyTransaction)
//     .leftJoin(survey, eq(surveyTransaction.surveyId, survey.id))
//     .where(
//       and(
//         eq(surveyTransaction.panelistId, panelistId),
//         eq(surveyTransaction.status, 'completed')
//       )
//     )
//     .orderBy(desc(surveyTransaction.completedAt))
//     .limit(limit);

//   // Combine and sort activities
//   const allActivities = [
//     ...pointsActivity.map(activity => ({
//       ...activity,
//       createdAt: activity.createdAt || new Date()
//     })),
//     ...surveyActivity.map(activity => ({
//       ...activity,
//       createdAt: activity.createdAt || new Date()
//     }))
//   ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

//   return allActivities.slice(0, limit);
// }

