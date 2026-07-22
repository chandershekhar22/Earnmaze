<script lang="ts">
	import { onMount } from 'svelte';
	import { Gift, Sparkles } from '@lucide/svelte';

	let { open, onClose }: { open: boolean; onClose: () => void } = $props();

	interface ExplorationNotification {
		id: string;
		points: number;
		referenceType: string;
		description: string | null;
		createdAt: string;
	}

	let items = $state<ExplorationNotification[]>([]);
	let loading = $state(false);
	let loaded = $state(false);

	function relativeTime(iso: string): string {
		const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
		if (mins < 1) return 'now';
		if (mins < 60) return `${mins}m`;
		if (mins < 1440) return `${Math.floor(mins / 60)}h`;
		return `${Math.floor(mins / 1440)}d`;
	}

	// Exploration points (today's-tile wins + the signup welcome bonus) are
	// their own notification feed, separate from survey activity — see
	// $lib/utils/exploration-points and the (panelist)/dashboard vs
	// (panelist)/discover split.
	async function load() {
		if (loading) return;
		loading = true;
		try {
			const res = await fetch('/api/panelist/exploration-notifications');
			const result = await res.json();
			if (result.success) items = result.data;
		} finally {
			loading = false;
			loaded = true;
		}
	}

	$effect(() => {
		if (open && !loaded) load();
	});
</script>

{#if open}
	<button
		type="button"
		class="fixed inset-0 z-40 cursor-default"
		aria-label="Close notifications"
		onclick={onClose}
	></button>

	<div
		class="absolute end-0 top-full mt-2 z-50 w-[320px] sm:w-[380px] max-h-[420px] flex flex-col bg-surface-100 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
	>
		<div class="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
			<h3 class="text-[14px] font-semibold text-white">Notifications</h3>
			<span class="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">Exploration points</span>
		</div>

		<div class="overflow-y-auto flex-1">
			{#if loading && !loaded}
				<div class="px-4 py-10 text-center text-[13px] text-neutral-500">Loading…</div>
			{:else if items.length === 0}
				<div class="px-4 py-10 text-center text-[13px] text-neutral-500 leading-relaxed">
					No notifications yet. Complete today's tile in any section to earn your first exploration points.
				</div>
			{:else}
				{#each items as item (item.id)}
					<div class="flex items-start gap-3 px-4 py-3.5 border-b border-white/[0.04] last:border-b-0">
						<div class="w-9 h-9 rounded-[10px] bg-amber-400/12 text-amber-400 grid place-items-center flex-shrink-0">
							{#if item.referenceType === 'bonus'}
								<Gift class="w-4 h-4" />
							{:else}
								<Sparkles class="w-4 h-4" />
							{/if}
						</div>
						<div class="flex-1 min-w-0">
							<strong class="block text-[13px] font-semibold text-white mb-0.5">
								{item.referenceType === 'bonus'
									? `Welcome bonus! +${item.points} exploration points 🎉`
									: `Congratulations! You won ${item.points} exploration points 🎉`}
							</strong>
							<p class="text-[12px] text-neutral-400 leading-relaxed">{item.description}</p>
						</div>
						<div class="text-[11px] text-neutral-500 font-mono flex-shrink-0">{relativeTime(item.createdAt)}</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
{/if}
