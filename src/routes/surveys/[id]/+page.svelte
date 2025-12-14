<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

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

<div class="min-h-screen bg-gray-50 flex items-center justify-center">
	<div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
		{#if isLoading}
			<div class="mb-4">
				<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
			<h2 class="text-xl font-semibold text-gray-900 mb-2">Preparing Your Survey</h2>
			<p class="text-gray-600">Please wait while we set things up...</p>
		{:else if error}
			<div class="text-red-600 mb-4">
				<svg class="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
				</svg>
				<p class="font-semibold">Error</p>
				<p class="text-sm mt-2">{error}</p>
			</div>
			<button
				onclick={() => goto('/guest/dashboard')}
				class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
			>
				Return to Dashboard
			</button>
		{:else}
			<div class="mb-4">
				<svg class="w-12 h-12 mx-auto text-green-600" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
				</svg>
			</div>
			<h2 class="text-xl font-semibold text-gray-900 mb-2">Survey Complete!</h2>
			<p class="text-gray-600">Redirecting you back to your dashboard...</p>
		{/if}
	</div>
</div>
