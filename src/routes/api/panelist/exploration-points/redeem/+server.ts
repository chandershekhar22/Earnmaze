import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import { db } from '$lib/db';
import { panelistPoint, pointsTransactions } from '$lib/db/schema';
import { eq, and, inArray, notInArray, sql } from 'drizzle-orm';
import { EXPLORATION_TRANSACTION_REFERENCE_TYPES, EXPLORATION_REDEEM_THRESHOLD } from '$lib/utils/exploration-points';
import { Logger } from '$lib/utils/app-logger';

/**
 * POST /api/panelist/exploration-points/redeem
 *
 * Redeems a fixed EXPLORATION_REDEEM_THRESHOLD points, gated on the
 * Discover dashboard's exploration-vs-survey split: the panelist needs at
 * least EXPLORATION_REDEEM_THRESHOLD points in *both* the exploration bucket and the survey bucket
 * (see getPointsSummaryByBucket). There's only one spendable wallet
 * underneath (panelistPoint.currentPoints) — the buckets are a
 * referenceType-based read of points_transactions used purely to decide
 * eligibility, so the debit itself is a normal 'redeemed' transaction.
 */
export const POST: RequestHandler = async (event) => {
	const authUser = await requirePanelist(event);

	try {
		const { newBalance } = await db.transaction(async (tx) => {
			// Lock the wallet row so concurrent redemption attempts serialize —
			// the second request only proceeds past this point once the first
			// has committed, so its bucket re-check below sees the first
			// redemption's transaction row.
			const [locked] = await tx
				.select()
				.from(panelistPoint)
				.where(eq(panelistPoint.panelistId, authUser.id))
				.for('update')
				.limit(1);

			const balance = locked?.currentPoints ?? 0;

			const bucketCurrentPoints = async (bucket: 'exploration' | 'survey') => {
				const bucketFilter = bucket === 'exploration'
					? inArray(pointsTransactions.referenceType, EXPLORATION_TRANSACTION_REFERENCE_TYPES)
					: notInArray(pointsTransactions.referenceType, EXPLORATION_TRANSACTION_REFERENCE_TYPES);
				const [row] = await tx
					.select({
						currentPoints: sql<number>`COALESCE(SUM(CASE
							WHEN ${pointsTransactions.type} IN ('completed', 'terminated', 'quota_full', 'bonus', 'adjustment', 'refund')
							THEN ${pointsTransactions.points}
							WHEN ${pointsTransactions.type} IN ('rejected', 'redeemed')
							THEN -${pointsTransactions.points}
							ELSE 0
						END), 0)`.as('current_points'),
					})
					.from(pointsTransactions)
					.where(and(eq(pointsTransactions.panelistId, authUser.id), bucketFilter));
				return Number(row?.currentPoints ?? 0);
			};

			const [explorationPoints, surveyPoints] = await Promise.all([
				bucketCurrentPoints('exploration'),
				bucketCurrentPoints('survey'),
			]);

			if (explorationPoints < EXPLORATION_REDEEM_THRESHOLD) {
				throw new Error('INSUFFICIENT_EXPLORATION_POINTS');
			}
			if (surveyPoints < EXPLORATION_REDEEM_THRESHOLD) {
				throw new Error('INSUFFICIENT_SURVEY_POINTS');
			}
			if (balance < EXPLORATION_REDEEM_THRESHOLD) {
				// Unreachable in practice (the exploration bucket is always a
				// subset of the total wallet), but keep the wallet invariant safe.
				throw new Error('INSUFFICIENT_EXPLORATION_POINTS');
			}

			const nextBalance = balance - EXPLORATION_REDEEM_THRESHOLD;

			await tx
				.update(panelistPoint)
				.set({
					currentPoints: sql`${panelistPoint.currentPoints} - ${EXPLORATION_REDEEM_THRESHOLD}`,
					updatedAt: new Date(),
				})
				.where(eq(panelistPoint.panelistId, authUser.id));

			await tx.insert(pointsTransactions).values({
				panelistId: authUser.id,
				type: 'redeemed',
				points: EXPLORATION_REDEEM_THRESHOLD,
				currentBalance: nextBalance,
				description: 'Redeemed exploration points',
				referenceType: 'redemption',
				metadata: JSON.stringify({ kind: 'exploration_redemption' }),
				createdAt: new Date(),
			});

			return { newBalance: nextBalance };
		});

		Logger.root.info(
			{ context: 'redemption', userId: authUser.id, points: EXPLORATION_REDEEM_THRESHOLD },
			'Exploration points redeemed'
		);

		return json({
			success: true,
			message: 'Exploration points redeemed successfully.',
			data: { redeemedPoints: EXPLORATION_REDEEM_THRESHOLD, newBalance },
		});
	} catch (error) {
		const msg = error instanceof Error ? error.message : 'Unknown error';

		if (msg === 'INSUFFICIENT_EXPLORATION_POINTS') {
			return json(
				{ success: false, error: 'INSUFFICIENT_EXPLORATION_POINTS', message: `You need ${EXPLORATION_REDEEM_THRESHOLD} exploration points to redeem` },
				{ status: 400 }
			);
		}
		if (msg === 'INSUFFICIENT_SURVEY_POINTS') {
			return json(
				{ success: false, error: 'INSUFFICIENT_SURVEY_POINTS', message: `You need ${EXPLORATION_REDEEM_THRESHOLD} survey points to redeem` },
				{ status: 400 }
			);
		}

		Logger.root.error({ context: 'api', error, userId: authUser.id }, 'Exploration points redemption failed');
		return json({ success: false, error: 'REDEEM_FAILED', message: 'Failed to redeem exploration points' }, { status: 500 });
	}
};
