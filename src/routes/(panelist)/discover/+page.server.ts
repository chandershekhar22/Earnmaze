import type { PageServerLoad } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import { db, getPointsSummaryByBucket, getPointsSummary } from '$lib/db';
import { getAvailableSurveysCount } from '$lib/db/repositories/survey.repository.server';
import { panelistStats } from '$lib/db/schema/panelist-stats';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const user = await requirePanelist(event);

	// Discover only shows points from today's-tile exploration + the signup
	// bonus (see getPointsSummaryByBucket) — survey-earned points stay on the
	// Survey dashboard instead. We also fetch the survey bucket here (without
	// displaying it as a stat) because redeeming exploration points requires
	// an equal survey-points balance — see the "Redeem now" gating below.
	const [explorationPointsSummary, surveyPointsSummary, pointsSummary, availableSurveys, statsData] = await Promise.all([
		getPointsSummaryByBucket(user.id, 'exploration'),
		getPointsSummaryByBucket(user.id, 'survey'),
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
			currentPoints: explorationPointsSummary?.currentPoints ?? 0,
			lifetimePoints: explorationPointsSummary?.lifetimePoints ?? 0,
			surveyPoints: surveyPointsSummary?.currentPoints ?? 0,
			redeemedPoints: pointsSummary?.redeemedPoints ?? 0,
			streakDays: statsData?.currentStreak ?? 0,
			availableSurveys: availableSurveys ?? 0,
		},
	};
};
