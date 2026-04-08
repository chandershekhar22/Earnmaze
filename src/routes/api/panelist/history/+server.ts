import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import { getPanelistActivityHistory } from '$lib/db/repositories';
import { Logger } from '$lib/utils/app-logger';

/**
 * GET /api/panelist/history — combined activity history
 * Returns a unified list of points transactions, survey activity, and redemptions
 */
export const GET: RequestHandler = async (event) => {
	const user = await requirePanelist(event);

	try {
		const limit = Math.min(parseInt(event.url.searchParams.get('limit') || '20'), 100);
		const offset = parseInt(event.url.searchParams.get('offset') || '0');

		// Fetch enough from each source to fill the page after merging + sorting
		const fetchLimit = limit + offset;
		const { pointsTxs, surveyTxs, redemptionTxs } = await getPanelistActivityHistory(user.id, fetchLimit);

		// Transform into unified HistoryItem[] shape expected by the component
		const history = [
			...pointsTxs.map((tx) => ({
				type: 'points' as const,
				title: formatPointsTitle(tx.type),
				description: tx.description,
				createdAt: tx.createdAt?.toISOString() ?? new Date().toISOString(),
				points: tx.type === 'redeemed' || tx.type === 'penalty' ? -(tx.points ?? 0) : (tx.points ?? 0),
				status: 'completed',
			})),

			...surveyTxs.map((tx) => ({
				type: 'surveys' as const,
				title: tx.surveyTitle || 'Survey',
				description: formatSurveyDescription(tx.status),
				createdAt: (tx.completedAt ?? tx.startedAt)?.toISOString() ?? new Date().toISOString(),
				points: tx.awardedPoints ?? 0,
				status: tx.status,
				surveyId: tx.surveyId,
			})),

			...redemptionTxs.map((tx) => ({
				type: 'rewards' as const,
				title: `${tx.provider ?? 'Reward'} Redemption`,
				description: `$${tx.value} (${tx.amount} points)`,
				createdAt: tx.createdAt?.toISOString() ?? new Date().toISOString(),
				points: -(tx.amount ?? 0),
				status: tx.status ?? 'pending',
			})),
		];

		// Sort by date descending, then paginate
		history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		const page = history.slice(offset, offset + limit);

		return json({ success: true, data: { data: page, total: history.length, limit, offset } });
	} catch (error) {
		Logger.root.error({ context: 'api', error, userId: user.id }, 'History fetch error');
		return json(
			{ success: false, error: 'HISTORY_FETCH_FAILED', message: 'Failed to fetch history' },
			{ status: 500 }
		);
	}
};

function formatPointsTitle(type: string): string {
	switch (type) {
		case 'completed':
			return 'Survey Completed';
		case 'terminated':
			return 'Survey Terminated';
		case 'quota_full':
			return 'Survey Quota Full';
		case 'disqualified':
			return 'Survey Disqualified';
		case 'redeemed':
			return 'Points Redeemed';
		case 'bonus':
			return 'Bonus Points';
		case 'rejected':
			return 'Points Rejected';
		case 'penalty':
			return 'Points Penalty';
		case 'adjustment':
			return 'Points Adjustment';
		case 'refund':
			return 'Points Refund';
		case 'expired':
			return 'Points Expired';
		default:
			return 'Points Transaction';
	}
}

function formatSurveyDescription(status: string): string {
	switch (status) {
		case 'completed':
			return 'Survey completed successfully';
		case 'started':
			return 'Survey started';
		case 'disqualified':
			return 'Disqualified from survey';
		case 'abandoned':
			return 'Survey abandoned';
		default:
			return `Survey ${status}`;
	}
}
