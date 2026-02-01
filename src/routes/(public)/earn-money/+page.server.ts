import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAuthUser } from '$lib/server/auth';
import { validateGuestSession } from '$lib/db/repositories/guest-session.repository.server';
import { Logger } from '$lib/utils/app-logger';

export const load: PageServerLoad = async (event) => {
	// If authenticated panelist, send to dashboard
	const user = await getAuthUser(event);
	if (user?.userType === 'panelist') {
		Logger.root.info({ context: 'auth', userId: user.id }, 'Panelist redirected from earn-money to dashboard');
		throw redirect(303, '/dashboard');
	}

	// If guest session exists and is active, go to guest dashboard
	const guestToken = event.cookies.get('guest_session');
	if (guestToken) {
		const guestSession = await validateGuestSession(guestToken);
		if (guestSession) {
			Logger.root.info({ context: 'auth', guestSessionId: guestSession.id }, 'Guest redirected from earn-money to guest dashboard');
			throw redirect(303, '/guest/dashboard');
		}
	}

	return {};
};
