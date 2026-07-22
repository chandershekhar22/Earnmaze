import type { PageServerLoad } from './$types';
import { getLatestGame } from '$lib/server/games-store';
import { getPointsSummaryByBucket } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	// The most recently uploaded game powers the hero "Today's game" card.
	const [todaysGame, explorationPoints] = await Promise.all([
		getLatestGame(),
		locals.user
			? getPointsSummaryByBucket(locals.user.id, 'exploration').then((s) => s.currentPoints)
			: Promise.resolve(0),
	]);
	return {
		todaysGame,
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
