import type { PageServerLoad } from './$types';
import { getAllAvailableSurveys, getTodaySurvey } from '$lib/db/repositories/survey.repository.server';
import { getPointsSummaryByBucket } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	const [surveys, todaySurvey, explorationPoints] = await Promise.all([
		getAllAvailableSurveys(),
		getTodaySurvey(),
		locals.user
			? getPointsSummaryByBucket(locals.user.id, 'exploration').then((s) => s.currentPoints)
			: Promise.resolve(0),
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
		// Server-known auth state, so the nav can hide Log in/Sign up on the
		// very first render instead of waiting for the client checkAuth() call.
		isLoggedIn: !!locals.user,
		// Anyone not signed into a full account sees this instead of the
		// decorative marketing number — 0 for a plain anonymous visitor, or
		// their real balance if they have a guest email-capture session.
		guestPoints: locals.guestSession?.sessionPoints ?? 0,
		// A signed-in panelist's real exploration-points wallet total (same
		// bucket as the Discover dashboard — see getPointsSummaryByBucket),
		// so the nav pill shows their actual balance instead of a fixed number.
		explorationPoints,
	};
};
