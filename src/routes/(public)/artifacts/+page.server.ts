import type { PageServerLoad } from './$types';
import { readManifest } from '$lib/server/artifacts-store';
import { getKindStats } from '$lib/server/engagement-store';

export const load: PageServerLoad = async () => {
	const [items, stats] = await Promise.all([readManifest(), getKindStats('artifacts')]);
	// Merge anon-agnostic counts for first paint; per-browser `liked` is
	// hydrated client-side from /api/engagement/artifacts/stats.
	const withStats = items.map((a) => ({
		...a,
		likes: stats[a.id]?.likes ?? 0,
		shares: stats[a.id]?.shares ?? 0,
	}));
	return { items: withStats };
};
