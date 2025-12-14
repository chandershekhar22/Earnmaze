<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { getDashboardUrl } from '$lib/utils/dashboard-routing';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	let mounted = $state(false);
	let authChecked = $state(false);

	onMount(() => {
		mounted = true;
	});

	$effect(() => {
		// Wait for auth store to finish loading before making routing decisions
		if (mounted && !authStore.state.isLoading && !authChecked) {
			authChecked = true;

			if (authStore.state.user) {
				// Redirect to appropriate dashboard based on user type
				const dashboardUrl = getDashboardUrl(authStore.state.user.userType);
				goto(dashboardUrl);
			}
		}
	});

	let isAuthPage = $derived(
		$page.url.pathname.includes('/auth') ||
		$page.url.pathname === '/login' ||
		$page.url.pathname === '/register'
	);
	
	let isEarnMoneyPage = $derived($page.url.pathname === '/earn-money');
</script>

<svelte:head>
	<title>EarnMaze Panel - Professional Survey Platform</title>
	<meta
		name="description"
		content="EarnMaze Panel - Earn rewards by participating in surveys and research studies"
	/>
</svelte:head>

{#if mounted}
	{#if isAuthPage}
		<!-- Auth pages layout -->
		<main
			class="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-neutral-100 py-12 px-4 sm:px-6 lg:px-8"
		>
			{@render children()}
		</main>
	{:else}
		<!-- Public pages layout -->
		<div class="min-h-screen bg-white">
			<header class="bg-white border-b border-neutral-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div class="flex justify-between items-center py-3 md:py-4">
					<div class="flex items-center">
						<a href="/" class="text-xl md:text-2xl font-bold text-violet-600 flex items-center">
							<img src="/favicon.svg" alt="EarnMaze Logo" class="w-8 h-8 md:w-10 md:h-10 mr-2" />
							<span>EarnMaze</span>
						</a>
					</div>
						{#if !isEarnMoneyPage}
							<nav class="flex items-center space-x-2 md:space-x-4">
								<a href="/about" class="hidden sm:inline-block text-neutral-600 hover:text-violet-600 transition-colors text-sm md:text-base">About</a>
								<a href="/login" class="text-sm md:text-base px-3 py-1.5 md:px-4 md:py-2 text-neutral-700 hover:text-violet-600 font-medium transition-colors touch-manipulation">Sign In</a>
								<a href="/register" class="text-sm md:text-base px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all touch-manipulation">Get Started</a>
							</nav>
						{/if}
					</div>
				</div>
			</header>
			<main>
				{@render children()}
			</main>
		</div>
	{/if}
{:else}
	<!-- Loading state -->
	<div class="min-h-screen flex items-center justify-center bg-neutral-50">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
	</div>
{/if}
