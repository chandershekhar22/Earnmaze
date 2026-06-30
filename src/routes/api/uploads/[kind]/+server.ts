import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	readUploads,
	addUpload,
	removeUpload,
	saveUploadHtml,
	saveUploadThumb,
	slugify,
	isUploadKind,
	publicHtmlPath,
	markFeaturedToday,
	type UploadCat,
	type UploadTag,
} from '$lib/server/uploads-store';

const BG_BY_CAT: Record<UploadCat, string> = {
	data: 'linear-gradient(135deg,#0a3a2a,#0a1408)',
	lifestyle: 'linear-gradient(135deg,#3a1a5a,#1a0a30)',
	other: 'linear-gradient(135deg,#1a2a5a,#0a1230)',
};
const ICON_BY_CAT: Record<UploadCat, string> = {
	data: 'chart',
	lifestyle: 'fashion',
	other: 'bars',
};

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

function resolveKind(kindParam: string) {
	if (!isUploadKind(kindParam)) throw error(404, 'Unknown kind');
	return kindParam;
}

export const GET: RequestHandler = async ({ params }) => {
	const kind = resolveKind(params.kind!);
	const items = await readUploads(kind);
	return json(items);
};

export const POST: RequestHandler = async ({ request, locals, params }) => {
	requireAdmin(locals);
	const kind = resolveKind(params.kind!);

	const form = await request.formData();
	const title = String(form.get('title') || '').trim();
	const desc = String(form.get('desc') || '').trim();
	const catRaw = String(form.get('cat') || 'other');
	const cat: UploadCat = catRaw === 'data' || catRaw === 'lifestyle' ? catRaw : 'other';
	const trending = form.get('trending') === 'on';
	const isNew = form.get('new') === 'on';
	const featuredToday = form.get('featuredToday') === 'on';
	const file = form.get('file') as File | null;
	const thumbFile = form.get('thumb') as File | null;

	if (!title || !desc) throw error(400, 'Title and description are required');
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
	await saveUploadHtml(kind, id, html);

	let thumbUrl: string | undefined;
	if (thumbFile && thumbExt) {
		const buf = new Uint8Array(await thumbFile.arrayBuffer());
		thumbUrl = await saveUploadThumb(kind, id, buf, thumbExt);
	}

	const tags: UploadTag[] = [];
	if (trending) tags.push('TRENDING');
	if (isNew) tags.push('NEW');

	const minutes = Math.max(2, Math.min(15, Math.round(html.length / 2000)));

	await addUpload(kind, {
		id,
		title,
		desc,
		cat,
		tags,
		readTime: `${minutes} min read`,
		bg: BG_BY_CAT[cat],
		icon: ICON_BY_CAT[cat],
		file: publicHtmlPath(kind, id),
		thumb: thumbUrl,
	});

	if (featuredToday) {
		await markFeaturedToday(kind, id);
	}

	return json({ ok: true, id });
};

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	requireAdmin(locals);
	const kind = resolveKind(params.kind!);
	const body = await request.json().catch(() => ({}));
	const id = String(body?.id || '');
	if (!id) throw error(400, 'id required');
	await markFeaturedToday(kind, id);
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ url, locals, params }) => {
	requireAdmin(locals);
	const kind = resolveKind(params.kind!);
	const id = url.searchParams.get('id');
	if (!id) throw error(400, 'id required');
	await removeUpload(kind, id);
	return json({ ok: true });
};
