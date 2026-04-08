import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPanelistPoints } from '$lib/db';
import { getPointsSummary } from '$lib/db/repositories/panelist-points-aggregations.repository.server';
import type { PanelistPointsResponse } from '$lib/types/api-responses';
import { Logger } from '$lib/utils/app-logger';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// User is already authenticated via hooks.server.ts middleware
		const user = locals.user;

		if (!user) {
			return json({ success: false, error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
		}

		if (user.userType !== 'panelist') {
			return json({ success: false, error: 'FORBIDDEN', message: 'Panelist access required' }, { status: 403 });
		}

		const [pointsData, summary] = await Promise.all([
			getPanelistPoints(user.id),
			getPointsSummary(user.id),
		]);

		const response: PanelistPointsResponse = {
			currentBalance: pointsData?.currentPoints ?? 0,
			lifetimeEarned: summary.lifetimePoints,
			lifetimeRedeemed: summary.redeemedPoints,
		};

		return json({ success: true, data: response });
	} catch (error) {
		Logger.root.error(
			{ context: 'api', error, userId: locals.user?.id },
			'Failed to fetch points data'
		);
		return json({ success: false, error: 'FETCH_FAILED', message: 'Failed to fetch points data' }, { status: 500 });
	}
};
