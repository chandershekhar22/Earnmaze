<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Check } from '@lucide/svelte';

	let mounted = $state(false);

	$effect(() => {
		if (!mounted) {
			mounted = true;
			// Page redirects in +page.server.ts, but show loading state briefly
			const timer = setTimeout(() => {
				const completed = $page.url.searchParams.get('completed');
				const status = $page.url.searchParams.get('status');
				const points = $page.url.searchParams.get('points');

				if (completed === 'true') {
					// Redirect should have already happened in load()
					// This is fallback in case JS redirect needed
					const dashboard = window.location.pathname.includes('guest')
						? `/guest/dashboard?status=${status}&points=${points}`
						: `/surveys?status=${status}&points=${points}`;
					goto(dashboard);
				}
			}, 100);

			return () => clearTimeout(timer);
		}
	});
</script>

<div class="flex items-center justify-center min-h-screen bg-surface p-4">
	<!-- Loading State -->
	<div class="text-center max-w-md">
		<div class="mb-6 flex justify-center">
			<div class="relative w-16 h-16">
				<div class="absolute inset-0 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full animate-spin" style="mask-image: conic-gradient(transparent 25%, black 25%);"></div>
				<div class="absolute inset-1 bg-surface rounded-full flex items-center justify-center">
					<Check class="w-8 h-8 text-primary-400" />
				</div>
			</div>
		</div>

		<h1 class="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">
			Processing your completion
		</h1>

		<p class="text-neutral-400 mb-8 leading-relaxed">
			We're recording your survey completion and preparing your dashboard. You'll be redirected in just a moment.
		</p>

		<!-- Status Badge -->
		<div class="inline-block bg-surface-100 border border-white/[0.06] rounded-lg px-4 py-2 mb-6">
			<p class="text-sm text-neutral-400">
				<span class="inline-block w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
				Updating survey records
			</p>
		</div>

		<!-- Progress Bar -->
		<div class="w-full h-1 bg-surface-200 rounded-full overflow-hidden">
			<div class="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full animate-pulse" style="width: 65%;"></div>
		</div>
	</div>
</div>

<style>
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
