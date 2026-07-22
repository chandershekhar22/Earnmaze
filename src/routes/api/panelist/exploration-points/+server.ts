import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { claimExplorationEntries } from '$lib/server/exploration-points.server';
import { Logger } from '$lib/utils/app-logger';

// Lets an already-signed-in panelist claim exploration points earned from a
// section tile mid-session (see ExplorationPointsWatcher), instead of only
// picking them up at register/login. Reuses the same validated claim logic
// as those two flows.
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ success: false, error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
	}
	if (user.userType !== 'panelist') {
		return json({ success: false, error: 'FORBIDDEN', message: 'Panelist access required' }, { status: 403 });
	}

	try {
		const body = await request.json().catch(() => ({}));
		const result = await claimExplorationEntries(user.id, body?.entries);
		return json({ success: true, ...result });
	} catch (error) {
		Logger.root.error({ context: 'points', userId: user.id, error }, 'Failed to claim exploration points');
		return json(
			{ success: false, error: 'CLAIM_FAILED', message: 'Failed to claim exploration points' },
			{ status: 500 }
		);
	}
};
