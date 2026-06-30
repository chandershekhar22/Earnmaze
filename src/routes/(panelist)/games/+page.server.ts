import type { PageServerLoad } from './$types';
import { getLatestGame } from '$lib/server/games-store';

export const load: PageServerLoad = async () => {
	// The most recently uploaded game powers the hero "Today's game" card.
	const todaysGame = await getLatestGame();
	return { todaysGame };
};
