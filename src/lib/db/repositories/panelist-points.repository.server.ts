import { eq, sql, desc } from "drizzle-orm";
import { panelistPoint, pointsTransactions } from "../schema/panelist-points";
import { db } from "..";

/**
 * Panelist Points Repository
 * Handles all point-related operations for panelists
 */

/**
 * Reset panelist points to zero (used for initialization)
 * @param panelistId - Panelist ID
 */
export async function resetPanelistPoints(panelistId: string) {
  return await db
    .update(panelistPoint)
    .set({ 
      currentPoints: 0, 
      pendingPoints: 0,
      updatedAt: new Date()
    })
    .where(eq(panelistPoint.panelistId, panelistId));
}

export async function initializePanelistPoints(panelistId: string) {
    return await db.insert(panelistPoint).values({
      panelistId,
      currentPoints: 0,
      pendingPoints: 0,
      updatedAt: new Date()
    });
}   

/**
 * Add points to pending points with transaction logging
 * lifetimePoints is also incremented as it is a cumulative metric
 * @param panelistId - Panelist ID
 * @param pointsToAdd - Points to add to pending
 * @param description - Description of the earning
 * @param referenceId - Survey completion ID or other reference
 * @param referenceType - Type of reference (survey_completion, etc)
 * @param metadata - Additional metadata
 */
export async function addPendingPoints(
  panelistId: string,
  pointsToAdd: number,
  description: string,
  referenceId?: string,
  referenceType: string = 'survey_completion',
  metadata?: Record<string, unknown>
) {
  const currentPoints = await getPanelistPoints(panelistId);
  const newCurrentBalance = currentPoints?.currentPoints || 0;
  const newPendingBalance = (currentPoints?.pendingPoints || 0) + pointsToAdd;

  await db.transaction(async (tx) => {
    await tx
      .update(panelistPoint)
      .set({
        pendingPoints: sql`${panelistPoint.pendingPoints} + ${pointsToAdd}`,
        updatedAt: new Date(),
      })
      .where(eq(panelistPoint.panelistId, panelistId));

    // Log transaction as pending with dual balance snapshot
    await tx.insert(pointsTransactions).values({
      panelistId,
      type: 'earned',
      points: pointsToAdd,
      currentBalance: newCurrentBalance,
      pendingBalance: newPendingBalance,
      description,
      referenceId,
      referenceType,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  });
}

/**
 * Confirm and move pending points to current points
 * Creates a NEW transaction for the confirmation (doesn't update old one)
 * @param panelistId - Panelist ID
 * @param pointsToConfirm - Points to confirm
 * @param originalTransactionId - ID of the original pending transaction (for reference)
 * @param description - Description for the confirmation transaction
 */
export async function confirmPendingPoints(
  panelistId: string,
  pointsToConfirm: number,
  originalTransactionId: string,
  description: string = 'Points confirmed',
  metadata?: Record<string, unknown>
) {
  const currentPoints = await getPanelistPoints(panelistId);
  const newCurrentBalance = (currentPoints?.currentPoints || 0) + pointsToConfirm;
  const newPendingBalance = (currentPoints?.pendingPoints || 0) - pointsToConfirm;

  await db.transaction(async (tx) => {
    await tx
      .update(panelistPoint)
      .set({
        pendingPoints: sql`${panelistPoint.pendingPoints} - ${pointsToConfirm}`,
        currentPoints: sql`${panelistPoint.currentPoints} + ${pointsToConfirm}`,
        updatedAt: new Date(),
      })
      .where(eq(panelistPoint.panelistId, panelistId));

    // Create NEW transaction for confirmation
    await tx.insert(pointsTransactions).values({
      panelistId,
      type: 'confirmed',
      points: pointsToConfirm,
      currentBalance: newCurrentBalance,
      pendingBalance: newPendingBalance,
      description,
      referenceId: originalTransactionId,
      referenceType: 'confirmation',
       metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
    });
  });
}

/**
 * Reject and remove pending points
 * Creates a NEW transaction for the rejection (doesn't update old one)
 * @param panelistId - Panelist ID
 * @param pointsToReject - Points to reject
 * @param originalTransactionId - ID of the original pending transaction (for reference)
 * @param description - Description for the rejection transaction
 * @param rejectionReason - Reason for rejection (stored in metadata)
 */
export async function rejectPendingPoints(
  panelistId: string,
  pointsToReject: number,
  originalTransactionId: string,
  description: string = 'Points rejected',
  metadata?: Record<string, unknown>
) {
  const currentPoints = await getPanelistPoints(panelistId);
  const newCurrentBalance = currentPoints?.currentPoints || 0;
  const newPendingBalance = (currentPoints?.pendingPoints || 0) - pointsToReject;

  await db.transaction(async (tx) => {
    await tx
      .update(panelistPoint)
      .set({
        pendingPoints: sql`${panelistPoint.pendingPoints} - ${pointsToReject}`,
        updatedAt: new Date(),
      })
      .where(eq(panelistPoint.panelistId, panelistId));

    // Create NEW transaction for rejection
    await tx.insert(pointsTransactions).values({
      panelistId,
      type: 'penalty',
      points: -pointsToReject, // Negative to show deduction
      currentBalance: newCurrentBalance,
      pendingBalance: newPendingBalance,
      description,
      referenceId: originalTransactionId,
      referenceType: 'rejection',
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
    });
  });
}

/**
 * Add bonus points directly to current points with transaction logging
 * @param panelistId - Panelist ID
 * @param bonusPoints - Bonus points to add
 * @param description - Description of the bonus
 * @param referenceId - Optional reference ID (e.g., referral ID)
 * @param metadata - Optional metadata
 */
export async function addBonusPoints(
  panelistId: string,
  bonusPoints: number,
  description: string = 'Bonus points',
  referenceId?: string,
  metadata?: Record<string, unknown>
) {
  // Get current balance for transaction record
  const currentPoints = await getPanelistPoints(panelistId);
  const newCurrentBalance = (currentPoints?.currentPoints || 0) + bonusPoints;
  const newPendingBalance = currentPoints?.pendingPoints || 0;

  // Update points in a transaction
  await db.transaction(async (tx) => {
    // Update summary table
    await tx
      .update(panelistPoint)
      .set({
        currentPoints: sql`${panelistPoint.currentPoints} + ${bonusPoints}`,
        updatedAt: new Date(),
      })
      .where(eq(panelistPoint.panelistId, panelistId));

    // Log transaction with dual balance snapshot
    await tx.insert(pointsTransactions).values({
      panelistId,
      type: 'bonus',
      points: bonusPoints,
      currentBalance: newCurrentBalance,
      pendingBalance: newPendingBalance,
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
 * @param panelistId - Panelist ID
 * @param pointsToRedeem - Points to redeem
 * @param redemptionId - ID of the redemption record
 * @param description - Description of the redemption
 * @param metadata - Additional metadata (redemption details)
 */
export async function redeemPoints(
  panelistId: string,
  pointsToRedeem: number,
  redemptionId: string,
  description: string,
  metadata?: Record<string, unknown>
) {
  const currentPoints = await getPanelistPoints(panelistId);
  const newCurrentBalance = (currentPoints?.currentPoints || 0) - pointsToRedeem;
  const newPendingBalance = currentPoints?.pendingPoints || 0;

  // Validate sufficient balance
  if (newCurrentBalance < 0) {
    throw new Error('Insufficient points balance');
  }

  await db.transaction(async (tx) => {
    await tx
      .update(panelistPoint)
      .set({
        currentPoints: sql`${panelistPoint.currentPoints} - ${pointsToRedeem}`,
        updatedAt: new Date(),
      })
      .where(eq(panelistPoint.panelistId, panelistId));

    // Log redemption transaction with dual balance snapshot
    await tx.insert(pointsTransactions).values({
      panelistId,
      type: 'redeemed',
      points: pointsToRedeem, // Negative for redemptions
      currentBalance: newCurrentBalance,
      pendingBalance: newPendingBalance,
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
 * @param panelistId - Panelist ID
 * @returns Points information
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
 * @param userId - User ID
 * @param limit - Maximum number of transactions to return
 * @returns Array of points transactions
 */
export async function getPanelistPointsTransactions(userId: string, limit: number = 20) {

  return db
    .select({
      id: pointsTransactions.id,
      type: pointsTransactions.type,
      points: pointsTransactions.points,
      currentBalance: pointsTransactions.currentBalance,
      pendingBalance: pointsTransactions.pendingBalance,
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


