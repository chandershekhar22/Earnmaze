import type { PageServerLoad } from './$types';
import { requirePanelist } from '$lib/server/auth/guards';
import { getPanelistActivityHistory } from '$lib/db/repositories';
import { signedTransactionPoints } from '$lib/constants/constants';

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

export const load: PageServerLoad = async (event) => {
	const user = await requirePanelist(event);

	const { pointsTxs, surveyTxs, redemptionTxs } = await getPanelistActivityHistory(user.id, 50);

	const history = [
		...pointsTxs.map((tx) => ({
			type: 'points' as const,
			title: formatPointsTitle(tx.type),
			description: tx.description,
			createdAt: tx.createdAt?.toISOString() ?? new Date().toISOString(),
			// DB stores `points` as positive magnitude; effect is encoded by
			// `tx.type`. The shared helper renders the correct sign for all
			// types (redeemed/penalty/expired/disqualified → negative; etc).
			points: signedTransactionPoints(tx.type, tx.points ?? 0),
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

	history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	return { history: history.slice(0, 100) };
};
