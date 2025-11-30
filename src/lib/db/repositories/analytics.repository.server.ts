/**
 * Analytics Repository
 * Database operations for analytics tracking and metrics
 */

import { db } from '..';
import { pageVisits, emailConversions, ctaClicks } from '../schema/analytics';
import { eq, sql, desc, count } from 'drizzle-orm';

/**
 * Record a page visit
 */
export async function createPageVisit(visitData: {
	userId: string;
	sessionId: string;
	fingerprint: string;
	landingPage: string;
	utmSource?: string | null;
	utmMedium?: string | null;
	utmCampaign?: string | null;
	utmTerm?: string | null;
	utmContent?: string | null;
	referrer?: string | null;
	userAgent?: string | null;
	deviceType?: string | null;
	browserName?: string | null;
	osName?: string | null;
	screenResolution?: string | null;
	timezone?: string | null;
	language?: string | null;
}) {
	return await db.insert(pageVisits).values({
		userId: visitData.userId,
		sessionId: visitData.sessionId,
		fingerprint: visitData.fingerprint,
		landingPage: visitData.landingPage,
		utmSource: visitData.utmSource || null,
		utmMedium: visitData.utmMedium || null,
		utmCampaign: visitData.utmCampaign || null,
		utmTerm: visitData.utmTerm || null,
		utmContent: visitData.utmContent || null,
		referrer: visitData.referrer || null,
		userAgent: visitData.userAgent || null,
		deviceType: visitData.deviceType || null,
		browserName: visitData.browserName || null,
		osName: visitData.osName || null,
		screenResolution: visitData.screenResolution || null,
		timezone: visitData.timezone || null,
		language: visitData.language || null,
		visitedAt: new Date()
	});
}

/**
 * Record an email conversion
 */
export async function createEmailConversion(conversionData: {
	userId: string;
	sessionId: string;
	email: string;
	timeToConvertSeconds?: number | null;
	utmSource?: string | null;
	utmMedium?: string | null;
	utmCampaign?: string | null;
}) {
	return await db.insert(emailConversions).values({
		userId: conversionData.userId,
		sessionId: conversionData.sessionId,
		email: conversionData.email,
		timeToConvertSeconds: conversionData.timeToConvertSeconds || null,
		utmSource: conversionData.utmSource || null,
		utmMedium: conversionData.utmMedium || null,
		utmCampaign: conversionData.utmCampaign || null,
		convertedAt: new Date()
	});
}

/**
 * Record a CTA click
 */
export async function createCtaClick(clickData: {
	userId: string;
	sessionId: string;
	buttonLocation: string;
}) {
	return await db.insert(ctaClicks).values({
		userId: clickData.userId,
		sessionId: clickData.sessionId,
		buttonLocation: clickData.buttonLocation,
		clickedAt: new Date()
	});
}

/**
 * Get total visits count
 */
export async function getTotalVisits(): Promise<number> {
	const result = await db.select({ count: count() }).from(pageVisits);
	return result[0]?.count || 0;
}

/**
 * Get total conversions count
 */
export async function getTotalConversions(): Promise<number> {
	const result = await db.select({ count: count() }).from(emailConversions);
	return result[0]?.count || 0;
}

/**
 * Get total CTA clicks count
 */
export async function getTotalCtaClicks(): Promise<number> {
	const result = await db.select({ count: count() }).from(ctaClicks);
	return result[0]?.count || 0;
}

/**
 * Get unique visitors count
 */
export async function getUniqueVisitors(): Promise<number> {
	const result = await db
		.select({
			count: sql<number>`COUNT(DISTINCT ${pageVisits.userId})`
		})
		.from(pageVisits);
	
	return result[0]?.count || 0;
}

/**
 * Get conversion rate
 */
export async function getConversionRate(): Promise<number> {
	const visits = await getTotalVisits();
	const conversions = await getTotalConversions();
	
	return visits > 0 ? (conversions / visits) * 100 : 0;
}

/**
 * Get average time to convert (in seconds)
 */
export async function getAverageTimeToConvert(): Promise<number | null> {
	const result = await db
		.select({
			avg: sql<number>`AVG(${emailConversions.timeToConvertSeconds})`
		})
		.from(emailConversions);
	
	return result[0]?.avg || null;
}

/**
 * Get traffic sources breakdown
 */
export async function getTrafficSources(): Promise<Array<{ source: string; count: number; percentage: number }>> {
	const totalVisits = await getTotalVisits();
	
	const sources = await db
		.select({
			source: sql<string>`COALESCE(${pageVisits.utmSource}, 'direct')`,
			count: count()
		})
		.from(pageVisits)
		.groupBy(sql`COALESCE(${pageVisits.utmSource}, 'direct')`)
		.orderBy(desc(count()));
	
	return sources.map(item => ({
		source: item.source,
		count: item.count,
		percentage: totalVisits > 0 ? (item.count / totalVisits) * 100 : 0
	}));
}

/**
 * Get recent conversions
 */
export async function getRecentConversions(limit: number = 10) {
	return await db
		.select({
			email: emailConversions.email,
			convertedAt: emailConversions.convertedAt,
			timeToConvert: emailConversions.timeToConvertSeconds,
			utmSource: emailConversions.utmSource,
			utmMedium: emailConversions.utmMedium
		})
		.from(emailConversions)
		.orderBy(desc(emailConversions.convertedAt))
		.limit(limit);
}

/**
 * Get visits by date range
 */
export async function getVisitsByDateRange(startDate: Date, endDate: Date) {
	return await db
		.select()
		.from(pageVisits)
		.where(
			sql`${pageVisits.visitedAt} BETWEEN ${startDate} AND ${endDate}`
		)
		.orderBy(desc(pageVisits.visitedAt));
}

/**
 * Get conversions by date range
 */
export async function getConversionsByDateRange(startDate: Date, endDate: Date) {
	return await db
		.select()
		.from(emailConversions)
		.where(
			sql`${emailConversions.convertedAt} BETWEEN ${startDate} AND ${endDate}`
		)
		.orderBy(desc(emailConversions.convertedAt));
}

/**
 * Check if email has already converted
 */
export async function hasEmailConverted(email: string): Promise<boolean> {
	const result = await db
		.select({ count: count() })
		.from(emailConversions)
		.where(eq(emailConversions.email, email));
	
	return (result[0]?.count || 0) > 0;
}

/**
 * Get visitor journey (all activities for a user)
 */
export async function getVisitorJourney(userId: string) {
	const [visits, conversions, clicks] = await Promise.all([
		db.select().from(pageVisits).where(eq(pageVisits.userId, userId)),
		db.select().from(emailConversions).where(eq(emailConversions.userId, userId)),
		db.select().from(ctaClicks).where(eq(ctaClicks.userId, userId))
	]);
	
	return {
		visits,
		conversions,
		clicks,
		totalActivities: visits.length + conversions.length + clicks.length
	};
}
