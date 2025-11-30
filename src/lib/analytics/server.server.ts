/**
 * Server-side analytics utilities
 * For processing and analyzing analytics data
 * Only runs on server
 */

import {
	getTotalVisits,
	getTotalConversions,
	getTotalCtaClicks,
	getConversionRate,
	getAverageTimeToConvert,
	getTrafficSources,
	getRecentConversions,
	getUniqueVisitors
} from '$lib/db';

export interface AnalyticsMetrics {
	totalVisits: number;
	totalConversions: number;
	totalCtaClicks: number;
	conversionRate: number;
	avgTimeToConvert: number | null;
	trafficSources: Array<{
		source: string;
		count: number;
		percentage: number;
	}>;
	recentConversions: Array<{
		email: string;
		convertedAt: Date;
		timeToConvert: number | null;
		utmSource: string | null;
		utmMedium: string | null;
	}>;
}

/**
 * Get comprehensive analytics metrics
 */
export async function getAnalyticsMetrics(): Promise<AnalyticsMetrics> {
	const [
		totalVisits,
		totalConversions,
		totalCtaClicks,
		conversionRate,
		avgTimeToConvert,
		trafficSources,
		recentConversions
	] = await Promise.all([
		getTotalVisits(),
		getTotalConversions(),
		getTotalCtaClicks(),
		getConversionRate(),
		getAverageTimeToConvert(),
		getTrafficSources(),
		getRecentConversions(10)
	]);

	return {
		totalVisits,
		totalConversions,
		totalCtaClicks,
		conversionRate,
		avgTimeToConvert,
		trafficSources,
		recentConversions: recentConversions.map((item) => ({
			email: item.email,
			convertedAt: item.convertedAt,
			timeToConvert: item.timeToConvert,
			utmSource: item.utmSource,
			utmMedium: item.utmMedium,
		})),
	};
}

/**
 * Determine traffic source from UTM parameters and referrer
 */
export function determineTrafficSource(
	utmSource: string | null,
	utmMedium: string | null,
	referrer: string | null
): string {
	// If UTM source is present, use it
	if (utmSource) {
		return utmSource;
	}

	// Parse referrer to determine source
	if (referrer) {
		try {
			const url = new URL(referrer);
			const hostname = url.hostname.toLowerCase();

			// Social media platforms
			if (hostname.includes('facebook.com')) return 'facebook';
			if (hostname.includes('twitter.com') || hostname.includes('t.co')) return 'twitter';
			if (hostname.includes('linkedin.com')) return 'linkedin';
			if (hostname.includes('instagram.com')) return 'instagram';
			if (hostname.includes('youtube.com')) return 'youtube';
			if (hostname.includes('reddit.com')) return 'reddit';
			if (hostname.includes('tiktok.com')) return 'tiktok';

			// Search engines
			if (hostname.includes('google.com')) return 'google';
			if (hostname.includes('bing.com')) return 'bing';
			if (hostname.includes('yahoo.com')) return 'yahoo';
			if (hostname.includes('duckduckgo.com')) return 'duckduckgo';

			// Other referrals
			return 'referral';
		} catch (e) {
			return 'referral';
		}
	}

	// Direct traffic (no referrer, no UTM)
	return 'direct';
}

/**
 * Get unique visitors count (alias for repository function)
 */
export async function getUniqueVisitorsCount(): Promise<number> {
	return getUniqueVisitors();
}

/**
 * Get conversion funnel metrics
 */
export async function getConversionFunnel() {
	const [totalVisits, totalCtaClicks, totalConversions] = await Promise.all([
		getTotalVisits(),
		getTotalCtaClicks(),
		getTotalConversions()
	]);

	return {
		visits: totalVisits,
		ctaClicks: totalCtaClicks,
		conversions: totalConversions,
		visitToClickRate: totalVisits > 0 ? (totalCtaClicks / totalVisits) * 100 : 0,
		clickToConversionRate: totalCtaClicks > 0 ? (totalConversions / totalCtaClicks) * 100 : 0,
		overallConversionRate: totalVisits > 0 ? (totalConversions / totalVisits) * 100 : 0,
	};
}
