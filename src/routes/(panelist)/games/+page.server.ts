import type { PageServerLoad } from './$types';
import { getLatestGame } from '$lib/server/games-store';

export const load: PageServerLoad = async ({ locals }) => {
	// The most recently uploaded game powers the hero "Today's game" card.
	const todaysGame = await getLatestGame();
	return {
		todaysGame,
		// Server-known auth state, so the nav can hide Log in/Sign up on the
		// very first render instead of waiting for the client checkAuth() call.
		isLoggedIn: !!locals.user,
	};
};
