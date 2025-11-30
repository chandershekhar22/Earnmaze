import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPanelistPoints } from '$lib/db';
import type { PanelistPointsResponse } from '$lib/types/api-responses';

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

		// Construct typed response with only allowed fields
		const response: PanelistPointsResponse = {
			currentBalance: pointsData.availablePoints,
			lifetimeEarned: pointsData.lifetimeEarned,
			lifetimeRedeemed: 0, // TODO: Add redeemedPoints to response when available
			pendingPoints: pointsData.pendingPoints,
			tier: 'bronze', // TODO: Get tier from panelist data
			nextTierPoints: undefined,
		};

		return json(response);
	} catch (error) {
		console.error('Points API error:', error);
		return json({ error: 'Failed to fetch points data' }, { status: 500 });
	}
};
