import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPanelistPointsTransactions } from '$lib/db';

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

		const transactions = await getPanelistPointsTransactions(user.id);

		return json(transactions);
	} catch (error) {
		console.error('Transactions API error:', error);
		return json({ error: 'Failed to fetch transactions' }, { status: 500 });
	}
};
