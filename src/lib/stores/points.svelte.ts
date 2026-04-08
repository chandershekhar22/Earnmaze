import { Logger, API } from '$lib/utils/app-logger';

export interface PointsData {
	currentBalance: number;
	lifetimeEarned: number;
	lifetimeRedeemed: number;
}

class PointsStore {
	data = $state<PointsData>({
		currentBalance: 0,
		lifetimeEarned: 0,
		lifetimeRedeemed: 0
	});

	async fetchPoints() {
		Logger.root.info({ context: 'points' }, 'Fetching user points');
		const requestId = API.request('GET', '/api/panelist/points');
		const startTime = performance.now();

		try {
			const response = await fetch('/api/panelist/points');
			const duration = performance.now() - startTime;

			API.response(requestId, response.status, duration);

			if (response.ok) {
				const pointsData = await response.json();
				Logger.root.info({ context: 'points', currentBalance: pointsData.currentBalance }, 'Points fetched successfully');
				this.data = pointsData;
				return pointsData;
			} else {
				Logger.root.warn({ context: 'points', statusCode: response.status }, 'Failed to fetch points');
				return null;
			}
		} catch (error) {
			const duration = performance.now() - startTime;
			API.error(requestId, error as Error, duration);
			Logger.root.error({ context: 'errors', error: error instanceof Error ? error.message : 'Unknown error', duration: `${duration}ms` }, 'Points fetch network error');
			return null;
		}
	}

	updatePoints(pointsData: Partial<PointsData>) {
		this.data = {
			...this.data,
			...pointsData
		};
		Logger.root.info({ context: 'points', ...pointsData }, 'Points updated locally');
	}

	reset() {
		this.data = {
			currentBalance: 0,
			lifetimeEarned: 0,
			lifetimeRedeemed: 0
		};
		Logger.root.info({ context: 'points' }, 'Points reset');
	}
}

export const pointsStore = new PointsStore();
