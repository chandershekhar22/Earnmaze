import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * GET /api/admin/geo-analytics
 * Get geo-restriction analytics and statistics
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	// Check admin authorization
	if (!locals.user || locals.user.userType !== 'admin') {
		return json(
			{
				success: false,
				error: 'UNAUTHORIZED',
				message: 'Admin access required'
			},
			{ status: 403 }
		);
	}

	// Get query parameters
	const days = parseInt(url.searchParams.get('days') || '7');
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);

	try {
		// In a real implementation, query from database
		// Example query:
		// const logs = await db
		//   .select()
		//   .from(geoRestrictionLogs)
		//   .where(gte(geoRestrictionLogs.createdAt, startDate));
		
		// For now, return mock analytics
		const analytics = {
			summary: {
				totalRequests: 1247,
				allowedRequests: 1089,
				blockedRequests: 158,
				allowRate: 87.3,
				blockRate: 12.7,
			},
			
			blockReasons: [
				{ reason: 'Service not available in your country', count: 158 },
			],
			
			topBlockedCountries: [
				{ countryCode: 'CN', country: 'China', count: 34 },
				{ countryCode: 'RU', country: 'Russia', count: 28 },
				{ countryCode: 'BR', country: 'Brazil', count: 19 },
				{ countryCode: 'KP', country: 'North Korea', count: 8 },
			],
			
			topAllowedCountries: [
				{ countryCode: 'US', country: 'United States', count: 456 },
				{ countryCode: 'GB', country: 'United Kingdom', count: 234 },
				{ countryCode: 'CA', country: 'Canada', count: 189 },
				{ countryCode: 'AU', country: 'Australia', count: 156 },
			],
			
			hourlyTrend: [
				{ hour: '00:00', allowed: 12, blocked: 3 },
				{ hour: '01:00', allowed: 8, blocked: 2 },
				{ hour: '02:00', allowed: 6, blocked: 1 },
				{ hour: '03:00', allowed: 5, blocked: 1 },
				{ hour: '04:00', allowed: 7, blocked: 2 },
				{ hour: '05:00', allowed: 14, blocked: 4 },
				{ hour: '06:00', allowed: 23, blocked: 6 },
				{ hour: '07:00', allowed: 45, blocked: 12 },
				{ hour: '08:00', allowed: 67, blocked: 15 },
				{ hour: '09:00', allowed: 89, blocked: 18 },
				{ hour: '10:00', allowed: 98, blocked: 21 },
				{ hour: '11:00', allowed: 102, blocked: 19 },
				{ hour: '12:00', allowed: 95, blocked: 17 },
				{ hour: '13:00', allowed: 88, blocked: 14 },
				{ hour: '14:00', allowed: 76, blocked: 11 },
				{ hour: '15:00', allowed: 65, blocked: 8 },
				{ hour: '16:00', allowed: 54, blocked: 6 },
				{ hour: '17:00', allowed: 43, blocked: 4 },
				{ hour: '18:00', allowed: 34, blocked: 3 },
				{ hour: '19:00', allowed: 28, blocked: 2 },
				{ hour: '20:00', allowed: 21, blocked: 2 },
				{ hour: '21:00', allowed: 18, blocked: 1 },
				{ hour: '22:00', allowed: 15, blocked: 1 },
				{ hour: '23:00', allowed: 13, blocked: 1 },
			],
			
			recentBlocks: [
				{
					timestamp: new Date().toISOString(),
					ipAddress: '1.2.3.x',
					country: 'China',
					countryCode: 'CN',
					reason: 'Service not available in your country',
					pathname: '/api/panelist/dashboard',
				},
				{
					timestamp: new Date(Date.now() - 300000).toISOString(),
					ipAddress: '5.6.7.x',
					country: 'Russia',
					countryCode: 'RU',
					reason: 'Service not available in your country',
					pathname: '/dashboard',
				},
				{
					timestamp: new Date(Date.now() - 600000).toISOString(),
					ipAddress: '9.10.11.x',
					country: 'Brazil',
					countryCode: 'BR',
					reason: 'Service not available in your country',
					pathname: '/api/surveys/available',
				},
			],
		};

		return json({
			success: true,
			data: analytics,
			meta: {
				period: `Last ${days} days`,
				startDate: startDate.toISOString(),
				endDate: new Date().toISOString(),
			}
		});
		
	} catch (error) {
		console.error('Error fetching geo analytics:', error);
		return json(
			{
				success: false,
				error: 'SERVER_ERROR',
				message: 'Failed to fetch analytics'
			},
			{ status: 500 }
		);
	}
};
