import type { PageServerLoad } from './$types';
import { readGames } from '$lib/server/games-store';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user as any;
	if (!user || user.userType !== 'admin') throw redirect(302, '/login');
	const items = await readGames();
	return { items };
};
