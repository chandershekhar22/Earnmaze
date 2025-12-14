import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import type { PanelistDashboardResponse } from '$lib/types/api-responses';
import { getPanelistPoints, getPointsSummary } from '$lib/db';
import { getAvailableSurveysCount, getSurveyCompletionsPanelist } from '$lib/db/repositories/survey.repository.server';

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
		
		const pointsSummary = await getPointsSummary(user.id);
		const points = await getPanelistPoints(user.id);
		const availableSurveys = await getAvailableSurveysCount();
		const surveysCompleted = await getSurveyCompletionsPanelist(user.id);

		// Construct typed response
		const response: PanelistDashboardResponse = {
			lifetimePoints: pointsSummary.lifetimePoints || 0,
			availableSurveys: availableSurveys || 0,
			currentPoints: points.currentPoints || 0,
			surveysCompleted: surveysCompleted || 0
		};

		return json(response);
	} catch (error) {
		console.error('Dashboard API error:', error);
		return json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
	}
};
