import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readManifest, readArtifactHtml } from '$lib/server/artifacts-store';
import { injectPersistence } from '$lib/server/html-inject';

/**
 * Serves an uploaded artifact's HTML with the state-persistence layer injected
 * (see $lib/server/html-inject). The artifact viewer iframe points here
 * instead of at the raw static file so every artifact gets the helpers.
 *
 * Same origin as the app, so the iframe (sandbox allow-same-origin) can use
 * localStorage for persistence.
 */
export const GET: RequestHandler = async ({ params }) => {
	const items = await readManifest();
	if (!items.some((a) => a.id === params.id)) throw error(404, 'Artifact not found');

	const html = await readArtifactHtml(params.id);
	if (html == null) throw error(404, 'Artifact file missing');

	const out = injectPersistence(html, 'artifact', params.id);
	return new Response(out, {
		headers: {
			'content-type': 'text/html; charset=utf-8',
			// Always re-serve so the injected layer is current; the artifact's own
			// state lives in localStorage, not the document.
			'cache-control': 'no-store',
		},
	});
};
