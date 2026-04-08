import { eq, sql, desc } from "drizzle-orm";
import { panelistPoint, pointsTransactions, pointsTransactionTypeEnum } from "../schema/panelist-points";
import { db } from "..";

type TransactionType = (typeof pointsTransactionTypeEnum.enumValues)[number];

/**
 * Panelist Points Repository
 * Handles all point-related operations for panelists
 */

export async function resetPanelistPoints(panelistId: string) {
  return await db
    .update(panelistPoint)
    .set({
      currentPoints: 0,
      updatedAt: new Date()
    })
    .where(eq(panelistPoint.panelistId, panelistId));
}

export async function initializePanelistPoints(panelistId: string) {
    return await db.insert(panelistPoint).values({
      panelistId,
      currentPoints: 0,
      updatedAt: new Date()
    });
}

/**
 * Add points to current points with transaction logging
 * @param panelistId - Panelist ID
 * @param pointsToAdd - Points to add to current
 * @param description - Description of the earning
 * @param type - Transaction type enum value
 * @param referenceType - Type of reference (survey_completion, etc)
 * @param referenceId - Survey completion ID or other reference
 * @param metadata - Additional metadata
 */
export async function addPoints(
  panelistId: string,
  pointsToAdd: number,
  description: string,
  type: TransactionType,
  referenceType: string,
  referenceId?: string,
  metadata?: Record<string, unknown>
) {
  await db.transaction(async (tx) => {
    // Upsert panelist_points row — create if first time earning
    await tx
      .insert(panelistPoint)
      .values({ panelistId, currentPoints: 0 })
      .onConflictDoNothing({ target: panelistPoint.panelistId });

    // Lock the row to prevent concurrent modifications
    const [currentPoints] = await tx
      .select()
      .from(panelistPoint)
      .where(eq(panelistPoint.panelistId, panelistId))
      .for('update');

    const newCurrentBalance = (currentPoints?.currentPoints || 0) + pointsToAdd;

    await tx
      .update(panelistPoint)
      .set({
        currentPoints: sql`${panelistPoint.currentPoints} + ${pointsToAdd}`,
        updatedAt: new Date(),
      })
      .where(eq(panelistPoint.panelistId, panelistId));

    await tx.insert(pointsTransactions).values({
      panelistId,
      type,
      points: pointsToAdd,
      currentBalance: newCurrentBalance,
      description,
      referenceId,
      referenceType,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  });
}

/**
 * Add points earned from survey completion
 * @param panelistId - Panelist ID
 * @param pointsToAdd - Points to add
 * @param description - Description
 * @param referenceId - Survey transaction ID
 * @param referenceType - Reference category (e.g. 'survey_completion')
 * @param metadata - Additional metadata
 */
export async function addPendingPoints(
  panelistId: string,
  pointsToAdd: number,
  description: string,
  referenceId: string,
  referenceType: string,
  metadata?: Record<string, unknown>
) {
  return addPoints(panelistId, pointsToAdd, description, 'completed', referenceType, referenceId, metadata);
}

/**
 * Add bonus points directly to current points with transaction logging
 */
export async function addBonusPoints(
  panelistId: string,
  bonusPoints: number,
  description: string = 'Bonus points',
  referenceId?: string,
  metadata?: Record<string, unknown>
) {
  await db.transaction(async (tx) => {
    // Lock the row to prevent concurrent modifications
    const [currentPoints] = await tx
      .select()
      .from(panelistPoint)
      .where(eq(panelistPoint.panelistId, panelistId))
      .for('update');

    const newCurrentBalance = (currentPoints?.currentPoints || 0) + bonusPoints;

    await tx
      .update(panelistPoint)
      .set({
        currentPoints: sql`${panelistPoint.currentPoints} + ${bonusPoints}`,
        updatedAt: new Date(),
      })
      .where(eq(panelistPoint.panelistId, panelistId));

    await tx.insert(pointsTransactions).values({
      panelistId,
      type: 'bonus',
      points: bonusPoints,
      currentBalance: newCurrentBalance,
      description,
      referenceId,
      referenceType: 'bonus',
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
    });
  });
}

/**
 * Redeem points (move from current to redeemed) with transaction logging
 */
export async function redeemPoints(
  panelistId: string,
  pointsToRedeem: number,
  redemptionId: string,
  description: string,
  metadata?: Record<string, unknown>
) {
  await db.transaction(async (tx) => {
    // Lock the row to prevent concurrent modifications and ensure accurate balance check
    const [currentPoints] = await tx
      .select()
      .from(panelistPoint)
      .where(eq(panelistPoint.panelistId, panelistId))
      .for('update');

    const newCurrentBalance = (currentPoints?.currentPoints || 0) - pointsToRedeem;

    // Validate sufficient balance inside the transaction (under lock)
    if (newCurrentBalance < 0) {
      throw new Error('Insufficient points balance');
    }

    await tx
      .update(panelistPoint)
      .set({
        currentPoints: sql`${panelistPoint.currentPoints} - ${pointsToRedeem}`,
        updatedAt: new Date(),
      })
      .where(eq(panelistPoint.panelistId, panelistId));

    await tx.insert(pointsTransactions).values({
      panelistId,
      type: 'redeemed',
      points: pointsToRedeem,
      currentBalance: newCurrentBalance,
      description,
      referenceId: redemptionId,
      referenceType: 'redemption',
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
    });
  });
}

/**
 * Get panelist points by panelist ID
 */
export async function getPanelistPoints(panelistId: string) {
    const [pointsData] = await db
        .select()
        .from(panelistPoint)
        .where(eq(panelistPoint.panelistId, panelistId))
        .limit(1);

    return pointsData;
}

/**
 * Get panelist points transactions history
 */
export async function getPanelistPointsTransactions(userId: string, limit: number = 20) {
  return db
    .select({
      id: pointsTransactions.id,
      type: pointsTransactions.type,
      points: pointsTransactions.points,
      currentBalance: pointsTransactions.currentBalance,
      description: pointsTransactions.description,
      referenceId: pointsTransactions.referenceId,
      referenceType: pointsTransactions.referenceType,
      createdAt: pointsTransactions.createdAt,
    })
    .from(pointsTransactions)
    .where(eq(pointsTransactions.panelistId, userId))
    .orderBy(desc(pointsTransactions.createdAt))
    .limit(limit);
}
