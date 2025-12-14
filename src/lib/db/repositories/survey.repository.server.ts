import { eq, and, or, gte, lte, desc, sql, count, inArray, isNull } from "drizzle-orm";
import { db } from "..";
import { panelistQuality } from "../schema/panelist-profile";
import { survey, surveyTransaction } from "../schema";

/**
 * Utility functions for survey management in respondent panel
 */

/**
 * Get first available survey for new users
 */
export async function getFirstAvailableSurvey() {
	const result = await db
		.select()
		.from(survey)
		.where(eq(survey.isActive, true))
		.orderBy(survey.createdAt)
		.limit(1);
	
	return result.length > 0 ? result[0] : null;
}

export async function getAllAvailableSurveys() {
  const result = await db
    .select()
    .from(survey)
    .where(
      and(
        eq(survey.isActive, true),
        eq(survey.isDeleted, false)
      )
    );
  
  return result;
} 

export async function getSurveyById(surveyId: string) {
  const [found] = await db
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

  return found ?? null;
}

/**
 * Get survey dashboard data for admin
 */
export async function getAvailableSurveysCount() {
  const result = await db
    .select({
      count: count(),
    })
    .from(survey)
    .where(eq(survey.isActive, true));
  
  return result.length > 0 ? result[0].count : 0;
}

export async function getSurveyCompletionsPanelist(panelistId: string) {
  const result = await db
    .select({
      count: count(),
    })
    .from(surveyTransaction)
    .where(
      and(
        eq(surveyTransaction.panelistId, panelistId),
        eq(surveyTransaction.status, 'completed')
      ));
  
  return result.length > 0 ? result[0].count : 0;
}

export async function getSurveyDashboard(surveyId: string) {
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

    return {
    survey: surveyData[0],
    completionStats: completionStats[0],
    };
}