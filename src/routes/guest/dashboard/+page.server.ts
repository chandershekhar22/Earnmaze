import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.guestSession;

	if (!session) {
		throw redirect(302, '/');
	}

	// Return session data
	return {
		session: {
			id: session.id,
			email: session.email,
			sessionPoints: session.sessionPoints || 0,
			surveysViewed: session.surveysViewed || 0,
			surveysCompleted: session.surveysCompleted || 0,
			expiresAt: session.expiresAt.toISOString()
		}
	};
};
