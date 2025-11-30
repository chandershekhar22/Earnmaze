<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});

	function toggleTheme() {
		themeStore.toggle();
	}

	// Get the current applied theme for display
	let currentTheme = $derived(themeStore.current === 'system'
		? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
		: themeStore.current);
</script>

{#if mounted}
	<button
		onclick={toggleTheme}
		class="relative inline-flex h-10 w-16 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
		aria-label="Toggle theme"
	>
		<span class="sr-only">Toggle theme</span>

		<!-- Sun icon -->
		<span
			class="inline-block h-8 w-8 transform rounded-full bg-yellow-400 p-1 text-gray-900 transition-transform duration-300 ease-in-out {currentTheme === 'dark' ? 'translate-x-8 rotate-180' : 'translate-x-1 rotate-0'}"
		>
			<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
			</svg>
		</span>

		<!-- Moon icon -->
		<span
			class="inline-block h-8 w-8 transform rounded-full bg-gray-900 p-1 text-yellow-400 transition-transform duration-300 ease-in-out {currentTheme === 'dark' ? 'translate-x-1 rotate-0' : '-translate-x-8 rotate-180'}"
		>
			<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
				<path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd"/>
			</svg>
		</span>
	</button>
{/if}

<style>
	/* Ensure smooth transitions for theme changes */
	:global(.dark) {
		color-scheme: dark;
	}

	:global(html) {
		transition: background-color 0.3s ease, color 0.3s ease;
	}

	:global(body) {
		transition: background-color 0.3s ease, color 0.3s ease;
	}
</style>