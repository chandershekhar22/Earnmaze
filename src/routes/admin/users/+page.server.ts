import { requireAdmin } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { getAdminUsers } from '$lib/db/repositories';
import { obfuscateEmail } from '$lib/utils/obfuscate';
import { Logger } from '$lib/utils/app-logger';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	const search = event.url.searchParams.get('search') || '';
	const userType = event.url.searchParams.get('type') || 'all';
	const page = parseInt(event.url.searchParams.get('page') || '1');
	const limit = 20;

	try {
		const result = await getAdminUsers({ search, userType, page, limit });
		return {
			...result,
			users: result.users.map((u: any) => ({
				...u,
				email: obfuscateEmail(u.email),
			})),
		};
	} catch (error) {
		Logger.root.error({ context: 'admin', error }, 'Failed to load users page');
		return {
			users: [],
			pagination: { page: 1, limit, total: 0, totalPages: 0 },
			filters: { search, userType },
		};
	}
};
