import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { isUploadKind, readUploads, KIND_META } from '$lib/server/uploads-store';
import { getKindStats } from '$lib/server/engagement-store';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = locals.user as any;
	if (!user || user.userType !== 'admin') throw redirect(302, '/login');
	if (!isUploadKind(params.kind)) throw error(404, 'Unknown section');
	const [items, stats] = await Promise.all([
		readUploads(params.kind),
		getKindStats(params.kind),
	]);
	const withStats = items.map((a) => ({
		...a,
		likes: stats[a.id]?.likes ?? 0,
		shares: stats[a.id]?.shares ?? 0,
	}));
	return {
		items: withStats,
		kind: params.kind,
		kindLabel: KIND_META[params.kind].label,
		kindSingular: KIND_META[params.kind].singular,
	};
};
