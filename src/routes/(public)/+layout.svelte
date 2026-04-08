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
		$page.url.pathname === '/register' ||
		$page.url.pathname === '/forgot-password' ||
		$page.url.pathname === '/reset-password'
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
			class="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8"
		>
			<!-- Background gradient blobs -->
			<div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
				<div class="absolute -top-40 -left-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl"></div>
				<div class="absolute -bottom-40 -right-40 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl"></div>
				<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
			</div>
			<div class="relative z-10 w-full flex items-center justify-center">
				{@render children()}
			</div>
		</main>
	{:else}
		<!-- Public pages layout -->
		<div class="min-h-screen bg-surface">
			<header class="border-b border-white/[0.06] sticky top-0 z-40 backdrop-blur-xl bg-surface/80">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div class="flex justify-between items-center py-3 md:py-4">
					<div class="flex items-center">
						<a href="/" class="text-xl md:text-2xl font-bold text-white flex items-center">
							<img src="/favicon.svg?v=2" alt="EarnMaze Logo" class="w-8 h-8 md:w-10 md:h-10 mr-2" />
							<span>EarnMaze</span>
						</a>
					</div>
						{#if !isEarnMoneyPage}
							<nav class="flex items-center space-x-2 md:space-x-4">
								<a href="/about" class="hidden sm:inline-block text-neutral-400 hover:text-white transition-colors text-sm md:text-base">About</a>
								<a href="/login" class="text-sm md:text-base px-3 py-1.5 md:px-4 md:py-2 text-neutral-300 hover:text-white font-medium transition-colors touch-manipulation">Sign In</a>
								<a href="/register" class="btn-primary text-sm md:text-base !px-3 !py-1.5 md:!px-4 md:!py-2 touch-manipulation">Sign Up</a>
							</nav>
						{/if}
					</div>
				</div>
			</header>
			<main>
				{@render children()}
			</main>
			<footer class="bg-surface-50 border-t border-white/[0.06] mt-16">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
						<!-- Brand -->
						<div>
							<a href="/" class="text-lg font-bold text-white flex items-center mb-2">
								<img src="/favicon.svg?v=2" alt="EarnMaze Logo" class="w-6 h-6 mr-2" />
								EarnMaze
							</a>
							<p class="text-sm text-neutral-500">Earn rewards by participating in surveys and research studies</p>
						</div>

						<!-- Quick Links -->
						<div>
							<h3 class="font-semibold text-white mb-4">Quick Links</h3>
							<ul class="space-y-2 text-sm">
								<li><a href="/" class="text-neutral-400 hover:text-primary-400 transition-colors">Home</a></li>
								<li><a href="/about" class="text-neutral-400 hover:text-primary-400 transition-colors">About</a></li>
								<li><a href="/login" class="text-neutral-400 hover:text-primary-400 transition-colors">Sign In</a></li>
							</ul>
						</div>

						<!-- Legal -->
						<div>
							<h3 class="font-semibold text-white mb-4">Legal</h3>
							<ul class="space-y-2 text-sm">
								<li><a href="/privacy-policy" class="text-neutral-400 hover:text-primary-400 transition-colors">Privacy Policy</a></li>
								<li><a href="/terms-of-service" class="text-neutral-400 hover:text-primary-400 transition-colors">Terms of Service</a></li>
							</ul>
						</div>
					</div>

					<!-- Bottom -->
					<div class="mt-8 pt-8 border-t border-white/[0.06] text-center text-sm text-neutral-600">
						<p>&copy; 2026 EarnMaze. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</div>
	{/if}
{:else}
	<!-- Loading state -->
	<div class="min-h-screen flex items-center justify-center bg-surface">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
	</div>
{/if}
