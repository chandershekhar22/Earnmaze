import { Logger } from '$lib/utils/app-logger';

interface GuestDashboardData {
	email: string;
	sessionPoints: number;
	surveysViewed: number;
	surveysCompleted: number;
	expiresAt: string;
	availableSurveys: Array<{
		id: string;
		title: string;
		description: string | null;
		category: string | null;
		points: number;
		estimatedMinutes: number | null;
		link: string;
	}>;
}

class GuestStore {
	data = $state<GuestDashboardData | null>(null);
	isLoading = $state(false);
	error = $state<string | null>(null);
	isAuthenticated = $state(false);

	async fetchDashboard() {
		this.isLoading = true;
		this.error = null;
		Logger.root.info({ context: 'api' }, 'Fetching guest dashboard');

		try {
			const response = await fetch('/api/guest/dashboard');
			
			if (response.status === 401) {
				this.isAuthenticated = false;
				this.data = null;
				return null;
			}

			if (!response.ok) {
				throw new Error('Failed to fetch dashboard');
			}

			const result = await response.json();
			
			if (result.success && result.data) {
				this.data = result.data;
				this.isAuthenticated = true;
				Logger.root.info({ context: 'api', surveysCount: result.data.availableSurveys.length }, 'Guest dashboard loaded');
				return result.data;
			} else {
				throw new Error(result.message || 'Failed to load dashboard');
			}
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Unknown error';
			this.isAuthenticated = false;
			Logger.root.error({ context: 'errors', error: err }, 'Guest dashboard fetch failed');
			return null;
		} finally {
			this.isLoading = false;
		}
	}

	async logout() {
		try {
			await fetch('/api/guest/logout', { method: 'POST' });
			this.data = null;
			this.isAuthenticated = false;
			Logger.root.info({ context: 'app' }, 'Guest logged out');
		} catch (err) {
			Logger.root.error({ context: 'errors', error: err }, 'Guest logout failed');
		}
	}

	reset() {
		this.data = null;
		this.error = null;
		this.isLoading = false;
		this.isAuthenticated = false;
	}
}

export const guestStore = new GuestStore();
