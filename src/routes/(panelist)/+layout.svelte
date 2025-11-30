<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { Logger } from '$lib/utils/app-logger';
	import Header from '$lib/components/layout/Header.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	let mounted = $state(false);
	let authChecked = $state(false);
	let isSidebarOpen = $state(false);

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	onMount(() => {
		mounted = true;
	});

	$effect(() => {
		// Wait for auth store to finish loading before making routing decisions
		if (mounted && !authStore.state.isLoading && !authChecked) {
			authChecked = true;
			
			if (!authStore.state.user) {
				Logger.auth.warn('Unauthenticated access attempt to panelist area', {
					route: $page.route.id,
					path: $page.url.pathname
				});
				const redirectUrl = encodeURIComponent($page.url.pathname);
				goto(`/login?redirect=${redirectUrl}`);
			} else {
				// Check if user type is panelist or admin
				const userType = authStore.state.user.userType;
				if (userType !== 'panelist' && userType !== 'admin') {
					Logger.auth.warn('Unauthorized user type accessing panelist area', {
						userId: authStore.state.user.id,
						userType,
						route: $page.route.id,
						path: $page.url.pathname
					});
					// Redirect to their appropriate dashboard
					if (userType === 'client') {
						goto('/client/dashboard');
					} else if (userType === 'moderator') {
						goto('/moderator/dashboard');
					} else {
						goto('/');
					}
				} else {
					// Log panelist area access
					Logger.ui.info('Panelist area accessed', {
						userId: authStore.state.user.id,
						userType,
						route: $page.route.id,
						path: $page.url.pathname
					});
				}
			}
		}
	});

	$effect(() => {
		// Handle session expiration
		if (mounted && authChecked && !authStore.state.isLoading && !authStore.state.user) {
			Logger.auth.info('User session expired in respondent area, redirecting to login');
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>Dashboard - EarnMaze Panel</title>
	<meta name="description" content="EarnMaze respondent dashboard - manage your surveys, points, and rewards" />
</svelte:head>

{#if mounted && authStore.state.user}
	<!-- Respondent dashboard layout with sidebar -->
	<div class="flex h-screen bg-gray-50 overflow-hidden">
		<Sidebar bind:isOpen={isSidebarOpen} />
		<div class="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
			<Header onMenuClick={toggleSidebar} />
			<main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-6">
				<div class="max-w-7xl mx-auto">
					{@render children()}
				</div>
			</main>
		</div>
	</div>
{:else if mounted && authChecked}
	<!-- Fallback loading state while redirecting -->
	<div class="min-h-screen flex items-center justify-center bg-gray-50">
		<div class="text-center">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
			<p class="text-gray-600">Redirecting to login...</p>
		</div>
	</div>
{:else}
	<!-- Initial loading state -->
	<div class="min-h-screen flex items-center justify-center bg-gray-50">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
	</div>
{/if}