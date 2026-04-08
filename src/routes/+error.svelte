<script lang="ts">
	import { page } from '$app/stores';
	import { Home, ArrowLeft, Search } from '@lucide/svelte';
</script>

<svelte:head>
	<title>{$page.status} - EarnMaze</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-surface p-4">
	<div class="text-center max-w-md">
		<!-- Status code -->
		<div class="text-8xl font-black text-white/[0.06] mb-2 select-none">{$page.status}</div>

		<!-- Icon -->
		<div class="w-14 h-14 bg-surface-100 border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-5">
			{#if $page.status === 404}
				<Search class="w-7 h-7 text-neutral-500" />
			{:else}
				<span class="text-2xl">!</span>
			{/if}
		</div>

		<!-- Message -->
		<h1 class="text-xl font-bold text-white mb-2">
			{#if $page.status === 404}
				Page not found
			{:else}
				Something went wrong
			{/if}
		</h1>
		<p class="text-sm text-neutral-500 mb-8 leading-relaxed">
			{#if $page.status === 404}
				The page you're looking for doesn't exist or has been moved.
			{:else if $page.error?.message}
				{$page.error.message}
			{:else}
				An unexpected error occurred. Please try again.
			{/if}
		</p>

		<!-- Actions -->
		<div class="flex flex-col sm:flex-row gap-3 justify-center">
			<a href="/dashboard" class="btn-primary">
				<Home class="w-4 h-4" />
				Go to Dashboard
			</a>
			<button onclick={() => history.back()} class="btn-secondary">
				<ArrowLeft class="w-4 h-4" />
				Go Back
			</button>
		</div>
	</div>
</div>
