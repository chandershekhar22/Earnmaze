import { requireAdmin } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { getAdminRewards } from '$lib/db/repositories';
import { Logger } from '$lib/utils/app-logger';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	const url = new URL(event.request.url);
	const search = url.searchParams.get('search') || '';
	const status = url.searchParams.get('status') || 'all';
	const type = url.searchParams.get('type') || 'all';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;

	try {
		return await getAdminRewards({ search, status, type, page, limit });
	} catch (error) {
		Logger.root.error({ context: 'admin', error }, 'Failed to load rewards page');
		return {
			rewards: [],
			pagination: { page: 1, limit, total: 0, totalPages: 0 },
			filters: { search, status, type },
			stats: { totalRewards: 0, activeRewards: 0, featuredRewards: 0, outOfStock: 0 },
		};
	}
};
