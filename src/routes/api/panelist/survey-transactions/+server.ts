import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPanelistSurveyTransactions, getPanelistIdFromUserId } from '$lib/db';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const user = locals.user;

		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (user.userType !== 'panelist') {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const panelistId = await getPanelistIdFromUserId(user.id);

		if (!panelistId) {
			return json({ error: 'Panelist not found' }, { status: 404 });
		}

		const surveyTransactions = await getPanelistSurveyTransactions(panelistId);

		return json(surveyTransactions);
	} catch (error) {
		console.error('Error fetching survey transactions:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};