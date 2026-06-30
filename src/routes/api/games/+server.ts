import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	readGames,
	addGame,
	removeGame,
	saveGameHtml,
	saveGameThumb,
	slugify,
} from '$lib/server/games-store';

const THUMB_MIME_EXT: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/jpg': 'jpg',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'image/svg+xml': 'svg',
};

function requireAdmin(locals: App.Locals) {
	const user = locals.user as any;
	if (!user) throw error(401, 'Not authenticated');
	if (user.userType !== 'admin') throw error(403, 'Admin only');
}

export const GET: RequestHandler = async () => {
	const items = await readGames();
	return json(items);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	requireAdmin(locals);

	const form = await request.formData();
	const title = String(form.get('title') || '').trim();
	const file = form.get('file') as File | null;
	const thumbFile = form.get('thumb') as File | null;

	if (!title) throw error(400, 'Title is required');
	if (!file || !(file instanceof File)) throw error(400, 'HTML file is required');
	const fname = file.name.toLowerCase();
	if (!fname.endsWith('.html') && !fname.endsWith('.htm'))
		throw error(400, 'Only .html files are allowed');
	if (file.size > 5 * 1024 * 1024) throw error(400, 'File too large (max 5 MB)');

	let thumbExt: string | null = null;
	if (thumbFile && thumbFile instanceof File && thumbFile.size > 0) {
		thumbExt = THUMB_MIME_EXT[thumbFile.type] ?? null;
		if (!thumbExt) throw error(400, 'Thumbnail must be PNG, JPG, WEBP, GIF or SVG');
		if (thumbFile.size > 2 * 1024 * 1024) throw error(400, 'Thumbnail too large (max 2 MB)');
	}

	const id = `${slugify(title)}-${Date.now().toString(36)}`;
	const html = await file.text();
	await saveGameHtml(id, html);

	let thumbUrl: string | undefined;
	if (thumbFile && thumbExt) {
		const buf = new Uint8Array(await thumbFile.arrayBuffer());
		thumbUrl = await saveGameThumb(id, buf, thumbExt);
	}

	await addGame({
		id,
		title,
		file: `/games-uploaded/${id}/index.html`,
		thumb: thumbUrl,
	});

	return json({ ok: true, id });
};

export const DELETE: RequestHandler = async ({ url, locals }) => {
	requireAdmin(locals);
	const id = url.searchParams.get('id');
	if (!id) throw error(400, 'id required');
	await removeGame(id);
	return json({ ok: true });
};
