import type { PageServerLoad } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import { getDashboardPreference } from '$lib/db/repositories';

export const load: PageServerLoad = async (event) => {
	const user = await requirePanelist(event);
	const pref = await getDashboardPreference(user.id);

	return {
		firstName: user.name?.split(' ')[0] || 'there',
		currentView: pref.dashboardView,
	};
};
