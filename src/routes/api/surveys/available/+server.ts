import { json, type RequestHandler } from '@sveltejs/kit';
import { getAllAvailableSurveys } from '$lib/db/repositories/survey.repository.server';
import type { AvailableSurveysResponse } from '$types/api-responses';
import { requireAuth } from '$lib/server/auth/guards';

// Returns the list of active surveys available to the authenticated user.
export const GET: RequestHandler = async (event) => {
	await requireAuth(event);

	const surveys = await getAllAvailableSurveys();

	const payload: AvailableSurveysResponse = surveys.map((s) => ({
		id: s.id,
		title: s.title,
		description: s.description ?? '',
		points: s.points,
		link: s.link
	}));

	return json(payload);
};
