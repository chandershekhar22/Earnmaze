import type { PageServerLoad } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import { getPanelistPoints } from '$lib/db';
import { getPointsSummary } from '$lib/db/repositories/panelist-points-aggregations.repository.server';
import { getPanelistPointsTransactions } from '$lib/db/repositories/panelist-points.repository.server';

export const load: PageServerLoad = async (event) => {
	const user = await requirePanelist(event);

	const [pointsRaw, summary, transactions] = await Promise.all([
		getPanelistPoints(user.id),
		getPointsSummary(user.id),
		getPanelistPointsTransactions(user.id),
	]);

	const pointsData = {
		availablePoints: pointsRaw?.currentPoints ?? 0,
		lifetimeEarned: summary.lifetimePoints,
		lifetimeRedeemed: summary.redeemedPoints,
	};

	return { pointsData, transactions };
};
