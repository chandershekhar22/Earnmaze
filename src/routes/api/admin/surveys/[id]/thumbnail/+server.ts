import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { getSurveyById, updateSurveyAdmin } from '$lib/db/repositories';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Logger } from '$lib/utils/app-logger';

const ALLOWED_MIME: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/jpg': 'jpg',
	'image/webp': 'webp',
	'image/gif': 'gif',
};

export const POST: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);
	const surveyId = event.params.id;

	if (!surveyId) {
		return json({ success: false, message: 'Invalid survey ID' }, { status: 400 });
	}

	const existing = await getSurveyById(surveyId, true, false);
	if (!existing) {
		return json({ success: false, message: 'Survey not found' }, { status: 404 });
	}

	try {
		const form = await event.request.formData();
		const file = form.get('file') as File | null;

		if (!file || !(file instanceof File)) {
			return json({ success: false, message: 'No file provided' }, { status: 400 });
		}

		const ext = ALLOWED_MIME[file.type];
		if (!ext) {
			return json({ success: false, message: 'Unsupported file type. Use PNG, JPG, WEBP, or GIF.' }, { status: 400 });
		}

		if (file.size > 2 * 1024 * 1024) {
			return json({ success: false, message: 'File too large (max 2 MB)' }, { status: 400 });
		}

		const dir = path.join(process.cwd(), 'static', 'surveys-uploaded', surveyId);
		await fs.mkdir(dir, { recursive: true });

		const filename = `thumb.${ext}`;
		const bytes = new Uint8Array(await file.arrayBuffer());
		await fs.writeFile(path.join(dir, filename), bytes);

		const thumbnailUrl = `/surveys-uploaded/${surveyId}/${filename}`;
		await updateSurveyAdmin(surveyId, { thumbnailUrl }, admin.id);

		return json({ success: true, thumbnailUrl });
	} catch (error) {
		Logger.root.error({ context: 'admin', error, surveyId }, 'Failed to upload survey thumbnail');
		return json({ success: false, message: 'Upload failed' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async (event) => {
	const admin = await requireAdmin(event);
	const surveyId = event.params.id;

	if (!surveyId) {
		return json({ success: false, message: 'Invalid survey ID' }, { status: 400 });
	}

	try {
		const dir = path.join(process.cwd(), 'static', 'surveys-uploaded', surveyId);
		await fs.rm(dir, { recursive: true, force: true });
		await updateSurveyAdmin(surveyId, { thumbnailUrl: null }, admin.id);
		return json({ success: true });
	} catch (error) {
		Logger.root.error({ context: 'admin', error, surveyId }, 'Failed to delete survey thumbnail');
		return json({ success: false, message: 'Delete failed' }, { status: 500 });
	}
};
