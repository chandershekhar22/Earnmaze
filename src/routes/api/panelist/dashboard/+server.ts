import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPanelistDashboard, getPanelistRecentActivity, getAvailableSurveysCount } from '$lib/db';
import type { PanelistDashboardResponse } from '$lib/types/api-responses';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// User is already authenticated via hooks.server.ts middleware
		const user = locals.user;
		
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is a panelist
		if (user.userType !== 'panelist') {
			return json({ error: 'Forbidden' }, { status: 403 });
		}
		
		const dashboardData = await getPanelistDashboard(user.id);
		const recentActivity = await getPanelistRecentActivity(user.id, 5);
		const availableSurveys = await getAvailableSurveysCount(user.id);

		// Construct typed response
		const response: PanelistDashboardResponse = {
			totalPoints: dashboardData.totalPoints,
			lifetimeEarnings: dashboardData.lifetimeEarnings,
			surveysCompleted: dashboardData.surveysCompleted,
			averageRating: dashboardData.averageRating,
			currentTier: dashboardData.currentTier,
			completionRate: dashboardData.completionRate,
			recentActivity: recentActivity.map(activity => ({
				id: activity.id,
				type: activity.type,
				description: activity.description,
				amount: activity.amount,
				timestamp: activity.timestamp,
			})),
			availableSurveys,
		};

		return json(response);
	} catch (error) {
		console.error('Dashboard API error:', error);
		return json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
	}
};
