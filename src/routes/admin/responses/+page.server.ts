import { requireAdmin } from '$lib/server/auth';
import { obfuscateEmail } from '$lib/utils/obfuscate';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { surveyTransaction } from '$lib/db/schema/surveys';
import { survey } from '$lib/db/schema/surveys';
import { user } from '$lib/db/schema/auth';
import { desc, eq, sql, and } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	const page = parseInt(event.url.searchParams.get('page') || '1');
	const statusFilter = event.url.searchParams.get('status') || 'all';
	const surveyFilter = event.url.searchParams.get('survey') || 'all';
	const limit = 30;
	const offset = (page - 1) * limit;

	// Build conditions
	const conditions = [];
	if (statusFilter !== 'all') conditions.push(eq(surveyTransaction.status, statusFilter as any));
	if (surveyFilter !== 'all') conditions.push(eq(surveyTransaction.surveyId, surveyFilter));

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const [responses, countResult, surveys, statusCounts] = await Promise.all([
		db
			.select({
				id: surveyTransaction.id,
				panelistId: surveyTransaction.panelistId,
				panelistName: user.name,
				panelistEmail: user.email,
				surveyId: surveyTransaction.surveyId,
				surveyTitle: survey.title,
				surveyDescription: survey.description,
				surveyPoints: survey.points,
				surveyTerminatedPoints: survey.terminatedPoints,
				surveyQuotaFullPoints: survey.quotaFullPoints,
				surveyLink: survey.link,
				surveyIsActive: survey.isActive,
				respondentId: surveyTransaction.respondentId,
				status: surveyTransaction.status,
				awardedPoints: surveyTransaction.awardedPoints,
				startedAt: surveyTransaction.startedAt,
				completedAt: surveyTransaction.completedAt,
			})
			.from(surveyTransaction)
			.leftJoin(user, eq(surveyTransaction.panelistId, user.id))
			.leftJoin(survey, eq(surveyTransaction.surveyId, survey.id))
			.where(whereClause)
			.orderBy(desc(surveyTransaction.startedAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)`.as('count') })
			.from(surveyTransaction)
			.where(whereClause),
		db
			.select({ id: survey.id, title: survey.title })
			.from(survey)
			.orderBy(desc(survey.createdAt))
			.limit(100),
		db
			.select({
				status: surveyTransaction.status,
				count: sql<number>`count(*)`.as('count'),
			})
			.from(surveyTransaction)
			.groupBy(surveyTransaction.status),
	]);

	const total = Number(countResult[0]?.count ?? 0);
	const counts: Record<string, number> = { all: 0 };
	for (const sc of statusCounts) {
		counts[sc.status] = Number(sc.count);
		counts.all += Number(sc.count);
	}

	return {
		responses: responses.map(r => ({
			id: r.id,
			panelistId: r.panelistId,
			panelistName: r.panelistName,
			panelistEmail: obfuscateEmail(r.panelistEmail),
			surveyId: r.surveyId,
			surveyTitle: r.surveyTitle,
			surveyDescription: r.surveyDescription,
			surveyPoints: r.surveyPoints,
			surveyTerminatedPoints: r.surveyTerminatedPoints,
			surveyQuotaFullPoints: r.surveyQuotaFullPoints,
			surveyLink: r.surveyLink,
			surveyIsActive: r.surveyIsActive,
			respondentId: r.respondentId,
			status: r.status,
			awardedPoints: r.awardedPoints,
			startedAt: r.startedAt.toISOString(),
			completedAt: r.completedAt?.toISOString() ?? null,
		})),
		surveys: surveys.map(s => ({ id: s.id, title: s.title })),
		statusCounts: counts,
		pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		filters: { status: statusFilter, survey: surveyFilter },
	};
};
