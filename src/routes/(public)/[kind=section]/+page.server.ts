import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { isUploadKind, readUploads, KIND_META } from '$lib/server/uploads-store';
import { getKindStats } from '$lib/server/engagement-store';

export const load: PageServerLoad = async ({ params }) => {
	if (!isUploadKind(params.kind)) throw error(404, 'Not found');
	const [items, stats] = await Promise.all([
		readUploads(params.kind),
		getKindStats(params.kind),
	]);
	const withStats = items.map((a) => ({
		...a,
		likes: stats[a.id]?.likes ?? 0,
		shares: stats[a.id]?.shares ?? 0,
	}));
	const featured = withStats.find((a) => a.featuredToday) ?? null;
	return {
		items: withStats,
		kind: params.kind,
		kindLabel: KIND_META[params.kind].label,
		kindSingular: KIND_META[params.kind].singular,
		accent: KIND_META[params.kind].accent,
		featured,
	};
};
