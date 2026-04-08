import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllAppSettings, setAppSetting } from '$lib/db/repositories';
import { requireAdmin } from '$lib/server/auth';
import { Logger } from '$lib/utils/app-logger';
import { adminSettingsSchema } from '$lib/validation/api-schemas';
import { z } from 'zod';

export const GET: RequestHandler = async (event) => {
	await requireAdmin(event);

	try {
		const settingsObj = await getAllAppSettings();
		return json({ success: true, settings: settingsObj });
	} catch (error) {
		Logger.root.error({ context: 'api', error }, 'Failed to fetch settings');
		return json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
	}
};

export const POST: RequestHandler = async (event) => {
	await requireAdmin(event);

	try {
		const body = await event.request.json();
		const validated = adminSettingsSchema.parse(body);

		await setAppSetting(validated.key, validated.value);

		return json({ success: true });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return json({ success: false, error: error.issues[0]?.message || 'Invalid input' }, { status: 400 });
		}
		Logger.root.error({ context: 'api', error }, 'Failed to save setting');
		return json({ success: false, error: 'Failed to save setting' }, { status: 500 });
	}
};
