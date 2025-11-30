import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { pageVisits, emailConversions, ctaClicks } from '$lib/db/schema/analytics';
import { sql, and, gte, lte, desc } from 'drizzle-orm';
import { requireAdmin } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
	// Require admin authentication
	await requireAdmin(event);
	
	try {
		const dateFrom = event.url.searchParams.get('from');
		const dateTo = event.url.searchParams.get('to');
		
		// Build date filter
		const dateFilter = [];
		if (dateFrom) {
			dateFilter.push(gte(pageVisits.visitedAt, new Date(dateFrom)));
		}
		if (dateTo) {
			dateFilter.push(lte(pageVisits.visitedAt, new Date(dateTo)));
		}

		// Total visits
		const totalVisitsResult = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(pageVisits)
			.where(dateFilter.length > 0 ? and(...dateFilter) : undefined);
		const totalVisits = totalVisitsResult[0]?.count || 0;

		// Unique users
		const uniqueUsersResult = await db
			.select({ count: sql<number>`count(DISTINCT ${pageVisits.userId})::int` })
			.from(pageVisits)
			.where(dateFilter.length > 0 ? and(...dateFilter) : undefined);
		const uniqueUsers = uniqueUsersResult[0]?.count || 0;

		// Total conversions
		const totalConversionsResult = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(emailConversions);
		const totalConversions = totalConversionsResult[0]?.count || 0;

		// Unique converting users
		const uniqueConvertingUsersResult = await db
			.select({ count: sql<number>`count(DISTINCT ${emailConversions.userId})::int` })
			.from(emailConversions);
		const uniqueConvertingUsers = uniqueConvertingUsersResult[0]?.count || 0;

		// Conversion rate
		const conversionRate = totalVisits > 0 
			? ((totalConversions / totalVisits) * 100).toFixed(2) 
			: '0.00';

		// Unique user conversion rate
		const uniqueConversionRate = uniqueUsers > 0 
			? ((uniqueConvertingUsers / uniqueUsers) * 100).toFixed(2) 
			: '0.00';

		// Total CTA clicks
		const totalCtaClicksResult = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(ctaClicks);
		const totalCtaClicks = totalCtaClicksResult[0]?.count || 0;

		// CTA click-through rate
		const ctaClickRate = totalVisits > 0 
			? ((totalCtaClicks / totalVisits) * 100).toFixed(2) 
			: '0.00';

		// Conversions by traffic source
		const conversionsBySource = await db
			.select({
				source: emailConversions.utmSource,
				medium: emailConversions.utmMedium,
				campaign: emailConversions.utmCampaign,
				count: sql<number>`count(*)::int`,
			})
			.from(emailConversions)
			.groupBy(
				emailConversions.utmSource, 
				emailConversions.utmMedium, 
				emailConversions.utmCampaign
			)
			.orderBy(desc(sql`count(*)`));

		// Traffic sources (visits)
		const trafficSources = await db
			.select({
				source: pageVisits.utmSource,
				medium: pageVisits.utmMedium,
				campaign: pageVisits.utmCampaign,
				visits: sql<number>`count(*)::int`,
			})
			.from(pageVisits)
			.where(dateFilter.length > 0 ? and(...dateFilter) : undefined)
			.groupBy(
				pageVisits.utmSource, 
				pageVisits.utmMedium, 
				pageVisits.utmCampaign
			)
			.orderBy(desc(sql`count(*)`));

		// Device breakdown
		const deviceBreakdown = await db
			.select({
				deviceType: pageVisits.deviceType,
				visits: sql<number>`count(*)::int`,
			})
			.from(pageVisits)
			.where(dateFilter.length > 0 ? and(...dateFilter) : undefined)
			.groupBy(pageVisits.deviceType)
			.orderBy(desc(sql`count(*)`));

		// Browser breakdown
		const browserBreakdown = await db
			.select({
				browserName: pageVisits.browserName,
				visits: sql<number>`count(*)::int`,
			})
			.from(pageVisits)
			.where(dateFilter.length > 0 ? and(...dateFilter) : undefined)
			.groupBy(pageVisits.browserName)
			.orderBy(desc(sql`count(*)`));

		// Average time to convert
		const avgTimeToConvertResult = await db
			.select({
				avgTime: sql<number>`avg(${emailConversions.timeToConvertSeconds})::int`,
			})
			.from(emailConversions)
			.where(sql`${emailConversions.timeToConvertSeconds} IS NOT NULL`);
		
		const avgTimeToConvert = avgTimeToConvertResult[0]?.avgTime || 0;

		// CTA performance by location
		const ctaPerformance = await db
			.select({
				location: ctaClicks.buttonLocation,
				clicks: sql<number>`count(*)::int`,
			})
			.from(ctaClicks)
			.groupBy(ctaClicks.buttonLocation)
			.orderBy(desc(sql`count(*)`));

		return json({
			summary: {
				totalVisits,
				uniqueUsers,
				totalConversions,
				uniqueConvertingUsers,
				conversionRate: parseFloat(conversionRate),
				uniqueConversionRate: parseFloat(uniqueConversionRate),
				totalCtaClicks,
				ctaClickRate: parseFloat(ctaClickRate),
				avgTimeToConvert,
			},
			trafficSources,
			conversionsBySource,
			deviceBreakdown,
			browserBreakdown,
			ctaPerformance,
		});

	} catch (error) {
		console.error('Error fetching analytics:', error);
		return json({ error: 'Failed to fetch analytics' }, { status: 500 });
	}
};
