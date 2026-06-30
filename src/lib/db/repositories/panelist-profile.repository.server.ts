/**
 * Panelist Profile Repository
 * Database operations for panelist profile data (demographics, geography, professional, preferences)
 */

import { db } from '..';
import { user as userTable } from '../schema/auth';
import {
	panelistDemographics,
	panelistGeography,
	panelistProfessional,
	panelistPreferences,
} from '../schema/panelist-profile';
import { eq } from 'drizzle-orm';

/**
 * Get all profile data for a panelist (parallel fetch)
 */
export async function getPanelistProfile(panelistId: string) {
	const [userData, demographics, geography, professional, preferences] = await Promise.all([
		db
			.select({ name: userTable.name, email: userTable.email })
			.from(userTable)
			.where(eq(userTable.id, panelistId))
			.limit(1)
			.then((r) => r[0] ?? null),
		db
			.select()
			.from(panelistDemographics)
			.where(eq(panelistDemographics.panelistId, panelistId))
			.limit(1)
			.then((r) => r[0] ?? null),
		db
			.select()
			.from(panelistGeography)
			.where(eq(panelistGeography.panelistId, panelistId))
			.limit(1)
			.then((r) => r[0] ?? null),
		db
			.select()
			.from(panelistProfessional)
			.where(eq(panelistProfessional.panelistId, panelistId))
			.limit(1)
			.then((r) => r[0] ?? null),
		db
			.select()
			.from(panelistPreferences)
			.where(eq(panelistPreferences.panelistId, panelistId))
			.limit(1)
			.then((r) => r[0] ?? null),
	]);

	return { userData, demographics, geography, professional, preferences };
}

export type DashboardView = 'surveys' | 'discover';

export type DashboardPreference = {
	dashboardView: DashboardView;
	dashboardOnboarded: boolean;
};

/**
 * Get a panelist's dashboard view preference. Falls back to defaults
 * (surveys view, not yet onboarded) when no preferences row exists.
 */
export async function getDashboardPreference(panelistId: string): Promise<DashboardPreference> {
	const row = await db
		.select({
			dashboardView: panelistPreferences.dashboardView,
			dashboardOnboarded: panelistPreferences.dashboardOnboarded,
		})
		.from(panelistPreferences)
		.where(eq(panelistPreferences.panelistId, panelistId))
		.limit(1)
		.then((r) => r[0] ?? null);

	return {
		dashboardView: (row?.dashboardView as DashboardView) ?? 'surveys',
		dashboardOnboarded: row?.dashboardOnboarded ?? false,
	};
}

/**
 * Persist a panelist's dashboard view preference. Upserts the preferences row
 * so it works even before the panelist has any other preferences saved.
 */
export async function setDashboardPreference(
	panelistId: string,
	data: { dashboardView?: DashboardView; dashboardOnboarded?: boolean }
): Promise<void> {
	const set: Record<string, unknown> = { updatedBy: panelistId };
	if (data.dashboardView !== undefined) set.dashboardView = data.dashboardView;
	if (data.dashboardOnboarded !== undefined) set.dashboardOnboarded = data.dashboardOnboarded;

	await db
		.insert(panelistPreferences)
		.values({
			panelistId,
			dashboardView: data.dashboardView ?? 'surveys',
			dashboardOnboarded: data.dashboardOnboarded ?? false,
			updatedBy: panelistId,
		})
		.onConflictDoUpdate({
			target: panelistPreferences.panelistId,
			set,
		});
}

export type ProfileUpdateData = {
	name?: string;
	demographics?: {
		gender?: string;
		country?: string;
		education?: string;
		employment?: string;
		income?: string;
	};
	preferences?: {
		emailNotifications?: boolean;
		smsNotifications?: boolean;
		surveyCategories?: string[];
	};
};

/**
 * Update panelist profile data in a single transaction
 */
export async function updatePanelistProfile(
	panelistId: string,
	data: ProfileUpdateData
): Promise<void> {
	await db.transaction(async (tx) => {
		// Update user name
		if (data.name !== undefined) {
			await tx
				.update(userTable)
				.set({ name: data.name, updatedAt: new Date() })
				.where(eq(userTable.id, panelistId));
		}

		// Upsert demographics, geography, professional
		if (data.demographics) {
			const demo = data.demographics;

			await tx
				.insert(panelistDemographics)
				.values({ panelistId, gender: demo.gender || null, updatedBy: panelistId })
				.onConflictDoUpdate({
					target: panelistDemographics.panelistId,
					set: { gender: demo.gender || null, updatedBy: panelistId },
				});

			await tx
				.insert(panelistGeography)
				.values({ panelistId, country: demo.country || null, updatedBy: panelistId })
				.onConflictDoUpdate({
					target: panelistGeography.panelistId,
					set: { country: demo.country || null, updatedBy: panelistId },
				});

			await tx
				.insert(panelistProfessional)
				.values({
					panelistId,
					education: demo.education || null,
					employment: demo.employment || null,
					income: demo.income || null,
					updatedBy: panelistId,
				})
				.onConflictDoUpdate({
					target: panelistProfessional.panelistId,
					set: {
						education: demo.education || null,
						employment: demo.employment || null,
						income: demo.income || null,
						updatedBy: panelistId,
					},
				});
		}

		// Upsert preferences
		if (data.preferences) {
			const prefs = data.preferences;
			const channels: string[] = [];
			if (prefs.emailNotifications) channels.push('email');
			if (prefs.smsNotifications) channels.push('sms');

			await tx
				.insert(panelistPreferences)
				.values({
					panelistId,
					notificationOptIn: prefs.emailNotifications ?? true,
					notificationChannels: channels,
					surveyTopicsInterest: prefs.surveyCategories ?? [],
					updatedBy: panelistId,
				})
				.onConflictDoUpdate({
					target: panelistPreferences.panelistId,
					set: {
						notificationOptIn: prefs.emailNotifications ?? true,
						notificationChannels: channels,
						surveyTopicsInterest: prefs.surveyCategories ?? [],
						updatedBy: panelistId,
					},
				});
		}
	});
}
