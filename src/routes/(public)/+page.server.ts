import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		// Server-known auth state, so the nav renders correctly on first paint.
		isLoggedIn: !!locals.user,
		// Anyone not signed into a full account sees this instead of the
		// decorative marketing number — 0 for a plain anonymous visitor, or
		// their real balance if they have a guest email-capture session.
		guestPoints: locals.guestSession?.sessionPoints ?? 0,
	};
};
