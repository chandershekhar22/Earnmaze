import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GuestDashboardResponse } from '$types/guest-session';
import { getAllAvailableSurveys } from '$lib/db';
import { Logger } from '$lib/utils/app-logger';

/**
 * Guest Dashboard API
 * 
 * Returns limited dashboard data for guest sessions:
 * - Available surveys
 * - Session-specific points (not lifetime)
 * - Basic tracking for current session only
 */
export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = locals.guestSession;

		if (!session) {
			return json(
				{ success: false, error: 'NO_SESSION', message: 'No guest session found' },
				{ status: 401 }
			);
		}

		// Fetch available surveys using repository
		const availableSurveys = await getAllAvailableSurveys(20);

		Logger.root.info({ context: 'api', sessionId: session.id, email: session.email }, 'Guest dashboard accessed');

		return json({
			success: true,
			data: {
				sessionPoints: session.sessionPoints || 0,
				surveysViewed: session.surveysViewed || 0,
				surveysCompleted: session.surveysCompleted || 0,
				expiresAt: session.expiresAt.toISOString(),
				availableSurveys: availableSurveys.map((s) => ({
					id: s.id,
					title: s.title,
					description: s.description,
					points: s.points,
					link: s.link
				}))
			}
		});
	} catch (error) {
		Logger.root.error({ context: 'api', error }, 'Guest dashboard error');
		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: 'Failed to load dashboard' },
			{ status: 500 }
		);
	}
};
