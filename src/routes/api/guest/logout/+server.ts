import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GuestLogoutResponse } from '$types/guest-session';
import { invalidateGuestSession } from '$lib/db';
import { Logger } from '$lib/utils/app-logger';

/**
 * Guest Logout API
 * 
 * Invalidates guest session and clears the cookie.
 */
export const POST: RequestHandler = async ({ cookies }) => {
	try {
		const token = cookies.get('guest_session');

		if (token) {
			await invalidateGuestSession(token);
			Logger.root.info({ context: 'auth' }, 'Guest session invalidated');
		}

		// Clear guest session cookie
		cookies.delete('guest_session', { path: '/' });

		return json({
			success: true,
			message: 'Guest session ended',
		} satisfies GuestLogoutResponse);
	} catch (error) {
		Logger.root.error({ context: 'errors', error }, 'Guest logout error');
		return json(
			{ success: false, message: 'Failed to end guest session' } satisfies GuestLogoutResponse,
			{ status: 500 }
		);
	}
};
