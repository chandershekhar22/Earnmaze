<script lang="ts">
	import { onMount } from 'svelte';
	import { Logger } from '$lib/utils/app-logger';

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

	let history = $state<HistoryItem[]>([]);
	let loading = $state(true);
	let filter = $state('all'); // all, surveys, points, rewards
	let filteredHistory = $state<HistoryItem[]>([]);

	onMount(async () => {
		try {
			const response = await fetch('/api/panelist/history');
			if (response.ok) {
				history = await response.json();
				filterHistory();
			}
		} catch (error) {
			Logger.root.error({ context: 'errors', error }, 'Failed to fetch history');
		} finally {
			loading = false;
		}
	});

	function filterHistory() {
		if (filter === 'all') {
			filteredHistory = history;
		} else {
			filteredHistory = history.filter(item => item.type === filter);
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'completed':
			case 'redeemed':
			case 'approved':
				return 'badge-success';
			case 'pending':
			case 'processing':
				return 'badge-warning';
			case 'rejected':
			case 'failed':
				return 'badge-danger';
			case 'in-progress':
				return 'badge-primary';
			default:
				return 'badge-neutral';
		}
	}

	$effect(() => {
		filterHistory();
	});
</script>

<svelte:head>
	<title>Activity History - EarnMaze Panel</title>
	<meta name="description" content="View your complete activity history on EarnMaze." />
</svelte:head>

<div class="space-y-6 animate-fade-in">
	<!-- Page Header -->
	<div>
		<h1 class="text-2xl font-bold text-neutral-900">Activity History</h1>
		<p class="text-neutral-500 mt-1">Track all your surveys, points, and rewards</p>
	</div>

	<!-- Filter Tabs -->
	<div class="tab-group">
		<button 
			onclick={() => filter = 'all'}
			class={filter === 'all' ? 'tab-active' : 'tab'}
		>
			<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
			</svg>
			All
		</button>
		<button 
			onclick={() => filter = 'surveys'}
			class={filter === 'surveys' ? 'tab-active' : 'tab'}
		>
			<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
			</svg>
			Surveys
		</button>
		<button 
			onclick={() => filter = 'points'}
			class={filter === 'points' ? 'tab-active' : 'tab'}
		>
			<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			Points
		</button>
		<button 
			onclick={() => filter = 'rewards'}
			class={filter === 'rewards' ? 'tab-active' : 'tab'}
		>
			<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
			</svg>
			Rewards
		</button>
	</div>

	{#if loading}
		<div class="card text-center py-16">
			<div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
				<svg class="w-6 h-6 text-primary-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			</div>
			<p class="text-neutral-500">Loading history...</p>
		</div>
	{:else if filteredHistory.length === 0}
		<div class="card text-center py-16">
			<div class="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
				</svg>
			</div>
			<h3 class="text-lg font-semibold text-neutral-900 mb-2">No activity found</h3>
			<p class="text-neutral-500 mb-6 max-w-sm mx-auto">
				{filter === 'all' 
					? 'Start completing surveys to see your activity history here.' 
					: `No ${filter} activity found. Try a different filter.`}
			</p>
			<a href="/surveys" class="btn-primary">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
				</svg>
				Browse Surveys
			</a>
		</div>
	{:else}
		<div class="card !p-0 overflow-hidden">
			<div class="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
				<h2 class="font-semibold text-neutral-900">
					{filteredHistory.length} {filter === 'all' ? 'activities' : filter}
				</h2>
			</div>
			
			<div class="divide-y divide-neutral-100">
				{#each filteredHistory as item, index}
					<div class="p-4 hover:bg-neutral-50/50 transition-colors animate-slide-up" style="animation-delay: {index * 30}ms">
						<div class="flex items-start justify-between gap-4">
							<div class="flex items-start gap-3">
								<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 {
									item.type === 'surveys' ? 'bg-primary-100' :
									item.type === 'points' ? 'bg-emerald-100' :
									item.type === 'rewards' ? 'bg-amber-100' : 'bg-neutral-100'
								}">
									{#if item.type === 'surveys'}
										<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
										</svg>
									{:else if item.type === 'points'}
										<svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									{:else if item.type === 'rewards'}
										<svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
										</svg>
									{:else}
										<svg class="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
										</svg>
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<h3 class="text-sm font-medium text-neutral-900">{item.title}</h3>
									<p class="text-sm text-neutral-500 mt-0.5">{item.description}</p>
									<div class="flex items-center gap-4 mt-2">
										<span class="text-xs text-neutral-400">{formatDate(item.createdAt)}</span>
										{#if item.points}
											<span class="text-xs font-semibold {item.points > 0 ? 'text-emerald-600' : 'text-rose-600'}">
												{item.points > 0 ? '+' : ''}{item.points} pts
											</span>
										{/if}
									</div>
								</div>
							</div>
							<div class="flex flex-col items-end gap-2">
								{#if item.status}
									<span class={getStatusBadge(item.status)}>
										{item.status.replace('-', ' ')}
									</span>
								{/if}
								{#if item.type === 'surveys' && item.surveyId}
									<a href="/surveys/{item.surveyId}" class="link text-xs">
										View →
									</a>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
