import type { PageServerLoad } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import { getTicketsByPanelist, getActiveFaqsLocalized } from '$lib/db/repositories';
import { getRecentTransactions } from '$lib/db/repositories/panelist-points-aggregations.repository.server';
import { db } from '$lib/db';
import { surveyTransaction, survey } from '$lib/db/schema/surveys';
import { eq, desc } from 'drizzle-orm';
import { getLocale } from '$lib/paraglide/runtime';

export const load: PageServerLoad = async (event) => {
	const authUser = await requirePanelist(event);

	const [tickets, faqs, recentTxs, recentSurveys] = await Promise.all([
		getTicketsByPanelist(authUser.id),
		getActiveFaqsLocalized(getLocale()),
		getRecentTransactions(authUser.id, 20),
		db.select({
			id: surveyTransaction.id,
			surveyId: surveyTransaction.surveyId,
			surveyTitle: survey.title,
			status: surveyTransaction.status,
			awardedPoints: surveyTransaction.awardedPoints,
			startedAt: surveyTransaction.startedAt,
			completedAt: surveyTransaction.completedAt,
		})
		.from(surveyTransaction)
		.leftJoin(survey, eq(surveyTransaction.surveyId, survey.id))
		.where(eq(surveyTransaction.panelistId, authUser.id))
		.orderBy(desc(surveyTransaction.startedAt))
		.limit(20),
	]);

	return {
		tickets: tickets.map((t) => ({
			id: t.id,
			subject: t.subject,
			message: t.message,
			status: t.status,
			priority: t.priority,
			adminReply: t.adminReply,
			repliedAt: t.repliedAt?.toISOString() ?? null,
			createdAt: t.createdAt.toISOString(),
		})),
		faqs,
		transactions: (recentTxs ?? []).map((tx) => ({
			id: tx.id,
			type: tx.type,
			points: tx.points,
			description: tx.description,
			createdAt: tx.createdAt.toISOString(),
		})),
		surveyAttempts: (recentSurveys ?? []).map((s) => ({
			id: s.id,
			surveyTitle: s.surveyTitle || 'Untitled Survey',
			status: s.status,
			awardedPoints: s.awardedPoints ?? 0,
			startedAt: s.startedAt.toISOString(),
			completedAt: s.completedAt?.toISOString() ?? null,
		})),
	};
};
