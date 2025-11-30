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
		Logger.points.info('Fetching user points');
		const requestId = API.logRequest('GET', '/api/panelist/points');
		const startTime = performance.now();

		try {
			const response = await fetch('/api/panelist/points');
			const duration = performance.now() - startTime;

			API.logResponse(requestId, response.status, duration);

			if (response.ok) {
				const pointsData = await response.json();
				Logger.points.info('Points fetched successfully', {
					availablePoints: pointsData.availablePoints,
					totalPoints: pointsData.totalPoints
				});
				this.data = pointsData;
				return pointsData;
			} else {
				Logger.points.warn('Failed to fetch points', {
					statusCode: response.status
				});
				// Keep existing data on error
				return null;
			}
		} catch (error) {
			const duration = performance.now() - startTime;
			API.logError(requestId, error as Error, duration);
			Logger.points.error('Points fetch network error', {
				error: error instanceof Error ? error.message : 'Unknown error',
				duration: `${duration}ms`
			});
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
		Logger.points.info('Points updated locally', pointsData);
	}

	// Reset points (useful for logout)
	reset() {
		this.data = {
			totalPoints: 0,
			availablePoints: 0,
			pendingPoints: 0,
			lifetimeEarned: 0
		};
		Logger.points.info('Points reset');
	}
}

export const pointsStore = new PointsStore();