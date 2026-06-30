import type { PageServerLoad } from './$types';
import { getAllAvailableSurveys, getTodaySurvey } from '$lib/db/repositories/survey.repository.server';

export const load: PageServerLoad = async () => {
	const [surveys, todaySurvey] = await Promise.all([
		getAllAvailableSurveys(),
		getTodaySurvey(),
	]);

	return {
		surveys: surveys.map((s) => ({
			id: s.id,
			title: s.title,
			description: s.description,
			points: s.points,
			thumbnailUrl: s.thumbnailUrl,
			isTodaySurvey: s.isTodaySurvey,
			priority: s.priority,
			createdAt: s.createdAt.toISOString(),
		})),
		todaySurveyId: todaySurvey?.id ?? null,
	};
};
