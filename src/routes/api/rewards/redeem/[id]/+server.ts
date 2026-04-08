import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import { db } from '$lib/db';
import { redemptions, panelistPoint, pointsTransactions } from '$lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { Logger } from '$lib/utils/app-logger';

/**
 * DELETE /api/rewards/redeem/[id] — Request cancellation of a pending redemption
 * Only works for redemptions with status 'pending' owned by the requesting user.
 * Refunds points atomically.
 */
export const DELETE: RequestHandler = async (event) => {
	const user = await requirePanelist(event);
	const { id } = event.params;

	try {
		// Find the redemption and verify ownership + status
		const [redemption] = await db
			.select()
			.from(redemptions)
			.where(and(eq(redemptions.id, id), eq(redemptions.panelistId, user.id)))
			.limit(1);

		if (!redemption) {
			return json({ success: false, error: 'NOT_FOUND', message: 'Redemption not found' }, { status: 404 });
		}

		if (redemption.status !== 'pending') {
			return json({
				success: false,
				error: 'CANNOT_CANCEL',
				message: `Cannot cancel a redemption that is already ${redemption.status}`,
			}, { status: 400 });
		}

		// Atomic: cancel redemption + refund points
		await db.transaction(async (tx) => {
			await tx
				.update(redemptions)
				.set({ status: 'cancelled', updatedAt: new Date() })
				.where(eq(redemptions.id, id));

			const [updatedPoints] = await tx
				.update(panelistPoint)
				.set({
					currentPoints: sql`${panelistPoint.currentPoints} + ${redemption.amount}`,
					updatedAt: new Date(),
				})
				.where(eq(panelistPoint.panelistId, user.id))
				.returning({ currentPoints: panelistPoint.currentPoints });

			await tx.insert(pointsTransactions).values({
				panelistId: user.id,
				type: 'refund',
				points: redemption.amount,
				currentBalance: updatedPoints?.currentPoints ?? 0,
				description: `Redemption cancelled: ${(redemption.paymentDetails as any)?.rewardName || 'Reward'}`,
				referenceId: id,
				referenceType: 'redemption',
				createdAt: new Date(),
			});
		});

		Logger.root.info(
			{ context: 'api', userId: user.id, redemptionId: id, refundedPoints: redemption.amount },
			'Redemption cancelled and points refunded'
		);

		return json({
			success: true,
			message: 'Redemption cancelled. Your points have been refunded.',
			data: { refundedPoints: redemption.amount },
		});
	} catch (error) {
		Logger.root.error({ context: 'api', error, userId: user.id, redemptionId: id }, 'Failed to cancel redemption');
		return json({ success: false, error: 'CANCEL_FAILED', message: 'Failed to cancel redemption' }, { status: 500 });
	}
};
