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

<!-- <div class="container"> -->
<!-- Modern Hero Welcome Section -->
<div class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 rounded-2xl md:rounded-3xl p-5 md:p-8 mb-6 md:mb-8">
	<!-- Background Pattern -->
	<div class="absolute inset-0 opacity-30">
		<div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%227%22%20cy%3D%227%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
	</div>
	
	<!-- Floating Elements -->
	<div class="absolute top-4 right-4 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 blur-xl animate-pulse"></div>
	<div class="absolute bottom-4 left-4 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-20 blur-xl animate-pulse delay-1000"></div>
	
	<div class="relative flex items-center justify-between">
		<div class="flex-1">
			<div class="inline-flex items-center px-2.5 py-1 md:px-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs font-medium text-white/80 mb-3 md:mb-4">
				<span class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
				Online now
			</div>
		<h1 class="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3 leading-tight">
			Welcome back, <br class="hidden sm:block">
			<span class="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
				{authStore.state.user?.name?.split(' ')[0] || 'Earner'}
			</span>! 
		</h1>
			<p class="text-sm md:text-lg text-white/70 mb-4 md:mb-6 max-w-lg">
				Ready to turn your opinions into rewards? You have <span class="font-semibold text-blue-300"> active surveys</span> waiting for you.
			</p>
			<div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
				<div class="inline-flex items-center px-4 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl md:rounded-2xl font-semibold shadow-lg text-sm md:text-base">
					<span class="text-base md:text-lg mr-2">💎</span>
					{dashboardData?.points?.currentPoints.toLocaleString()} points
				</div>
				<div class="inline-flex items-center px-3 py-2 md:px-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 rounded-lg md:rounded-xl text-xs md:text-sm">
					Level: Pro Earner
				</div>
			</div>
		</div>
		<div class="hidden lg:block">
			<div class="relative">
				<div class="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 blur-2xl animate-pulse"></div>
				<div class="absolute inset-0 flex items-center justify-center text-6xl">🎯</div>
			</div>
		</div>
	</div>
</div>

<div class="space-y-8">
	<!-- Ultra-Modern Stats Overview -->
	{#if isDataLoaded}
		<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
			<!-- Total Points Card -->
			<div class="group relative">
				<div class="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl md:rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
				<div class="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl md:rounded-2xl p-5 md:p-6 hover:bg-white/90 transition-all duration-300 active:scale-[0.98] md:hover:scale-[1.02]">
					<div class="flex items-start justify-between mb-3 md:mb-4">
						<div class="p-2.5 md:p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg md:rounded-xl shadow-lg">
							<span class="text-xl md:text-2xl">💎</span>
						</div>
						<div class="text-right">
							<div class="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
								+12% this week
							</div>
						</div>
					</div>
					<h3 class="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Total Points</h3>
					<p class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{dashboardData?.points?.currentPoints.toLocaleString()}</p>
					<div class="flex items-center text-xs md:text-sm text-gray-500">
						<div class="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
						Active balance
					</div>
				</div>
			</div>

			<!-- Available Surveys Card -->
			<div class="group relative">
				<div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl md:rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
				<div class="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl md:rounded-2xl p-5 md:p-6 hover:bg-white/90 transition-all duration-300 active:scale-[0.98] md:hover:scale-[1.02]">
					<div class="flex items-start justify-between mb-3 md:mb-4">
						<div class="p-2.5 md:p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg md:rounded-xl shadow-lg">
							<span class="text-xl md:text-2xl">📋</span>
						</div>
						<div class="text-right">
							<div class="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
								{availableSurveys > 0 ? 'New today' : 'Up to date'}
							</div>
						</div>
					</div>
					<h3 class="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Available Surveys</h3>
					<p class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{availableSurveys}</p>
					<div class="flex items-center text-xs md:text-sm text-gray-500">
						<div class="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
						Ready to complete
					</div>
				</div>
			</div>

			<!-- Completed Surveys Card -->
			<div class="group relative">
				<div class="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl md:rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
				<div class="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl md:rounded-2xl p-5 md:p-6 hover:bg-white/90 transition-all duration-300 active:scale-[0.98] md:hover:scale-[1.02]">
					<div class="flex items-start justify-between mb-3 md:mb-4">
						<div class="p-2.5 md:p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg md:rounded-xl shadow-lg">
							<span class="text-xl md:text-2xl">✨</span>
						</div>
						<div class="text-right">
							<div class="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
								All time
							</div>
						</div>
					</div>
					<h3 class="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Completed</h3>
					<p class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{completedSurveys}</p>
					<div class="flex items-center text-xs md:text-sm text-gray-500">
						<div class="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
						Surveys finished
					</div>
				</div>
			</div>

			<!-- Pending Rewards Card -->
			<div class="group relative">
				<div class="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl md:rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
				<div class="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl md:rounded-2xl p-5 md:p-6 hover:bg-white/90 transition-all duration-300 active:scale-[0.98] md:hover:scale-[1.02]">
					<div class="flex items-start justify-between mb-3 md:mb-4">
						<div class="p-2.5 md:p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg md:rounded-xl shadow-lg">
							<span class="text-xl md:text-2xl">🎁</span>
						</div>
						<div class="text-right">
							<div class="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
								Processing
							</div>
						</div>
					</div>
					<h3 class="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Pending Rewards</h3>
					<p class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{pendingRewards}</p>
					<div class="flex items-center text-xs md:text-sm text-gray-500">
						<div class="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
						Being processed
					</div>
				</div>
			</div>
		</div>
	{:else}
		<SkeletonStats />
	{/if}

	<!-- Ultra-Modern Quick Actions -->
	<div class="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-xl">
		<!-- Background Pattern -->
		<div class="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white/50"></div>
		<div class="absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
		
		<div class="relative">
			<div class="flex items-center mb-6 md:mb-8">
				<div class="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg md:rounded-xl flex items-center justify-center mr-3 md:mr-4 shadow-lg">
					<span class="text-white text-base md:text-lg">⚡</span>
				</div>
				<div>
					<h2 class="text-xl md:text-2xl font-bold text-gray-900">Quick Actions</h2>
					<p class="text-gray-600 text-xs md:text-sm">Jump into your earning activities</p>
				</div>
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
				<!-- Take Surveys Action -->
				<a href="/surveys" class="group relative touch-manipulation">
					<div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl md:rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
					<div class="relative bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl md:rounded-2xl p-5 md:p-6 hover:bg-white/90 transition-all duration-300 active:scale-[0.98] md:hover:scale-[1.02] md:hover:-translate-y-1">
						<div class="absolute top-3 right-3 md:top-4 md:right-4 w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-full opacity-40"></div>
						<div class="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 shadow-lg group-hover:scale-110 transition-transform">
							<span class="text-xl md:text-2xl text-white">📋</span>
						</div>
						<h3 class="font-bold text-gray-900 mb-1.5 md:mb-2 text-base md:text-lg">Take Surveys</h3>
						<p class="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 leading-relaxed">Complete surveys to earn points and unlock amazing rewards</p>
						<div class="flex items-center text-blue-600 text-xs md:text-sm font-semibold">
							Start earning
							<span class="ml-2 group-hover:translate-x-1 transition-transform">→</span>
						</div>
					</div>
				</a>
				
				<!-- View Points Action -->
				<a href="/points" class="group relative touch-manipulation">
					<div class="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl md:rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
					<div class="relative bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl md:rounded-2xl p-5 md:p-6 hover:bg-white/90 transition-all duration-300 active:scale-[0.98] md:hover:scale-[1.02] md:hover:-translate-y-1">
						<div class="absolute top-3 right-3 md:top-4 md:right-4 w-7 h-7 md:w-8 md:h-8 bg-emerald-100 rounded-full opacity-40"></div>
						<div class="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 shadow-lg group-hover:scale-110 transition-transform">
							<span class="text-xl md:text-2xl text-white">💰</span>
						</div>
						<h3 class="font-bold text-gray-900 mb-1.5 md:mb-2 text-base md:text-lg">View Points</h3>
						<p class="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 leading-relaxed">Track your balance and detailed transaction history</p>
						<div class="flex items-center text-emerald-600 text-xs md:text-sm font-semibold">
							Check balance
							<span class="ml-2 group-hover:translate-x-1 transition-transform">→</span>
						</div>
					</div>
				</a>
				
				<!-- Redeem Rewards Action -->
				<a href="/rewards" class="group relative touch-manipulation">
					<div class="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl md:rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
					<div class="relative bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl md:rounded-2xl p-5 md:p-6 hover:bg-white/90 transition-all duration-300 active:scale-[0.98] md:hover:scale-[1.02] md:hover:-translate-y-1">
						<div class="absolute top-3 right-3 md:top-4 md:right-4 w-7 h-7 md:w-8 md:h-8 bg-purple-100 rounded-full opacity-40"></div>
						<div class="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 shadow-lg group-hover:scale-110 transition-transform">
							<span class="text-xl md:text-2xl text-white">🎁</span>
						</div>
						<h3 class="font-bold text-gray-900 mb-1.5 md:mb-2 text-base md:text-lg">Redeem Rewards</h3>
						<p class="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 leading-relaxed">Exchange points for gift cards and amazing prizes</p>
						<div class="flex items-center text-purple-600 text-xs md:text-sm font-semibold">
							Browse rewards
							<span class="ml-2 group-hover:translate-x-1 transition-transform">→</span>
						</div>
					</div>
				</a>
			</div>
		</div>
	</div>

	<!-- Ultra-Modern Recent Activity -->
	{#if isDataLoaded}
		<div class="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-xl">
			<!-- Background Pattern -->
			<div class="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white/50"></div>
			<div class="absolute bottom-0 left-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-tr from-purple-100/30 to-pink-100/30 rounded-full blur-3xl"></div>
			
			<div class="relative">
				<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
					<div class="flex items-center">
						<div class="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-r from-gray-700 to-gray-900 rounded-lg md:rounded-xl flex items-center justify-center mr-3 md:mr-4 shadow-lg">
							<span class="text-white text-base md:text-lg">📊</span>
						</div>
						<div>
							<h2 class="text-xl md:text-2xl font-bold text-gray-900">Recent Activity</h2>
							<p class="text-gray-600 text-xs md:text-sm">Your latest earning activities</p>
						</div>
					</div>
					<a href="/history" class="group inline-flex items-center px-3 py-2 md:px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-colors duration-200 touch-manipulation">
						View all
						<span class="ml-2 group-hover:translate-x-1 transition-transform">→</span>
					</a>
				</div>
				
				<div class="space-y-3 md:space-y-4">
					{#if dashboardData?.recentActivity && dashboardData.recentActivity.length > 0}
						{#each dashboardData.recentActivity as activity}
							<div class="group relative touch-manipulation">
								<div class="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								<div class="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 md:p-6 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl md:rounded-2xl hover:bg-white/90 transition-all duration-300 active:scale-[0.99]">
									<div class="flex items-center w-full sm:w-auto">
										<div class="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg md:rounded-xl flex items-center justify-center mr-3 md:mr-4 shadow-lg flex-shrink-0">
											<span class="text-white font-bold text-base md:text-lg">{getActivityIcon(activity.type)}</span>
										</div>
										<div class="flex-1 min-w-0">
											<p class="font-semibold text-gray-900 mb-1 text-sm md:text-base truncate">{activity.description}</p>
											<div class="flex items-center text-xs md:text-sm text-gray-500">
												<div class="w-2 h-2 bg-emerald-400 rounded-full mr-2 flex-shrink-0"></div>
												{formatRelativeTime(activity.createdAt)}
											</div>
										</div>
									</div>
									<div class="text-left sm:text-right w-full sm:w-auto">
										<div class="inline-flex items-center px-2.5 py-1 md:px-3 bg-emerald-100 text-emerald-800 rounded-full text-xs md:text-sm font-semibold shadow-sm">
											{activity.amount > 0 ? '+' : ''}{activity.amount.toLocaleString()} points
										</div>
									</div>
								</div>
							</div>
						{/each}
					{:else}
						<div class="text-center py-8 md:py-12">
							<div class="text-3xl md:text-4xl mb-2">📊</div>
							<p class="text-gray-600 text-sm md:text-base px-4">No recent activity yet. Start completing surveys to see your progress!</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<SkeletonActivity />
	{/if}
</div>
