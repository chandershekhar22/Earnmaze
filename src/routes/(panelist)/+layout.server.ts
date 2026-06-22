import type { LayoutServerLoad } from './$types';
import { getDashboardPreference } from '$lib/db/repositories';

/**
 * Expose the panelist's saved dashboard view so shared pages (points, rewards,
 * referrals, …) keep showing the right sidebar instead of falling back to the
 * surveys nav. Only panelists have a preference; others default to surveys.
 */
export const load: LayoutServerLoad = async (event) => {
	const user = event.locals.user;

	let dashboardView: 'surveys' | 'discover' = 'surveys';
	if (user && user.userType === 'panelist') {
		const pref = await getDashboardPreference(user.id);
		dashboardView = pref.dashboardView === 'discover' ? 'discover' : 'surveys';
	}

	return { dashboardView };
};
