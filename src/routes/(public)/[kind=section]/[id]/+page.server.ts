import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { isUploadKind, readUploads, KIND_META } from '$lib/server/uploads-store';
import { getItemStats } from '$lib/server/engagement-store';

export const load: PageServerLoad = async ({ params }) => {
	if (!isUploadKind(params.kind)) throw error(404, 'Not found');
	const items = await readUploads(params.kind);
	const item = items.find((a) => a.id === params.id);
	if (!item) throw error(404, 'Item not found');
	const stats = await getItemStats(params.kind, params.id);
	return { item, stats, kind: params.kind, kindLabel: KIND_META[params.kind].label };
};
