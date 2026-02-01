<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

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

<div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
	<!-- Loading State -->
	<div class="text-center max-w-md">
		<div class="mb-6 flex justify-center">
			<div class="relative w-16 h-16">
				<div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-spin" style="mask-image: conic-gradient(transparent 25%, black 25%);"></div>
				<div class="absolute inset-1 bg-slate-800 rounded-full flex items-center justify-center">
					<svg class="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
					</svg>
				</div>
			</div>
		</div>
		
		<h1 class="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
			Processing your completion
		</h1>
		
		<p class="text-slate-300 mb-8 leading-relaxed">
			We're recording your survey completion and preparing your dashboard. You'll be redirected in just a moment.
		</p>

		<!-- Status Badge -->
		<div class="inline-block bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 mb-6">
			<p class="text-sm text-slate-300">
				<span class="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
				Updating survey records
			</p>
		</div>

		<!-- Progress Bar -->
		<div class="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
			<div class="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse" style="width: 65%;"></div>
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
