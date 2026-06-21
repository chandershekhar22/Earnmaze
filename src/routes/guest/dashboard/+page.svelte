<script lang="ts">
	import { goto } from '$app/navigation';
	import { guestStore } from '$lib/stores/guest.svelte';
	import { onMount } from 'svelte';
	import { Logger, Features } from '$lib/utils/app-logger';
	import { AlertTriangle, CircleCheck, CircleDollarSign, ClipboardList, Eye, Info } from '@lucide/svelte';

	let mounted = $state(false);
	let timeRemaining = $state('');
	let showWelcomeBack = $state(false);
	let isFirstVisit = $state(false);

	onMount(() => {
		mounted = true;
		Features.trackPageView('/guest/dashboard');

		// Check URL parameters for survey return
		const params = new URLSearchParams(window.location.search);
		const fromSurvey = params.get('from') === 'survey';
		const completed = params.get('completed') === 'true';
		const isNew = params.get('new') === 'true';

		if (fromSurvey && completed) {
			showWelcomeBack = true;
			// Hide welcome message after 5 seconds
			setTimeout(() => {
				showWelcomeBack = false;
				// Clean URL
				window.history.replaceState({}, '', '/guest/dashboard');
			}, 5000);
		}

		if (isNew) {
			isFirstVisit = true;
			setTimeout(() => {
				isFirstVisit = false;
			}, 8000);
		}

		loadDashboard();
	});

	async function loadDashboard() {
		await guestStore.fetchDashboard();

		if (!guestStore.isAuthenticated) {
			goto('/');
		}
	}

	// Calculate time remaining
	$effect(() => {
		if (guestStore.data?.expiresAt) {
			const updateTime = () => {
				const expires = new Date(guestStore.data!.expiresAt);
				const now = new Date();
				const diff = expires.getTime() - now.getTime();

				if (diff <= 0) {
					timeRemaining = 'Expired';
					goto('/');
					return;
				}

				const hours = Math.floor(diff / (1000 * 60 * 60));
				const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
				timeRemaining = `${hours}h ${minutes}m`;
			};

			updateTime();
			const interval = setInterval(updateTime, 60000); // Update every minute

			return () => clearInterval(interval);
		}
	});

	function handleSurveyClick(surveyId: string) {
		Features.trackUserAction('guest-survey-click', 'guest-dashboard', { surveyId });
		Logger.root.info({ context: 'ui', surveyId }, 'Guest clicked survey');
		goto(`/start-survey?surveyId=${surveyId}&source=guest`);
	}

	async function handleUpgradeClick() {
		Features.trackUserAction('upgrade-click', 'guest-dashboard');
		goto('/guest/upgrade');
	}

	async function handleLogout() {
		await guestStore.logout();
		goto('/');
	}
</script>

<svelte:head>
	<title>Guest Dashboard - EarnMaze Panel</title>
</svelte:head>

<div class="min-h-screen bg-surface py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		{#if guestStore.isLoading}
			<div class="text-center py-12">
				<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
				<p class="mt-4 text-neutral-400">Loading your dashboard...</p>
			</div>
		{:else if guestStore.error}
			<div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 text-center">
				<p class="text-rose-400">{guestStore.error}</p>
				<button
					onclick={loadDashboard}
					class="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
				>
					Retry
				</button>
			</div>
		{:else if guestStore.data}
			<!-- Welcome Back Banner (after survey) -->
			{#if showWelcomeBack}
				<div class="bg-emerald-500/10 border-s-4 border-emerald-500 p-4 mb-6 animate-fade-in rounded-e-xl">
					<div class="flex items-start">
						<div class="flex-shrink-0">
							<CircleCheck class="h-6 w-6 text-emerald-400" />
						</div>
						<div class="ms-3 flex-1">
							<h3 class="text-sm font-medium text-emerald-300">Welcome back!</h3>
							<p class="mt-1 text-sm text-emerald-400/80">
								Great job completing the survey! Your progress has been saved. Check out more surveys below to earn more points.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- First Visit Banner -->
			{#if isFirstVisit}
				<div class="bg-violet-500/10 border-s-4 border-violet-500 p-4 mb-6 animate-fade-in rounded-e-xl">
					<div class="flex items-start">
						<div class="flex-shrink-0">
							<Info class="h-6 w-6 text-violet-400" />
						</div>
						<div class="ms-3 flex-1">
							<h3 class="text-sm font-medium text-violet-300">Welcome to EarnMaze!</h3>
							<p class="mt-1 text-sm text-violet-400/80">
								Your account has been created! Complete surveys to earn points. Create a full account later to redeem rewards and save your progress permanently.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Session Info Banner -->
			<div class="bg-amber-500/10 border-s-4 border-amber-500 p-4 mb-6 rounded-e-xl">
				<div class="flex items-start">
					<div class="flex-shrink-0">
						<AlertTriangle class="h-5 w-5 text-amber-400" />
					</div>
					<div class="ms-3 flex-1">
						<p class="text-sm text-amber-300/90">
							<strong>Guest Session</strong> - You're viewing a limited dashboard.
							<button onclick={handleUpgradeClick} class="underline font-semibold hover:text-amber-200">
								Create an account
							</button> to access full features and save your progress.
						</p>
					</div>
				</div>
			</div>

			<!-- Header -->
			<div class="bg-surface-100 rounded-2xl border border-white/[0.06] p-6 mb-6">
				<div class="flex justify-between items-start">
					<div>
						<h1 class="text-2xl font-bold text-white">Guest Dashboard</h1>
						<p class="text-neutral-400 mt-1">{guestStore.data.email}</p>
					</div>
					<div class="text-end">
						<p class="text-sm text-neutral-500">Session expires in</p>
						<p class="text-lg font-semibold text-white">{timeRemaining}</p>
						<button
							onclick={handleLogout}
							class="mt-2 text-sm text-rose-400 hover:text-rose-300"
						>
							End Session
						</button>
					</div>
				</div>
			</div>

			<!-- Stats -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<div class="bg-surface-100 rounded-2xl border border-white/[0.06] p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0 bg-violet-500/10 rounded-xl p-3">
							<CircleDollarSign class="h-6 w-6 text-violet-400" />
						</div>
						<div class="ms-5">
							<p class="text-sm font-medium text-neutral-500">Session Points</p>
							<p class="text-2xl font-semibold text-white">{guestStore.data.sessionPoints}</p>
						</div>
					</div>
				</div>

				<div class="bg-surface-100 rounded-2xl border border-white/[0.06] p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0 bg-emerald-500/10 rounded-xl p-3">
							<Eye class="h-6 w-6 text-emerald-400" />
						</div>
						<div class="ms-5">
							<p class="text-sm font-medium text-neutral-500">Surveys Viewed</p>
							<p class="text-2xl font-semibold text-white">{guestStore.data.surveysViewed}</p>
						</div>
					</div>
				</div>

				<div class="bg-surface-100 rounded-2xl border border-white/[0.06] p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0 bg-indigo-500/10 rounded-xl p-3">
							<ClipboardList class="h-6 w-6 text-indigo-400" />
						</div>
						<div class="ms-5">
							<p class="text-sm font-medium text-neutral-500">Surveys Completed</p>
							<p class="text-2xl font-semibold text-white">{guestStore.data.surveysCompleted}</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Available Surveys -->
			<div class="bg-surface-100 rounded-2xl border border-white/[0.06] p-6 mb-8">
				<div class="flex justify-between items-center mb-6">
					<h2 class="text-xl font-bold text-white">Available Surveys</h2>
					<span class="text-sm text-neutral-500">
						{guestStore.data.availableSurveys.length} surveys available
					</span>
				</div>

				{#if guestStore.data.availableSurveys.length === 0}
					<p class="text-center text-neutral-500 py-8">No surveys available at the moment</p>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each guestStore.data.availableSurveys as survey}
							<div class="border border-white/[0.06] rounded-xl p-4 hover:border-violet-500/30 transition-colors bg-surface-200">
								<div class="flex justify-between items-start mb-2">
									<h3 class="font-semibold text-white flex-1">{survey.title}</h3>
								</div>

								<p class="text-sm text-neutral-400 mb-4 line-clamp-2">{survey.description || 'No description'}</p>

								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center space-x-4">
										<span class="text-emerald-400 font-semibold">{survey.points} points</span>
										{#if survey.estimatedMinutes}
											<span class="text-neutral-500">{survey.estimatedMinutes} min</span>
										{/if}
										{#if survey.category}
											<span class="text-neutral-500 capitalize">{survey.category}</span>
										{/if}
									</div>
									<button
										onclick={() => handleSurveyClick(survey.id)}
										class="px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-500 hover:to-indigo-500 text-sm"
									>
										Start
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Upgrade CTA -->
			<div class="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
				<div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
				<div class="relative">
					<h2 class="text-2xl font-bold mb-2">Unlock Full Access</h2>
					<p class="mb-6 text-violet-100/80">
						Create a free account to save your progress, redeem rewards, and access your complete history.
					</p>
					<button
						onclick={handleUpgradeClick}
						class="px-8 py-3 bg-white text-violet-600 font-semibold rounded-lg hover:bg-white/90 transition-colors"
					>
						Create Free Account
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.animate-fade-in {
		animation: fadeIn 0.5s ease-in;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
