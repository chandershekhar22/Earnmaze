import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { isUploadKind, readUploads, KIND_META } from '$lib/server/uploads-store';

export const load: PageServerLoad = async ({ params }) => {
	if (!isUploadKind(params.kind)) throw error(404, 'Not found');
	const items = await readUploads(params.kind);
	const item = items.find((a) => a.id === params.id);
	if (!item) throw error(404, 'Item not found');
	return { item, kind: params.kind, kindLabel: KIND_META[params.kind].label };
};
