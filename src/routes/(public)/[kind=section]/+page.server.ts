import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { isUploadKind, readUploads, KIND_META } from '$lib/server/uploads-store';

export const load: PageServerLoad = async ({ params }) => {
	if (!isUploadKind(params.kind)) throw error(404, 'Not found');
	const items = await readUploads(params.kind);
	return {
		items,
		kind: params.kind,
		kindLabel: KIND_META[params.kind].label,
		accent: KIND_META[params.kind].accent,
	};
};
