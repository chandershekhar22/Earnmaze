<script lang="ts">
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { pointsStore } from '$lib/stores/points.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { isOpen = $bindable(false) }: { isOpen?: boolean } = $props();

	async function handleLogout() {
		await authStore.logout();
		goto('/');
	}

	function navigateTo(href: string) {
		goto(href);
		// Close mobile menu after navigation
		isOpen = false;
	}

	// Reactive function that updates when page changes
	let isActive = $derived.by(() => (href: string) => {
		return $page.url.pathname === href;
	});

	// Navigation items for respondents only with modern SVG icons
	let navigationItems = $state([
		{ 
			name: 'Dashboard', 
			href: '/dashboard', 
			icon: 'home' 
		},
		{ 
			name: 'Available Surveys', 
			href: '/surveys', 
			icon: 'clipboard' 
		},
		{ 
			name: 'My Points', 
			href: '/points', 
			icon: 'points' 
		},
		{ 
			name: 'Rewards', 
			href: '/rewards', 
			icon: 'star' 
		},
		{ 
			name: 'Profile', 
			href: '/profile', 
			icon: 'user' 
		},
	]);

	// Track if points have been fetched to prevent infinite loops
	let pointsFetched = $state(false);

	// Fetch points on mount
	onMount(async () => {
		if (authStore.state.user && !pointsFetched) {
			pointsFetched = true;
			await pointsStore.fetchPoints();
		}
	});
</script>

<!-- Mobile Overlay -->
{#if isOpen}
	<button 
		type="button"
		class="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
		onclick={() => isOpen = false}
		aria-label="Close navigation overlay"
	></button>
{/if}

<aside class="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 flex flex-col transform transition-transform duration-300 ease-in-out {isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}">
	<!-- Header -->
	<div class="p-6 border-b border-neutral-200 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl flex items-center justify-center">
				<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
				</svg>
			</div>
			<div>
				<div class="text-xl font-bold text-neutral-900">
					EarnMaze
				</div>
				<div class="text-xs text-neutral-500">Survey Panel</div>
			</div>
		</div>
		<!-- Close button for mobile -->
		<button 
			onclick={() => isOpen = false}
			aria-label="Close sidebar"
			class="lg:hidden p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>
	
	<!-- Navigation -->
	<nav class="flex-1 p-3 md:p-4 space-y-1.5 md:space-y-2 overflow-y-auto">
		{#each navigationItems as item}
			<button
				onclick={() => navigateTo(item.href)}
				class="w-full group flex items-center px-3 md:px-4 py-2.5 md:py-3 text-sm font-medium rounded-lg md:rounded-xl transition-all duration-200 active:scale-[0.98] md:hover:scale-105 touch-manipulation {isActive(item.href) 
					? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20' 
					: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'}"
			>
				<span class="mr-3 flex-shrink-0 {isActive(item.href) ? 'text-white' : 'text-neutral-500 group-hover:text-violet-600'}">
					{#if item.icon === 'home'}
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
						</svg>
					{:else if item.icon === 'clipboard'}
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
						</svg>
					{:else if item.icon === 'points'}
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H11V21H5V3H13V9H21ZM20.5 11.27L21.73 12.5L16.73 17.5L13.23 14L14.46 12.77L16.73 15.04L20.5 11.27Z"/>
						</svg>
					{:else if item.icon === 'star'}
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 2l3.09 6.26L22 9l-5 4.87 1.18 6.88L12 17.77l-6.18 2.98L7 14.87 2 9l6.91-1.74L12 2z"/>
						</svg>
					{:else if item.icon === 'user'}
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
						</svg>
					{:else if item.icon === 'history'}
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z"/>
						</svg>
					{:else}
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 2l3.09 6.26L22 9l-5 4.87 1.18 6.88L12 17.77l-6.18 2.98L7 14.87 2 9l6.91-1.74L12 2z"/>
						</svg>
					{/if}
				</span>
				<span class="truncate">{item.name}</span>
				{#if isActive(item.href)}
					<div class="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
				{/if}
			</button>
		{/each}
	</nav>
	
	<!-- Points Display -->
	<div class="p-4 bg-amber-50 border-y border-neutral-200">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<svg class="w-5 h-5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
					<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
				</svg>
				<span class="text-sm text-neutral-600 truncate">Balance</span>
			</div>
			<span class="text-lg font-bold text-amber-700 flex-shrink-0">{(pointsStore.data?.availablePoints ?? 0).toLocaleString()}</span>
		</div>
	</div>
	
	<!-- Footer -->
	<div class="p-4 border-t border-neutral-200 space-y-3">
		<!-- Logout Button -->
		<button
			onclick={handleLogout}
			class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all"
		>
			<svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
				<path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
			</svg>
			<span>Sign Out</span>
		</button>
		
		<!-- Copyright -->
		<div class="text-center text-xs text-neutral-400">
			© 2025 EarnMaze
		</div>
	</div>
</aside>
