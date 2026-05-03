import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import { db, getPanelistPoints } from '$lib/db';
import { rewards, redemptions, panelistPoint, pointsTransactions } from '$lib/db/schema';
import { eq, and, sql, gt, or, isNull } from 'drizzle-orm';
import { Logger } from '$lib/utils/app-logger';
import { createRedemptionOtp, verifyRedemptionOtp } from '$lib/server/redemption-otp';
import { sendRedemptionOtpEmail } from '$lib/server/email-service';
import { user } from '$lib/db/schema/auth';
import { notifyUpdate } from '$lib/utils/telegram';

/**
 * POST /api/rewards/redeem — Step 1: Request OTP before redemption
 * Body: { rewardId: string }
 * Sends OTP to user's email. User must confirm via PATCH.
 */
export const POST: RequestHandler = async (event) => {
	const authUser = await requirePanelist(event);

	let body: { rewardId?: string };
	try {
		body = await event.request.json();
	} catch {
		return json({ success: false, error: 'INVALID_BODY', message: 'Invalid JSON body' }, { status: 400 });
	}

	const { rewardId } = body;
	if (!rewardId) {
		return json({ success: false, error: 'MISSING_REWARD_ID', message: 'Reward ID is required' }, { status: 400 });
	}

	try {
		// Verify reward exists and is available
		const now = new Date();
		const [reward] = await db
			.select()
			.from(rewards)
			.where(and(eq(rewards.id, rewardId), eq(rewards.isActive, true), or(isNull(rewards.expiresAt), gt(rewards.expiresAt, now))))
			.limit(1);

		if (!reward) {
			return json({ success: false, error: 'REWARD_NOT_FOUND', message: 'Reward not found or no longer available' }, { status: 404 });
		}

		if (reward.stock !== null && reward.stock <= 0) {
			return json({ success: false, error: 'OUT_OF_STOCK', message: 'This reward is out of stock' }, { status: 409 });
		}

		// Quick balance pre-check
		const points = await getPanelistPoints(authUser.id);
		if ((points?.currentPoints ?? 0) < reward.pointsCost) {
			return json({ success: false, error: 'INSUFFICIENT_POINTS', message: `You need ${reward.pointsCost - (points?.currentPoints ?? 0)} more points` }, { status: 400 });
		}

		// Get user email
		const [userData] = await db.select({ email: user.email }).from(user).where(eq(user.id, authUser.id)).limit(1);
		if (!userData?.email) {
			return json({ success: false, error: 'NO_EMAIL', message: 'No email found for your account' }, { status: 400 });
		}

		// Generate OTP and send email
		const otp = createRedemptionOtp(authUser.id, rewardId);
		await sendRedemptionOtpEmail(userData.email, otp, reward.name, reward.pointsCost);

		Logger.root.info({ context: 'redemption', userId: authUser.id, rewardId }, 'Redemption OTP sent');

		return json({
			success: true,
			message: 'Verification code sent to your email. Enter it to confirm redemption.',
			data: { rewardId, rewardName: reward.name, pointsCost: reward.pointsCost },
		});
	} catch (error) {
		Logger.root.error({ context: 'api', error, userId: authUser.id }, 'Failed to send redemption OTP');
		return json({ success: false, error: 'OTP_FAILED', message: 'Failed to send verification code' }, { status: 500 });
	}
};

/**
 * PATCH /api/rewards/redeem — Step 2: Confirm OTP and process redemption
 * Body: { otp: string }
 */
export const PATCH: RequestHandler = async (event) => {
	const authUser = await requirePanelist(event);

	let body: { otp?: string };
	try {
		body = await event.request.json();
	} catch {
		return json({ success: false, error: 'INVALID_BODY', message: 'Invalid JSON body' }, { status: 400 });
	}

	const { otp } = body;
	if (!otp || otp.length !== 6) {
		return json({ success: false, error: 'INVALID_OTP', message: 'Please enter a valid 6-digit code' }, { status: 400 });
	}

	// Verify OTP
	const result = verifyRedemptionOtp(authUser.id, otp);
	if (!result) {
		return json({ success: false, error: 'OTP_INVALID', message: 'Invalid or expired verification code' }, { status: 403 });
	}

	const { rewardId } = result;

	try {
		// Fetch reward again (may have changed since OTP was sent)
		const now = new Date();
		const [reward] = await db
			.select()
			.from(rewards)
			.where(and(eq(rewards.id, rewardId), eq(rewards.isActive, true), or(isNull(rewards.expiresAt), gt(rewards.expiresAt, now))))
			.limit(1);

		if (!reward) {
			return json({ success: false, error: 'REWARD_NOT_FOUND', message: 'Reward is no longer available' }, { status: 404 });
		}

		if (reward.stock !== null && reward.stock <= 0) {
			return json({ success: false, error: 'OUT_OF_STOCK', message: 'This reward is out of stock' }, { status: 409 });
		}

		// ATOMIC TRANSACTION
		const txResult = await db.transaction(async (tx) => {
			const [lockedPoints] = await tx
				.select()
				.from(panelistPoint)
				.where(eq(panelistPoint.panelistId, authUser.id))
				.for('update')
				.limit(1);

			const balance = lockedPoints?.currentPoints ?? 0;
			if (balance < reward.pointsCost) {
				throw new Error('INSUFFICIENT_POINTS');
			}

			if (reward.maxPerUser !== null) {
				const [{ count }] = await tx
					.select({ count: sql<number>`count(*)::int` })
					.from(redemptions)
					.where(and(
						eq(redemptions.panelistId, authUser.id),
						sql`${redemptions.status} NOT IN ('failed', 'cancelled')`,
						eq(redemptions.provider, reward.provider ?? ''),
						sql`${redemptions.value}::numeric = ${Number(reward.value)}`
					));
				if (count >= reward.maxPerUser) {
					throw new Error('MAX_REDEMPTIONS');
				}
			}

			const [redemption] = await tx
				.insert(redemptions)
				.values({
					panelistId: authUser.id,
					type: reward.type === 'cash' ? 'cash' : 'gift_card',
					provider: reward.provider,
					amount: reward.pointsCost,
					value: reward.value,
					currency: reward.currency ?? 'USD',
					exchangeRate: reward.pointsCost > 0
						? String((Number(reward.value) / reward.pointsCost).toFixed(4))
						: '0.0000',
					status: 'pending',
					paymentDetails: { rewardId: reward.id, rewardName: reward.name },
					fees: '0.00',
					netAmount: reward.value,
				})
				.returning({ id: redemptions.id });

			const newBalance = balance - reward.pointsCost;

			await tx
				.update(panelistPoint)
				.set({
					currentPoints: sql`${panelistPoint.currentPoints} - ${reward.pointsCost}`,
					updatedAt: new Date(),
				})
				.where(eq(panelistPoint.panelistId, authUser.id));

			await tx.insert(pointsTransactions).values({
				panelistId: authUser.id,
				type: 'redeemed',
				points: reward.pointsCost,
				currentBalance: newBalance,
				description: `Redeemed: ${reward.name}`,
				referenceId: redemption.id,
				referenceType: 'redemption',
				metadata: JSON.stringify({ rewardId: reward.id, provider: reward.provider, value: Number(reward.value) }),
				createdAt: new Date(),
			});

			if (reward.stock !== null) {
				await tx.update(rewards).set({ stock: sql`${rewards.stock} - 1` }).where(eq(rewards.id, rewardId));
			}

			return { redemptionId: redemption.id };
		});

		Logger.root.info({ context: 'api', userId: authUser.id, rewardId, redemptionId: txResult.redemptionId }, 'Reward redeemed successfully (OTP verified)');

		// Best-effort Telegram update for the operations channel.
		// Escape reward.name — admin-controlled but treated as untrusted to
		// avoid breaking Telegram's HTML parser if it contains <, >, or &.
		const safeRewardName = String(reward.name ?? '')
			.slice(0, 200)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		try {
			notifyUpdate(
				`🎁 Redemption: <b>${safeRewardName}</b> · ${reward.pointsCost} pts · ${reward.value} ${reward.currency ?? 'USD'}`
			).catch(() => {
				/* swallow */
			});
		} catch {
			/* swallow sync throw */
		}

		return json({
			success: true,
			message: 'Reward redeemed successfully! Your redemption is being processed.',
			data: { redemptionId: txResult.redemptionId },
		});
	} catch (error) {
		const msg = error instanceof Error ? error.message : 'Unknown error';

		if (msg === 'INSUFFICIENT_POINTS') {
			return json({ success: false, error: 'INSUFFICIENT_POINTS', message: 'Insufficient points balance' }, { status: 400 });
		}
		if (msg === 'MAX_REDEMPTIONS') {
			return json({ success: false, error: 'MAX_REDEMPTIONS', message: 'You have already redeemed this reward the maximum number of times' }, { status: 409 });
		}

		Logger.root.error({ context: 'api', error, userId: authUser.id }, 'Reward redemption error');
		return json({ success: false, error: 'REDEEM_FAILED', message: 'Failed to redeem reward' }, { status: 500 });
	}
};
