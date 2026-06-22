/**
 * Consent statistics — aggregations over `users` (current state) and
 * `email_consent_log` (historical events) for the admin compliance view.
 */
import { sql, eq, gte, desc, and } from 'drizzle-orm';
import { db } from '$lib/db';
import { user, emailConsentLog } from '$lib/db/schema/auth';

export interface ConsentStats {
	totals: {
		activeUsers: number;
		marketingOptedIn: number;
		marketingOptedInPercent: number;
		surveyDataSharingAccepted: number;
		surveyDataSharingPercent: number;
		ageVerified: number;
		tosAccepted: number;
	};
	recent: {
		marketingGrantedLast24h: number;
		marketingRevokedLast24h: number;
		marketingGrantedLast7d: number;
		marketingRevokedLast7d: number;
	};
	bySource: { source: string; channel: string; granted: number; revoked: number }[];
	dailyLast30d: { day: string; granted: number; revoked: number }[];
	recentEvents: {
		id: string;
		userId: string;
		userEmail: string | null;
		channel: string;
		granted: boolean;
		source: string | null;
		createdAt: Date;
	}[];
}

export async function getConsentStats(): Promise<ConsentStats> {
	const now = new Date();
	const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	// Totals — single query against users
	const [totalsRow] = await db
		.select({
			activeUsers: sql<number>`count(*)::int`,
			marketingOptedIn: sql<number>`count(case when ${user.marketingConsent} = true then 1 end)::int`,
			surveyDataSharing: sql<number>`count(case when ${user.surveyDataSharingAcceptedAt} is not null then 1 end)::int`,
			ageVerified: sql<number>`count(case when ${user.ageVerified} = true then 1 end)::int`,
			tosAccepted: sql<number>`count(case when ${user.tosAcceptedAt} is not null then 1 end)::int`,
		})
		.from(user)
		.where(eq(user.isActive, true));

	const activeUsers = totalsRow?.activeUsers ?? 0;
	const marketingOptedIn = totalsRow?.marketingOptedIn ?? 0;
	const surveyDataSharingAccepted = totalsRow?.surveyDataSharing ?? 0;

	// Recent grant/revoke counts on the marketing channel
	const [recent24] = await db
		.select({
			granted: sql<number>`count(case when ${emailConsentLog.granted} = true then 1 end)::int`,
			revoked: sql<number>`count(case when ${emailConsentLog.granted} = false then 1 end)::int`,
		})
		.from(emailConsentLog)
		.where(
			and(
				eq(emailConsentLog.channel, 'marketing'),
				gte(emailConsentLog.createdAt, oneDayAgo)
			)
		);

	const [recent7d] = await db
		.select({
			granted: sql<number>`count(case when ${emailConsentLog.granted} = true then 1 end)::int`,
			revoked: sql<number>`count(case when ${emailConsentLog.granted} = false then 1 end)::int`,
		})
		.from(emailConsentLog)
		.where(
			and(
				eq(emailConsentLog.channel, 'marketing'),
				gte(emailConsentLog.createdAt, sevenDaysAgo)
			)
		);

	// Source breakdown — funnel attribution. Joins channel + source.
	const bySourceRows = await db
		.select({
			channel: emailConsentLog.channel,
			source: emailConsentLog.source,
			granted: sql<number>`count(case when ${emailConsentLog.granted} = true then 1 end)::int`,
			revoked: sql<number>`count(case when ${emailConsentLog.granted} = false then 1 end)::int`,
		})
		.from(emailConsentLog)
		.groupBy(emailConsentLog.channel, emailConsentLog.source)
		.orderBy(emailConsentLog.channel);

	// Daily grants/revokes for the last 30 days (marketing only — keeps the
	// view focused; survey-data-sharing is binary and rarely revoked)
	const dailyRows = await db
		.select({
			day: sql<string>`to_char(${emailConsentLog.createdAt}::date, 'YYYY-MM-DD')`,
			granted: sql<number>`count(case when ${emailConsentLog.granted} = true then 1 end)::int`,
			revoked: sql<number>`count(case when ${emailConsentLog.granted} = false then 1 end)::int`,
		})
		.from(emailConsentLog)
		.where(
			and(
				eq(emailConsentLog.channel, 'marketing'),
				gte(emailConsentLog.createdAt, thirtyDaysAgo)
			)
		)
		.groupBy(sql`${emailConsentLog.createdAt}::date`)
		.orderBy(sql`${emailConsentLog.createdAt}::date desc`);

	// Recent activity — last 20 events with user email for context
	const recentEvents = await db
		.select({
			id: emailConsentLog.id,
			userId: emailConsentLog.userId,
			userEmail: user.email,
			channel: emailConsentLog.channel,
			granted: emailConsentLog.granted,
			source: emailConsentLog.source,
			createdAt: emailConsentLog.createdAt,
		})
		.from(emailConsentLog)
		.leftJoin(user, eq(user.id, emailConsentLog.userId))
		.orderBy(desc(emailConsentLog.createdAt))
		.limit(20);

	const pct = (numerator: number, denominator: number) =>
		denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;

	return {
		totals: {
			activeUsers,
			marketingOptedIn,
			marketingOptedInPercent: pct(marketingOptedIn, activeUsers),
			surveyDataSharingAccepted,
			surveyDataSharingPercent: pct(surveyDataSharingAccepted, activeUsers),
			ageVerified: totalsRow?.ageVerified ?? 0,
			tosAccepted: totalsRow?.tosAccepted ?? 0,
		},
		recent: {
			marketingGrantedLast24h: recent24?.granted ?? 0,
			marketingRevokedLast24h: recent24?.revoked ?? 0,
			marketingGrantedLast7d: recent7d?.granted ?? 0,
			marketingRevokedLast7d: recent7d?.revoked ?? 0,
		},
		bySource: bySourceRows.map((r) => ({
			channel: r.channel,
			source: r.source ?? 'unknown',
			granted: r.granted,
			revoked: r.revoked,
		})),
		dailyLast30d: dailyRows,
		recentEvents,
	};
}
