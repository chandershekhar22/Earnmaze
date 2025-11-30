import { eq, and, or, gte, lte, desc, sql, count, inArray, isNull } from "drizzle-orm";
import { db } from "..";
import { panelist, panelistQuality, panelistSegments } from "../schema/panelists";
import { survey, surveyInvitation } from "../schema";

/**
 * Utility functions for survey management in respondent panel
 */

/**
 * Sync survey from external portal
 */
export async function syncSurveyFromExternal(externalSurveyData: {
  externalId: string;
  sourcePortal: string;
  title: string;
  description?: string;
  instructions?: string;
  points: number;
  estimatedMinutes: number;
  category: string;
  targetAudience?: Record<string, unknown>;
  screeningQuestions?: Record<string, unknown>[];
  qualifications?: Record<string, unknown>[];
  maxCompletions?: number;
  externalUrl: string;
}) {
  const syncData = {
    id: `${externalSurveyData.sourcePortal}_${externalSurveyData.externalId}`,
    ...externalSurveyData,
    targetAudience: externalSurveyData.targetAudience ? JSON.stringify(externalSurveyData.targetAudience) : null,
    screeningQuestions: externalSurveyData.screeningQuestions ? JSON.stringify(externalSurveyData.screeningQuestions) : null,
    qualifications: externalSurveyData.qualifications ? JSON.stringify(externalSurveyData.qualifications) : null,
    lastSyncAt: new Date(),
    syncStatus: 'synced' as const,
    syncData: JSON.stringify(externalSurveyData),
  };

  // Upsert survey
  const result = await db.insert(survey).values(syncData)
    .onConflictDoUpdate({
      target: [survey.id],
      set: {
        title: syncData.title,
        description: syncData.description,
        points: syncData.points,
        estimatedMinutes: syncData.estimatedMinutes,
        category: syncData.category,
        targetAudience: syncData.targetAudience,
        screeningQuestions: syncData.screeningQuestions,
        qualifications: syncData.qualifications,
        maxCompletions: syncData.maxCompletions,
        externalUrl: syncData.externalUrl,
        updatedAt: new Date(),
      }
    });

  return result;
}

/**
 * Get available surveys for a specific panelist
 */
export async function getAvailableSurveysForPanelist(userId: string) {
  const now = new Date();

  // Get panelist data for targeting
  const panelistData = await db.select()
    .from(panelist)
    .where(eq(panelist.userId, userId))
    .limit(1);

  if (!panelistData.length) return [];

  const panelistFirst = panelistData[0];

  // Get available surveys
  const availableSurveys = await db.select({
    survey: survey,
    invitation: surveyInvitation,
  })
  .from(survey)
  .leftJoin(surveyInvitation, and(
    eq(surveyInvitation.surveyId, survey.id),
    eq(surveyInvitation.panelistId, panelistFirst.id)
  ))
  .where(
    and(
      eq(survey.status, 'available'),
      eq(survey.isActive, true),
      eq(survey.isPublic, true),
      or(
        isNull(survey.availableFrom),
        lte(survey.availableFrom, now)
      ),
      or(
        isNull(survey.availableUntil),
        gte(survey.availableUntil, now)
      ),
      // Not already invited or completed
      or(
        isNull(surveyInvitation.id),
        and(
          eq(surveyInvitation.status, 'sent'),
          or(
            isNull(surveyInvitation.expiresAt),
            gte(surveyInvitation.expiresAt, now)
          )
        )
      )
    )
  )
  .orderBy(desc(survey.priority), desc(survey.points));

  return availableSurveys;
}

/**
 * Check if panelist qualifies for a survey
 */
export async function checkPanelistQualification(surveyId: string, panelistId: string) {
  // Get survey qualification criteria
  const surveyData = await db.select()
    .from(survey)
    .where(eq(survey.id, surveyId))
    .limit(1);

  if (!surveyData.length) return { qualified: false, reason: 'Survey not found' };

  // Get panelist data and segments
  const [panelistData] = await Promise.all([
    db.select().from(panelist).where(eq(panelist.id, panelistId)).limit(1),
  ]);

  if (!panelistData.length) return { qualified: false, reason: 'Panelist not found' };

  const panelistFirst = panelistData[0];

  // Check basic qualifications
  if (panelistFirst.status !== 'active') {
    return { qualified: false, reason: 'Panelist not active' };
  }

  // Fetch panelist quality score from panelistQuality table
  const panelistQualityData = await db.select()
    .from(panelistQuality)
    .where(eq(sql`panelistQuality.panelistId`, panelistFirst.id))
    .limit(1);

  const qualityScore = panelistQualityData.length ? panelistQualityData[0].qualityScore : 0;

  if (qualityScore < 70) { // Minimum quality threshold
    return { qualified: false, reason: 'Quality score too low' };
  }

  return { qualified: true, reason: 'All criteria met' };
}

/**
 * Create survey invitation for respondent
 */
export async function createSurveyInvitation(
  surveyId: string,
  panelistId: string,
  invitationType: string = 'targeted',
  targetingReason?: Record<string, unknown>
) {
  // Check if invitation already exists
  const existing = await db.select()
    .from(surveyInvitation)
    .where(and(
      eq(surveyInvitation.surveyId, surveyId),
      eq(surveyInvitation.panelistId, panelistId)
    ))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Check qualification
  const qualification = await checkPanelistQualification(surveyId, panelistId);

  const invitation = await db.insert(surveyInvitation).values({
    surveyId,
    panelistId,
    invitationType,
    targetingReason: targetingReason ? JSON.stringify(targetingReason) : null,
    qualificationStatus: qualification.qualified ? 'qualified' : 'disqualified',
    disqualificationReason: qualification.qualified ? null : qualification.reason,
    qualifiedAt: qualification.qualified ? new Date() : null,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });

  return invitation;
}

/**
 * Bulk invite qualified panelist to a survey
 */
export async function bulkInvitePanelists(
  surveyId: string,
  targetingCriteria: {
    tiers?: readonly ('bronze' | 'silver' | 'gold' | 'platinum' | 'diamond')[];
    segments?: readonly string[];
    qualityScoreMin?: number;
    maxInvitations?: number;
  } = {}
) {
  const {
    tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const,
    segments = [],
    qualityScoreMin = 70,
    maxInvitations = 1000
  } = targetingCriteria;

  // Get qualified panelists
  let query = db.select({
    id: panelist.id,
    tier: panelist.tier,
    qualityScore: panelistQuality.qualityScore,
  })
  .from(panelist)
  .innerJoin(panelistQuality, eq(panelistQuality.panelistId, panelist.id))
  .where(
    and(
      eq(panelist.status, 'active'),
      inArray(panelist.tier, tiers),
      gte(panelistQuality.qualityScore, qualityScoreMin)
    )
  )
  .limit(maxInvitations);

  // Add segment filtering if specified
  if (segments.length > 0) {
    query = query.innerJoin(panelistSegments, 
      and(
        eq(panelistSegments.panelistId, panelist.id),
        inArray(panelistSegments.segmentValue, segments),
        eq(panelistSegments.isActive, true)
      )
    );
  }

  const qualifiedRespondents = await query;

  // Create invitations
  const invitations = await Promise.all(
    qualifiedRespondents.map(respondent =>
      createSurveyInvitation(
        surveyId,
        respondent.id,
        'targeted',
        { tiers, segments, qualityScoreMin }
      )
    )
  );

  return invitations;
}

/**
 * Get survey dashboard data for admin
 */
export async function getSurveyDashboard(surveyId: string) {
  const [surveyData, invitationStats, completionStats] = await Promise.all([
    // Survey basic data
    db.select().from(survey).where(eq(survey.id, surveyId)).limit(1),
    
    // Invitation statistics
    db.select({
      status: surveyInvitation.status,
      count: count(),
    })
    .from(surveyInvitation)
    .where(eq(surveyInvitation.surveyId, surveyId))
    .groupBy(surveyInvitation.status),
    
    // Completion statistics (this would join with surveyCompletions from respondents.ts)
    db.select({
      totalCompletions: count(),
    })
    .from(sql`survey_completions`)
    .where(sql`survey_id = ${surveyId}`)
  ]);

  return {
    survey: surveyData[0],
    invitationStats,
    completionStats: completionStats[0],
  };
}