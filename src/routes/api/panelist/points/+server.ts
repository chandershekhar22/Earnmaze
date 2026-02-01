import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLifetimePoints, getPanelistPoints, getTotalRedeemedPoints } from '$lib/db';
import type { PanelistPointsResponse } from '$lib/types/api-responses';
import { Logger } from '$lib/utils/app-logger';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// User is already authenticated via hooks.server.ts middleware
		const user = locals.user;

		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is a panelist
		if (user.userType !== 'panelist') {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const pointsData = await getPanelistPoints(user.id);
		const lifeTimeEarned = await getLifetimePoints(user.id);
		const redeemedPoints = await getTotalRedeemedPoints(user.id)

		// Construct typed response with only allowed fields
		const response: PanelistPointsResponse = {
			currentBalance: pointsData.currentPoints,
			lifetimeEarned: lifeTimeEarned,
			lifetimeRedeemed: redeemedPoints,
			pendingPoints: pointsData.pendingPoints,
		};

		return json(response);
	} catch (error) {
		Logger.root.error(
			{ context: 'api', error, userId: locals.user?.id },
			'Failed to fetch points data'
		);
		return json({ error: 'Failed to fetch points data' }, { status: 500 });
	}
};
