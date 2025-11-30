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
			Logger.errors.error('Failed to fetch history', { error });
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

	function getItemIcon(type: string, action?: string) {
		switch (type) {
			case 'surveys':
				return action === 'completed' ? '✅' : '📋';
			case 'points':
				return '💰';
			case 'rewards':
				return '🎁';
			default:
				return '📊';
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'completed':
			case 'redeemed':
			case 'approved':
				return 'text-green-600 bg-green-100';
			case 'pending':
			case 'processing':
				return 'text-yellow-600 bg-yellow-100';
			case 'rejected':
			case 'failed':
				return 'text-red-600 bg-red-100';
			case 'in-progress':
				return 'text-blue-600 bg-blue-100';
			default:
				return 'text-gray-600 bg-gray-100';
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

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Activity History</h1>
		<p class="text-gray-600">Track all your surveys, points, and reward activities</p>
	</div>

	<!-- Filter Tabs -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
		<div class="flex flex-wrap gap-2">
			<button 
				onclick={() => filter = 'all'}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
			>
				All Activities
			</button>
			<button 
				onclick={() => filter = 'surveys'}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filter === 'surveys' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
			>
				Surveys
			</button>
			<button 
				onclick={() => filter = 'points'}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filter === 'points' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
			>
				Points
			</button>
			<button 
				onclick={() => filter = 'rewards'}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {filter === 'rewards' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
			>
				Rewards
			</button>
		</div>
	</div>

	{#if loading}
		<div class="text-center py-12">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
			<p class="mt-2 text-gray-600">Loading history...</p>
		</div>
	{:else if filteredHistory.length === 0}
		<div class="text-center py-12">
			<div class="text-6xl mb-4">📊</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No activity found</h3>
			<p class="text-gray-600 mb-6">
				{filter === 'all' 
					? 'Start completing surveys to see your activity history here.' 
					: `No ${filter} activity found. Try changing the filter or start participating in surveys.`}
			</p>
			<a href="/surveys" class="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
				Browse Surveys
			</a>
		</div>
	{:else}
		<div class="bg-white rounded-lg shadow-sm border border-gray-200">
			<div class="p-4 border-b border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900">
					{filteredHistory.length} {filter === 'all' ? 'activities' : filter} found
				</h2>
			</div>
			
			<div class="divide-y divide-gray-200">
				{#each filteredHistory as item}
					<div class="p-4 hover:bg-gray-50 transition-colors">
						<div class="flex items-start justify-between">
							<div class="flex items-start space-x-3">
								<span class="text-xl">{getItemIcon(item.type, item.action)}</span>
								<div class="flex-1">
									<h3 class="text-sm font-medium text-gray-900">{item.title}</h3>
									<p class="text-sm text-gray-600 mt-1">{item.description}</p>
									<div class="flex items-center space-x-4 mt-2">
										<span class="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
										{#if item.points}
											<span class="text-xs {item.points > 0 ? 'text-green-600' : 'text-red-600'}">
												{item.points > 0 ? '+' : ''}{item.points} points
											</span>
										{/if}
									</div>
								</div>
							</div>
							<div class="flex flex-col items-end space-y-2">
								{#if item.status}
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getStatusColor(item.status)}">
										{item.status.replace('-', ' ')}
									</span>
								{/if}
								{#if item.type === 'surveys' && item.surveyId}
									<a 
										href="/surveys/{item.surveyId}" 
										class="text-xs text-primary-600 hover:text-primary-700"
									>
										View Survey
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
