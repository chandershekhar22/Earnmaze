import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Logger } from '$lib/utils/app-logger';
import { getConversionAnalytics } from '$lib/db/repositories';
import { requireAdmin } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
	// Require admin authentication
	await requireAdmin(event);

	try {
		const dateFrom = event.url.searchParams.get('from') ?? undefined;
		const dateTo = event.url.searchParams.get('to') ?? undefined;

		const analytics = await getConversionAnalytics(dateFrom, dateTo);

		return json(analytics);
	} catch (error) {
		Logger.root.error({ context: 'analytics', error }, 'Error fetching analytics');
		return json({ error: 'Failed to fetch analytics' }, { status: 500 });
	}
};