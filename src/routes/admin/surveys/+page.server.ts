import { requireAdmin } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { survey, surveyTransaction } from '$lib/db/schema';
import { eq, desc, sql, like, or, and, count, isNull } from 'drizzle-orm';
import { Logger } from '$lib/utils/app-logger';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	const url = new URL(event.request.url);
	const search = url.searchParams.get('search') || '';
	const status = url.searchParams.get('status') || 'all';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	try {
		// Build query conditions
		const whereConditions = [];
		
		// Always exclude deleted surveys
		whereConditions.push(
			or(
				eq(survey.isDeleted, false),
				isNull(survey.isDeleted)
			)
		);

		if (search) {
			whereConditions.push(
				or(
					like(survey.title, `%${search}%`),
					like(survey.description, `%${search}%`)
				)
			);
		}

		if (status === 'active') {
			whereConditions.push(eq(survey.isActive, true));
		} else if (status === 'inactive') {
			whereConditions.push(eq(survey.isActive, false));
		}

		const whereClause = whereConditions.length > 0 
			? and(...whereConditions)
			: undefined;

		// Get total count
		const [totalCount] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(survey)
			.where(whereClause);

		// Get surveys with pagination
		const surveys = await db
			.select({
				id: survey.id,
				title: survey.title,
				description: survey.description,
				points: survey.points,
				link: survey.link,
				isActive: survey.isActive,
				createdAt: survey.createdAt,
				updatedAt: survey.updatedAt
			})
			.from(survey)
			.where(whereClause)
			.orderBy(desc(survey.createdAt))
			.limit(limit)
			.offset(offset);

		// Get completion stats for each survey
		const surveyIds = surveys.map(s => s.id);
		const completionStats = surveyIds.length > 0 ? await db
			.select({
				surveyId: surveyTransaction.surveyId,
				totalStarted: sql<number>`count(*)::int`,
				totalCompleted: sql<number>`count(case when ${surveyTransaction.status} = 'completed' then 1 end)::int`
			})
			.from(surveyTransaction)
			.where(sql`${surveyTransaction.surveyId} IN (${sql.join(surveyIds.map(id => sql`${id}`), sql`, `)})`)
			.groupBy(surveyTransaction.surveyId)
			: [];

		// Merge stats with surveys
		const surveysWithStats = surveys.map(s => {
			const stats = completionStats.find(c => c.surveyId === s.id);
			return {
				...s,
				totalStarted: stats?.totalStarted || 0,
				totalCompleted: stats?.totalCompleted || 0
			};
		});

		// Get summary stats
		const [summaryStats] = await db
			.select({
				totalSurveys: sql<number>`count(*)::int`,
				activeSurveys: sql<number>`count(case when ${survey.isActive} = true then 1 end)::int`,
				inactiveSurveys: sql<number>`count(case when ${survey.isActive} = false then 1 end)::int`
			})
			.from(survey)
			.where(or(eq(survey.isDeleted, false), isNull(survey.isDeleted)));

		return {
			surveys: surveysWithStats,
			pagination: {
				page,
				limit,
				total: totalCount?.count || 0,
				totalPages: Math.ceil((totalCount?.count || 0) / limit)
			},
			filters: {
				search,
				status
			},
			stats: {
				totalSurveys: summaryStats?.totalSurveys || 0,
				activeSurveys: summaryStats?.activeSurveys || 0,
				inactiveSurveys: summaryStats?.inactiveSurveys || 0
			}
		};
	} catch (error) {
		Logger.root.error({ context: 'admin', error }, 'Failed to load surveys page');
		return {
			surveys: [],
			pagination: {
				page: 1,
				limit,
				total: 0,
				totalPages: 0
			},
			filters: {
				search,
				status
			},
			stats: {
				totalSurveys: 0,
				activeSurveys: 0,
				inactiveSurveys: 0
			}
		};
	}
};
