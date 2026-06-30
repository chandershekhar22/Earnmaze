import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import {
	getDashboardPreference,
	setDashboardPreference,
	type DashboardView,
} from '$lib/db/repositories';
import { Logger } from '$lib/utils/app-logger';

const VALID_VIEWS: DashboardView[] = ['surveys', 'discover'];

/**
 * GET /api/panelist/dashboard-view — current dashboard view preference
 */
export const GET: RequestHandler = async (event) => {
	const authUser = await requirePanelist(event);

	try {
		const pref = await getDashboardPreference(authUser.id);
		return json(pref);
	} catch (error) {
		Logger.root.error({ context: 'api', error, userId: authUser.id }, 'Dashboard view fetch error');
		return json(
			{ success: false, error: 'DASHBOARD_VIEW_FETCH_FAILED', message: 'Failed to fetch preference' },
			{ status: 500 }
		);
	}
};

/**
 * POST /api/panelist/dashboard-view — save the chosen dashboard view.
 * Body: { view: 'surveys' | 'discover', onboarded?: boolean }
 */
export const POST: RequestHandler = async (event) => {
	const authUser = await requirePanelist(event);

	let view: DashboardView;
	let onboarded: boolean | undefined;

	try {
		const raw = await event.request.json();
		if (!VALID_VIEWS.includes(raw?.view)) {
			return json(
				{ success: false, error: 'VALIDATION_ERROR', message: 'Invalid dashboard view' },
				{ status: 400 }
			);
		}
		view = raw.view;
		onboarded = typeof raw?.onboarded === 'boolean' ? raw.onboarded : true;
	} catch {
		return json(
			{ success: false, error: 'INVALID_BODY', message: 'Invalid JSON body' },
			{ status: 400 }
		);
	}

	try {
		await setDashboardPreference(authUser.id, { dashboardView: view, dashboardOnboarded: onboarded });
		return json({ success: true, dashboardView: view, dashboardOnboarded: onboarded });
	} catch (error) {
		Logger.root.error({ context: 'api', error, userId: authUser.id }, 'Dashboard view update error');
		return json(
			{ success: false, error: 'DASHBOARD_VIEW_UPDATE_FAILED', message: 'Failed to save preference' },
			{ status: 500 }
		);
	}
};
