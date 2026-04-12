import type { PageServerLoad } from './$types';
import type { PanelistDashboardData } from '$lib/types/panelist';
import { requirePanelist } from '$lib/server/auth/guards';
import { db, getPanelistPoints, getPointsSummary, getRecentTransactions } from '$lib/db';
import { getAvailableSurveysCount, getSurveyCompletionsPanelist, getAllAvailableSurveys } from '$lib/db/repositories/survey.repository.server';
import { user as userTable } from '$lib/db/schema/auth';
import { panelistStats } from '$lib/db/schema/panelist-stats';
import { panelistQuality } from '$lib/db/schema/panelist-profile';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const user = await requirePanelist(event);

	const [
		pointsData,
		pointsSummary,
		availableSurveys,
		surveysCompleted,
		statsData,
		userData,
		recentTxs,
		topSurveys,
		qualityData,
	] = await Promise.all([
		getPanelistPoints(user.id),
		getPointsSummary(user.id),
		getAvailableSurveysCount(),
		getSurveyCompletionsPanelist(user.id),
		db.select().from(panelistStats).where(eq(panelistStats.panelistId, user.id)).limit(1).then((r) => r[0] ?? null),
		db.select({ referralCode: userTable.referralCode, status: userTable.status, createdAt: userTable.createdAt }).from(userTable).where(eq(userTable.id, user.id)).limit(1).then((r) => r[0] ?? null),
		getRecentTransactions(user.id, 5),
		getAllAvailableSurveys(3),
		db.select().from(panelistQuality).where(eq(panelistQuality.panelistId, user.id)).limit(1).then((r) => r[0] ?? null),
	]);

	const currentPoints = pointsData?.currentPoints ?? 0;
	const lifetimePoints = pointsSummary?.lifetimePoints ?? 0;
	const redeemedPoints = pointsSummary?.redeemedPoints ?? 0;

	const dashboardData: PanelistDashboardData = {
		panelist: {
			id: user.id,
			userId: user.id,
			status: userData?.status ?? 'active',
			tier: qualityData?.tier ?? 'bronze',
			referralCode: userData?.referralCode ?? null,
			createdAt: userData?.createdAt ?? new Date(),
		},
		points: { currentPoints, lifetimePoints, redeemedPoints, tierProgress: 0 },
		engagement: {
			streakDays: statsData?.currentStreak ?? 0,
			lastActiveAt: statsData?.lastActiveDate ?? null,
			totalSurveys: statsData?.totalSurveysStarted ?? 0,
			completedSurveys: surveysCompleted ?? 0,
			completionRate: Number(statsData?.completionRate ?? 0),
		},
		quality: null,
		verification: null,
		demographics: null,
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

	const availableSurveyCards = (topSurveys ?? []).map((s) => ({
		id: s.id,
		title: s.title ?? 'Untitled Survey',
		points: s.points ?? 0,
	}));

	return { dashboardData, availableSurveyCards };
};
