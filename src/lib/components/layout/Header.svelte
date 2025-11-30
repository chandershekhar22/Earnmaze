
<script lang="ts">
	import { page } from '$app/stores';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { onMenuClick }: { onMenuClick?: () => void } = $props();

	// Get current page title and description based on route
	let pageInfo = $derived(getPageInfo($page.route.id));

	function getPageInfo(routeId: string | null): { title: string; description: string } {
		if (!routeId) return { title: 'Dashboard', description: 'Overview of your survey activities' };
		
		const pageMap: Record<string, { title: string; description: string }> = {
			'/(respondent)/dashboard': { 
				title: 'Dashboard', 
				description: 'Overview of your survey activities and earnings' 
			},
			'/(respondent)/surveys': { 
				title: 'Available Surveys', 
				description: 'Participate in surveys to earn points' 
			},
			'/(respondent)/points': { 
				title: 'My Points', 
				description: 'Track your earnings and point history' 
			},
			'/(respondent)/rewards': { 
				title: 'Rewards', 
				description: 'Redeem your points for exciting rewards' 
			},
			'/(respondent)/profile': { 
				title: 'Profile Settings', 
				description: 'Manage your account and preferences' 
			},
			'/(respondent)/history': { 
				title: 'Activity History', 
				description: 'View your completed surveys and transactions' 
			}
		};
		
		return pageMap[routeId] || { title: 'Dashboard', description: 'Overview of your activities' };
	}
</script>

<header class="bg-white border-b border-gray-200 shadow-sm">
	<div class="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
		<!-- Mobile Menu Button & Page Context -->
		<div class="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
			<!-- Mobile menu button -->
			<button
				onclick={onMenuClick}
				class="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
				aria-label="Toggle menu"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
			
			<!-- Page Context -->
			<div class="flex items-center space-x-2 md:space-x-3 min-w-0">
				<div class="hidden md:block w-1 h-10 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full flex-shrink-0"></div>
				<div class="min-w-0">
					<h1 class="text-lg md:text-2xl font-bold text-gray-900 truncate">{pageInfo.title}</h1>
					<p class="hidden sm:block text-xs md:text-sm text-gray-500 truncate">{pageInfo.description}</p>
				</div>
			</div>
		</div>
		
		<!-- Quick Actions -->
		<div class="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
			<!-- Search -->
			<div class="hidden md:flex items-center">
				<div class="relative">
					<input 
						type="text" 
						placeholder="Search surveys..."
						class="w-64 px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
					>
					<svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
						<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
					</svg>
				</div>
			</div>

			<!-- Theme Toggle -->
			<div class="hidden sm:block">
				<ThemeToggle />
			</div>

			<!-- Notifications -->
			<button 
				aria-label="Notifications"
				class="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700">
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
				</svg>
				<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
			</button>

			<!-- Help -->
			<button 
				aria-label="Help"
				class="hidden md:block p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700">
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
				</svg>
			</button>

			<!-- Settings -->
			<button 
				aria-label="Settings"
				class="hidden md:block p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700">
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
				</svg>
			</button>
		</div>
	</div>
</header>
