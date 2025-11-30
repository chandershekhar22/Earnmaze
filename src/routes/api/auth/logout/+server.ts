import { redirect } from '@sveltejs/kit';
import { invalidateSession } from '$lib/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		const sessionId = cookies.get('session');
		
		if (sessionId) {
			await invalidateSession(sessionId);
		}

		cookies.delete('session', { path: '/' });

		// Redirect to home page after logout
		throw redirect(303, '/');
	} catch (error) {
		// If error is a redirect, re-throw it
		if (error instanceof Response) {
			throw error;
		}
		console.error('Logout error:', error);
		// On error, still redirect to home
		throw redirect(303, '/');
	}
};
