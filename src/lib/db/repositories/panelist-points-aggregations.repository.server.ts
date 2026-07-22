import { eq, and, sql, desc, inArray, notInArray } from "drizzle-orm";
import { pointsTransactions } from "../schema/panelist-points";
import { db } from "..";
import { EXPLORATION_TRANSACTION_REFERENCE_TYPES } from "$lib/utils/exploration-points";

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
    // The `points` column always stores a positive magnitude — the `type`
    // column encodes direction. So:
    //  - Lifetime earnings = positive-effect types (completed, terminated,
    //    quota_full, bonus, adjustment) minus 'rejected' (post-credit
    //    rejection that claws back already-credited points).
    //    `refund` is excluded because a refund just restores previously-spent
    //    points — it is not new income.
    //  - Net redeemed = `redeemed` minus `refund` so cancelled redemptions
    //    stop counting as redeemed once refunded.
    const result = await db
        .select({
            lifetimePoints: sql<number>`COALESCE(SUM(CASE
                WHEN ${pointsTransactions.type} IN ('completed', 'terminated', 'quota_full', 'bonus', 'adjustment')
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
                WHEN ${pointsTransactions.type} = 'refund'
                THEN -${pointsTransactions.points}
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
 * Same current/lifetime formulas as getPointsSummary, but scoped to one side
 * of the exploration/survey split — the Discover dashboard shows only
 * `'exploration'`, the Survey dashboard only `'survey'`, so the two never
 * double-count the same points earned from today's tile or the signup bonus.
 *
 * Note: a redemption debit (type 'redeemed', referenceType 'redemption')
 * always falls in the 'survey' bucket, since it isn't attributable to either
 * source — there's a single spendable wallet underneath (see
 * getPanelistPoints), this split is for dashboard display only.
 */
export async function getPointsSummaryByBucket(panelistId: string, bucket: 'exploration' | 'survey') {
    const bucketFilter = bucket === 'exploration'
        ? inArray(pointsTransactions.referenceType, EXPLORATION_TRANSACTION_REFERENCE_TYPES)
        : notInArray(pointsTransactions.referenceType, EXPLORATION_TRANSACTION_REFERENCE_TYPES);

    const result = await db
        .select({
            currentPoints: sql<number>`COALESCE(SUM(CASE
                WHEN ${pointsTransactions.type} IN ('completed', 'terminated', 'quota_full', 'bonus', 'adjustment', 'refund')
                THEN ${pointsTransactions.points}
                WHEN ${pointsTransactions.type} IN ('rejected', 'redeemed')
                THEN -${pointsTransactions.points}
                ELSE 0
            END), 0)`.as('current_points'),
            lifetimePoints: sql<number>`COALESCE(SUM(CASE
                WHEN ${pointsTransactions.type} IN ('completed', 'terminated', 'quota_full', 'bonus', 'adjustment')
                THEN ${pointsTransactions.points}
                WHEN ${pointsTransactions.type} = 'rejected'
                THEN -${pointsTransactions.points}
                ELSE 0
            END), 0)`.as('lifetime_points'),
        })
        .from(pointsTransactions)
        .where(and(eq(pointsTransactions.panelistId, panelistId), bucketFilter));

    return {
        currentPoints: Number(result[0]?.currentPoints || 0),
        lifetimePoints: Number(result[0]?.lifetimePoints || 0),
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

/**
 * Recent exploration points — today's-tile wins plus the signup welcome
 * bonus (see EXPLORATION_TRANSACTION_REFERENCE_TYPES) — for the notification
 * bell on the panelist dashboards. Kept separate from getRecentTransactions
 * so the query itself excludes survey activity rather than over-fetching and
 * filtering client-side.
 */
export async function getRecentExplorationTransactions(panelistId: string, limit: number = 20) {
  return await db
    .select()
    .from(pointsTransactions)
    .where(
      and(
        eq(pointsTransactions.panelistId, panelistId),
        inArray(pointsTransactions.referenceType, EXPLORATION_TRANSACTION_REFERENCE_TYPES)
      )
    )
    .orderBy(desc(pointsTransactions.createdAt))
    .limit(limit);
}

