import { eq, and, gte, desc, sql } from "drizzle-orm";
import {
  panelist,
  panelistPoint,
  panelistVerification,
  panelistQuality,
  panelistEngagement,
  panelistPreferences,
  panelistDemographics,
  panelistGeography,
  panelistProfessional,
  panelistLifestyle,
  panelistTierEnum,
} from "../schema/panelists";
import {
  panelistProfileCompletion,
  panelistTags,
  panelistDevices,
  panelistStatusHistory,
} from "../schema/panelist-extensions";
import { survey, surveyTransaction } from "../schema/surveys";
import { pointsTransactions } from "../schema/transactions";
import { db } from "..";

/**
 * Utility functions for optimized respondent operations with normalized schema
 */

/**
 * Calculate and update panelist tier based on points and engagement
 */
export async function updatePanelistTier(panelistId: string) {
  // Get points data
  const pointsData = await db.select()
    .from(panelistPoint)
    .where(eq(panelistPoint.panelistId, panelistId))
    .limit(1);

  // Get engagement data
  const engagementData = await db.select()
    .from(panelistEngagement)
    .where(eq(panelistEngagement.panelistId, panelistId))
    .limit(1);

  // Get quality data
  const qualityData = await db.select()
    .from(panelistQuality)
    .where(eq(panelistQuality.panelistId, panelistId))
    .limit(1);

  if (!pointsData.length || !engagementData.length || !qualityData.length) return;

  const { lifetimePoints } = pointsData[0];
  const { completedSurveys } = engagementData[0];
  const { qualityScore } = qualityData[0];
  
  let newTier = 'bronze';
  let tierProgress = 0;

  // Tier calculation logic with null checks
  const points = lifetimePoints || 0;
  const surveys = completedSurveys || 0;
  const quality = qualityScore || 0;

  if (points >= 50000 && surveys >= 500 && quality >= 90) {
    newTier = 'diamond';
    tierProgress = 100;
  } else if (points >= 25000 && surveys >= 250 && quality >= 85) {
    newTier = 'platinum';
    tierProgress = Math.min(100, ((points - 25000) / 25000) * 100);
  } else if (points >= 10000 && surveys >= 100 && quality >= 80) {
    newTier = 'gold';
    tierProgress = Math.min(100, ((points - 10000) / 15000) * 100);
  } else if (points >= 2500 && surveys >= 25 && quality >= 75) {
    newTier = 'silver';
    tierProgress = Math.min(100, ((points - 2500) / 7500) * 100);
  } else {
    newTier = 'bronze';
    tierProgress = Math.min(100, (points / 2500) * 100);
  }

  await db.update(panelist)
    .set({ tier: newTier as typeof panelistTierEnum.enumValues[number] })
    .where(eq(panelist.id, panelistId));

  return { tier: newTier, tierProgress };
}

/**
 * Calculate and update profile completion percentage
 */
export async function calculateProfileCompletion(panelistId: string): Promise<number> {
  const profileTables = await Promise.all([
    db.select().from(panelistDemographics).where(eq(panelistDemographics.panelistId, panelistId)).limit(1),
    db.select().from(panelistGeography).where(eq(panelistGeography.panelistId, panelistId)).limit(1),
    db.select().from(panelistProfessional).where(eq(panelistProfessional.panelistId, panelistId)).limit(1),
    db.select().from(panelistLifestyle).where(eq(panelistLifestyle.panelistId, panelistId)).limit(1),
    db.select().from(panelistPreferences).where(eq(panelistPreferences.panelistId, panelistId)).limit(1)
  ]);

  const [demographics, geography, professional, lifestyle, preferences] = profileTables;

  let totalFields = 0;
  let completedFields = 0;

  // Count demographics fields
  if (demographics.length > 0) {
    const demo = demographics[0];
    const demoFields = ['gender', 'dateOfBirth', 'maritalStatus', 'numberOfChildren', 'educationLevel'];
    totalFields += demoFields.length;
    completedFields += demoFields.filter(field => 
      demo[field as keyof typeof demo] != null && demo[field as keyof typeof demo] !== ''
    ).length;
  } else {
    totalFields += 5; // demographics fields
  }

  // Count geography fields
  if (geography.length > 0) {
    const geo = geography[0];
    const geoFields = ['country', 'state', 'city', 'postalCode', 'timezone'];
    totalFields += geoFields.length;
    completedFields += geoFields.filter(field => 
      geo[field as keyof typeof geo] != null && geo[field as keyof typeof geo] !== ''
    ).length;
  } else {
    totalFields += 5; // geography fields
  }

  // Count professional fields
  if (professional.length > 0) {
    const prof = professional[0];
    const profFields = ['employmentStatus', 'industry', 'jobTitle', 'workExperience', 'income'];
    totalFields += profFields.length;
    completedFields += profFields.filter(field => 
      prof[field as keyof typeof prof] != null && prof[field as keyof typeof prof] !== ''
    ).length;
  } else {
    totalFields += 5; // professional fields
  }

  // Count lifestyle fields
  if (lifestyle.length > 0) {
    const life = lifestyle[0];
    const lifeFields = ['interests', 'hobbies', 'shoppingHabits', 'brandPreferences'];
    totalFields += lifeFields.length;
    completedFields += lifeFields.filter(field => 
      life[field as keyof typeof life] != null && life[field as keyof typeof life] !== ''
    ).length;
  } else {
    totalFields += 4; // lifestyle fields
  }

  // Count preferences fields
  if (preferences.length > 0) {
    const pref = preferences[0];
    const prefFields = ['preferredLanguage', 'communicationChannel', 'surveyFrequency', 'emailNotifications'];
    totalFields += prefFields.length;
    completedFields += prefFields.filter(field => 
      pref[field as keyof typeof pref] != null && pref[field as keyof typeof pref] !== ''
    ).length;
  } else {
    totalFields += 4; // preferences fields
  }

  const completionPercentage = Math.round((completedFields / totalFields) * 100);

  // Update or insert the completion data
  const existingCompletion = await db.select()
    .from(panelistProfileCompletion)
    .where(eq(panelistProfileCompletion.panelistId, panelistId))
    .limit(1);

  if (existingCompletion.length > 0) {
    await db.update(panelistProfileCompletion)
      .set({
        overallCompletion: completionPercentage,
        lastCalculated: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(panelistProfileCompletion.panelistId, panelistId));
  } else {
    await db.insert(panelistProfileCompletion).values({
      panelistId,
      overallCompletion: completionPercentage,
      lastCalculated: new Date(),
      updatedAt: new Date(),
    });
  }

  return completionPercentage;
}

/**
 * Update engagement metrics for a respondent
 */
export async function updateEngagementMetrics(panelistId: string, _surveyId: string, timeSpent: number, isCompleted: boolean) {
  // Update engagement data
    const engagement = await db.select()
      .from(panelistEngagement)
      .where(eq(panelistEngagement.panelistId, panelistId))
    .limit(1);

  if (engagement.length > 0) {
    const current = engagement[0];
    await db.update(panelistEngagement)
      .set({
        totalSurveys: isCompleted ? (current.totalSurveys || 0) + 1 : current.totalSurveys,
        completedSurveys: isCompleted ? (current.completedSurveys || 0) + 1 : current.completedSurveys,
        averageTimePerSurvey: Math.round(((current.averageTimePerSurvey || 0) + timeSpent) / 2),
        lastSurveyAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(panelistEngagement.panelistId, panelistId));
  } else {
    await db.insert(panelistEngagement).values({
      panelistId,
      totalSurveys: isCompleted ? 1 : 0,
      completedSurveys: isCompleted ? 1 : 0,
      averageTimePerSurvey: timeSpent,
      lastSurveyAt: new Date(),
    });
  }
}

/**
 * Update quality metrics for a respondent
 */
export async function updateQualityMetrics(panelistId: string, qualityRating: number, wasDisqualified: boolean = false) {
  const quality = await db.select()
    .from(panelistQuality)
    .where(eq(panelistQuality.panelistId, panelistId))
    .limit(1);

  if (quality.length > 0) {
    const current = quality[0];
    const currentScore = current.qualityScore || 0;
    const newQualityScore = Math.round((currentScore + qualityRating) / 2);
    
    await db.update(panelistQuality)
      .set({
        qualityScore: newQualityScore,
        qualityFlags: wasDisqualified ? (current.qualityFlags || 0) + 1 : current.qualityFlags,
        updatedAt: new Date(),
      })
      .where(eq(panelistQuality.panelistId, panelistId));
  } else {
    await db.insert(panelistQuality).values({
      panelistId,
      qualityScore: qualityRating,
      qualityFlags: wasDisqualified ? 1 : 0,
    });
  }
}

/**
 * Add or update respondent tag
 */
export async function addPanelistTag(panelistId: string, tagName: string, tagValue: string, tagType: string = 'manual') {
  const existingTag = await db.select()
    .from(panelistTags)
    .where(
      and(
        eq(panelistTags.panelistId, panelistId),
        eq(panelistTags.tagName, tagName)
      )
    )
    .limit(1);

  if (existingTag.length > 0) {
    await db.update(panelistTags)
      .set({
        tagValue,
        tagType,
        createdAt: new Date(),
      })
      .where(
        and(
          eq(panelistTags.panelistId, panelistId),
          eq(panelistTags.tagName, tagName)
        )
      );
  } else {
    await db.insert(panelistTags).values({
      panelistId,
      tagName,
      tagValue,
      tagType,
      createdAt: new Date(),
    });
  }
}

/**
 * Get respondents by tags for targeting
 */
export async function getPanelistsByTags(tagNames: string[], limit: number = 1000) {
  return db.select({
    panelistId: panelistTags.panelistId,
    tagName: panelistTags.tagName,
    tagValue: panelistTags.tagValue,
  })
  .from(panelistTags)
  .where(sql`${panelistTags.tagName} IN (${tagNames.map(t => `'${t}'`).join(',')})`)
  .limit(limit);
}

/**
 * Auto-tag respondents based on profile data
 */
export async function autoTagPanelist(panelistId: string) {
  const profileData = await Promise.all([
    db.select().from(panelistDemographics).where(eq(panelistDemographics.panelistId, panelistId)).limit(1),
    db.select().from(panelistGeography).where(eq(panelistGeography.panelistId, panelistId)).limit(1),
    db.select().from(panelistProfessional).where(eq(panelistProfessional.panelistId, panelistId)).limit(1),
  ]);

  const [demographics, geography, professional] = profileData;

  // Age-based tagging
  if (demographics.length > 0 && demographics[0].dateOfBirth) {
    const age = new Date().getFullYear() - new Date(demographics[0].dateOfBirth).getFullYear();
    let ageGroup = '';
    if (age < 25) ageGroup = '18-24';
    else if (age < 35) ageGroup = '25-34';
    else if (age < 45) ageGroup = '35-44';
    else if (age < 55) ageGroup = '45-54';
    else if (age < 65) ageGroup = '55-64';
    else ageGroup = '65+';
    
  await addPanelistTag(panelistId, 'Age_Group', ageGroup, 'demographic');
  }

  // Geographic tagging
  if (geography.length > 0 && geography[0].country) {
  await addPanelistTag(panelistId, 'Country', geography[0].country, 'geographic');
  }

  // Professional tagging
  if (professional.length > 0) {
    if (professional[0].industry) {
  await addPanelistTag(panelistId, 'Industry', professional[0].industry, 'professional');
    }
    if (professional[0].income) {
      await addPanelistTag(panelistId, 'Income_Level', professional[0].income, 'demographic');
    }
  }
}

/**
 * Get comprehensive panelist dashboard data with single-query optimization
 */
export async function getPanelistDashboard(userId: string) {
  const [mainData] = await db
    .select({
      points: {
        currentPoints: panelistPoint.currentPoints,
        lifetimePoints: panelistPoint.lifetimePoints,
        pendingPoints: panelistPoint.pendingPoints,
        redeemedPoints: panelistPoint.redeemedPoints,
        tierProgress: panelistPoint.tierProgress
      },
      engagement: {
        streakDays: panelistEngagement.streakDays,
        lastActiveAt: panelistEngagement.lastActiveAt,
        totalSurveys: panelistEngagement.totalSurveys,
        completedSurveys: panelistEngagement.completedSurveys,
        completionRate: panelistEngagement.completionRate
      },
      verification: {
        status: panelistVerification.status,
        identityVerified: panelistVerification.identityVerified,
        phoneVerified: panelistVerification.phoneVerified,
        emailVerified: panelistVerification.emailVerified,
        verifiedAt: panelistVerification.verifiedAt
      },
      demographics: {
        dateOfBirth: panelistDemographics.dateOfBirth,
        gender: panelistDemographics.gender,
        maritalStatus: panelistDemographics.maritalStatus,
        ethnicity: panelistDemographics.ethnicity,
        hasChildren: panelistDemographics.hasChildren,
        householdSize: panelistDemographics.householdSize
      },
      geography: {
        country: panelistGeography.country,
        state: panelistGeography.state,
        city: panelistGeography.city,
        zipCode: panelistGeography.zipCode,
        latitude: panelistGeography.latitude,
        longitude: panelistGeography.longitude
      },
      professional: {
        education: panelistProfessional.education,
        employment: panelistProfessional.employment,
        occupation: panelistProfessional.occupation,
        industry: panelistProfessional.industry,
        income: panelistProfessional.income,
        workExperience: panelistProfessional.workExperience
      }
    })
    .from(panelist)
    .leftJoin(panelistPoint, eq(panelist.id, panelistPoint.panelistId))
    .leftJoin(panelistEngagement, eq(panelist.id, panelistEngagement.panelistId))
    .leftJoin(panelistQuality, eq(panelist.id, panelistQuality.panelistId))
    .leftJoin(panelistVerification, eq(panelist.id, panelistVerification.panelistId))
    .leftJoin(panelistDemographics, eq(panelist.id, panelistDemographics.panelistId))
    .leftJoin(panelistGeography, eq(panelist.id, panelistGeography.panelistId))
    .leftJoin(panelistProfessional, eq(panelist.id, panelistProfessional.panelistId))
    .where(eq(panelist.userId, userId))
    .limit(1);

  return {
    ...mainData
  };
}

/**
 * Get high-value respondents for targeting
 */
export async function getHighValuePanelists(limit: number = 500) {
  return db.select({
    id: panelist.id,
    tier: panelist.tier,
    status: panelist.status,
    lifetimePoints: panelistPoint.lifetimePoints,
    currentPoints: panelistPoint.currentPoints,
    qualityScore: panelistQuality.qualityScore,
    completedSurveys: panelistEngagement.completedSurveys,
    totalSurveys: panelistEngagement.totalSurveys,
  })
  .from(panelist)
  .leftJoin(panelistPoint, eq(panelist.id, panelistPoint.panelistId))
  .leftJoin(panelistQuality, eq(panelist.id, panelistQuality.panelistId))
  .leftJoin(panelistEngagement, eq(panelist.id, panelistEngagement.panelistId))
  .where(
    and(
      eq(panelist.status, 'active'),
      gte(panelistQuality.qualityScore, 80),
      gte(panelistPoint.lifetimePoints, 1000)
    )
  )
  .orderBy(desc(panelistPoint.lifetimePoints), desc(panelistQuality.qualityScore))
  .limit(limit);
}

/**
 * Update respondent points after survey completion
 */
export async function updatePanelistPoints(panelistId: string, pointsEarned: number) {
  const points = await db.select()
    .from(panelistPoint)
    .where(eq(panelistPoint.panelistId, panelistId))
    .limit(1);

  if (points.length > 0) {
    const current = points[0];
    await db.update(panelistPoint)
      .set({
        currentPoints: current.currentPoints + pointsEarned,
        lifetimePoints: current.lifetimePoints + pointsEarned,
        updatedAt: new Date(),
      })
      .where(eq(panelistPoint.panelistId, panelistId));
  } else {
    await db.insert(panelistPoint).values({
      panelistId,
      currentPoints: pointsEarned,
      lifetimePoints: pointsEarned,
      pendingPoints: 0,
      redeemedPoints: 0,
    });
  }

  // Update tier after points change
  await updatePanelistTier(panelistId);
}

/**
 * Track device information for a respondent
 */
export async function trackPanelistDevice(panelistId: string, deviceInfo: {
  deviceType: string;
  operatingSystem: string;
  browser: string;
  screenResolution?: string;
  userAgent?: string;
}) {
  const existingDevice = await db.select()
    .from(panelistDevices)
    .where(
      and(
        eq(panelistDevices.panelistId, panelistId),
        eq(panelistDevices.deviceType, deviceInfo.deviceType),
        eq(panelistDevices.operatingSystem, deviceInfo.operatingSystem),
        eq(panelistDevices.browser, deviceInfo.browser)
      )
    )
    .limit(1);

  if (existingDevice.length > 0) {
    await db.update(panelistDevices)
      .set({
        lastUsedAt: new Date(),
        usageCount: (existingDevice[0].usageCount || 0) + 1,
        screenResolution: deviceInfo.screenResolution,
        userAgent: deviceInfo.userAgent,
      })
      .where(eq(panelistDevices.id, existingDevice[0].id));
  } else {
    await db.insert(panelistDevices).values({
      panelistId,
      deviceType: deviceInfo.deviceType,
      operatingSystem: deviceInfo.operatingSystem,
      browser: deviceInfo.browser,
      screenResolution: deviceInfo.screenResolution,
      userAgent: deviceInfo.userAgent,
      firstUsedAt: new Date(),
      lastUsedAt: new Date(),
      usageCount: 1,
    });
  }
}

/**
 * Record status change for a respondent
 */
export async function recordPanelistStatusChange(
  panelistId: string,
  previousStatus: string,
  newStatus: string,
  reason?: string,
  changedBy?: string
) {
  await db.insert(panelistStatusHistory).values({
    panelistId,
    previousStatus,
    newStatus,
    reason,
    changedBy,
    createdAt: new Date(),
  });

  // Update the main panelist status
  await db.update(panelist)
    .set({
      status: newStatus as typeof panelist.$inferInsert.status,
      updatedAt: new Date(),
    })
    .where(eq(panelist.id, panelistId));
}

/**
 * Get points data for a panelist
 */
export async function getPanelistPoints(userId: string) {
  const [pointsData] = await db
    .select({
      currentPoints: panelistPoint.currentPoints,
      lifetimePoints: panelistPoint.lifetimePoints,
      pendingPoints: panelistPoint.pendingPoints,
      redeemedPoints: panelistPoint.redeemedPoints,
    })
    .from(panelist)
    .leftJoin(panelistPoint, eq(panelist.id, panelistPoint.panelistId))
    .where(eq(panelist.userId, userId))
    .limit(1);

  if (!pointsData) {
    return {
      totalPoints: 0,
      availablePoints: 0,
      pendingPoints: 0,
      lifetimeEarned: 0
    };
  }

  const { currentPoints = 0, lifetimePoints = 0, pendingPoints = 0 } = pointsData;

  return {
    totalPoints: (currentPoints ?? 0) + (pendingPoints ?? 0),
    availablePoints: currentPoints ?? 0,
    pendingPoints: pendingPoints ?? 0,
    lifetimeEarned: lifetimePoints ?? 0
  };
}

/**
 * Get points transactions for a panelist
 */
export async function getPanelistPointsTransactions(userId: string, limit: number = 20) {
  // First get the panelist ID from user ID
  const [panelistData] = await db
    .select({ id: panelist.id })
    .from(panelist)
    .where(eq(panelist.userId, userId))
    .limit(1);

  if (!panelistData) {
    return [];
  }

  return db
    .select({
      id: pointsTransactions.id,
      type: pointsTransactions.type,
      category: pointsTransactions.category,
      amount: pointsTransactions.amount,
      balance: pointsTransactions.balance,
      description: pointsTransactions.description,
      referenceId: pointsTransactions.referenceId,
      referenceType: pointsTransactions.referenceType,
      status: pointsTransactions.status,
      createdAt: pointsTransactions.createdAt,
    })
    .from(pointsTransactions)
    .where(eq(pointsTransactions.panelistId, panelistData.id))
    .orderBy(desc(pointsTransactions.createdAt))
    .limit(limit);
}

/**
 * Get survey transactions for a panelist
 */
export async function getPanelistSurveyTransactions(panelistId: string, limit: number = 20) {
  return db
    .select({
      id: surveyTransaction.id,
      surveyId: surveyTransaction.surveyId,
      status: surveyTransaction.status,
      awardedPoints: surveyTransaction.awardedPoints,
      bonusPoints: surveyTransaction.bonusPoints,
      qualityRating: surveyTransaction.qualityRating,
      timeSpentSeconds: surveyTransaction.timeSpentSeconds,
      startedAt: surveyTransaction.startedAt,
      completedAt: surveyTransaction.completedAt,
      submittedAt: surveyTransaction.submittedAt,
      createdAt: surveyTransaction.createdAt,
      survey: {
        id: survey.id,
        title: survey.title,
        points: survey.points,
        category: survey.category,
        estimatedMinutes: survey.estimatedMinutes,
      },
    })
    .from(surveyTransaction)
    .leftJoin(survey, eq(surveyTransaction.surveyId, survey.id))
    .where(eq(surveyTransaction.panelistId, panelistId))
    .orderBy(desc(surveyTransaction.createdAt))
    .limit(limit);
}

/**
 * Get recent activity for a panelist dashboard
 */
export async function getPanelistRecentActivity(userId: string, limit: number = 5) {
  // First get the panelist ID from user ID
  const [panelistData] = await db
    .select({ id: panelist.id })
    .from(panelist)
    .where(eq(panelist.userId, userId))
    .limit(1);

  if (!panelistData) {
    return [];
  }

  const panelistId = panelistData.id;

  // Get recent points transactions
  const pointsActivity = await db
    .select({
      id: pointsTransactions.id,
      type: pointsTransactions.type,
      amount: pointsTransactions.amount,
      description: pointsTransactions.description,
      createdAt: pointsTransactions.createdAt,
      category: sql<string>`'points'`.as('category')
    })
    .from(pointsTransactions)
    .where(eq(pointsTransactions.panelistId, panelistId))
    .orderBy(desc(pointsTransactions.createdAt))
    .limit(limit);

  // Get recent survey transactions
  const surveyActivity = await db
    .select({
      id: surveyTransaction.id,
      type: sql<string>`'survey'`.as('type'),
      amount: surveyTransaction.awardedPoints,
      description: sql<string>`CONCAT('Completed "', surveys.title, '"')`.as('description'),
      createdAt: surveyTransaction.completedAt,
      category: sql<string>`'survey'`.as('category')
    })
    .from(surveyTransaction)
    .leftJoin(survey, eq(surveyTransaction.surveyId, survey.id))
    .where(
      and(
        eq(surveyTransaction.panelistId, panelistId),
        eq(surveyTransaction.status, 'completed')
      )
    )
    .orderBy(desc(surveyTransaction.completedAt))
    .limit(limit);

  // Combine and sort activities
  const allActivities = [
    ...pointsActivity.map(activity => ({
      ...activity,
      createdAt: activity.createdAt || new Date()
    })),
    ...surveyActivity.map(activity => ({
      ...activity,
      createdAt: activity.createdAt || new Date()
    }))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return allActivities.slice(0, limit);
}

/**
 * Get available surveys count for a panelist
 */
export async function getAvailableSurveysCount(userId: string) {
  // First get the panelist ID from user ID
  const [panelistData] = await db
    .select({ id: panelist.id })
    .from(panelist)
    .where(eq(panelist.userId, userId))
    .limit(1);

  if (!panelistData) {
    return 0;
  }

  // For now, return a mock count. In a real implementation, you'd check:
  // - Surveys that match the panelist's profile/demographics
  // - Surveys the panelist hasn't completed yet
  // - Surveys that are currently active
  return 5; // Mock data - replace with actual logic
}
