import type { PageServerLoad } from './$types';
import { readManifest } from '$lib/server/artifacts-store';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user as any;
	if (!user || user.userType !== 'admin') throw redirect(302, '/login');
	const items = await readManifest();
	return { items };
};
