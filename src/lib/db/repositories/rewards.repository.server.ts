/**
 * Rewards Repository
 * Database operations for rewards management
 */

import { db } from '..';
import { rewards, redemptions } from '../schema';
import { eq, sql, gt, and, or, isNull, desc, like } from 'drizzle-orm';

export type RewardType = 'gift_card' | 'cash' | 'product' | 'discount' | 'experience';

export type RewardInput = {
	name: string;
	description?: string | null;
	type: RewardType;
	provider?: string | null;
	category?: string | null;
	pointsCost: number;
	value: string;
	currency?: string;
	stock?: number | null;
	maxPerUser?: number | null;
	isActive?: boolean;
	isFeatured?: boolean;
	image?: string | null;
	terms?: string | null;
	expiresAt?: Date | null;
};

export type RewardUpdateInput = Partial<RewardInput>;

export type AdminRewardsFilter = {
	search?: string;
	status?: string;
	type?: string;
	page?: number;
	limit?: number;
};

/**
 * Get all rewards (including inactive) for admin management
 */
export async function getAllRewards() {
	return db.select().from(rewards).orderBy(sql`${rewards.createdAt} DESC`);
}

/**
 * Get a single reward by ID
 */
export async function getRewardById(id: string) {
	const [reward] = await db.select().from(rewards).where(eq(rewards.id, id)).limit(1);
	return reward ?? null;
}

/**
 * Get active rewards visible to panelists (non-expired)
 */
export async function getActiveRewards() {
	const now = new Date();
	return db
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
		.orderBy(sql`${rewards.isFeatured} DESC, ${rewards.pointsCost} ASC`);
}

/**
 * Create a new reward
 */
export async function createReward(data: RewardInput) {
	const [created] = await db
		.insert(rewards)
		.values({
			name: data.name,
			description: data.description ?? null,
			type: data.type,
			provider: data.provider ?? null,
			category: data.category ?? null,
			pointsCost: data.pointsCost,
			value: data.value,
			currency: data.currency ?? 'USD',
			stock: data.stock ?? null,
			maxPerUser: data.maxPerUser ?? null,
			isActive: data.isActive ?? true,
			isFeatured: data.isFeatured ?? false,
			image: data.image ?? null,
			terms: data.terms ?? null,
			expiresAt: data.expiresAt ?? null,
		})
		.returning();
	return created;
}

/**
 * Update a reward (partial update)
 */
export async function updateReward(id: string, data: RewardUpdateInput) {
	const updateSet: Record<string, unknown> = { updatedAt: new Date() };

	if (data.name !== undefined) updateSet.name = data.name;
	if (data.description !== undefined) updateSet.description = data.description;
	if (data.type !== undefined) updateSet.type = data.type;
	if (data.provider !== undefined) updateSet.provider = data.provider;
	if (data.category !== undefined) updateSet.category = data.category;
	if (data.pointsCost !== undefined) updateSet.pointsCost = data.pointsCost;
	if (data.value !== undefined) updateSet.value = data.value;
	if (data.currency !== undefined) updateSet.currency = data.currency;
	if (data.stock !== undefined) updateSet.stock = data.stock;
	if (data.maxPerUser !== undefined) updateSet.maxPerUser = data.maxPerUser;
	if (data.isActive !== undefined) updateSet.isActive = data.isActive;
	if (data.isFeatured !== undefined) updateSet.isFeatured = data.isFeatured;
	if (data.image !== undefined) updateSet.image = data.image;
	if (data.terms !== undefined) updateSet.terms = data.terms;
	if (data.expiresAt !== undefined) updateSet.expiresAt = data.expiresAt;

	const [updated] = await db.update(rewards).set(updateSet).where(eq(rewards.id, id)).returning();
	return updated ?? null;
}

/**
 * Soft-delete a reward by deactivating it (preserves redemption history)
 */
export async function deactivateReward(id: string) {
	const [deactivated] = await db
		.update(rewards)
		.set({ isActive: false, updatedAt: new Date() })
		.where(eq(rewards.id, id))
		.returning({ id: rewards.id, name: rewards.name });
	return deactivated ?? null;
}

/**
 * Get paginated rewards list for admin with filters and stats
 */
export async function getAdminRewards(filters: AdminRewardsFilter = {}) {
	const { search = '', status = 'all', type = 'all', page = 1, limit = 20 } = filters;
	const offset = (page - 1) * limit;

	const whereConditions = [];

	if (search) {
		whereConditions.push(
			or(
				like(rewards.name, `%${search}%`),
				like(rewards.description, `%${search}%`),
				like(rewards.provider, `%${search}%`)
			)
		);
	}
	if (status === 'active') whereConditions.push(eq(rewards.isActive, true));
	else if (status === 'inactive') whereConditions.push(eq(rewards.isActive, false));
	if (type !== 'all') whereConditions.push(eq(rewards.type, type as RewardType));

	const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

	const [totalCount] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(rewards)
		.where(whereClause);

	const rewardRows = await db
		.select()
		.from(rewards)
		.where(whereClause)
		.orderBy(desc(rewards.createdAt))
		.limit(limit)
		.offset(offset);

	const rewardIds = rewardRows.map((r) => r.id);

	const redemptionStats =
		rewardIds.length > 0
			? await db
					.select({
						rewardId: sql<string>`(${redemptions.paymentDetails}->>'rewardId')`,
						totalRedemptions: sql<number>`count(*)::int`,
						pendingRedemptions: sql<number>`count(case when ${redemptions.status} = 'pending' then 1 end)::int`,
						completedRedemptions: sql<number>`count(case when ${redemptions.status} = 'completed' then 1 end)::int`,
					})
					.from(redemptions)
					.where(
						sql`(${redemptions.paymentDetails}->>'rewardId') IN (${sql.join(
							rewardIds.map((id) => sql`${id}`),
							sql`, `
						)})`
					)
					.groupBy(sql`(${redemptions.paymentDetails}->>'rewardId')`)
			: [];

	const rewardsWithStats = rewardRows.map((r) => {
		const stats = redemptionStats.find((s) => s.rewardId === r.id);
		return {
			...r,
			totalRedemptions: stats?.totalRedemptions ?? 0,
			pendingRedemptions: stats?.pendingRedemptions ?? 0,
			completedRedemptions: stats?.completedRedemptions ?? 0,
		};
	});

	const [summaryStats] = await db
		.select({
			totalRewards: sql<number>`count(*)::int`,
			activeRewards: sql<number>`count(case when ${rewards.isActive} = true then 1 end)::int`,
			featuredRewards: sql<number>`count(case when ${rewards.isFeatured} = true then 1 end)::int`,
			outOfStock: sql<number>`count(case when ${rewards.stock} = 0 then 1 end)::int`,
		})
		.from(rewards);

	return {
		rewards: rewardsWithStats,
		pagination: {
			page,
			limit,
			total: totalCount?.count || 0,
			totalPages: Math.ceil((totalCount?.count || 0) / limit),
		},
		filters: { search, status, type },
		stats: {
			totalRewards: summaryStats?.totalRewards || 0,
			activeRewards: summaryStats?.activeRewards || 0,
			featuredRewards: summaryStats?.featuredRewards || 0,
			outOfStock: summaryStats?.outOfStock || 0,
		},
	};
}
