import type { PageServerLoad } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import { db, getPanelistPoints, getPointsSummary } from '$lib/db';
import { getAvailableSurveysCount } from '$lib/db/repositories/survey.repository.server';
import { panelistStats } from '$lib/db/schema/panelist-stats';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const user = await requirePanelist(event);

	const [pointsData, pointsSummary, availableSurveys, statsData] = await Promise.all([
		getPanelistPoints(user.id),
		getPointsSummary(user.id),
		getAvailableSurveysCount(),
		db
			.select()
			.from(panelistStats)
			.where(eq(panelistStats.panelistId, user.id))
			.limit(1)
			.then((r) => r[0] ?? null),
	]);

	return {
		discover: {
			currentPoints: pointsData?.currentPoints ?? 0,
			lifetimePoints: pointsSummary?.lifetimePoints ?? 0,
			redeemedPoints: pointsSummary?.redeemedPoints ?? 0,
			streakDays: statsData?.currentStreak ?? 0,
			availableSurveys: availableSurveys ?? 0,
		},
	};
};
