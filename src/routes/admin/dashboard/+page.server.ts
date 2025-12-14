import { requireAdmin } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { db, pointsTransactions } from '$lib/db';
import { user, session } from '$lib/db/schema/auth';
import { surveyTransaction } from '$lib/db/schema/surveys';
import { emailConversions } from '$lib/db/schema/analytics';
import { eq, count, sql, desc, or } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	try {
		// Get total counts
		const [totalUsers] = await db
			.select({ count: count() })
			.from(user);

		const [totalPanelists] = await db
			.select({ count: count() })
			.from(user)
			.where(eq(user.userType, 'panelist'));

		const [totalAdmins] = await db
			.select({ count: count() })
			.from(user)
			.where(eq(user.userType, 'admin'));

		const [totalResponses] = await db
			.select({ count: count() })
			.from(surveyTransaction);

		const [totalPointsAwarded] = await db
			.select({ total: sql<number>`COALESCE(SUM(${pointsTransactions.points}), 0)` })
			.from(pointsTransactions)
			.where(or(eq(pointsTransactions.type, 'earned'),
				eq(pointsTransactions.type, 'bonus')));

		// Get recent users
		const recentUsers = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				userType: user.userType,
				createdAt: user.createdAt
			})
			.from(user)
			.orderBy(desc(user.createdAt))
			.limit(10);

		// Get recent survey responses
		const recentResponses = await db
			.select({
				id: surveyTransaction.id,
				surveyId: surveyTransaction.surveyId,
				panelistId: surveyTransaction.panelistId,
				status: surveyTransaction.status,
				completedAt: surveyTransaction.completedAt,
				createdAt: surveyTransaction.createdAt
			})
			.from(surveyTransaction)
			.orderBy(desc(surveyTransaction.createdAt))
			.limit(10);

		// Get active sessions count
		const [activeSessions] = await db
			.select({ count: count() })
			.from(session);

		// Get user growth (users created in last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const [newUsersLast30Days] = await db
			.select({ count: count() })
			.from(user)
			.where(sql`${user.createdAt} >= ${thirtyDaysAgo.toISOString()}`);

		// Get total email conversions
		const [totalConversions] = await db
			.select({ count: count() })
			.from(emailConversions);

		// Get recent email conversions
		const recentConversions = await db
			.select({
				id: emailConversions.id,
				email: emailConversions.email,
				visitorId: emailConversions.visitorId,
				sessionId: emailConversions.sessionId,
				utmSource: emailConversions.utmSource,
				utmMedium: emailConversions.utmMedium,
				utmCampaign: emailConversions.utmCampaign,
				timeToConvertSeconds: emailConversions.timeToConvertSeconds,
				convertedAt: emailConversions.convertedAt
			})
			.from(emailConversions)
			.orderBy(desc(emailConversions.convertedAt))
			.limit(10);

		return {
			stats: {
				totalUsers: totalUsers?.count || 0,
				totalPanelists: totalPanelists?.count || 0,
				totalAdmins: totalAdmins?.count || 0,
				totalResponses: totalResponses?.count || 0,
				totalPointsAwarded: totalPointsAwarded?.total || 0,
				activeSessions: activeSessions?.count || 0,
				newUsersLast30Days: newUsersLast30Days?.count || 0,
				totalConversions: totalConversions?.count || 0
			},
			recentUsers,
			recentResponses,
			recentConversions
		};
	} catch (error) {
		console.error('Error loading admin dashboard:', error);
		return {
			stats: {
				totalUsers: 0,
				totalPanelists: 0,
				totalAdmins: 0,
				totalResponses: 0,
				totalPointsAwarded: 0,
				activeSessions: 0,
				newUsersLast30Days: 0,
				totalConversions: 0
			},
			recentUsers: [],
			recentResponses: [],
			recentConversions: []
		};
	}
};
