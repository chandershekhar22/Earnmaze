import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isUploadKind, readUploads, readUploadHtml, KIND_META } from '$lib/server/uploads-store';
import { injectPersistence } from '$lib/server/html-inject';

/**
 * Serves an uploaded section item's HTML (streaks / quizzes / weekly-challenges
 * / exclusive-deals) with the state-persistence layer injected
 * (see $lib/server/html-inject). The section viewer iframe points here instead
 * of at the raw static file so every uploaded item gets the helpers.
 *
 * Same origin as the app, so the iframe (sandbox allow-same-origin) can use
 * localStorage for persistence.
 */
export const GET: RequestHandler = async ({ params }) => {
	if (!isUploadKind(params.kind)) throw error(404, 'Unknown section');

	const items = await readUploads(params.kind);
	if (!items.some((a) => a.id === params.id)) throw error(404, 'Item not found');

	const html = await readUploadHtml(params.kind, params.id);
	if (html == null) throw error(404, 'Item file missing');

	const out = injectPersistence(html, KIND_META[params.kind].singular, params.id);
	return new Response(out, {
		headers: {
			'content-type': 'text/html; charset=utf-8',
			'cache-control': 'no-store',
		},
	});
};
