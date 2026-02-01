<script lang="ts">
	import { goto } from '$app/navigation';
	import { guestStore } from '$lib/stores/guest.svelte';
	import { onMount } from 'svelte';
	import { Logger, Features } from '$lib/utils/app-logger';

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

<div class="min-h-screen bg-neutral-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		{#if guestStore.isLoading}
			<div class="text-center py-12">
				<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
				<p class="mt-4 text-neutral-600">Loading your dashboard...</p>
			</div>
		{:else if guestStore.error}
			<div class="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
				<p class="text-rose-800">{guestStore.error}</p>
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
				<div class="bg-emerald-50 border-l-4 border-emerald-400 p-4 mb-6 animate-fade-in rounded-r-xl">
					<div class="flex items-start">
						<div class="flex-shrink-0">
							<svg class="h-6 w-6 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
						</div>
						<div class="ml-3 flex-1">
							<h3 class="text-sm font-medium text-emerald-800">Welcome back!</h3>
							<p class="mt-1 text-sm text-emerald-700">
								Great job completing the survey! Your progress has been saved. Check out more surveys below to earn more points.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- First Visit Banner -->
			{#if isFirstVisit}
				<div class="bg-violet-50 border-l-4 border-violet-400 p-4 mb-6 animate-fade-in rounded-r-xl">
					<div class="flex items-start">
						<div class="flex-shrink-0">
							<svg class="h-6 w-6 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
							</svg>
						</div>
						<div class="ml-3 flex-1">
							<h3 class="text-sm font-medium text-violet-800">Welcome to EarnMaze! 🎉</h3>
							<p class="mt-1 text-sm text-violet-700">
								Your account has been created! Complete surveys to earn points. Create a full account later to redeem rewards and save your progress permanently.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Session Info Banner -->
			<div class="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-xl">
				<div class="flex items-start">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
						</svg>
					</div>
					<div class="ml-3 flex-1">
						<p class="text-sm text-amber-700">
							<strong>Guest Session</strong> - You're viewing a limited dashboard. 
							<button onclick={handleUpgradeClick} class="underline font-semibold hover:text-amber-900">
								Create an account
							</button> to access full features and save your progress.
						</p>
					</div>
				</div>
			</div>

			<!-- Header -->
			<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
				<div class="flex justify-between items-start">
					<div>
						<h1 class="text-2xl font-bold text-neutral-900">Guest Dashboard</h1>
						<p class="text-neutral-600 mt-1">{guestStore.data.email}</p>
					</div>
					<div class="text-right">
						<p class="text-sm text-neutral-500">Session expires in</p>
						<p class="text-lg font-semibold text-neutral-900">{timeRemaining}</p>
						<button
							onclick={handleLogout}
							class="mt-2 text-sm text-rose-600 hover:text-rose-800"
						>
							End Session
						</button>
					</div>
				</div>
			</div>

			<!-- Stats -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0 bg-violet-100 rounded-xl p-3">
							<svg class="h-6 w-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
							</svg>
						</div>
						<div class="ml-5">
							<p class="text-sm font-medium text-neutral-500">Session Points</p>
							<p class="text-2xl font-semibold text-neutral-900">{guestStore.data.sessionPoints}</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0 bg-emerald-100 rounded-xl p-3">
							<svg class="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
							</svg>
						</div>
						<div class="ml-5">
							<p class="text-sm font-medium text-neutral-500">Surveys Viewed</p>
							<p class="text-2xl font-semibold text-neutral-900">{guestStore.data.surveysViewed}</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0 bg-indigo-100 rounded-xl p-3">
							<svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
							</svg>
						</div>
						<div class="ml-5">
							<p class="text-sm font-medium text-neutral-500">Surveys Completed</p>
							<p class="text-2xl font-semibold text-neutral-900">{guestStore.data.surveysCompleted}</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Available Surveys -->
			<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8">
				<div class="flex justify-between items-center mb-6">
					<h2 class="text-xl font-bold text-neutral-900">Available Surveys</h2>
					<span class="text-sm text-neutral-500">
						{guestStore.data.availableSurveys.length} surveys available
					</span>
				</div>

				{#if guestStore.data.availableSurveys.length === 0}
					<p class="text-center text-neutral-500 py-8">No surveys available at the moment</p>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each guestStore.data.availableSurveys as survey}
							<div class="border border-neutral-200 rounded-xl p-4 hover:border-violet-300 transition-colors bg-white">
								<div class="flex justify-between items-start mb-2">
									<h3 class="font-semibold text-neutral-900 flex-1">{survey.title}</h3>
								</div>
								
								<p class="text-sm text-neutral-600 mb-4 line-clamp-2">{survey.description || 'No description'}</p>
								
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center space-x-4">
										<span class="text-emerald-600 font-semibold">{survey.points} points</span>
										{#if survey.estimatedMinutes}
											<span class="text-neutral-500">{survey.estimatedMinutes} min</span>
										{/if}
										{#if survey.category}
											<span class="text-neutral-500 capitalize">{survey.category}</span>
										{/if}
									</div>
									<button
										onclick={() => handleSurveyClick(survey.id)}
										class="px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 text-sm"
									>
										View
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Upgrade CTA -->
			<div class="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-lg p-8 text-center text-white">
				<h2 class="text-2xl font-bold mb-2">Unlock Full Access</h2>
				<p class="mb-6 text-violet-100">
					Create a free account to save your progress, redeem rewards, and access your complete history.
				</p>
				<button
					onclick={handleUpgradeClick}
					class="px-8 py-3 bg-white text-violet-600 font-semibold rounded-lg hover:bg-violet-50 transition-colors"
				>
					Create Free Account
				</button>
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
