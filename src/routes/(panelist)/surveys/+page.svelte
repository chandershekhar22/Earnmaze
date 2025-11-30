<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';
	import { Logger } from '$lib/utils/app-logger';
	import type { Survey } from "$lib/types/survey";

	let { data }: { data: {
		availableSurveyData: Survey[];
		surveyTransactions: Array<{
			id: string;
			surveyId: string;
			status: string;
			awardedPoints: number;
			bonusPoints: number;
			qualityRating: number | null;
			timeSpentSeconds: number | null;
			startedAt: string;
			completedAt: string | null;
			submittedAt: string | null;
			survey: {
				title: string;
				points: number;
				category: string;
				estimatedMinutes: number;
			};
		}>;
	}} = $props();

	const { availableSurveyData, surveyTransactions } = data;

	let activeTab = $state('available'); // 'available' or 'history'

	async function startSurvey(surveyId: string) {
		try {
			const survey = availableSurveyData.find(s => s.id === surveyId);
			toastStore.info('Starting Survey', `Loading ${survey?.title || 'survey'}...`);

			const response = await fetch(`/api/surveys/${surveyId}/start`, {
				method: 'POST'
			});
			if (response.ok) {
				toastStore.success('Survey Started!', `Good luck with ${survey?.title || 'your survey'}!`);
				window.location.href = `/surveys/${surveyId}/take`;
			} else {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				toastStore.error('Failed to Start Survey', errorData.error || 'Please try again.');
			}
		} catch (error) {
			Logger.errors.error('Failed to start survey', { error });
			toastStore.error('Connection Error', 'Unable to start survey. Please check your connection and try again.');
		}
	}

	function formatTime(seconds: number | null): string {
		if (!seconds) return 'N/A';
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'completed': return 'bg-green-100 text-green-800';
			case 'started': return 'bg-blue-100 text-blue-800';
			case 'submitted': return 'bg-yellow-100 text-yellow-800';
			case 'disqualified': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<svelte:head>
	<title>Surveys - EarnMaze Panel</title>
	<meta name="description" content="Browse available surveys and view your survey completion history on EarnMaze." />
</svelte:head>

<div class="space-y-6">
	<div class="border-b border-gray-200">
		<nav class="-mb-px flex space-x-8">
			<button
				onclick={() => activeTab = 'available'}
				class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'available' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Available Surveys ({availableSurveyData.length})
			</button>
			<button
				onclick={() => activeTab = 'history'}
				class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'history' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				Survey History ({surveyTransactions.length})
			</button>
		</nav>
	</div>

	{#if activeTab === 'available'}
		<!-- Available Surveys Section -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">Available Surveys</h2>
				<div class="text-sm text-gray-500">
					{availableSurveyData.length} survey{availableSurveyData.length !== 1 ? 's' : ''} available
				</div>
			</div>

			{#if availableSurveyData.length === 0}
				<div class="text-center py-12">
					<div class="text-6xl mb-4">📋</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">No surveys available</h3>
					<p class="text-gray-600 mb-6">Check back later for new survey opportunities.</p>
					<a href="/dashboard" class="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
						Return to Dashboard
					</a>
				</div>
			{:else}
				<div class="grid gap-6">
					{#each availableSurveyData as survey}
						<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<h3 class="text-lg font-semibold text-gray-900 mb-2">{survey.pointsReward}</h3>
									<p class="text-gray-600 mb-4">points</p>

									<div class="flex items-center space-x-6 text-sm text-gray-500 mb-4">
										<div class="flex items-center">
											<span class="mr-1">⏱️</span>
											<span>{survey.estimatedMinutes} minutes</span>
										</div>
										<div class="flex items-center">
											<span class="mr-1">👥</span>
											<span>{survey.targetResponses - survey.currentResponses} spots left</span>
										</div>
									</div>

									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-2">
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
												Active
											</span>
										</div>

										<button
											onclick={() => startSurvey(survey.id)}
											class="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
										>
											Start Survey
											<span class="ml-1">→</span>
										</button>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Survey History Section -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">Survey History</h2>
				<div class="text-sm text-gray-500">
					{surveyTransactions.length} survey{surveyTransactions.length !== 1 ? 's' : ''} completed
				</div>
			</div>

			{#if surveyTransactions.length === 0}
				<div class="text-center py-12">
					<div class="text-6xl mb-4">📊</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">No survey history</h3>
					<p class="text-gray-600 mb-6">Complete your first survey to see your history here.</p>
					<button
						onclick={() => activeTab = 'available'}
						class="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
					>
						Browse Available Surveys
					</button>
				</div>
			{:else}
				<div class="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each surveyTransactions as transaction}
									<tr class="hover:bg-gray-50">
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="text-sm font-medium text-gray-900">{transaction.survey.title}</div>
											<div class="text-sm text-gray-500">{transaction.survey.category}</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(transaction.status)}">
												{transaction.status}
											</span>
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											<div class="font-medium">{transaction.awardedPoints + (transaction.bonusPoints || 0)}</div>
											{#if transaction.bonusPoints && transaction.bonusPoints > 0}
												<div class="text-xs text-green-600">+{transaction.bonusPoints} bonus</div>
											{/if}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{formatTime(transaction.timeSpentSeconds)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{#if transaction.qualityRating}
												<div class="flex items-center">
													<span class="text-yellow-400">★</span>
													<span class="ml-1">{transaction.qualityRating}/100</span>
												</div>
											{:else}
												<span class="text-gray-400">N/A</span>
											{/if}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{#if transaction.completedAt}
												{formatDate(transaction.completedAt)}
											{:else if transaction.startedAt}
												{formatDate(transaction.startedAt)}
											{:else}
												<span class="text-gray-400">N/A</span>
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
