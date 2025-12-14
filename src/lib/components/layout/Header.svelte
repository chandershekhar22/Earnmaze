
<script lang="ts">
	import { page } from '$app/stores';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { onMenuClick }: { onMenuClick?: () => void } = $props();

	// Get current page title and description based on route
	let pageInfo = $derived(getPageInfo($page.route.id));

	function getPageInfo(routeId: string | null): { title: string; description: string } {
		if (!routeId) return { title: 'Dashboard', description: 'Overview of your survey activities' };
		
		const pageMap: Record<string, { title: string; description: string }> = {
			'/(panelist)/dashboard': { 
				title: 'Dashboard', 
				description: 'Overview of your survey activities and earnings' 
			},
			'/(panelist)/surveys': { 
				title: 'Available Surveys', 
				description: 'Participate in surveys to earn points' 
			},
			'/(panelist)/points': { 
				title: 'My Points', 
				description: 'Track your earnings and point history' 
			},
			'/(panelist)/rewards': { 
				title: 'Rewards', 
				description: 'Redeem your points for exciting rewards' 
			},
			'/(panelist)/profile': { 
				title: 'Profile', 
				description: 'Manage your account and preferences' 
			},
			'/(panelist)/history': { 
				title: 'History', 
				description: 'View your completed surveys and transactions' 
			}
		};
		
		return pageMap[routeId] || { title: 'Dashboard', description: 'Overview of your activities' };
	}
</script>

<header class="bg-white border-b border-neutral-200">
	<div class="flex items-center justify-between px-4 md:px-6 py-4">
		<!-- Mobile Menu Button & Page Context -->
		<div class="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
			<!-- Mobile menu button -->
			<button
				onclick={onMenuClick}
				class="lg:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
				aria-label="Toggle menu"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
			
			<!-- Page Context -->
			<div class="min-w-0">
				<h1 class="text-xl md:text-2xl font-bold text-neutral-900 truncate">{pageInfo.title}</h1>
				<p class="hidden sm:block text-sm text-neutral-500 truncate">{pageInfo.description}</p>
			</div>
		</div>
		
		<!-- Quick Actions -->
		<div class="flex items-center gap-2 flex-shrink-0">
			<!-- Search -->
			<div class="hidden md:flex items-center">
				<div class="relative">
					<input 
						type="text" 
						placeholder="Search..."
						class="w-64 px-4 py-2 pl-10 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
					>
					<svg class="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
						<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
					</svg>
				</div>
			</div>

			<!-- Notifications -->
			<button 
				aria-label="Notifications"
				class="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors">
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
				</svg>
				<div class="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full"></div>
			</button>

			<!-- Profile -->
			<button 
				aria-label="Profile"
				class="p-1.5 hover:bg-neutral-100 rounded-xl transition-colors">
				<div class="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl flex items-center justify-center">
					<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
					</svg>
				</div>
			</button>
		</div>
	</div>
</header>
