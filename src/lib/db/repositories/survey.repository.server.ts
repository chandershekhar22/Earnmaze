import { eq, and, or, gte, lte, desc, sql, count, inArray, isNull } from "drizzle-orm";
import { db } from "..";
import { panelistQuality } from "../schema/panelist-profile";
import { survey, surveyTransaction, user } from "../schema";
import { addPendingPoints } from "./panelist-points.repository.server";
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
export async function getAllAvailableSurveys() {
	try {
		Logger.root.debug({ context: 'surveys' }, 'Fetching all available surveys');
		
		const result = await db
			.select()
			.from(survey)
			.where(
				and(
					eq(survey.isActive, true),
					eq(survey.isDeleted, false)
				)
			);
		
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
export async function getSurveyById(surveyId: string) {
	if (!surveyId || typeof surveyId !== 'string' || surveyId.trim().length === 0) {
		Logger.root.warn(
			{ context: 'surveys', surveyId },
			'Invalid surveyId provided'
		);
		throw new Error('Invalid surveyId: must be a non-empty string');
	}

	try {
		Logger.root.debug({ context: 'surveys', surveyId }, 'Fetching survey by ID');
		
		const query = db
			.select()
			.from(survey)
			.where(
				and(
					eq(survey.id, surveyId),
					eq(survey.isActive, true),
					eq(survey.isDeleted, false)
				)
			)
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

		// Add pending points if survey was completed and points were awarded
		if (status === 'completed' && awardedPoints > 0 && transactionId) {
			try {
				await addPendingPoints(
					panelistId,
					awardedPoints,
					'Survey completed',
					transactionId.toString(),
					'survey_completion',
					{ surveyId }
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
		
		const [surveyData, completionStats] = await Promise.all([
			// Survey basic data
			db
				.select({
					survey: survey,
					totalActiveSurveys: count(),
				})
				.from(survey)
				.where(eq(survey.isActive, true)),
			
			// Completion statistics
			db
				.select({
					totalCompletions: count(),
				})
				.from(sql`survey_completions`)
		]);

		Logger.root.debug(
			{ context: 'surveys', surveyId },
			'Survey dashboard data fetched successfully'
		);

		return {
			survey: surveyData[0],
			completionStats: completionStats[0],
		};
	} catch (error) {
		Logger.root.error(
			{ context: 'surveys', surveyId, error },
			'Failed to fetch survey dashboard data'
		);
		throw error;
	}
}