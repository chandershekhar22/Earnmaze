import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { appSettings } from '$lib/db/schema/settings';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '$lib/server/auth';
import { Logger } from '$lib/utils/app-logger';

export const GET: RequestHandler = async (event) => {
	await requireAdmin(event);
	
	try {
		const settings = await db
			.select()
			.from(appSettings);
		
		// Convert to key-value object
		const settingsObj = settings.reduce((acc, setting) => {
			acc[setting.key] = setting.value;
			return acc;
		}, {} as Record<string, string>);
		
		return json({ success: true, settings: settingsObj });
	} catch (error) {
		Logger.root.error({ context: 'api', error }, 'Failed to fetch settings');
		return json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
	}
};

export const POST: RequestHandler = async (event) => {
	await requireAdmin(event);
	
	try {
		const { key, value, description } = await event.request.json();
		
		if (!key || value === undefined) {
			return json({ success: false, error: 'Key and value are required' }, { status: 400 });
		}
		
		// Upsert setting
		await db
			.insert(appSettings)
			.values({
				key,
				value,
				description: description || null,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: appSettings.key,
				set: {
					value,
					description: description || null,
					updatedAt: new Date(),
				},
			});
		
		return json({ success: true });
	} catch (error) {
		Logger.root.error({ context: 'api', error }, 'Failed to save setting');
		return json({ success: false, error: 'Failed to save setting' }, { status: 500 });
	}
};
