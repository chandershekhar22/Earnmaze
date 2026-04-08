<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';
	import { Sun, Moon } from '@lucide/svelte';

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
		class="relative inline-flex h-10 w-16 items-center rounded-full bg-surface-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface"
		aria-label="Toggle theme"
	>
		<span class="sr-only">Toggle theme</span>

		<!-- Sun icon -->
		<span
			class="inline-block h-8 w-8 transform rounded-full bg-amber-400 p-1 text-surface transition-transform duration-300 ease-in-out {currentTheme === 'dark' ? 'translate-x-8 rotate-180' : 'translate-x-1 rotate-0'}"
		>
			<Sun class="h-6 w-6" />
		</span>

		<!-- Moon icon -->
		<span
			class="inline-block h-8 w-8 transform rounded-full bg-surface-50 p-1 text-amber-400 transition-transform duration-300 ease-in-out {currentTheme === 'dark' ? 'translate-x-1 rotate-0' : '-translate-x-8 rotate-180'}"
		>
			<Moon class="h-6 w-6" />
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
