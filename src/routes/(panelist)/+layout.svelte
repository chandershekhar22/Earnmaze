<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { Logger } from '$lib/utils/app-logger';
	import Header from '$lib/components/layout/Header.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import DashboardViewToggle from '$lib/components/DashboardViewToggle.svelte';
	import FeedbackWidget from '$lib/components/FeedbackWidget.svelte';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import { deLocalizeUrl } from '$lib/paraglide/runtime';
	import type { Snippet } from 'svelte';

	let { children, data }: { children: Snippet; data: { dashboardView: 'surveys' | 'discover' } } = $props();

	let mounted = $state(false);
	let authChecked = $state(false);
	let isSidebarOpen = $state(false);
	let mainEl: HTMLElement;

	// $page.url keeps the locale prefix (e.g. `/pt/dashboard`) — the reroute
	// hook only delocalizes for route MATCHING, not for `$page.url` itself.
	// Delocalize here too, otherwise every check below silently fails for any
	// non-English locale and both the sidebar variant and the view toggle
	// break.
	let basePath = $derived(deLocalizeUrl($page.url).pathname);

	// Discover dashboard gets a different sidebar; both dashboards show the
	// quick view toggle so users can flip between them. On shared pages
	// (points, rewards, …) fall back to the saved preference so the sidebar
	// stays in the view the user is browsing in.
	let dashboardView = $derived<'surveys' | 'discover'>(
		basePath.startsWith('/discover')
			? 'discover'
			: basePath === '/dashboard'
				? 'surveys'
				: data.dashboardView
	);
	let isDashboardRoute = $derived(
		basePath === '/dashboard' || basePath.startsWith('/discover')
	);

	// Scroll to top on page navigation
	afterNavigate(() => {
		mainEl?.scrollTo(0, 0);
	});

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	onMount(() => {
		mounted = true;
	});

	$effect(() => {
		if (mounted && !authStore.state.isLoading && !authChecked) {
			authChecked = true;

			if (!authStore.state.user) {
				Logger.root.warn({ context: 'auth', route: $page.route.id, path: $page.url.pathname }, 'Unauthenticated access attempt to panelist area');
				const redirectUrl = encodeURIComponent($page.url.pathname);
				goto(`/login?redirect=${redirectUrl}`);
			} else {
				const userType = authStore.state.user.userType;
				if (userType !== 'panelist' && userType !== 'admin') {
					Logger.root.warn({ context: 'auth', userId: authStore.state.user.id, userType, route: $page.route.id, path: $page.url.pathname }, 'Unauthorized user type accessing panelist area');
					if (userType === 'client') {
						goto('/client/dashboard');
					} else if (userType === 'moderator') {
						goto('/moderator/dashboard');
					} else {
						goto('/');
					}
				} else {
					Logger.root.info({ context: 'ui', userId: authStore.state.user.id, userType, route: $page.route.id, path: $page.url.pathname }, 'Panelist area accessed');
				}
			}
		}
	});

	$effect(() => {
		if (mounted && authChecked && !authStore.state.isLoading && !authStore.state.user) {
			Logger.root.info({ context: 'auth' }, 'User session expired in respondent area, redirecting to login');
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>Dashboard - EarnMaze</title>
	<meta name="description" content="EarnMaze respondent dashboard - manage your surveys, points, and rewards" />
</svelte:head>

{#if mounted && authStore.state.user}
	<div class="flex h-screen bg-surface overflow-hidden">
		<Sidebar bind:isOpen={isSidebarOpen} variant={dashboardView} />
		<div class="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
			<Header onMenuClick={toggleSidebar} />
			<main bind:this={mainEl} class="flex-1 overflow-x-hidden overflow-y-auto bg-surface p-4 md:p-6 lg:p-8">
				<div class="max-w-6xl mx-auto">
					{@render children()}
				</div>
			</main>
		</div>
		{#if isDashboardRoute}
			<DashboardViewToggle current={dashboardView} />
			<FeedbackWidget />
		{/if}
	</div>
{:else}
	<!-- Branded loading screen -->
	<div class="min-h-screen flex items-center justify-center bg-surface">
		<div class="text-center animate-fade-in">
			<div class="relative w-12 h-12 mx-auto mb-4">
				<div class="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl opacity-20 blur-lg animate-pulse"></div>
				<div class="relative w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
					<svg class="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
					</svg>
				</div>
			</div>
			<p class="text-sm font-semibold text-white/40">Loading your dashboard...</p>
		</div>
	</div>
{/if}
