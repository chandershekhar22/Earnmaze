import { eq } from "drizzle-orm";
import { panelistPoint } from "../schema/panelist-points";
import {
  panelistQuality,
  panelistDemographics,
  panelistGeography,
  panelistProfessional,
  panelistLifestyle,
  panelistPreferences,
  panelistTierEnum
} from "../schema/panelist-profile";
import { panelistStats } from "../schema/panelist-stats";
import { panelistProfileCompletion } from "../schema/panelist-extensions";
import { db } from "..";

/**
 * Panelist Tier Repository
 * Handles tier calculations and profile completion tracking
 */

/**
 * Calculate and update panelist tier based on points, surveys, and quality
 * @param panelistId - Panelist ID
 * @returns Updated tier and progress percentage
 */
// export async function updatePanelistTier(panelistId: string) {
//   const [pointsData, qualityData, engagementData] = await Promise.all([
//     db.select().from(panelistPoint).where(eq(panelistPoint.panelistId, panelistId)).limit(1),
//     db.select().from(panelistQuality).where(eq(panelistQuality.panelistId, panelistId)).limit(1),
//     db.select().from(panelistEngagement).where(eq(panelistEngagement.panelistId, panelistId)).limit(1)
//   ]);

//   const points = pointsData.length > 0 ? (pointsData[0].lifetimePoints || 0) : 0;
//   const quality = qualityData.length > 0 ? (qualityData[0].qualityScore || 0) : 0;
//   const surveys = engagementData.length > 0 ? (engagementData[0].completedSurveys || 0) : 0;

//   let newTier = 'bronze';
//   let tierProgress = 0;

//   // Tier thresholds with progressive requirements
//   if (points >= 25000 && surveys >= 250 && quality >= 85) {
//     newTier = 'platinum';
//     tierProgress = 100;
//   } else if (points >= 10000 && surveys >= 100 && quality >= 80) {
//     newTier = 'gold';
//     tierProgress = Math.min(100, ((points - 10000) / 15000) * 100);
//   } else if (points >= 2500 && surveys >= 25 && quality >= 75) {
//     newTier = 'silver';
//     tierProgress = Math.min(100, ((points - 2500) / 7500) * 100);
//   } else {
//     newTier = 'bronze';
//     tierProgress = Math.min(100, (points / 2500) * 100);
//   }

//   await db.update(panelist)
//     .set({ tier: newTier as typeof panelistTierEnum.enumValues[number] })
//     .where(eq(panelist.id, panelistId));

//   return { tier: newTier, tierProgress };
// }

/**
 * Calculate and update profile completion percentage
 * @param panelistId - Panelist ID
 * @returns Completion percentage (0-100)
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
