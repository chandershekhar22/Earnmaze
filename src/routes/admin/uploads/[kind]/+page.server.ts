import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { isUploadKind, readUploads, KIND_META } from '$lib/server/uploads-store';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = locals.user as any;
	if (!user || user.userType !== 'admin') throw redirect(302, '/login');
	if (!isUploadKind(params.kind)) throw error(404, 'Unknown section');
	const items = await readUploads(params.kind);
	return { items, kind: params.kind, kindLabel: KIND_META[params.kind].label };
};
