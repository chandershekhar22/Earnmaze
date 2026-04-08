import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Logger } from '$lib/utils/app-logger';
import type { PanelistDashboardData } from '$lib/types/panelist';
import { db, getPanelistPoints, getPointsSummary, getRecentTransactions } from '$lib/db';
import { getAvailableSurveysCount, getSurveyCompletionsPanelist } from '$lib/db/repositories/survey.repository.server';
import { user as userTable } from '$lib/db/schema/auth';
import { panelistQuality } from '$lib/db/schema/panelist-profile';
import { panelistStats } from '$lib/db/schema/panelist-stats';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const user = locals.user;

		if (!user) {
			return json({ success: false, error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
		}

		if (user.userType !== 'panelist') {
			return json({ success: false, error: 'FORBIDDEN', message: 'Panelist access required' }, { status: 403 });
		}

		// Fetch all data in parallel
		const [
			pointsData,
			pointsSummary,
			availableSurveys,
			surveysCompleted,
			qualityData,
			statsData,
			userData,
			recentTxs,
		] = await Promise.all([
			getPanelistPoints(user.id),
			getPointsSummary(user.id),
			getAvailableSurveysCount(),
			getSurveyCompletionsPanelist(user.id),
			db
				.select()
				.from(panelistQuality)
				.where(eq(panelistQuality.panelistId, user.id))
				.limit(1)
				.then((r) => r[0] ?? null),
			db
				.select()
				.from(panelistStats)
				.where(eq(panelistStats.panelistId, user.id))
				.limit(1)
				.then((r) => r[0] ?? null),
			db
				.select({
					referralCode: userTable.referralCode,
					status: userTable.status,
					createdAt: userTable.createdAt,
				})
				.from(userTable)
				.where(eq(userTable.id, user.id))
				.limit(1)
				.then((r) => r[0] ?? null),
			getRecentTransactions(user.id, 10),
		]);

		const currentPoints = pointsData?.currentPoints ?? 0;
		const lifetimePoints = pointsSummary?.lifetimePoints ?? 0;
		const redeemedPoints = pointsSummary?.redeemedPoints ?? 0;

		// Calculate tier progress (points needed for next tier)
		const tierThresholds = { bronze: 0, silver: 500, gold: 2000, platinum: 5000, diamond: 15000 };
		const tier = qualityData?.tier ?? 'bronze';
		const currentThreshold = tierThresholds[tier as keyof typeof tierThresholds] ?? 0;
		const tierKeys = Object.keys(tierThresholds) as Array<keyof typeof tierThresholds>;
		const currentTierIndex = tierKeys.indexOf(tier as keyof typeof tierThresholds);
		const nextThreshold =
			currentTierIndex < tierKeys.length - 1
				? tierThresholds[tierKeys[currentTierIndex + 1]]
				: currentThreshold;
		const tierProgress =
			nextThreshold > currentThreshold
				? Math.min(
						100,
						Math.round(
							((lifetimePoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100
						)
					)
				: 100;

		const response: PanelistDashboardData = {
			panelist: {
				id: user.id,
				userId: user.id,
				status: userData?.status ?? 'active',
				tier,
				referralCode: userData?.referralCode ?? null,
				createdAt: userData?.createdAt ?? new Date(),
			},
			points: {
				currentPoints,
				lifetimePoints,
				redeemedPoints,
				tierProgress,
			},
			engagement: {
				streakDays: statsData?.currentStreak ?? 0,
				lastActiveAt: statsData?.lastActiveDate ?? null,
				totalSurveys: statsData?.totalSurveysStarted ?? 0,
				completedSurveys: surveysCompleted ?? 0,
				completionRate: Number(statsData?.completionRate ?? 0),
			},
			quality: {
				qualityScore: qualityData?.qualityScore ?? 100,
				qualityFlags: qualityData?.qualityFlags ?? 0,
				averageRating: Number(qualityData?.averageRating ?? 0),
				consistencyScore: qualityData?.consistencyScore ?? 100,
			},
			verification: null, // Not yet implemented
			demographics: null, // Fetched separately in profile
			geography: null,
			professional: null,
			tags: [],
			recentActivity: (recentTxs ?? []).map((tx) => ({
				id: tx.id,
				type: tx.type,
				amount: tx.points,
				description: tx.description,
				createdAt: tx.createdAt,
				category: tx.referenceType ?? 'general',
			})),
			availableSurveys: availableSurveys ?? 0,
		};

		return json({ success: true, data: response });
	} catch (error) {
		Logger.root.error({ context: 'api', userId: locals.user?.id, error }, 'Dashboard API error');
		return json({ success: false, error: 'FETCH_FAILED', message: 'Failed to fetch dashboard data' }, { status: 500 });
	}
};
