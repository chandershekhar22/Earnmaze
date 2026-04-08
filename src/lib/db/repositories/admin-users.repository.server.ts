/**
 * Admin Users Repository
 * Database operations for admin user management
 */

import { db } from '..';
import { user } from '../schema/auth';
import { panelistPoint } from '../schema';
import { surveyTransaction } from '../schema/surveys';
import { eq, desc, sql, like, or } from 'drizzle-orm';

export type AdminUsersFilter = {
	search?: string;
	userType?: string;
	page?: number;
	limit?: number;
};

/**
 * Get paginated users list for admin with optional filters and panelist stats
 */
export async function getAdminUsers(filters: AdminUsersFilter = {}) {
	const { search = '', userType = 'all', page = 1, limit = 20 } = filters;
	const offset = (page - 1) * limit;

	const whereConditions = [];

	if (search) {
		const trimmed = search.trim();
		const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
		const isRespondentId = !isUUID && /^[A-Za-z0-9_-]{10,}$/.test(trimmed);

		if (isUUID) {
			// Direct user ID lookup
			whereConditions.push(eq(user.id, trimmed));
		} else if (isRespondentId) {
			// Find user by respondent ID via survey_transactions
			const txResult = await db
				.select({ panelistId: surveyTransaction.panelistId })
				.from(surveyTransaction)
				.where(eq(surveyTransaction.respondentId, trimmed))
				.limit(1);

			if (txResult.length > 0) {
				whereConditions.push(eq(user.id, txResult[0].panelistId));
			} else {
				return {
					users: [],
					pagination: { page, limit, total: 0, totalPages: 0 },
					filters: { search, userType },
				};
			}
		} else {
			whereConditions.push(or(like(user.email, `%${search}%`), like(user.name, `%${search}%`)));
		}
	}

	if (userType !== 'all') {
		whereConditions.push(
			eq(user.userType, userType as 'admin' | 'panelist' | 'client' | 'moderator')
		);
	}

	const whereClause =
		whereConditions.length > 0 ? sql`${sql.join(whereConditions, sql` AND `)}` : undefined;

	const [totalCount] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(user)
		.where(whereClause);

	const users = await db
		.select({
			id: user.id,
			email: user.email,
			name: user.name,
			userType: user.userType,
			isActive: user.isActive,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt,
			lastLoginAt: user.lastLoginAt,
		})
		.from(user)
		.where(whereClause)
		.orderBy(desc(user.createdAt))
		.limit(limit)
		.offset(offset);

	const userIds = users.map((u) => u.id);

	const panelistStats =
		userIds.length > 0
			? await db
					.select({
						userId: panelistPoint.panelistId,
						currentPoints: panelistPoint.currentPoints,
					})
					.from(panelistPoint)
					.where(
						sql`${panelistPoint.panelistId} IN (${sql.join(
							userIds.map((id) => sql`${id}`),
							sql`, `
						)})`
					)
			: [];

	const usersWithStats = users.map((u) => {
		const pStats = panelistStats.find((p) => p.userId === u.id);
		return {
			...u,
			panelistStats: u.userType === 'panelist' ? (pStats ?? null) : null,
		};
	});

	return {
		users: usersWithStats,
		pagination: {
			page,
			limit,
			total: totalCount?.count || 0,
			totalPages: Math.ceil((totalCount?.count || 0) / limit),
		},
		filters: { search, userType },
	};
}
