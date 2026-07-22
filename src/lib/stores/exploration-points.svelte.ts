import { getPendingTotal } from '$lib/utils/exploration-points';

/**
 * Reactive mirror of the localStorage pending-exploration-points total (see
 * $lib/utils/exploration-points) so the navbar points pill can reflect a win
 * immediately, without a full page reload. Starts at 0 (matches SSR) and is
 * synced from localStorage via refresh() once mounted in the browser.
 *
 * `walletTotal` is the signed-in panelist's real credited exploration-points
 * balance (see getPointsSummaryByBucket) — seeded from SSR data by whichever
 * page renders the nav pill, then bumped by ExplorationPointsWatcher once a
 * pending win is actually claimed, so the pill reflects the credited total
 * without waiting for the next full page load.
 */
class ExplorationPointsDisplayStore {
	pendingTotal = $state(0);
	walletTotal = $state(0);

	refresh() {
		this.pendingTotal = getPendingTotal();
	}

	setWalletTotal(total: number) {
		this.walletTotal = total;
	}

	addToWallet(amount: number) {
		this.walletTotal += amount;
	}
}

export const explorationPointsDisplay = new ExplorationPointsDisplayStore();
