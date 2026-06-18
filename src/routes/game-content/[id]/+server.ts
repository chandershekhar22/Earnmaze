import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readGames, readGameHtml } from '$lib/server/games-store';
import { injectPersistence } from '$lib/server/html-inject';

/**
 * Serves an admin-uploaded game's HTML with the state-persistence layer
 * injected (see $lib/server/html-inject). Only applies to uploaded games
 * (single self-contained HTML in /games-uploaded/<id>/) — the static catalog
 * games under /games-repo are multi-file and not part of the upload flow.
 *
 * Same origin as the app, so the iframe can use localStorage for persistence.
 */
export const GET: RequestHandler = async ({ params }) => {
	const games = await readGames();
	if (!games.some((g) => g.id === params.id)) throw error(404, 'Game not found');

	const html = await readGameHtml(params.id);
	if (html == null) throw error(404, 'Game file missing');

	const out = injectPersistence(html, 'game', params.id);
	return new Response(out, {
		headers: {
			'content-type': 'text/html; charset=utf-8',
			'cache-control': 'no-store',
		},
	});
};
