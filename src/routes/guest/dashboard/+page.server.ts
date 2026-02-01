import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '$lib/db/schema';
import { guestSession } from '$lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL!, { schema });

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('guest_session');

	if (!token) {
		throw redirect(302, '/');
	}

	// Verify guest session
	const session = await db.query.guestSession.findFirst({
		where: and(
			eq(guestSession.token, token),
			eq(guestSession.status, 'active'),
			gt(guestSession.expiresAt, new Date())
		)
	});

	if (!session) {
		// Clear invalid cookie
		cookies.delete('guest_session', { path: '/' });
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
