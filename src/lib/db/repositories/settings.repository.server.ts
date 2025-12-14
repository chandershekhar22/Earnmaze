import { eq, sql, inArray } from 'drizzle-orm';
import { db } from '..';
import { appSettings } from '../schema/settings';

/**
 * Settings Repository
 * Handles application settings and configuration management
 */

/**
 * Get a single app setting value by key
 * @param key - Setting key to retrieve
 * @returns Setting value or null if not found
 */
export async function getAppSetting(key: string): Promise<string | null> {
	const result = await db
		.select({ value: appSettings.value })
		.from(appSettings)
		.where(eq(appSettings.key, key))
		.limit(1);
	
	return result[0]?.value || null;
}

/**
 * Get multiple app settings by keys
 * @param keys - Array of setting keys to retrieve
 * @returns Object mapping keys to values (null if not found)
 */
export async function getAppSettings(keys: string[]): Promise<Record<string, string | null>> {
	if (keys.length === 0) return {};

	const results = await db
		.select({ key: appSettings.key, value: appSettings.value })
		.from(appSettings)
		.where(inArray(appSettings.key, keys));
	
	const settings: Record<string, string | null> = {};
	for (const key of keys) {
		const result = results.find(r => r.key === key);
		settings[key] = result?.value || null;
	}
	return settings;
}

/**
 * Get all app settings
 * @returns Object mapping all setting keys to values
 */
export async function getAllAppSettings(): Promise<Record<string, string>> {
	const results = await db
		.select({ key: appSettings.key, value: appSettings.value })
		.from(appSettings);
	
	const settings: Record<string, string> = {};
	for (const result of results) {
		settings[result.key] = result.value;
	}
	return settings;
}

/**
 * Set or update an app setting
 * @param key - Setting key
 * @param value - Setting value
 * @returns Updated setting
 */
export async function setAppSetting(key: string, value: string) {
	const existing = await db
		.select()
		.from(appSettings)
		.where(eq(appSettings.key, key))
		.limit(1);

	if (existing.length > 0) {
		// Update existing
		return await db
			.update(appSettings)
			.set({ value, updatedAt: new Date() })
			.where(eq(appSettings.key, key))
			.returning();
	} else {
		// Insert new
		return await db
			.insert(appSettings)
			.values({ key, value })
			.returning();
	}
}

/**
 * Set multiple app settings at once
 * @param settings - Object mapping keys to values
 */
export async function setAppSettings(settings: Record<string, string>): Promise<void> {
	const keys = Object.keys(settings);
	
	for (const key of keys) {
		await setAppSetting(key, settings[key]);
	}
}

/**
 * Delete an app setting
 * @param key - Setting key to delete
 */
export async function deleteAppSetting(key: string): Promise<void> {
	await db
		.delete(appSettings)
		.where(eq(appSettings.key, key));
}

/**
 * Get app setting as integer
 * @param key - Setting key
 * @param defaultValue - Default value if not found or invalid
 * @returns Integer value or default
 */
export async function getAppSettingAsInt(key: string, defaultValue: number = 0): Promise<number> {
	const value = await getAppSetting(key);
	if (!value) return defaultValue;
	
	const parsed = parseInt(value, 10);
	return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get app setting as boolean
 * @param key - Setting key
 * @param defaultValue - Default value if not found
 * @returns Boolean value or default
 */
export async function getAppSettingAsBoolean(key: string, defaultValue: boolean = false): Promise<boolean> {
	const value = await getAppSetting(key);
	if (!value) return defaultValue;
	
	return value === 'true' || value === '1';
}

/**
 * Get app setting as JSON
 * @param key - Setting key
 * @param defaultValue - Default value if not found or invalid JSON
 * @returns Parsed JSON value or default
 */
export async function getAppSettingAsJson<T = unknown>(key: string, defaultValue: T): Promise<T> {
	const value = await getAppSetting(key);
	if (!value) return defaultValue;
	
	try {
		return JSON.parse(value) as T;
	} catch {
		return defaultValue;
	}
}
