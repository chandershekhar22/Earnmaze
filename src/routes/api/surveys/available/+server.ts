import { getAvailableSurveysForPanelist } from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { AvailableSurveysResponse, AvailableSurveyItem } from '$lib/types/api-responses';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const user = locals.user;
		
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		// Check if user is a panelist
		if (user.userType !== 'panelist') {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		// Fetch available surveys from the database
		const surveys = await getAvailableSurveysForPanelist(user.id);
		
		// Map to typed response format (only return safe public fields)
		const response: AvailableSurveysResponse = surveys.map(item => ({
			id: item.survey.id,
			title: item.survey.title,
			description: item.survey.description || '',
			category: item.survey.category,
			pointsReward: item.survey.points,
			estimatedMinutes: item.survey.estimatedMinutes,
			targetResponses: item.survey.maxCompletions || 0,
			currentResponses: item.survey.currentCompletions || 0,
			expiresAt: item.survey.availableUntil || undefined,
			qualificationCriteria: (item.survey.qualifications as Array<{
				field: string;
				operator: string;
				value: unknown;
			}> | undefined),
		} satisfies AvailableSurveyItem));

		return json(response);
	} catch (error) {
		console.error('Surveys API error:', error);
		return json({ error: 'Failed to fetch surveys' }, { status: 500 });
	}
}
