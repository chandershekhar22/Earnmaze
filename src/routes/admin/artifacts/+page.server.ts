import type { PageServerLoad } from './$types';
import { readManifest } from '$lib/server/artifacts-store';
import { getKindStats } from '$lib/server/engagement-store';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user as any;
	if (!user || user.userType !== 'admin') throw redirect(302, '/login');
	const [items, stats] = await Promise.all([readManifest(), getKindStats('artifacts')]);
	const withStats = items.map((a) => ({
		...a,
		likes: stats[a.id]?.likes ?? 0,
		shares: stats[a.id]?.shares ?? 0,
	}));
	return { items: withStats };
};
