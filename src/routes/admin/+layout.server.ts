import { requireAdmin, type AuthUser } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load = (async (event) => {
	// Require admin authentication
	const user = await requireAdmin(event);
	
	return {
		user
	};
}) satisfies LayoutServerLoad;
