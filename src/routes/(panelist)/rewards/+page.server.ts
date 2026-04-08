import type { PageServerLoad } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import { db, getPanelistPoints } from '$lib/db';
import { rewards, redemptions } from '$lib/db/schema';
import { eq, and, or, isNull, gt, sql, desc } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const user = await requirePanelist(event);

	const now = new Date();

	const [rows, pointsData, userRedemptions] = await Promise.all([
		db
			.select({
				id: rewards.id,
				name: rewards.name,
				description: rewards.description,
				type: rewards.type,
				provider: rewards.provider,
				category: rewards.category,
				pointsCost: rewards.pointsCost,
				value: rewards.value,
				currency: rewards.currency,
				stock: rewards.stock,
				image: rewards.image,
				isFeatured: rewards.isFeatured,
				terms: rewards.terms,
				expiresAt: rewards.expiresAt,
			})
			.from(rewards)
			.where(and(eq(rewards.isActive, true), or(isNull(rewards.expiresAt), gt(rewards.expiresAt, now))))
			.orderBy(sql`${rewards.isFeatured} DESC, ${rewards.pointsCost} ASC`),
		getPanelistPoints(user.id),
		db.select({
			id: redemptions.id,
			type: redemptions.type,
			provider: redemptions.provider,
			amount: redemptions.amount,
			value: redemptions.value,
			status: redemptions.status,
			createdAt: redemptions.createdAt,
			completedAt: redemptions.completedAt,
			paymentDetails: redemptions.paymentDetails,
		}).from(redemptions).where(eq(redemptions.panelistId, user.id)).orderBy(desc(redemptions.createdAt)).limit(20),
	]);

	const rewardsList = rows.map((r) => ({
		id: r.id,
		title: r.name,
		description: r.description,
		type: r.type,
		provider: r.provider,
		category: r.category,
		pointsCost: r.pointsCost,
		originalPrice: r.value ? Number(r.value) : undefined,
		currency: r.currency,
		stock: r.stock ?? undefined,
		imageUrl: r.image ?? undefined,
		isFeatured: r.isFeatured,
		terms: r.terms,
		expiresAt: r.expiresAt,
	}));

	return {
		rewards: rewardsList,
		userPoints: pointsData?.currentPoints ?? 0,
		redemptions: userRedemptions.map(r => ({
			id: r.id,
			type: r.type,
			provider: r.provider,
			amount: r.amount,
			value: Number(r.value),
			status: r.status,
			rewardName: (r.paymentDetails as any)?.rewardName || r.provider || 'Reward',
			createdAt: r.createdAt.toISOString(),
			completedAt: r.completedAt?.toISOString() ?? null,
		})),
	};
};
