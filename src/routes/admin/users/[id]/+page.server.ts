import { requireAdmin } from '$lib/server/auth';
import { obfuscateEmail } from '$lib/utils/obfuscate';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/db';
import { user } from '$lib/db/schema/auth';
import { panelistPoint, pointsTransactions } from '$lib/db/schema/panelist-points';
import { surveyTransaction } from '$lib/db/schema/surveys';
import { supportTicket } from '$lib/db/schema/support-tickets';
import { panelistStats } from '$lib/db/schema/panelist-stats';
import { referrals } from '$lib/db/schema/transactions';
import { eq, desc, sql } from 'drizzle-orm';
import { getPointsSummary } from '$lib/db/repositories/panelist-points-aggregations.repository.server';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);
	const { id } = event.params;

	const [userData] = await db.select().from(user).where(eq(user.id, id)).limit(1);
	if (!userData) throw error(404, 'User not found');

	const [pointsData, pointsSummary, transactions, surveys, tickets, stats, userReferrals] = await Promise.all([
		db.select().from(panelistPoint).where(eq(panelistPoint.panelistId, id)).limit(1).then(r => r[0] ?? null),
		getPointsSummary(id),
		db.select().from(pointsTransactions).where(eq(pointsTransactions.panelistId, id)).orderBy(desc(pointsTransactions.createdAt)).limit(50),
		db.select().from(surveyTransaction).where(eq(surveyTransaction.panelistId, id)).orderBy(desc(surveyTransaction.createdAt)).limit(50),
		db.select().from(supportTicket).where(eq(supportTicket.panelistId, id)).orderBy(desc(supportTicket.createdAt)).limit(20),
		db.select().from(panelistStats).where(eq(panelistStats.panelistId, id)).limit(1).then(r => r[0] ?? null),
		db.select({
			id: referrals.id,
			referredName: user.name,
			status: referrals.status,
			referrerBonus: referrals.referrerBonus,
			createdAt: referrals.createdAt,
		}).from(referrals).leftJoin(user, eq(referrals.referredId, user.id)).where(eq(referrals.referrerId, id)).orderBy(desc(referrals.createdAt)).limit(20),
	]);

	return {
		panelist: {
			id: userData.id,
			name: userData.name,
			email: obfuscateEmail(userData.email),
			userType: userData.userType,
			isActive: userData.isActive,
			emailVerified: userData.emailVerified,
			registrationSource: userData.registrationSource,
			referralCode: userData.referralCode,
			loginCount: userData.loginCount,
			lastLoginAt: userData.lastLoginAt?.toISOString() ?? null,
			createdAt: userData.createdAt?.toISOString() ?? null,
		},
		points: {
			current: pointsData?.currentPoints ?? 0,
			lifetime: pointsSummary.lifetimePoints,
			redeemed: pointsSummary.redeemedPoints,
			bonus: pointsSummary.bonusPoints,
		},
		stats: {
			totalSurveysStarted: stats?.totalSurveysStarted ?? 0,
			totalSurveysCompleted: stats?.totalSurveysCompleted ?? 0,
			completionRate: Number(stats?.completionRate ?? 0),
			currentStreak: stats?.currentStreak ?? 0,
		},
		transactions: transactions.map(t => ({
			id: t.id,
			type: t.type,
			points: t.points,
			currentBalance: t.currentBalance,
			description: t.description,
			referenceType: t.referenceType,
			createdAt: t.createdAt.toISOString(),
		})),
		surveys: surveys.map(s => ({
			id: s.id,
			surveyId: s.surveyId,
			status: s.status,
			awardedPoints: s.awardedPoints,
			startedAt: s.startedAt?.toISOString() ?? null,
			completedAt: s.completedAt?.toISOString() ?? null,
		})),
		tickets: tickets.map(t => ({
			id: t.id,
			subject: t.subject,
			status: t.status,
			createdAt: t.createdAt.toISOString(),
		})),
		referrals: (userReferrals ?? []).map(r => ({
			id: r.id,
			referredName: r.referredName || 'User',
			status: r.status,
			bonus: r.referrerBonus ?? 0,
			createdAt: r.createdAt.toISOString(),
		})),
	};
};
