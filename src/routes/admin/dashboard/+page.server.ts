import { requireAdmin } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { db, pointsTransactions } from '$lib/db';
import { user, session } from '$lib/db/schema/auth';
import { surveyTransaction } from '$lib/db/schema/surveys';
import { emailConversions } from '$lib/db/schema/analytics';
import { referrals } from '$lib/db/schema/transactions';
import { eq, count, sql, desc, or } from 'drizzle-orm';
import { Logger } from '$lib/utils/app-logger';
import { obfuscateEmail } from '$lib/utils/obfuscate';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	try {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		// Use Promise.allSettled so one failing query doesn't crash the whole dashboard
		const safe = async <T>(fn: Promise<T>, fallback: T): Promise<T> => {
			try { return await fn; } catch (e) {
				Logger.root.warn({ context: 'admin', error: e }, 'Dashboard query failed, using fallback');
				return fallback;
			}
		};

		const [
			[userCounts],
			[totalResponses],
			[totalPointsAwarded],
			[activeSessions],
			[newUsersLast30Days],
			[totalConversions],
			[referralStats],
			recentUsers,
			recentResponses,
			recentConversions,
		] = await Promise.all([
			safe(db.select({
				total: count(),
				panelists: sql<number>`COUNT(*) FILTER (WHERE ${user.userType} = 'panelist')`,
				admins: sql<number>`COUNT(*) FILTER (WHERE ${user.userType} = 'admin')`,
			}).from(user), [{ total: 0, panelists: 0, admins: 0 }]),

			safe(db.select({ count: count() }).from(surveyTransaction), [{ count: 0 }]),

			safe(db.select({
				total: sql<number>`COALESCE(SUM(${pointsTransactions.points}), 0)`,
			}).from(pointsTransactions).where(or(
				eq(pointsTransactions.type, 'completed'),
				eq(pointsTransactions.type, 'terminated'),
				eq(pointsTransactions.type, 'quota_full'),
				eq(pointsTransactions.type, 'bonus')
			)), [{ total: 0 }]),

			safe(db.select({ count: count() }).from(session), [{ count: 0 }]),

			safe(db.select({ count: count() }).from(user)
				.where(sql`${user.createdAt} >= ${thirtyDaysAgo.toISOString()}`), [{ count: 0 }]),

			safe(db.select({ count: count() }).from(emailConversions), [{ count: 0 }]),

			safe(db.select({
				total: count(),
				pending: sql<number>`COUNT(*) FILTER (WHERE ${referrals.status} = 'pending')`,
				qualified: sql<number>`COUNT(*) FILTER (WHERE ${referrals.status} = 'qualified')`,
				paid: sql<number>`COUNT(*) FILTER (WHERE ${referrals.status} IN ('completed', 'paid'))`,
				totalBonus: sql<number>`COALESCE(SUM(${referrals.referrerBonus}) FILTER (WHERE ${referrals.status} IN ('completed', 'paid')), 0)`,
			}).from(referrals), [{ total: 0, pending: 0, qualified: 0, paid: 0, totalBonus: 0 }]),

			safe(db.select({
				id: user.id,
				name: user.name,
				email: user.email,
				userType: user.userType,
				createdAt: user.createdAt,
			}).from(user).orderBy(desc(user.createdAt)).limit(10), []),

			safe(db.select({
				id: surveyTransaction.id,
				surveyId: surveyTransaction.surveyId,
				panelistId: surveyTransaction.panelistId,
				status: surveyTransaction.status,
				completedAt: surveyTransaction.completedAt,
				createdAt: surveyTransaction.createdAt,
			}).from(surveyTransaction).orderBy(desc(surveyTransaction.createdAt)).limit(10), []),

			safe(db.select({
				id: emailConversions.id,
				email: emailConversions.email,
				visitorId: emailConversions.visitorId,
				sessionId: emailConversions.sessionId,
				utmSource: emailConversions.utmSource,
				utmMedium: emailConversions.utmMedium,
				utmCampaign: emailConversions.utmCampaign,
				timeToConvertSeconds: emailConversions.timeToConvertSeconds,
				convertedAt: emailConversions.convertedAt,
			}).from(emailConversions).orderBy(desc(emailConversions.convertedAt)).limit(10), []),
		]);

		return {
			stats: {
				totalUsers: userCounts?.total || 0,
				totalPanelists: userCounts?.panelists || 0,
				totalAdmins: userCounts?.admins || 0,
				totalResponses: totalResponses?.count || 0,
				totalPointsAwarded: totalPointsAwarded?.total || 0,
				activeSessions: activeSessions?.count || 0,
				newUsersLast30Days: newUsersLast30Days?.count || 0,
				totalConversions: totalConversions?.count || 0,
				totalReferrals: referralStats?.total || 0,
				pendingReferrals: referralStats?.pending || 0,
				qualifiedReferrals: referralStats?.qualified || 0,
				paidReferrals: referralStats?.paid || 0,
				referralBonusPaid: referralStats?.totalBonus || 0,
			},
			recentUsers: recentUsers.map((u: any) => ({ ...u, email: obfuscateEmail(u.email) })),
			recentResponses,
			recentConversions: recentConversions.map((c: any) => ({ ...c, email: obfuscateEmail(c.email) })),
		};
	} catch (error) {
		Logger.root.error({ context: 'admin', error }, 'Failed to load admin dashboard');
		return {
			stats: {
				totalUsers: 0,
				totalPanelists: 0,
				totalAdmins: 0,
				totalResponses: 0,
				totalPointsAwarded: 0,
				activeSessions: 0,
				newUsersLast30Days: 0,
				totalConversions: 0,
				totalReferrals: 0,
				pendingReferrals: 0,
				qualifiedReferrals: 0,
				paidReferrals: 0,
				referralBonusPaid: 0,
			},
			recentUsers: [],
			recentResponses: [],
			recentConversions: []
		};
	}
};
