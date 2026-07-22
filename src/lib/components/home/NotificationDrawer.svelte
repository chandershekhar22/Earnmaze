<script lang="ts">
	import Icon from './Icon.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getValidEntries, EXPLORATION_KIND_LABELS } from '$lib/utils/exploration-points';
	import { explorationPointsDisplay } from '$lib/stores/exploration-points.svelte';

	let { open, onClose }: { open: boolean; onClose: () => void } = $props();

	const tabs = [m.home_notif_tab_all(), m.home_notif_tab_rewards(), m.home_notif_tab_polls(), m.home_notif_tab_system()];
	let activeTab = $state(tabs[0]);

	function relativeTime(ms: number): string {
		const mins = Math.floor((Date.now() - ms) / 60000);
		if (mins < 1) return 'now';
		if (mins < 60) return `${mins}m`;
		return `${Math.floor(mins / 60)}h`;
	}

	// Real "you won points" entries earned from today's tile in any section
	// (see $lib/utils/exploration-points) — same wording as the
	// ExplorationPointsWatcher congrats toast. Re-derives whenever a win or a
	// claim changes the shared pendingTotal.
	const items = $derived.by(() => {
		explorationPointsDisplay.pendingTotal;
		return getValidEntries()
			.slice()
			.sort((a, b) => b.earnedAt - a.earnedAt)
			.map((e) => ({
				id: e.id,
				icon: 'coin',
				title: `Congratulations! You won ${e.points} points 🎉`,
				text: `Completed ${EXPLORATION_KIND_LABELS[e.kind]}. Sign up or log in within 1 hour to add these to your wallet — otherwise they expire.`,
				time: relativeTime(e.earnedAt)
			}));
	});
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && onClose()} />

<button class="notif-overlay" class:open onclick={onClose} aria-label={m.home_notif_close()}
></button>

<aside class="notif-drawer" class:open>
	<div class="notif-header">
		<h3>{m.home_notif_title()}</h3>
		<button class="notif-close" onclick={onClose} aria-label={m.home_notif_close()}>
			<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
				><path d="M6 6l12 12M18 6L6 18" /></svg
			>
		</button>
	</div>
	<div class="notif-tabs">
		{#each tabs as tab (tab)}
			<button class="notif-tab" class:active={activeTab === tab} onclick={() => (activeTab = tab)}
				>{tab}</button
			>
		{/each}
	</div>
	<div class="notif-list">
		{#if items.length === 0}
			<div class="notif-empty">{m.home_notif_empty()}</div>
		{/if}
		{#each items as item (item.id)}
			<div class="notif-item">
				<div class="ni-icon"><Icon name={item.icon} /></div>
				<div class="ni-text">
					<strong>{item.title}</strong>
					<p>{item.text}</p>
				</div>
				<div class="ni-time">{item.time}</div>
			</div>
		{/each}
	</div>
</aside>
