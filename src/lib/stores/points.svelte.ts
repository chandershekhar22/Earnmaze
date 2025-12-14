import { Logger, API } from '$lib/utils/app-logger';

export interface PointsData {
	totalPoints: number;
	availablePoints: number;
	pendingPoints: number;
	lifetimeEarned: number;
}

class PointsStore {
	data = $state<PointsData>({
		totalPoints: 0,
		availablePoints: 0,
		pendingPoints: 0,
		lifetimeEarned: 0
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
				Logger.root.info({ context: 'points', availablePoints: pointsData.availablePoints, totalPoints: pointsData.totalPoints }, 'Points fetched successfully');
				this.data = pointsData;
				return pointsData;
			} else {
				Logger.root.warn({ context: 'points', statusCode: response.status }, 'Failed to fetch points');
				// Keep existing data on error
				return null;
			}
		} catch (error) {
			const duration = performance.now() - startTime;
			API.error(requestId, error as Error, duration);
			Logger.root.error({ context: 'errors', error: error instanceof Error ? error.message : 'Unknown error', duration: `${duration}ms` }, 'Points fetch network error');
			// Keep existing data on error
			return null;
		}
	}

	// Update points after a transaction
	updatePoints(pointsData: Partial<PointsData>) {
		this.data = {
			...this.data,
			...pointsData
		};
		Logger.root.info({ context: 'points', ...pointsData }, 'Points updated locally');
	}

	// Reset points (useful for logout)
	reset() {
		this.data = {
			totalPoints: 0,
			availablePoints: 0,
			pendingPoints: 0,
			lifetimeEarned: 0
		};
		Logger.root.info({ context: 'points' }, 'Points reset');
	}
}

export const pointsStore = new PointsStore();