import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { toggleLike, isEngagementKind } from '$lib/server/engagement-store';

export const POST: RequestHandler = async ({ params, request }) => {
	if (!isEngagementKind(params.kind)) throw error(404, 'Unknown kind');
	const { anon_id } = (await request.json().catch(() => ({}))) as { anon_id?: string };
	if (!anon_id) throw error(400, 'anon_id required');
	return json(await toggleLike(params.kind, params.id, anon_id));
};
