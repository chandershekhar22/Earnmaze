import { requireAdmin } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { getAdminSurveys } from '$lib/db/repositories';
import { Logger } from '$lib/utils/app-logger';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	// Use event.url (a URL instance) instead of new URL(event.request.url) — the
	// destructured form ensures SvelteKit tracks URL changes and re-runs this
	// load on client-side navigations to ?page=N, ?search=..., etc.
	const search = event.url.searchParams.get('search') || '';
	const status = event.url.searchParams.get('status') || 'all';
	const priority = event.url.searchParams.get('priority') || 'all';
	const pageParam = parseInt(event.url.searchParams.get('page') || '1', 10);
	const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
	const limit = 20;

	try {
		const result = await getAdminSurveys({ search, status, priority, page, limit });
		// Include priority in filters so pagination links can preserve it.
		return {
			...result,
			filters: { ...result.filters, priority },
		};
	} catch (error) {
		Logger.root.error({ context: 'admin', error }, 'Failed to load surveys page');
		return {
			surveys: [],
			pagination: { page: 1, limit, total: 0, totalPages: 0 },
			filters: { search, status, priority },
			stats: { totalSurveys: 0, activeSurveys: 0, inactiveSurveys: 0 },
		};
	}
};
