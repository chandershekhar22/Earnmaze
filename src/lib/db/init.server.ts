import { initializeAdmin } from '../../../scripts/init-admin';

/**
 * Initialize database on app startup
 * This is called once when the application starts
 */
export async function initializeDatabase() {
	try {
		await initializeAdmin();
	} catch (error) {
		console.error('Failed to initialize database:', error);
		// Don't throw - allow app to continue even if init fails
	}
}
