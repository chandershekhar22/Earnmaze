import { requireAdmin } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { getConsentStats } from '$lib/db/repositories/consent-stats.repository.server';
import { Logger } from '$lib/utils/app-logger';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);

	try {
		const stats = await getConsentStats();
		return { stats };
	} catch (error) {
		Logger.root.error({ context: 'admin', error }, 'Failed to load consent stats');
		return {
			stats: {
				totals: {
					activeUsers: 0,
					marketingOptedIn: 0,
					marketingOptedInPercent: 0,
					surveyDataSharingAccepted: 0,
					surveyDataSharingPercent: 0,
					ageVerified: 0,
					tosAccepted: 0,
				},
				recent: {
					marketingGrantedLast24h: 0,
					marketingRevokedLast24h: 0,
					marketingGrantedLast7d: 0,
					marketingRevokedLast7d: 0,
				},
				bySource: [],
				dailyLast30d: [],
				recentEvents: [],
			},
		};
	}
};
