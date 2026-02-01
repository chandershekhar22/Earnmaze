import { requireAdmin } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { panelistPoint, user } from '$lib/db/schema';
import { eq, desc, sql, like, or } from 'drizzle-orm';
import { Logger } from '$lib/utils/app-logger';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	const url = new URL(event.request.url);
	const search = url.searchParams.get('search') || '';
	const userType = url.searchParams.get('type') || 'all';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	try {
		// Build query conditions
		let whereConditions = [];
		
		if (search) {
			whereConditions.push(
				or(
					like(user.email, `%${search}%`),
					like(user.name, `%${search}%`)
				)
			);
		}

		if (userType !== 'all') {
			whereConditions.push(eq(user.userType, userType as 'admin' | 'panelist' | 'client' | 'moderator'));
		}

		// Get total count
		const [totalCount] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(user)
			.where(whereConditions.length > 0 ? sql`${sql.join(whereConditions, sql` AND `)}` : undefined);

		// Get users with pagination
		const users = await db
			.select({
				id: user.id,
				email: user.email,
				name: user.name,
				userType: user.userType,
				isActive: user.isActive,
				emailVerified: user.emailVerified,
				createdAt: user.createdAt,
				lastLoginAt: user.lastLoginAt
			})
			.from(user)
			.where(whereConditions.length > 0 ? sql`${sql.join(whereConditions, sql` AND `)}` : undefined)
			.orderBy(desc(user.createdAt))
			.limit(limit)
			.offset(offset);

		// Get panelist stats for users
		const userIds = users.map(u => u.id);
		const panelistStats = userIds.length > 0 ? await db
			.select({
				userId: panelistPoint.panelistId,		
				currentPoints: panelistPoint.currentPoints,
				pendingPoints: panelistPoint.pendingPoints
			})
			.from(panelistPoint)
			.where(sql`${panelistPoint.panelistId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`)
			: [];

		// Merge panelist data with users
		const usersWithStats = users.map(u => {
			const pStats = panelistStats.find(p => p.userId === u.id);
			return {
				...u,
				panelistStats: u.userType === 'panelist' ? pStats : null
			};
		});

		return {
			users: usersWithStats,
			pagination: {
				page,
				limit,
				total: totalCount?.count || 0,
				totalPages: Math.ceil((totalCount?.count || 0) / limit)
			},
			filters: {
				search,
				userType
			}
		};
	} catch (error) {
		Logger.root.error({ context: 'admin', error }, 'Failed to load users page');
		return {
			users: [],
			pagination: {
				page: 1,
				limit,
				total: 0,
				totalPages: 0
			},
			filters: {
				search,
				userType
			}
		};
	}
};
