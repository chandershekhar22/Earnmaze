import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRecentExplorationTransactions } from '$lib/db';
import { Logger } from '$lib/utils/app-logger';

// Feeds the notification bell on the panelist dashboards with exploration
// points only — today's-tile wins (referenceType 'exploration') and the
// signup welcome bonus (referenceType 'bonus'). Survey-earned points have
// their own activity feed on the Survey dashboard and don't belong here.
export const GET: RequestHandler = async ({ locals }) => {
	try {
		const user = locals.user;

		if (!user) {
			return json({ success: false, error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
		}

		if (user.userType !== 'panelist') {
			return json({ success: false, error: 'FORBIDDEN', message: 'Panelist access required' }, { status: 403 });
		}

		const transactions = await getRecentExplorationTransactions(user.id, 20);

		return json({
			success: true,
			data: transactions.map((tx) => ({
				id: tx.id,
				points: tx.points,
				referenceType: tx.referenceType,
				description: tx.description,
				createdAt: tx.createdAt,
			})),
		});
	} catch (error) {
		Logger.root.error(
			{ context: 'api', error, userId: locals.user?.id },
			'Failed to fetch exploration notifications'
		);
		return json({ success: false, error: 'FETCH_FAILED', message: 'Failed to fetch notifications' }, { status: 500 });
	}
};
