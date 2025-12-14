<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { initializeAppLogging, Logger, Features, Session } from '$lib/utils/app-logger';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import type { Snippet } from 'svelte';
	import '../app.pcss';

	let { children }: { children: Snippet } = $props();
	
	let mounted = $state(false);
	let appliedTheme = $state<'light' | 'dark'>('light');

	onMount(() => {
		mounted = true;

		// Initialize app-wide logging
		initializeAppLogging();

		// Initialize auth state
		authStore.checkAuth();

		// Initialize theme
		themeStore.initialize();
		appliedTheme = themeStore.getAppliedTheme();

		// Log application startup
		Logger.root.info({ context: 'app', route: $page.route.id, url: $page.url.pathname, timestamp: new Date().toISOString() }, 'Application mounted and initialized');
	});

	// Track route changes
	$effect(() => {
		if (mounted && $page.route.id) {
			Features.trackPageView($page.url.pathname);
			Logger.root.info({ context: 'ui', route: $page.route.id, path: $page.url.pathname, params: $page.params }, 'Route changed');
		}
	});

	// Track user authentication state changes
	$effect(() => {
		if (mounted && authStore.state.user) {
			Session.setUser();
			Logger.root.info({ context: 'auth', userId: authStore.state.user.id, email: authStore.state.user.email }, 'User session active');
		}
	});

	// Update applied theme when themeStore changes
	$effect(() => {
		if (mounted) {
			appliedTheme = themeStore.getAppliedTheme();
		}
	});
</script>

<svelte:head>
	<title>EarnMaze Panel - Professional Survey Platform</title>
	<meta
		name="description"
		content="EarnMaze Panel - Earn rewards by participating in surveys and research studies"
	/>
</svelte:head>

<ErrorBoundary>
	{#if mounted}
		<div class="min-h-screen {appliedTheme === 'dark' ? 'dark' : ''}">
			{@render children()}
			<ToastContainer />
		</div>
	{:else}
		<!-- Loading state -->
		<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
		</div>
	{/if}
</ErrorBoundary>
