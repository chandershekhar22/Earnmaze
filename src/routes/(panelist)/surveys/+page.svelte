<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';
	import { Logger } from '$lib/utils/app-logger';
	import type { AvailableSurveyItem, SurveyTransactionsResponse } from '$types/api-responses';

	let { data }: { data: {
		availableSurveyData: AvailableSurveyItem[];
		surveyTransactions: SurveyTransactionsResponse;
	}} = $props();

	const availableSurveyData = $derived(data.availableSurveyData);
	const surveyTransactions = $derived(data.surveyTransactions);

	const transactions = $derived(surveyTransactions?.transactions ?? []);

	let activeTab = $state('available'); // 'available' or 'history'

	async function startSurvey(surveyId: string) {
		try {
			const survey = availableSurveyData.find((s) => s.id === surveyId);
			toastStore.info('Starting Survey', `Loading ${survey?.title || 'survey'}...`);
			window.location.href = `/start-survey?surveyId=${surveyId}`;
		} catch (error) {
			Logger.root.error({ context: 'errors', error }, 'Failed to start survey');
			toastStore.error('Connection Error', 'Unable to start survey. Please check your connection and try again.');
		}
	}

	function formatMinutes(minutes?: number): string {
		if (minutes === undefined || minutes === null) return 'N/A';
		return `${minutes} min`;
	}

	function formatDate(dateValue?: string | Date | null): string {
		if (!dateValue) return 'N/A';
		return new Date(dateValue).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusBadge(status: string): string {
		switch (status) {
			case 'completed': return 'badge-success';
			case 'started': return 'badge-primary';
			case 'invited': return 'badge-neutral';
			case 'disqualified': return 'badge-danger';
			case 'expired': return 'badge-warning';
			default: return 'badge-neutral';
		}
	}
</script>

<svelte:head>
	<title>Surveys - EarnMaze Panel</title>
	<meta name="description" content="Browse available surveys and view your survey completion history on EarnMaze." />
</svelte:head>

<div class="space-y-6 animate-fade-in">
	<!-- Page Header -->
	<!-- <div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-neutral-900">Surveys</h1>
			<p class="text-neutral-500 mt-1">Complete surveys and earn rewards</p>
		</div>
	</div> -->

	<!-- Tab Navigation -->
	<div class="tab-group max-w-md">
		<button
			onclick={() => activeTab = 'available'}
			class={activeTab === 'available' ? 'tab-active' : 'tab'}
		>
			<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
			</svg>
			Available ({availableSurveyData.length})
		</button>
		<button
			onclick={() => activeTab = 'history'}
			class={activeTab === 'history' ? 'tab-active' : 'tab'}
		>
			<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			History ({transactions.length})
		</button>
	</div>

	{#if activeTab === 'available'}
		<!-- Available Surveys Section -->
		<div class="space-y-4 md:space-y-6">
			{#if availableSurveyData.length === 0}
				<div class="card text-center py-16">
					<div class="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-neutral-900 mb-2">No surveys available</h3>
					<p class="text-neutral-500 mb-6 max-w-sm mx-auto">Check back later for new survey opportunities to earn points.</p>
					<a href="/dashboard" class="btn-primary">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
						</svg>
						Return to Dashboard
					</a>
				</div>
			{:else}
				<div class="grid gap-4">
					{#each availableSurveyData as survey, index}
						<div class="card-hover group animate-slide-up" style="animation-delay: {index * 50}ms">
							<div class="flex items-start justify-between gap-4">
								<div class="flex items-start gap-4 flex-1">
									<!-- Survey Icon -->
									<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm">
										<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
									</div>
									
									<div class="flex-1 min-w-0">
										<!-- Points Badge -->
										<div class="flex items-center gap-3 mb-2">
											<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												{survey.points} pts
											</span>
											<span class="badge-success">Active</span>
										</div>

										{#if survey.description}
											<p class="text-sm text-neutral-600 line-clamp-3">{survey.description}</p>
										{/if}
									</div>
								</div>

								<!-- Start Button -->
								<button
									onclick={() => startSurvey(survey.id)}
									class="btn-primary flex-shrink-0 group-hover:shadow-glow transition-shadow"
								>
									Start Survey
									<svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
									</svg>
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Survey History Section -->
		<div class="space-y-4">
			{#if transactions.length === 0}
				<div class="card text-center py-16">
					<div class="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-neutral-900 mb-2">No survey history</h3>
					<p class="text-neutral-500 mb-6 max-w-sm mx-auto">Complete your first survey to see your history here.</p>
					<button
						onclick={() => activeTab = 'available'}
						class="btn-primary"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
						Browse Available Surveys
					</button>
				</div>
			{:else}
				<div class="card overflow-hidden p-0">
					<div class="overflow-x-auto">
						<table class="min-w-full">
							<thead>
								<tr class="bg-neutral-50 border-b border-neutral-200">
									<th class="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Survey</th>
									<th class="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
									<th class="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Points</th>
									<th class="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Time Spent</th>
									<th class="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Started</th>
									<th class="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Completed</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-neutral-100">
								{#each transactions as transaction}
									<tr class="hover:bg-neutral-50/50 transition-colors">
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="text-sm font-medium text-neutral-900">{transaction.surveyTitle}</div>
											<div class="text-xs text-neutral-500">ID: {transaction.surveyId}</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<span class={getStatusBadge(transaction.status)}>
												{transaction.status}
											</span>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="text-sm font-semibold text-neutral-900">{transaction.pointsEarned}</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
											{formatMinutes(transaction.timeSpentMinutes)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
											{formatDate(transaction.startedAt)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
											{#if transaction.completedAt}
												{formatDate(transaction.completedAt)}
											{:else}
												<span class="text-neutral-400">N/A</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
