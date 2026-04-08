<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';
	import { Logger } from '$lib/utils/app-logger';
	import type { AvailableSurveyItem, SurveyTransactionsResponse } from '$types/api-responses';
	import { ClipboardList, Clock, House, FileText, ArrowRight, CircleCheckBig, CircleX, Zap, Rocket, Coins, Sparkles, Search } from '@lucide/svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data }: { data: {
		availableSurveyData: AvailableSurveyItem[];
		surveyTransactions: SurveyTransactionsResponse;
	}} = $props();

	const availableSurveyData = $derived(data.availableSurveyData);
	const surveyTransactions = $derived(data.surveyTransactions);
	const transactions = $derived(surveyTransactions?.transactions ?? []);

	let activeTab = $state('available');
	let searchQuery = $state('');
	let filteredSurveys = $derived(
		searchQuery.trim()
			? availableSurveyData.filter(s =>
				s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.description?.toLowerCase().includes(searchQuery.toLowerCase())
			)
			: availableSurveyData
	);
	let showSearch = $derived(availableSurveyData.length >= 5);

	let showCelebration = $state(false);
	let celebrationPts = $state(0);
	let celebrationStatus = $state('');

	// Check for survey completion redirect params
	onMount(() => {
		const completed = $page.url.searchParams.get('completed');
		const pts = $page.url.searchParams.get('pts');
		if (completed && pts) {
			celebrationStatus = completed;
			celebrationPts = parseInt(pts) || 0;
			showCelebration = true;
			// Clean URL without reload
			const url = new URL($page.url);
			url.searchParams.delete('completed');
			url.searchParams.delete('pts');
			history.replaceState({}, '', url.pathname);
			// Auto-dismiss after 5s
			setTimeout(() => showCelebration = false, 5000);
			// Show toast
			if (celebrationPts > 0) {
				toastStore.success('Points Earned!', `You earned ${celebrationPts} points!`);
			} else if (completed === 'disqualified') {
				toastStore.info('Survey Complete', 'You were screened out of this survey.');
			} else {
				toastStore.info('Survey Complete', 'Survey recorded successfully.');
			}
		}

		// Auto-refresh surveys every 60 seconds
		const refreshInterval = setInterval(() => invalidateAll(), 60_000);
		return () => clearInterval(refreshInterval);
	});

	// Rotating accent colors for cards
	const accents = [
		{ from: 'from-violet-500', to: 'to-fuchsia-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', shadow: 'shadow-violet-500/10' },
		{ from: 'from-cyan-500', to: 'to-blue-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', shadow: 'shadow-cyan-500/10' },
		{ from: 'from-emerald-500', to: 'to-teal-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', shadow: 'shadow-emerald-500/10' },
		{ from: 'from-amber-500', to: 'to-orange-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', shadow: 'shadow-amber-500/10' },
		{ from: 'from-pink-500', to: 'to-rose-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400', shadow: 'shadow-pink-500/10' },
		{ from: 'from-indigo-500', to: 'to-violet-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', shadow: 'shadow-indigo-500/10' },
	];

	function getAccent(i: number) { return accents[i % accents.length]; }

	async function startSurvey(surveyId: string) {
		try {
			const survey = availableSurveyData.find((s) => s.id === surveyId);
			toastStore.info('Starting Survey', `Loading ${survey?.title || 'survey'}...`);
			window.location.href = `/start-survey?surveyId=${surveyId}`;
		} catch (error) {
			Logger.root.error({ context: 'errors', error }, 'Failed to start survey');
			toastStore.error('Connection Error', 'Unable to start survey.');
		}
	}

	function formatMinutes(minutes?: number): string {
		if (minutes === undefined || minutes === null) return '--';
		return `${minutes}m`;
	}

	function formatDate(dateValue?: string | Date | null): string {
		if (!dateValue) return '--';
		return new Date(dateValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function getStatusStyle(status: string) {
		switch (status) {
			case 'completed': return { class: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20', icon: CircleCheckBig };
			case 'started': return { class: 'bg-primary-500/15 text-primary-400 ring-1 ring-primary-500/20', icon: Zap };
			case 'disqualified': return { class: 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20', icon: CircleX };
			case 'expired': return { class: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20', icon: Clock };
			default: return { class: 'bg-white/5 text-neutral-400 ring-1 ring-white/10', icon: Clock };
		}
	}
</script>

<svelte:head>
	<title>Surveys - EarnMaze</title>
	<meta name="description" content="Browse available surveys and view your survey completion history." />
	<style>
		@keyframes survey-glow {
			0%, 100% { box-shadow: 0 0 0 0 rgba(244,63,94,0); border-color: rgba(244,63,94,0.2); }
			50% { box-shadow: 0 0 24px 4px rgba(244,63,94,0.25); border-color: rgba(244,63,94,0.5); }
		}
		.survey-pulse { animation: survey-glow 2s ease-in-out infinite; }
	</style>
</svelte:head>

<style>
	@keyframes card-in { 0% { opacity:0; transform:translateY(16px) scale(.97) } 100% { opacity:1; transform:translateY(0) scale(1) } }
	.card-in { animation: card-in .45s ease-out both }
</style>

<div class="space-y-5 animate-fade-in">
	<InfoBanner id="survey-how" message="Click 'Start' on any survey to begin earning. You'll be redirected to the survey — once done, points are credited automatically. Partial credit may apply for terminated or quota-full surveys." color="primary" />

	<!-- Tabs -->
	<div class="tab-group max-w-sm">
		<button onclick={() => activeTab = 'available'} class={activeTab === 'available' ? 'tab-active' : 'tab'}>
			<ClipboardList class="w-4 h-4 mr-2 inline" />
			Available ({availableSurveyData.length})
		</button>
		<button onclick={() => activeTab = 'history'} class={activeTab === 'history' ? 'tab-active' : 'tab'}>
			<Clock class="w-4 h-4 mr-2 inline" />
			History ({transactions.length})
		</button>
	</div>

	<!-- Celebration banner -->
	{#if showCelebration}
		<div class="relative overflow-hidden bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-4 animate-scale-in">
			<div class="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl"></div>
			<div class="relative flex items-center gap-4">
				<div class="p-3 bg-emerald-500/15 rounded-xl flex-shrink-0">
					<CircleCheckBig class="w-6 h-6 text-emerald-400" />
				</div>
				<div class="flex-1">
					<h3 class="text-sm font-bold text-white">Survey completed!</h3>
					{#if celebrationPts > 0}
						<p class="text-xs text-emerald-400 font-semibold mt-0.5">+{celebrationPts} points earned</p>
					{:else}
						<p class="text-xs text-neutral-400 mt-0.5">Thanks for participating</p>
					{/if}
				</div>
				<button onclick={() => showCelebration = false} class="p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors flex-shrink-0" aria-label="Dismiss">
					<CircleX class="w-4 h-4" />
				</button>
			</div>
		</div>
	{/if}

	{#if activeTab === 'available'}
		<!-- Search bar (shown when 5+ surveys) -->
		{#if showSearch}
			<div class="relative">
				<Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search surveys..."
					class="input !pl-10 !pr-9 !py-2.5 !text-sm"
				/>
				{#if searchQuery}
					<button onclick={() => searchQuery = ''} class="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-neutral-600 hover:text-white transition-colors" aria-label="Clear search">
						<CircleX class="w-4 h-4" />
					</button>
				{/if}
			</div>
		{/if}

		{#if availableSurveyData.length === 0}
			<div class="card text-center py-20">
				<div class="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
					<ClipboardList class="w-8 h-8 text-neutral-600" />
				</div>
				<h3 class="text-lg font-bold text-white mb-2">No surveys right now</h3>
				<p class="text-neutral-500 mb-6 max-w-xs mx-auto text-sm">Check back later for new earning opportunities.</p>
				<a href="/dashboard" class="btn-secondary">
					<House class="w-4 h-4" />
					Back to Dashboard
				</a>
			</div>
		{:else if filteredSurveys.length === 0}
			<div class="card text-center py-12">
				<Search class="w-8 h-8 text-neutral-600 mx-auto mb-3" />
				<p class="text-sm font-semibold text-white/40">No surveys match "{searchQuery}"</p>
				<button onclick={() => searchQuery = ''} class="text-xs text-primary-400 hover:text-primary-300 mt-2 transition-colors">Clear search</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each filteredSurveys as survey, i}
					{@const a = getAccent(i)}
					<div
						class="group relative bg-surface-100 border rounded-2xl overflow-hidden hover:shadow-xl hover:{a.shadow} transition-all duration-300 hover:-translate-y-1 active:translate-y-0 card-in {survey.priority === 'high' ? 'border-rose-500/30 ring-1 ring-rose-500/20 survey-pulse' : 'border-white/[0.06] hover:border-white/[0.12]'}"
						style="animation-delay: {i * 60}ms"
					>
						<!-- Top gradient accent bar -->
						<div class="h-1 bg-gradient-to-r {survey.priority === 'high' ? 'from-rose-500 to-amber-500' : `${a.from} ${a.to}`}"></div>

						<div class="p-5">
							<!-- Icon + Points badge + Priority -->
							<div class="flex items-start justify-between mb-4">
								<div class="flex items-center gap-2">
									<div class="p-2.5 {a.bg} rounded-xl group-hover:scale-110 transition-transform duration-300">
										<FileText class="w-5 h-5 {a.text}" />
									</div>
									{#if survey.priority === 'high'}
										<span class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25 animate-pulse">Hot</span>
									{/if}
								</div>
								<div class="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 rounded-full ring-1 ring-emerald-500/20">
									<Coins class="w-3 h-3 text-emerald-400" />
									<span class="text-xs font-black text-emerald-400">+{survey.points}</span>
								</div>
							</div>

							<!-- Title -->
							<h3 class="text-sm font-bold text-white mb-1.5 line-clamp-2 leading-snug group-hover:text-white/90 transition-colors">
								{survey.title || 'Untitled Survey'}
							</h3>

							<!-- Description -->
							{#if survey.description}
								<p class="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-4">{survey.description}</p>
							{:else}
								<p class="text-xs text-neutral-600 mb-4">Complete this survey to earn points.</p>
							{/if}

							<!-- CTA Button -->
							<button
								onclick={() => startSurvey(survey.id)}
								class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r {a.from} {a.to} text-white text-sm font-bold rounded-xl opacity-90 group-hover:opacity-100 shadow-lg {a.shadow} hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
							>
								Start Survey
								<ArrowRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		{#if transactions.length === 0}
			<div class="card text-center py-20">
				<div class="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
					<Clock class="w-8 h-8 text-neutral-600" />
				</div>
				<h3 class="text-lg font-bold text-white mb-2">No history yet</h3>
				<p class="text-neutral-500 mb-6 max-w-xs mx-auto text-sm">Complete your first survey to build your history.</p>
				<button onclick={() => activeTab = 'available'} class="btn-primary">
					<Rocket class="w-4 h-4" />
					Browse Surveys
				</button>
			</div>
		{:else}
			<!-- History as cards on mobile, table on desktop -->
			<div class="block md:hidden space-y-2.5">
				{#each transactions as tx}
					{@const ss = getStatusStyle(tx.status)}
					<div class="bg-surface-100 border border-white/[0.06] rounded-xl p-4">
						<div class="flex items-start justify-between mb-2">
							<div class="text-sm font-semibold text-white flex-1 min-w-0 truncate">{tx.surveyTitle}</div>
							<span class="badge {ss.class} ml-2 flex-shrink-0">
								<ss.icon class="w-3 h-3" />
								{tx.status}
							</span>
						</div>
						<div class="flex items-center justify-between text-xs text-neutral-500">
							<span>{formatDate(tx.startedAt)}</span>
							<span class="font-bold text-white">{tx.pointsEarned} pts</span>
						</div>
					</div>
				{/each}
			</div>

			<div class="hidden md:block card !p-0 overflow-hidden">
				<div class="overflow-x-auto">
					<table class="min-w-full">
						<thead>
							<tr class="table-header">
								<th class="table-th">Survey</th>
								<th class="table-th">Status</th>
								<th class="table-th">Points</th>
								<th class="table-th">Time</th>
								<th class="table-th">Started</th>
								<th class="table-th">Completed</th>
							</tr>
						</thead>
						<tbody>
							{#each transactions as transaction}
								{@const statusStyle = getStatusStyle(transaction.status)}
								<tr class="table-row">
									<td class="table-td">
										<div class="text-sm font-medium text-white">{transaction.surveyTitle}</div>
									</td>
									<td class="table-td">
										<span class="badge {statusStyle.class}">
											<statusStyle.icon class="w-3 h-3" />
											{transaction.status}
										</span>
									</td>
									<td class="table-td">
										<span class="font-bold text-white">{transaction.pointsEarned}</span>
									</td>
									<td class="table-td text-neutral-500">
										{formatMinutes(transaction.timeSpentMinutes)}
									</td>
									<td class="table-td text-neutral-500 text-xs">
										{formatDate(transaction.startedAt)}
									</td>
									<td class="table-td text-neutral-500 text-xs">
										{transaction.completedAt ? formatDate(transaction.completedAt) : '--'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}
</div>
