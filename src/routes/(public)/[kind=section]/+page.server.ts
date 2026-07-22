import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { isUploadKind, readUploads, KIND_META } from '$lib/server/uploads-store';
import { getKindStats } from '$lib/server/engagement-store';
import { getPointsSummaryByBucket } from '$lib/db';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!isUploadKind(params.kind)) throw error(404, 'Not found');
	const [items, stats, explorationPoints] = await Promise.all([
		readUploads(params.kind),
		getKindStats(params.kind),
		locals.user
			? getPointsSummaryByBucket(locals.user.id, 'exploration').then((s) => s.currentPoints)
			: Promise.resolve(0),
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
		// Server-known auth state, so the nav can hide Log in/Sign up on the
		// very first render instead of waiting for the client checkAuth() call.
		isLoggedIn: !!locals.user,
		// Anyone not signed into a full account sees this instead of the
		// decorative marketing number — 0 for a plain anonymous visitor, or
		// their real balance if they have a guest email-capture session.
		guestPoints: locals.guestSession?.sessionPoints ?? 0,
		// A signed-in panelist's real exploration-points wallet total (same
		// bucket as the Discover dashboard — see getPointsSummaryByBucket),
		// so the nav pill shows their actual balance instead of a fixed number.
		explorationPoints,
	};
};
