<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { pointsStore } from '$lib/stores/points.svelte';
	import {
		getUnnotifiedValidEntries,
		markNotified,
		clearAll as clearPendingExplorationPoints
	} from '$lib/utils/exploration-points';
	import { claimPendingExplorationPoints } from '$lib/utils/claim-exploration-points';
	import { explorationPointsDisplay } from '$lib/stores/exploration-points.svelte';

	// Fires the "you won points" celebration for any pending exploration entry
	// earned since the last time this ran. Mounted once at the root layout so
	// it covers every route — including the section viewer pages, which reset
	// past the (public)/(panelist) layouts back to root. (The games modal
	// never unloads the page, so it claims inline instead — see its closeModal.)
	onMount(async () => {
		// Syncs the navbar points pill even when there's nothing new to
		// celebrate — e.g. a same-day tile earned earlier is still pending.
		explorationPointsDisplay.refresh();

		const entries = getUnnotifiedValidEntries();
		if (entries.length === 0) return;

		const claim = await claimPendingExplorationPoints();
		if (claim === null) return; // network/server error — leave pending, retried on next mount

		if (!claim.authenticated) {
			const confetti = (await import('canvas-confetti')).default;
			confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });

			const total = entries.reduce((sum, e) => sum + e.points, 0);
			toastStore.success(
				`Congratulations! You won ${total} point${total === 1 ? '' : 's'} 🎉`,
				'Sign up or log in within 1 hour to add these to your wallet — otherwise they expire.',
				{
					duration: 10000,
					action: { label: 'Sign up now', handler: () => goto('/register') }
				}
			);
			markNotified(entries.map((e) => e.id));
			return;
		}

		markNotified(entries.map((e) => e.id));
		if (claim.pointsAwarded > 0) {
			clearPendingExplorationPoints();
			explorationPointsDisplay.refresh();
			explorationPointsDisplay.addToWallet(claim.pointsAwarded);
			pointsStore.fetchPoints();

			const confetti = (await import('canvas-confetti')).default;
			confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
			toastStore.success(
				`Congratulations! You won ${claim.pointsAwarded} point${claim.pointsAwarded === 1 ? '' : 's'} 🎉`,
				'Added to your wallet.',
				{ duration: 8000 }
			);
		}
	});
</script>
