import { eq, and, sql, desc } from "drizzle-orm";
import { pointsTransactions } from "../schema/panelist-points";
import { db } from "..";

/**
 * Panelist Points Aggregations Repository
 * Provides derived metrics from points_transactions table
 * These replace the removed columns from panelist_points and panelist_stats
 */

/**
 * Get lifetime points earned by a panelist
 * Sums all completed earning transactions (earned, bonus, adjustment with positive points)
 */
export async function getLifetimePoints(panelistId: string): Promise<number> {
    const result = await db
        .select({
            total: sql<number>`COALESCE(SUM(CASE
                WHEN ${pointsTransactions.type} IN ('completed', 'terminated', 'quota_full', 'bonus', 'adjustment', 'refund')
                THEN ${pointsTransactions.points}
                WHEN ${pointsTransactions.type} = 'rejected'
                THEN -${pointsTransactions.points}
                ELSE 0
            END), 0)`.as('total'),
        })
        .from(pointsTransactions)
        .where(eq(pointsTransactions.panelistId, panelistId));

    return Number(result[0]?.total || 0);
}

/**
 * Get total bonus points earned by a panelist
 */
export async function getTotalBonusPoints(panelistId: string): Promise<number> {
    const result = await db
        .select({
            total: sql<number>`COALESCE(SUM(${pointsTransactions.points}), 0)`.as('total'),
        })
        .from(pointsTransactions)
        .where(
            and(
                eq(pointsTransactions.panelistId, panelistId),
                eq(pointsTransactions.type, 'bonus')
            )
        );

    return Number(result[0]?.total || 0);
}

/**
 * Get total points redeemed by a panelist
 */
export async function getTotalRedeemedPoints(panelistId: string): Promise<number> {
   const result = await db
        .select({
            total: sql<number>`COALESCE(SUM(${pointsTransactions.points}), 0)`.as('total'),
        })
        .from(pointsTransactions)
        .where(
            and(
                eq(pointsTransactions.panelistId, panelistId),
                eq(pointsTransactions.type, 'redeemed')
            )
        );

    return Number(result[0]?.total || 0);
}

/**
 * Get total rejected points for a panelist
 */
export async function getTotalRejectedPoints(panelistId: string): Promise<number> {
   const result = await db
        .select({
            total: sql<number>`COALESCE(SUM(${pointsTransactions.points}), 0)`.as('total'),
        })
        .from(pointsTransactions)
        .where(
            and(
                eq(pointsTransactions.panelistId, panelistId),
                eq(pointsTransactions.type, 'rejected')
            )
        );

    return Number(result[0]?.total || 0);
}

/**
 * Get comprehensive points summary for a panelist
 * Returns all derived metrics in one query
 */
export async function getPointsSummary(panelistId: string) {
    const result = await db
        .select({
            lifetimePoints: sql<number>`COALESCE(SUM(CASE
                WHEN ${pointsTransactions.type} IN ('completed', 'terminated', 'quota_full', 'bonus', 'adjustment', 'refund')
                THEN ${pointsTransactions.points}
                WHEN ${pointsTransactions.type} = 'rejected'
                THEN -${pointsTransactions.points}
                ELSE 0
            END), 0)`.as('lifetime_points'),
            bonusPoints: sql<number>`COALESCE(SUM(CASE
                WHEN ${pointsTransactions.type} = 'bonus'
                THEN ${pointsTransactions.points}
                ELSE 0
            END), 0)`.as('bonus_points'),
            redeemedPoints: sql<number>`COALESCE(SUM(CASE
                WHEN ${pointsTransactions.type} = 'redeemed'
                THEN ${pointsTransactions.points}
                ELSE 0
            END), 0)`.as('redeemed_points'),
            rejectedPoints: sql<number>`COALESCE(SUM(CASE
                WHEN ${pointsTransactions.type} = 'rejected'
                THEN ${pointsTransactions.points}
                ELSE 0
            END), 0)`.as('rejected_points'),
        })
        .from(pointsTransactions)
        .where(eq(pointsTransactions.panelistId, panelistId));

    return {
        lifetimePoints: Number(result[0]?.lifetimePoints || 0),
        bonusPoints: Number(result[0]?.bonusPoints || 0),
        redeemedPoints: Number(result[0]?.redeemedPoints || 0),
        rejectedPoints: Number(result[0]?.rejectedPoints || 0),
    };
}

/**
 * Get recent transactions for a panelist
 * @param panelistId - Panelist ID
 * @param limit - Number of transactions to return (default 10)
 */
export async function getRecentTransactions(panelistId: string, limit: number = 10) {
  return await db
    .select()
    .from(pointsTransactions)
    .where(eq(pointsTransactions.panelistId, panelistId))
    .orderBy(desc(pointsTransactions.createdAt))
    .limit(limit);
}

