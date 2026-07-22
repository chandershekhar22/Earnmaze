import { eq, and, or, gte, lte, desc, sql, count, inArray, isNull, like } from "drizzle-orm";
import { db } from "..";
import { panelistQuality } from "../schema/panelist-profile";
import { survey, surveyTransaction, user } from "../schema";
import { referrals } from "../schema/transactions";
import { addPoints } from "./panelist-points.repository.server";
import { Logger } from "$lib/utils/app-logger";

/**
 * Utility functions for survey management in respondent panel
 */

/**
 * Get first available survey for new users
 * Returns the oldest active, non-deleted survey
 * 
 * @returns The first available survey or null if none found
 * @throws Error if database query fails
 */
export async function getFirstAvailableSurvey() {
	try {
		Logger.root.debug({ context: 'surveys' }, 'Fetching first available survey');
		
		const result = await db
			.select()
			.from(survey)
			.where(
				and(
					eq(survey.isActive, true),
					eq(survey.isDeleted, false)
				)
			)
			.orderBy(survey.createdAt)
			.limit(1);
		
		const found = result.length > 0 ? result[0] : null;
		
		if (!found) {
			Logger.root.warn({ context: 'surveys' }, 'No available surveys found');
		}
		
		return found;
	} catch (error) {
		Logger.root.error(
			{ context: 'surveys', error },
			'Failed to fetch first available survey'
		);
		throw error;
	}
}

/**
 * Get all available surveys for display
 * Returns all active, non-deleted surveys
 * 
 * @returns Array of available surveys (empty array if none found)
 * @throws Error if database query fails
 */
export async function getAllAvailableSurveys(limit?: number) {
	try {
		Logger.root.debug({ context: 'surveys' }, 'Fetching all available surveys');

		let query = db
			.select()
			.from(survey)
			.where(
				and(
					eq(survey.isActive, true),
					eq(survey.isDeleted, false)
				)
			)
			.orderBy(
				sql`CASE ${survey.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END`,
				desc(survey.createdAt)
			);

		const result = limit ? await query.limit(limit) : await query;
		
		Logger.root.debug(
			{ context: 'surveys', count: result.length },
			'Fetched all available surveys'
		);
		
		return result;
	} catch (error) {
		Logger.root.error(
			{ context: 'surveys', error },
			'Failed to fetch all available surveys'
		);
		throw error;
	}
} 

/**
 * Get survey by ID with active and non-deleted filters
 * 
 * @param surveyId - UUID of the survey to fetch
 * @returns Survey object or null if not found/inactive/deleted
 * @throws Error if surveyId is invalid or database query fails
 */
export async function getSurveyById(surveyId: string, getInActive: boolean = false, getDeleted: boolean = false) {
	if (!surveyId || typeof surveyId !== 'string' || surveyId.trim().length === 0) {
		Logger.root.warn(
			{ context: 'surveys', surveyId },
			'Invalid surveyId provided'
		);
		throw new Error('Invalid surveyId: must be a non-empty string');
	}

	try {
		Logger.root.debug({ context: 'surveys', surveyId }, 'Fetching survey by ID');
		
		const conditions = [eq(survey.id, surveyId)];
		if (!getInActive) conditions.push(eq(survey.isActive, true));
		if (!getDeleted) conditions.push(eq(survey.isDeleted, false));
		
		const query = db
			.select()
			.from(survey)
			.where(and(...conditions))
			.limit(1);
		
		const compiledQuery = query.toSQL();
		Logger.root.debug(
			{
				context: 'surveys',
				surveyId,
				sql: compiledQuery.sql,
				params: compiledQuery.params
			},
			'Survey fetch query compiled'
		);
		
		const results = await query;
		Logger.root.debug(
			{ context: 'surveys', surveyId, resultCount: results.length },
			'Survey fetch query executed'
		);
		
		const [found] = results;
		
		if (!found) {
			Logger.root.warn(
				{ context: 'surveys', surveyId },
				'Survey not found or inactive/deleted'
			);
			return null;
		}

		Logger.root.debug({ context: 'surveys', surveyId }, 'Survey fetched successfully');
		return found;
	} catch (error) {
		Logger.root.error(
			{ context: 'surveys', surveyId, error },
			'Failed to fetch survey by ID'
		);
		throw error;
	}
}

/**
 * Find survey transaction by respondent ID
 * 
 * @param respondentId - Unique respondent identifier
 * @returns Survey transaction object or null if not found
 * @throws Error if respondentId is invalid or database query fails
 */
export async function getSurveyTransactionByRespondentId(respondentId: string) {
	if (!respondentId || typeof respondentId !== 'string' || respondentId.trim().length === 0) {
		Logger.root.warn(
			{ context: 'surveys', respondentId },
			'Invalid respondentId provided'
		);
		throw new Error('Invalid respondentId: must be a non-empty string');
	}

	try {
		Logger.root.debug(
			{ context: 'surveys', respondentId },
			'Fetching survey transaction by respondent ID'
		);
		
		const [found] = await db
			.select()
			.from(surveyTransaction)
			.where(eq(surveyTransaction.respondentId, respondentId))
			.limit(1);

		if (!found) {
			Logger.root.debug(
				{ context: 'surveys', respondentId },
				'No transaction found for respondent ID'
			);
		}

		return found ?? null;
	} catch (error) {
		Logger.root.error(
			{ context: 'surveys', respondentId, error },
			'Failed to fetch survey transaction by respondent ID'
		);
		throw error;
	}
}

/**
 * Update survey transaction with completion data
 * If points are awarded, adds them as pending points to the user's account
 * 
 * @param respondentId - Unique respondent identifier
 * @param status - Completion status of the survey
 * @param awardedPoints - Points to award (must be non-negative)
 * @param panelistId - ID of the panelist completing the survey
 * @param surveyId - ID of the completed survey
 * @param transactionId - Optional transaction ID for point reference
 * @returns Updated transaction object or null if not found
 * @throws Error if validation fails or database operation fails
 */
/**
 * Qualify a referral and award bonus points when referred user completes their first survey.
 */
async function qualifyReferralIfFirst(panelistId: string) {
	await db.transaction(async (tx) => {
		// Lock the referral row to prevent concurrent qualification
		const [pendingReferral] = await tx
			.select()
			.from(referrals)
			.where(and(eq(referrals.referredId, panelistId), eq(referrals.status, 'pending')))
			.for('update')
			.limit(1);

		if (!pendingReferral) return;

		// Count completed surveys (inside transaction for consistency)
		const [completedCount] = await tx
			.select({ count: count() })
			.from(surveyTransaction)
			.where(and(eq(surveyTransaction.panelistId, panelistId), eq(surveyTransaction.status, 'completed')));

		// Current survey is already marked completed, so first completion = count of 1
		if ((completedCount?.count ?? 0) > 1) return;

		// Qualify and mark as paid atomically
		await tx
			.update(referrals)
			.set({ status: 'paid', qualifiedAt: new Date(), paidAt: new Date() })
			.where(eq(referrals.id, pendingReferral.id));

		// Award referrer bonus — survey points (counted in the "survey" bucket,
		// since referenceType 'referral' is not in EXPLORATION_TRANSACTION_REFERENCE_TYPES).
		const referrerBonus = pendingReferral.referrerBonus ?? 0;
		if (referrerBonus > 0) {
			await addPoints(
				pendingReferral.referrerId,
				referrerBonus,
				`Referral bonus — referred friend completed their first survey`,
				'bonus',
				'referral',
				pendingReferral.id,
				{ referredId: panelistId }
			);
		}

		// Award referred user bonus — exploration points. referenceType
		// 'exploration' puts this in the exploration bucket (see
		// EXPLORATION_TRANSACTION_REFERENCE_TYPES / getPointsSummaryByBucket)
		// so it shows on the Discover dashboard like other exploration wins.
		const referredBonus = pendingReferral.referredBonus ?? 0;
		if (referredBonus > 0) {
			await addPoints(
				panelistId,
				referredBonus,
				`Exploration bonus — signed up via referral, unlocked by first survey`,
				'bonus',
				'exploration',
				pendingReferral.id,
				{ referrerId: pendingReferral.referrerId, source: 'referral' }
			);
		}

		Logger.root.info(
			{
				context: 'referral',
				referralId: pendingReferral.id,
				referrerId: pendingReferral.referrerId,
				referredId: panelistId,
				referrerBonus,
				referredBonus,
			},
			'Referral qualified and bonuses awarded'
		);
	});
}

export async function completeSurveyTransaction(
	respondentId: string,
	status: 'completed' | 'terminated' | 'quota_full' | 'disqualified',
	awardedPoints: number,
	panelistId: string,
	surveyId: string,
	transactionId?: number
) {
	// Input validation
	if (!respondentId || typeof respondentId !== 'string' || respondentId.trim().length === 0) {
		throw new Error('Invalid respondentId: must be a non-empty string');
	}
	
	if (!panelistId || typeof panelistId !== 'string' || panelistId.trim().length === 0) {
		throw new Error('Invalid panelistId: must be a non-empty string');
	}
	
	if (!surveyId || typeof surveyId !== 'string' || surveyId.trim().length === 0) {
		throw new Error('Invalid surveyId: must be a non-empty string');
	}
	
	if (typeof awardedPoints !== 'number' || awardedPoints < 0 || !Number.isFinite(awardedPoints)) {
		throw new Error('Invalid awardedPoints: must be a non-negative finite number');
	}
	
	const validStatuses = ['completed', 'terminated', 'quota_full', 'disqualified'];
	if (!validStatuses.includes(status)) {
		throw new Error(`Invalid status: must be one of ${validStatuses.join(', ')}`);
	}

	try {
		Logger.root.info(
			{
				context: 'surveys',
				respondentId,
				panelistId,
				surveyId,
				status,
				awardedPoints,
				transactionId
			},
			'Completing survey transaction'
		);
		
		const [updated] = await db
			.update(surveyTransaction)
			.set({
				status,
				awardedPoints,
				completedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(surveyTransaction.respondentId, respondentId))
			.returning();

		if (!updated) {
			Logger.root.warn(
				{ context: 'surveys', respondentId },
				'Survey transaction not found for completion'
			);
			return null;
		}

		// Add points if survey awarded any points
		if (awardedPoints > 0 && transactionId) {
			try {
				await addPoints(
					panelistId,
					awardedPoints,
					`Survey ${status}`,
					status,
					'survey_completion',
					transactionId.toString(),
					{ surveyId, status }
				);
				
				Logger.root.info(
					{
						context: 'surveys',
						panelistId,
						surveyId,
						awardedPoints,
						transactionId
					},
					'Pending points added for survey completion'
				);
			} catch (pointsError) {
				Logger.root.error(
					{
						context: 'surveys',
						panelistId,
						surveyId,
						awardedPoints,
						error: pointsError
					},
					'Failed to add pending points after survey completion'
				);
				// Don't throw - transaction was already updated successfully
				// This needs manual intervention to credit points
			}
		}

		// Qualify referral on first completed survey
		if (status === 'completed') {
			try {
				await qualifyReferralIfFirst(panelistId);
			} catch (refError) {
				Logger.root.error({ context: 'referral', panelistId, error: refError }, 'Failed to process referral qualification');
			}
		}

		Logger.root.info(
			{
				context: 'surveys',
				respondentId,
				panelistId,
				surveyId,
				status
			},
			'Survey transaction completed successfully'
		);

		return updated;
	} catch (error) {
		Logger.root.error(
			{
				context: 'surveys',
				respondentId,
				panelistId,
				surveyId,
				status,
				error
			},
			'Failed to complete survey transaction'
		);
		throw error;
	}
}

/**
 * Get user by ID for user type determination
 * 
 * @param userId - UUID of the user to fetch
 * @returns User object or null if not found
 * @throws Error if userId is invalid or database query fails
 */
export async function getUserById(userId: string) {
	if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
		Logger.root.warn({ context: 'surveys', userId }, 'Invalid userId provided');
		throw new Error('Invalid userId: must be a non-empty string');
	}

	try {
		Logger.root.debug({ context: 'surveys', userId }, 'Fetching user by ID');
		
		const [found] = await db
			.select()
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!found) {
			Logger.root.debug({ context: 'surveys', userId }, 'User not found');
		}

		return found ?? null;
	} catch (error) {
		Logger.root.error(
			{ context: 'surveys', userId, error },
			'Failed to fetch user by ID'
		);
		throw error;
	}
}

/**
 * Get count of available surveys for admin dashboard
 * 
 * @returns Count of active surveys
 * @throws Error if database query fails
 */
export async function getAvailableSurveysCount() {
	try {
		Logger.root.debug({ context: 'surveys' }, 'Fetching available surveys count');
		
		const result = await db
			.select({
				count: count(),
			})
			.from(survey)
			.where(
        and(
        eq(survey.isActive, true),
        eq(survey.isDeleted, false)
        )
      );
		
		const surveyCount = result.length > 0 ? result[0].count : 0;
		
		Logger.root.debug(
			{ context: 'surveys', count: surveyCount },
			'Fetched available surveys count'
		);
		
		return surveyCount;
	} catch (error) {
		Logger.root.error(
			{ context: 'surveys', error },
			'Failed to fetch available surveys count'
		);
		throw error;
	}
}

/**
 * Get count of completed surveys for a specific panelist
 * 
 * @param panelistId - UUID of the panelist
 * @returns Count of completed surveys
 * @throws Error if panelistId is invalid or database query fails
 */
export async function getSurveyCompletionsPanelist(panelistId: string) {
	if (!panelistId || typeof panelistId !== 'string' || panelistId.trim().length === 0) {
		Logger.root.warn(
			{ context: 'surveys', panelistId },
			'Invalid panelistId provided'
		);
		throw new Error('Invalid panelistId: must be a non-empty string');
	}

	try {
		Logger.root.debug(
			{ context: 'surveys', panelistId },
			'Fetching survey completions for panelist'
		);
		
		const result = await db
			.select({
				count: count(),
			})
			.from(surveyTransaction)
			.where(
				and(
					eq(surveyTransaction.panelistId, panelistId),
					eq(surveyTransaction.status, 'completed')
				)
			);
		
		const completionCount = result.length > 0 ? result[0].count : 0;
		
		Logger.root.debug(
			{ context: 'surveys', panelistId, count: completionCount },
			'Fetched survey completions count for panelist'
		);
		
		return completionCount;
	} catch (error) {
		Logger.root.error(
			{ context: 'surveys', panelistId, error },
			'Failed to fetch survey completions for panelist'
		);
		throw error;
	}
}

/**
 * Get comprehensive dashboard data for a survey
 * Fetches survey data and completion statistics
 * 
 * @param surveyId - UUID of the survey (currently unused but reserved for future filtering)
 * @returns Object containing survey data and completion statistics
 * @throws Error if database query fails
 */
export async function getSurveyDashboard(surveyId: string) {
	if (!surveyId || typeof surveyId !== 'string' || surveyId.trim().length === 0) {
		Logger.root.warn(
			{ context: 'surveys', surveyId },
			'Invalid surveyId provided'
		);
		throw new Error('Invalid surveyId: must be a non-empty string');
	}

	try {
		Logger.root.debug(
			{ context: 'surveys', surveyId },
			'Fetching survey dashboard data'
		);
		
		const [activeSurveysCount, completionStats] = await Promise.all([
			// Count of active surveys
			db
				.select({
					totalActiveSurveys: count(),
				})
				.from(survey)
				.where(eq(survey.isActive, true)),

			// Completion statistics from survey_transactions
			db
				.select({
					totalCompletions: count(),
				})
				.from(surveyTransaction)
				.where(eq(surveyTransaction.status, 'completed'))
		]);

		Logger.root.debug(
			{ context: 'surveys', surveyId },
			'Survey dashboard data fetched successfully'
		);

		return {
			totalActiveSurveys: activeSurveysCount[0]?.totalActiveSurveys ?? 0,
			totalCompletions: completionStats[0]?.totalCompletions ?? 0,
		};
	} catch (error) {
		Logger.root.error(
			{ context: 'surveys', surveyId, error },
			'Failed to fetch survey dashboard data'
		);
		throw error;
	}
}

// ---------------------------------------------------------------------------
// Admin Survey CRUD
// ---------------------------------------------------------------------------

export type SurveyCreateInput = {
	title: string;
	description?: string | null;
	points: number;
	terminatedPoints?: number;
	quotaFullPoints?: number;
	link: string;
	isActive?: boolean;
	priority?: 'low' | 'medium' | 'high';
	thumbnailUrl?: string | null;
	isTodaySurvey?: boolean;
};

export type SurveyUpdateInput = Partial<SurveyCreateInput>;

export type AdminSurveysFilter = {
	search?: string;
	status?: string;
	priority?: string;
	page?: number;
	limit?: number;
};

/**
 * Get all non-deleted surveys for admin (no pagination)
 */
export async function getAllSurveysAdmin() {
	return db
		.select()
		.from(survey)
		.where(eq(survey.isDeleted, false))
		.orderBy(sql`${survey.createdAt} DESC`);
}

/**
 * Create a new survey
 */
export async function createSurveyAdmin(data: SurveyCreateInput, adminId: string) {
	if (data.isTodaySurvey) {
		await db.update(survey).set({ isTodaySurvey: false }).where(eq(survey.isDeleted, false));
	}
	const [created] = await db
		.insert(survey)
		.values({
			title: data.title,
			description: data.description || null,
			points: data.points,
			terminatedPoints: data.terminatedPoints ?? 0,
			quotaFullPoints: data.quotaFullPoints ?? 0,
			link: data.link,
			isActive: data.isActive ?? true,
			priority: data.priority ?? 'medium',
			createdBy: adminId,
			thumbnailUrl: data.thumbnailUrl ?? null,
			isTodaySurvey: data.isTodaySurvey ?? false,
		})
		.returning();
	return created;
}

export async function getTodaySurvey() {
	const [found] = await db
		.select()
		.from(survey)
		.where(and(eq(survey.isTodaySurvey, true), eq(survey.isActive, true), eq(survey.isDeleted, false)))
		.limit(1);
	return found ?? null;
}

/**
 * Update a survey
 */
export async function updateSurveyAdmin(
	surveyId: string,
	data: SurveyUpdateInput,
	adminId: string
) {
	if (data.isTodaySurvey === true) {
		await db.update(survey).set({ isTodaySurvey: false }).where(eq(survey.isDeleted, false));
	}
	const [updated] = await db
		.update(survey)
		.set({
			...data,
			updatedBy: adminId,
			updatedAt: sql`CURRENT_TIMESTAMP`,
		})
		.where(eq(survey.id, surveyId))
		.returning();
	return updated ?? null;
}

/**
 * Soft-delete a survey
 */
export async function deleteSurveyAdmin(surveyId: string, adminId: string) {
	await db
		.update(survey)
		.set({ isDeleted: true, deletedBy: adminId, deletedAt: sql`CURRENT_TIMESTAMP` })
		.where(eq(survey.id, surveyId));
}

/**
 * Get paginated surveys for admin with filters and stats
 */
export async function getAdminSurveys(filters: AdminSurveysFilter = {}) {
	const { search = '', status = 'all', priority = 'all', page = 1, limit = 20 } = filters;
	const offset = (page - 1) * limit;

	const whereConditions = [or(eq(survey.isDeleted, false), isNull(survey.isDeleted))];

	if (search) {
		whereConditions.push(
			or(like(survey.title, `%${search}%`), like(survey.description, `%${search}%`))
		);
	}
	if (status === 'active') whereConditions.push(eq(survey.isActive, true));
	else if (status === 'inactive') whereConditions.push(eq(survey.isActive, false));
	if (priority !== 'all') whereConditions.push(eq(survey.priority, priority as 'low' | 'medium' | 'high'));

	const whereClause = and(...whereConditions);

	const [totalCount] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(survey)
		.where(whereClause);

	const surveys = await db
		.select({
			id: survey.id,
			title: survey.title,
			description: survey.description,
			points: survey.points,
			terminatedPoints: survey.terminatedPoints,
			quotaFullPoints: survey.quotaFullPoints,
			link: survey.link,
			isActive: survey.isActive,
			priority: survey.priority,
			createdAt: survey.createdAt,
			updatedAt: survey.updatedAt,
			thumbnailUrl: survey.thumbnailUrl,
			isTodaySurvey: survey.isTodaySurvey,
		})
		.from(survey)
		.where(whereClause)
		.orderBy(desc(survey.createdAt))
		.limit(limit)
		.offset(offset);

	const surveyIds = surveys.map((s) => s.id);

	const completionStats =
		surveyIds.length > 0
			? await db
					.select({
						surveyId: surveyTransaction.surveyId,
						totalStarted: sql<number>`count(*)::int`,
						totalCompleted: sql<number>`count(case when ${surveyTransaction.status} = 'completed' then 1 end)::int`,
					})
					.from(surveyTransaction)
					.where(
						sql`${surveyTransaction.surveyId} IN (${sql.join(
							surveyIds.map((id) => sql`${id}`),
							sql`, `
						)})`
					)
					.groupBy(surveyTransaction.surveyId)
			: [];

	const statsMap = new Map(completionStats.map((c) => [c.surveyId, c]));
	const surveysWithStats = surveys.map((s) => {
		const stats = statsMap.get(s.id);
		return {
			...s,
			totalStarted: stats?.totalStarted || 0,
			totalCompleted: stats?.totalCompleted || 0,
		};
	});

	const [summaryStats] = await db
		.select({
			totalSurveys: sql<number>`count(*)::int`,
			activeSurveys: sql<number>`count(case when ${survey.isActive} = true then 1 end)::int`,
			inactiveSurveys: sql<number>`count(case when ${survey.isActive} = false then 1 end)::int`,
		})
		.from(survey)
		.where(or(eq(survey.isDeleted, false), isNull(survey.isDeleted)));

	return {
		surveys: surveysWithStats,
		pagination: {
			page,
			limit,
			total: totalCount?.count || 0,
			totalPages: Math.ceil((totalCount?.count || 0) / limit),
		},
		filters: { search, status },
		stats: {
			totalSurveys: summaryStats?.totalSurveys || 0,
			activeSurveys: summaryStats?.activeSurveys || 0,
			inactiveSurveys: summaryStats?.inactiveSurveys || 0,
		},
	};
}