<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';
	import { Logger } from '$lib/utils/app-logger';
	import type { AvailableSurveyItem, SurveyTransactionsResponse } from '$types/api-responses';
	import { ClipboardList, Clock, House, FileText, ArrowRight, CircleCheckBig, CircleX, Zap, Rocket, Coins, Search } from '@lucide/svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
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

	onMount(() => {
		const completed = $page.url.searchParams.get('completed');
		const pts = $page.url.searchParams.get('pts');
		if (completed && pts) {
			celebrationStatus = completed;
			celebrationPts = parseInt(pts) || 0;
			showCelebration = true;
			const url = new URL($page.url);
			url.searchParams.delete('completed');
			url.searchParams.delete('pts');
			history.replaceState({}, '', url.pathname);
			setTimeout(() => showCelebration = false, 5000);
			if (celebrationPts > 0) {
				toastStore.success('Points Earned!', `You earned ${celebrationPts} points!`);
			} else if (completed === 'disqualified') {
				toastStore.info('Survey Complete', 'You were screened out of this survey.');
			} else {
				toastStore.info('Survey Complete', 'Survey recorded successfully.');
			}
		}

		const refreshInterval = setInterval(() => invalidateAll(), 60_000);
		return () => clearInterval(refreshInterval);
	});

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
			case 'started': return { class: 'bg-primary-400/15 text-primary-400 ring-1 ring-primary-400/20', icon: Zap };
			case 'disqualified': return { class: 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20', icon: CircleX };
			case 'expired': return { class: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20', icon: Clock };
			default: return { class: 'bg-white/5 text-neutral-400 ring-1 ring-white/10', icon: Clock };
		}
	}
</script>

<svelte:head>
	<title>Surveys - EarnMaze</title>
	<meta name="description" content="Browse available surveys and view your survey completion history." />
</svelte:head>

<div class="space-y-[22px] animate-fade-in">
	<InfoBanner id="survey-how" message="Click 'Start' on any survey to begin earning. You'll be redirected to the survey — once done, points are credited automatically. Partial credit may apply for terminated or quota-full surveys." color="primary" />

	<!-- Segmented tabs -->
	<div class="tab-group">
		<button onclick={() => activeTab = 'available'} class={activeTab === 'available' ? 'tab-active' : 'tab'}>
			<ClipboardList class="w-[15px] h-[15px]" />
			Available <span class="font-mono text-[11px] opacity-80">{availableSurveyData.length}</span>
		</button>
		<button onclick={() => activeTab = 'history'} class={activeTab === 'history' ? 'tab-active' : 'tab'}>
			<Clock class="w-[15px] h-[15px]" />
			History <span class="font-mono text-[11px] opacity-80">{transactions.length}</span>
		</button>
	</div>

	{#if showCelebration}
		<div class="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.12] to-primary-400/[0.06] p-4 animate-scale-in">
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
		{#if showSearch}
			<div class="relative">
				<Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search surveys..."
					class="input !pl-10 !pr-9 !py-2.5 !text-sm"
				/>
				{#if searchQuery}
					<button onclick={() => searchQuery = ''} class="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-neutral-500 hover:text-white transition-colors" aria-label="Clear search">
						<CircleX class="w-4 h-4" />
					</button>
				{/if}
			</div>
		{/if}

		{#if availableSurveyData.length === 0}
			<div class="em-panel">
				<div class="em-empty">
					<span class="em-empty-icon"><ClipboardList class="w-[30px] h-[30px]" /></span>
					<h4 class="text-[17px] font-semibold text-white tracking-tight">No surveys right now</h4>
					<p class="text-[13.5px] text-neutral-400 mb-4">Check back later for new earning opportunities.</p>
					<a href="/dashboard" class="btn-secondary"><House class="w-4 h-4" /> Back to dashboard</a>
				</div>
			</div>
		{:else if filteredSurveys.length === 0}
			<div class="em-panel">
				<div class="em-empty">
					<span class="em-empty-icon"><Search class="w-[24px] h-[24px]" /></span>
					<p class="text-sm font-semibold text-white/60">No surveys match "{searchQuery}"</p>
					<button onclick={() => searchQuery = ''} class="text-xs text-primary-400 hover:text-primary-300 mt-1 transition-colors">Clear search</button>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
				{#each filteredSurveys as survey, i}
					<div
						class="group em-stat flex flex-col gap-4 animate-fade-in"
						style="animation-delay: {i * 50}ms"
					>
						<span class="absolute top-0 left-0 right-0 h-[2px] bg-primary-400 opacity-85"></span>
						<div class="flex items-start justify-between gap-2">
							<span class="w-[42px] h-[42px] rounded-[11px] bg-primary-400/12 text-primary-400 grid place-items-center group-hover:scale-105 transition-transform">
								<FileText class="w-[18px] h-[18px]" />
							</span>
							<div class="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 rounded-full ring-1 ring-emerald-500/20">
								<Coins class="w-3 h-3 text-emerald-400" />
								<span class="font-mono text-[11px] font-bold text-emerald-400">+{survey.points}</span>
							</div>
						</div>

						<div class="flex-1">
							<h3 class="text-[15px] font-semibold text-white leading-snug tracking-tight line-clamp-2 mb-1.5">
								{survey.title || 'Untitled Survey'}
							</h3>
							{#if survey.description}
								<p class="text-[12.5px] text-neutral-400 line-clamp-2 leading-relaxed">{survey.description}</p>
							{:else}
								<p class="text-[12.5px] text-neutral-500">Complete this survey to earn points.</p>
							{/if}
						</div>

						<button
							onclick={() => startSurvey(survey.id)}
							class="btn-primary w-full"
						>
							Start survey <ArrowRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
						</button>

						{#if survey.priority === 'high'}
							<span class="absolute top-3 left-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25 animate-pulse">Hot</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		{#if transactions.length === 0}
			<div class="em-panel">
				<div class="em-empty">
					<span class="em-empty-icon"><Clock class="w-[30px] h-[30px]" /></span>
					<h4 class="text-[17px] font-semibold text-white tracking-tight">No history yet</h4>
					<p class="text-[13.5px] text-neutral-400 mb-4">Complete your first survey to build your history.</p>
					<button onclick={() => activeTab = 'available'} class="btn-primary"><Rocket class="w-4 h-4" /> Browse surveys</button>
				</div>
			</div>
		{:else}
			<div class="block md:hidden space-y-2.5">
				{#each transactions as tx}
					{@const ss = getStatusStyle(tx.status)}
					<div class="bg-surface-50 border border-white/[0.07] rounded-xl p-4">
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

			<div class="hidden md:block em-panel">
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
