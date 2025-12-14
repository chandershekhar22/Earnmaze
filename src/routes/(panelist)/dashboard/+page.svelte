<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import type { PanelistDashboardData } from '$lib/types/panelist';
	import SkeletonStats from '$lib/components/SkeletonStats.svelte';
	import SkeletonActivity from '$lib/components/SkeletonActivity.svelte';
	import { page } from '$app/stores';

	let { data }: { data: { dashboardData: PanelistDashboardData } } = $props();

	const { dashboardData } = data;

	// Use real data from the API
	let availableSurveys = $derived(dashboardData?.availableSurveys || 0);
	let completedSurveys = $derived(dashboardData?.engagement?.completedSurveys || 0);
	let pendingRewards = $derived(dashboardData?.points?.pendingPoints || 0);
	let currentPoints = $derived(dashboardData?.points?.currentPoints || 0);
	let lifetimePoints = $derived(dashboardData?.points?.lifetimePoints || 0);
	let qualityScore = $derived(dashboardData?.quality?.qualityScore || 0);
	let streakDays = $derived(dashboardData?.engagement?.streakDays || 0);
	let tier = $derived(dashboardData?.panelist?.tier || 'bronze');
	let completionRate = $derived(dashboardData?.engagement?.completionRate || 0);

	// Simulate loading state for demo
	let isLoading = $state(false);

	let isDataLoaded = $derived(dashboardData && !isLoading);

	// Helper function to format relative time
	function formatRelativeTime(date: Date): string {
		const now = new Date();
		const diffInMs = now.getTime() - date.getTime();
		const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
		const diffInDays = Math.floor(diffInHours / 24);

		if (diffInHours < 1) {
			return 'Just now';
		} else if (diffInHours < 24) {
			return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
		} else {
			return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
		}
	}

	// Helper function to get activity icon
	function getActivityIcon(type: string): string {
		switch (type) {
			case 'earned':
			case 'bonus':
				return '💰';
			case 'redeemed':
				return '🎁';
			case 'survey':
				return '✨';
			default:
				return '📊';
		}
	}

	// Helper function to get activity color
	function getActivityColor(type: string): string {
		switch (type) {
			case 'earned':
			case 'bonus':
			case 'survey':
				return 'text-green-600';
			case 'redeemed':
				return 'text-red-600';
			default:
				return 'text-gray-600';
		}
	}
</script>

<svelte:head>
	<title>Dashboard - EarnMaze Panel</title>
	<meta name="description" content="Your EarnMaze dashboard - manage surveys, points, and rewards." />
</svelte:head>

<!-- Modern Minimal Hero -->
<div class="relative overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-neutral-50 rounded-2xl p-5 md:p-6 mb-5 border border-neutral-200/50">
	<!-- Subtle gradient orbs -->
	<div class="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl"></div>
	<div class="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>
	
	<div class="relative">
		<div class="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/50 rounded-full mb-4">
			<div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
			<span class="text-xs font-medium text-emerald-700">Active</span>
		</div>
		
		<h1 class="text-3xl md:text-5xl font-bold text-neutral-900 mb-3 tracking-tight">
			Welcome back,
			<span class="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
				{authStore.state.user?.name?.split(' ')[0] || 'Earner'}
			</span>
		</h1>
		
		<!-- <p class="text-base md:text-lg text-neutral-600 mb-8 max-w-2xl">
			{#if streakDays > 0}
				<span class="inline-flex items-center gap-2 font-semibold text-orange-600">
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/></svg>
					{streakDays} day streak
				</span>
				— {availableSurveys} surveys ready
			{:else}
				{availableSurveys} surveys waiting for you
			{/if}
		</p> -->
		
		<!-- <div class="flex flex-wrap items-center gap-3">
			<div class="flex items-center gap-3 px-5 py-3 bg-white border border-neutral-200 rounded-2xl shadow-sm">
				<div class="text-2xl">💎</div>
				<div>
					<div class="text-sm text-neutral-500 font-medium">Balance</div>
					<div class="text-xl font-bold text-neutral-900">{currentPoints.toLocaleString()}</div>
				</div>
			</div>
			
			<div class="inline-flex items-center gap-2 px-4 py-3 bg-white border border-neutral-200 rounded-2xl shadow-sm">
				{#if tier === 'platinum'}
					<svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
					<span class="text-sm font-semibold text-purple-600">Platinum</span>
				{:else if tier === 'gold'}
					<svg class="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
					<span class="text-sm font-semibold text-amber-600">Gold</span>
				{:else if tier === 'silver'}
					<svg class="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
					<span class="text-sm font-semibold text-slate-600">Silver</span>
				{:else}
					<svg class="w-5 h-5 text-orange-700" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
					<span class="text-sm font-semibold text-orange-700">Bronze</span>
				{/if}
			</div>
			
			{#if qualityScore > 0}
				<div class="inline-flex items-center gap-2 px-4 py-3 bg-white border border-neutral-200 rounded-2xl shadow-sm">
					<svg class="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
					<span class="text-sm font-semibold text-neutral-900">{qualityScore.toFixed(1)}</span>
					<span class="text-xs text-neutral-500">quality</span>
				</div>
			{/if}
		</div> -->
	</div>
</div>

<div class="space-y-5">
	<!-- Modern Stats Grid -->
	{#if isDataLoaded}
		<div class="grid grid-cols-2 xl:grid-cols-4 gap-3">
			<!-- Current Points -->
			<div class="group bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md hover:border-violet-200 transition-all duration-200">
				<div class="flex items-center justify-between mb-2">
					<div class="p-2 bg-violet-50 rounded-lg">
						<svg class="w-4 h-4 text-violet-600" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/></svg>
					</div>
				</div>
				<div class="text-xs font-medium text-neutral-500 mb-0.5">Current Points</div>
				<div class="text-2xl font-bold text-neutral-900">{currentPoints.toLocaleString()}</div>
			</div>

			<!-- Available Surveys -->
			<div class="group bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all duration-200">
				<div class="flex items-center justify-between mb-2">
					<div class="p-2 bg-blue-50 rounded-lg">
						<svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
					</div>
					{#if availableSurveys > 0}
						<span class="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">New</span>
					{/if}
				</div>
				<div class="text-xs font-medium text-neutral-500 mb-0.5">Available Surveys</div>
				<div class="text-2xl font-bold text-neutral-900">{availableSurveys}</div>
			</div>

			<!-- Completed -->
			<div class="group bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md hover:border-emerald-200 transition-all duration-200">
				<div class="flex items-center justify-between mb-2">
					<div class="p-2 bg-emerald-50 rounded-lg">
						<svg class="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
					</div>
				</div>
				<div class="text-xs font-medium text-neutral-500 mb-0.5">Completed Surveys</div>
				<div class="text-2xl font-bold text-neutral-900">{completedSurveys}</div>
				{#if completionRate > 0}
					<div class="text-xs text-emerald-600 font-medium mt-1">{completionRate.toFixed(0)}% rate</div>
				{/if}
			</div>

			<!-- Pending -->
			<div class="group bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md hover:border-amber-200 transition-all duration-200">
				<div class="flex items-center justify-between mb-2">
					<div class="p-2 bg-amber-50 rounded-lg">
						<svg class="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
					</div>
					{#if pendingRewards > 0}
						<span class="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded">Pending</span>
					{/if}
				</div>
				<div class="text-xs font-medium text-neutral-500 mb-0.5">Pending Rewards</div>
				<div class="text-2xl font-bold text-neutral-900">{pendingRewards}</div>
			</div>
		</div>
	{:else}
		<SkeletonStats />
	{/if}

	<!-- Quick Actions -->
	<div class="bg-white border border-neutral-200 rounded-xl p-4 md:p-5">
		<h2 class="text-base font-bold text-neutral-900 mb-3">Quick Actions</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
			<!-- Take Surveys -->
			<a href="/surveys" class="group flex items-center gap-3 p-4 bg-neutral-50 hover:bg-violet-50 border border-neutral-200 hover:border-violet-300 rounded-xl transition-all duration-200">
				<div class="p-2.5 bg-white border border-neutral-200 group-hover:border-violet-300 rounded-lg transition-colors">
					<svg class="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
				</div>
				<div class="flex-1">
					<div class="font-semibold text-neutral-900 mb-1">Take Surveys</div>
					<div class="text-sm text-neutral-600">Complete surveys and earn rewards</div>
				</div>
				<svg class="w-5 h-5 text-neutral-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
			</a>
			
			<!-- View Points -->
			<a href="/points" class="group flex items-center gap-3 p-4 bg-neutral-50 hover:bg-emerald-50 border border-neutral-200 hover:border-emerald-300 rounded-xl transition-all duration-200">
				<div class="p-2.5 bg-white border border-neutral-200 group-hover:border-emerald-300 rounded-lg transition-colors">
					<svg class="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/></svg>
				</div>
				<div class="flex-1">
					<div class="font-semibold text-neutral-900 mb-1">View Points</div>
					<div class="text-sm text-neutral-600">Check balance and transactions</div>
				</div>
				<svg class="w-5 h-5 text-neutral-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
			</a>
			
			<!-- Redeem Rewards -->
			<a href="/rewards" class="group flex items-center gap-3 p-4 bg-neutral-50 hover:bg-blue-50 border border-neutral-200 hover:border-blue-300 rounded-xl transition-all duration-200">
				<div class="p-2.5 bg-white border border-neutral-200 group-hover:border-blue-300 rounded-lg transition-colors">
					<svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clip-rule="evenodd"/><path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z"/></svg>
				</div>
				<div class="flex-1">
					<div class="font-semibold text-neutral-900 mb-1">Redeem Rewards</div>
					<div class="text-sm text-neutral-600">Exchange points for prizes</div>
				</div>
				<svg class="w-5 h-5 text-neutral-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
			</a>
		</div>
	</div>

	<!-- Recent Activity -->
	{#if isDataLoaded}
		<div class="bg-white border border-neutral-200 rounded-xl p-4 md:p-5">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-base font-bold text-neutral-900">Recent Activity</h2>
				<a href="/history" class="group inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
					View all
					<svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
				</a>
			</div>
			
			<div class="space-y-3">
				{#if dashboardData?.recentActivity && dashboardData.recentActivity.length > 0}
					{#each dashboardData.recentActivity as activity}
						<div class="flex items-center gap-4 p-4 bg-neutral-50 hover:bg-neutral-100 rounded-2xl transition-colors">
							<div class="p-2.5 bg-white border border-neutral-200 rounded-xl flex-shrink-0">
								<svg class="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
									{#if activity.type === 'earned' || activity.type === 'bonus'}
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
									{:else if activity.type === 'redeemed'}
										<path fill-rule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clip-rule="evenodd"/><path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z"/>
									{:else}
										<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
									{/if}
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<div class="font-medium text-neutral-900 mb-0.5 truncate">{activity.description}</div>
								<div class="text-sm text-neutral-500">{formatRelativeTime(activity.createdAt)}</div>
							</div>
							<div class="flex-shrink-0">
								<span class="inline-flex items-center px-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-sm font-semibold {activity.amount > 0 ? 'text-emerald-700' : 'text-neutral-700'}">
									{activity.amount > 0 ? '+' : ''}{activity.amount.toLocaleString()}
								</span>
							</div>
						</div>
					{/each}
				{:else}
					<div class="text-center py-12">
						<div class="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<svg class="w-8 h-8 text-neutral-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
						</div>
						<p class="text-neutral-600 text-sm">No recent activity yet. Start completing surveys to see your progress!</p>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<SkeletonActivity />
	{/if}
</div>
