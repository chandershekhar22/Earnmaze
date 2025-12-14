import { json } from '@sveltejs/kit';
import { invalidateSession } from '$lib/db';
import type { RequestHandler } from './$types';
import { Logger } from '$lib/utils/app-logger';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		const sessionId = cookies.get('session');
		
		if (sessionId) {
			await invalidateSession(sessionId);
			Logger.root.info({ context: 'auth', sessionId }, 'Session invalidated on logout');
		}
		else {
			Logger.root.warn({ context: 'auth' }, 'Logout requested without session cookie');
		}

		cookies.delete('session', { path: '/' });
		Logger.root.info({ context: 'auth' }, 'Session cookie cleared');

		return json({ success: true });
	} catch (error) {
		Logger.root.error({ context: 'auth', error }, 'Logout error');
		return json({ success: false, error: 'LOGOUT_FAILED' }, { status: 500 });
	}
};
