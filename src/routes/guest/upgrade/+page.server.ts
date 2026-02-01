import type { PageServerLoad } from './$types';

/**
 * Guest Upgrade Page Server Load
 * 
 * Allows guests to access upgrade page without requiring an active session
 * (guests can upgrade from earn-money page without a session)
 */
export const load: PageServerLoad = async () => {
	// No auth check needed - guests can access upgrade page
	// They may or may not have an active session
	return {};
};
