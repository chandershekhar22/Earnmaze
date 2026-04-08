<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { CircleX, CircleCheckBig } from '@lucide/svelte';

	let { surveyId } = $props<{ surveyId?: string }>();
	let isLoading = $state(true);
	let error = $state('');

	onMount(() => {
		if (!surveyId) {
			// No survey ID, redirect to dashboard
			goto('/guest/dashboard');
			return;
		}

		// Check if this is a new user (coming from earn-money page)
		const urlParams = new URLSearchParams(window.location.search);
		const isNewUser = urlParams.get('new') === 'true';

		// Show loading state briefly, then redirect
		setTimeout(() => {
			// In a full implementation, this would:
			// 1. Check survey availability
			// 2. Record survey view
			// 3. Redirect to external survey link or internal survey page

			// For now, simulate survey completion and return to dashboard
			isLoading = false;

			// Simulate survey taking time
			setTimeout(() => {
				// Redirect back to dashboard with appropriate parameters
				const params = new URLSearchParams();
				params.set('from', 'survey');
				params.set('completed', 'true');
				if (isNewUser) {
					params.set('new', 'true');
				}
				goto(`/guest/dashboard?${params.toString()}`);
			}, 2000);
		}, 1000);
	});
</script>

<svelte:head>
	<title>Loading Survey - EarnMaze</title>
</svelte:head>

<div class="min-h-screen bg-surface flex items-center justify-center">
	<div class="max-w-md w-full bg-surface-100 rounded-2xl border border-white/[0.06] p-8 text-center">
		{#if isLoading}
			<div class="mb-4">
				<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
			</div>
			<h2 class="text-xl font-semibold text-white mb-2">Preparing Your Survey</h2>
			<p class="text-neutral-400">Please wait while we set things up...</p>
		{:else if error}
			<div class="text-rose-400 mb-4">
				<CircleX class="w-12 h-12 mx-auto mb-2 text-rose-400" />
				<p class="font-semibold">Error</p>
				<p class="text-sm mt-2">{error}</p>
			</div>
			<button
				onclick={() => goto('/guest/dashboard')}
				class="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500"
			>
				Return to Dashboard
			</button>
		{:else}
			<div class="mb-4">
				<CircleCheckBig class="w-12 h-12 mx-auto text-emerald-400" />
			</div>
			<h2 class="text-xl font-semibold text-white mb-2">Survey Complete!</h2>
			<p class="text-neutral-400">Redirecting you back to your dashboard...</p>
		{/if}
	</div>
</div>
