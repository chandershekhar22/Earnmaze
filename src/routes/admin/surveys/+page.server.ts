import { requireAdmin } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { getAdminSurveys } from '$lib/db/repositories';
import { Logger } from '$lib/utils/app-logger';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	const url = new URL(event.request.url);
	const search = url.searchParams.get('search') || '';
	const status = url.searchParams.get('status') || 'all';
	const priority = url.searchParams.get('priority') || 'all';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;

	try {
		return await getAdminSurveys({ search, status, priority, page, limit });
	} catch (error) {
		Logger.root.error({ context: 'admin', error }, 'Failed to load surveys page');
		return {
			surveys: [],
			pagination: { page: 1, limit, total: 0, totalPages: 0 },
			filters: { search, status },
			stats: { totalSurveys: 0, activeSurveys: 0, inactiveSurveys: 0 },
		};
	}
};
