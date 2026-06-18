import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getKindStats, isEngagementKind } from '$lib/server/engagement-store';

/**
 * Bulk stats for every item of a kind, from the calling browser's perspective.
 * `anon_id` is optional — when present, each entry's `liked` flag reflects
 * whether that browser has already liked the item.
 */
export const GET: RequestHandler = async ({ params, url }) => {
	if (!isEngagementKind(params.kind)) throw error(404, 'Unknown kind');
	const anonId = url.searchParams.get('anon_id') ?? '';
	return json(await getKindStats(params.kind, anonId));
};
