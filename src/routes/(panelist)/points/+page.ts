import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const [pointsResponse, transactionsResponse] = await Promise.all([
		fetch('/api/panelist/points'),
		fetch('/api/panelist/transactions')
	]);

	const pointsData = pointsResponse.ok ? await pointsResponse.json() : {
		totalPoints: 0,
		availablePoints: 0,
		pendingPoints: 0,
		lifetimeEarned: 0
	};

	const transactions = transactionsResponse.ok ? await transactionsResponse.json() : [];

	return {
		pointsData,
		transactions
	};
};