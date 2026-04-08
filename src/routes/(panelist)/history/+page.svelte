<script lang="ts">
	import { untrack } from 'svelte';
	import { AlignJustify, ClipboardList, CircleDollarSign, Gift, BarChart2, Rocket } from '@lucide/svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';

	interface HistoryItem {
		type: string;
		action?: string;
		title: string;
		description: string;
		createdAt: string;
		points?: number;
		status?: string;
		surveyId?: string;
	}

	let { data } = $props();

	let history = $state<HistoryItem[]>(untrack(() => data.history));
	let filter = $state('all');
	let filteredHistory = $state<HistoryItem[]>(untrack(() => data.history));

	function filterHistory() {
		if (filter === 'all') {
			filteredHistory = history;
		} else {
			filteredHistory = history.filter(item => item.type === filter);
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function getStatusStyle(status: string) {
		switch (status) {
			case 'completed': case 'redeemed': case 'approved': return 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20';
			case 'pending': case 'processing': return 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20';
			case 'rejected': case 'failed': return 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20';
			case 'in-progress': return 'bg-primary-500/15 text-primary-400 ring-1 ring-primary-500/20';
			default: return 'bg-white/5 text-neutral-400 ring-1 ring-white/10';
		}
	}

	function getTypeIcon(type: string) {
		switch (type) {
			case 'surveys': return { icon: ClipboardList, color: 'text-primary-400', bg: 'bg-primary-500/10' };
			case 'points': return { icon: CircleDollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
			case 'rewards': return { icon: Gift, color: 'text-amber-400', bg: 'bg-amber-500/10' };
			default: return { icon: BarChart2, color: 'text-neutral-400', bg: 'bg-white/5' };
		}
	}

	$effect(() => {
		filterHistory();
	});
</script>

<svelte:head>
	<title>History - EarnMaze</title>
	<meta name="description" content="View your complete activity history." />
</svelte:head>

<div class="space-y-5 animate-fade-in">
	<InfoBanner id="history-how" message="View your complete activity log. Filter by surveys, points, or rewards. Green amounts are earned, red are spent or deducted." color="primary" />

	<!-- Filter Tabs -->
	<div class="tab-group">
		<button onclick={() => filter = 'all'} class={filter === 'all' ? 'tab-active' : 'tab'}>
			<AlignJustify class="w-4 h-4 mr-1.5 inline" />
			All
		</button>
		<button onclick={() => filter = 'surveys'} class={filter === 'surveys' ? 'tab-active' : 'tab'}>
			<ClipboardList class="w-4 h-4 mr-1.5 inline" />
			Surveys
		</button>
		<button onclick={() => filter = 'points'} class={filter === 'points' ? 'tab-active' : 'tab'}>
			<CircleDollarSign class="w-4 h-4 mr-1.5 inline" />
			Points
		</button>
		<button onclick={() => filter = 'rewards'} class={filter === 'rewards' ? 'tab-active' : 'tab'}>
			<Gift class="w-4 h-4 mr-1.5 inline" />
			Rewards
		</button>
	</div>

	{#if filteredHistory.length === 0}
		<div class="card text-center py-20">
			<div class="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
				<BarChart2 class="w-8 h-8 text-neutral-600" />
			</div>
			<h3 class="text-lg font-bold text-white mb-2">No activity found</h3>
			<p class="text-neutral-500 mb-6 max-w-xs mx-auto text-sm">
				{filter === 'all'
					? 'Start completing surveys to build your history.'
					: `No ${filter} activity found.`}
			</p>
			<a href="/surveys" class="btn-primary">
				<Rocket class="w-4 h-4" />
				Browse Surveys
			</a>
		</div>
	{:else}
		<div class="card !p-0 overflow-hidden">
			<div class="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
				<h2 class="text-sm font-bold text-white">
					{filteredHistory.length} {filter === 'all' ? 'activities' : filter}
				</h2>
			</div>

			<div class="divide-y divide-white/[0.04]">
				{#each filteredHistory as item, index}
					{@const typeStyle = getTypeIcon(item.type)}
					<div class="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors animate-slide-up" style="animation-delay: {Math.min(index, 10) * 30}ms">
						<div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 {typeStyle.bg}">
							<typeStyle.icon class="w-4 h-4 {typeStyle.color}" />
						</div>
						<div class="flex-1 min-w-0">
							<h3 class="text-sm font-medium text-white/80">{item.title}</h3>
							<p class="text-xs text-neutral-600 mt-0.5">{item.description}</p>
							<div class="flex items-center gap-3 mt-2">
								<span class="text-[10px] text-neutral-700">{formatDate(item.createdAt)}</span>
								{#if item.points}
									<span class="text-xs font-black {item.points > 0 ? 'text-emerald-400' : 'text-rose-400'}">
										{item.points > 0 ? '+' : ''}{item.points} pts
									</span>
								{/if}
							</div>
						</div>
						<div class="flex flex-col items-end gap-2 flex-shrink-0">
							{#if item.status}
								<span class="badge {getStatusStyle(item.status)} text-[10px]">
									{item.status.replace('-', ' ')}
								</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
