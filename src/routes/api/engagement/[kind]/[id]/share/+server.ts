import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addShare, isEngagementKind } from '$lib/server/engagement-store';

const CHANNELS = new Set(['copy', 'twitter', 'whatsapp', 'facebook', 'native', 'other']);

export const POST: RequestHandler = async ({ params, request }) => {
	if (!isEngagementKind(params.kind)) throw error(404, 'Unknown kind');
	const { anon_id, channel } = (await request.json().catch(() => ({}))) as {
		anon_id?: string;
		channel?: string;
	};
	const ch = CHANNELS.has(String(channel)) ? String(channel) : 'other';
	return json(await addShare(params.kind, params.id, ch, anon_id ?? ''));
};
