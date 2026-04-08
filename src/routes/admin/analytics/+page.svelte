<script lang="ts">
	import { onMount } from 'svelte';

	let loading = $state(true);
	let analytics = $state<any>(null);
	let error = $state('');

	onMount(async () => {
		try {
			const response = await fetch('/api/analytics/conversions');
			if (response.ok) {
				analytics = await response.json();
			} else {
				error = 'Failed to load analytics';
			}
		} catch (e) {
			error = 'Network error loading analytics';
		} finally {
			loading = false;
		}
	});

	function formatSeconds(seconds: number): string {
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	}
</script>

<svelte:head>
	<title>Analytics Dashboard - Conversion & Traffic Tracking</title>
</svelte:head>

<div class="min-h-screen py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<h1 class="text-3xl font-bold text-white mb-8">Landing Page Analytics</h1>

		{#if loading}
			<div class="text-center py-12">
				<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
				<p class="mt-4 text-neutral-400">Loading analytics...</p>
			</div>
		{:else if error}
			<div class="card bg-rose-500/10 border-rose-500/20 text-rose-400">
				{error}
			</div>
		{:else if analytics}
			<!-- Summary Cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
				<div class="card">
					<h3 class="text-sm font-medium text-neutral-500 mb-2">Total Visits</h3>
					<p class="text-3xl font-bold text-white">{analytics.summary.totalVisits.toLocaleString()}</p>
				</div>

				<div class="card">
					<h3 class="text-sm font-medium text-neutral-500 mb-2">Unique Visitors</h3>
					<p class="text-3xl font-bold text-blue-400">{analytics.summary.uniqueVisitors.toLocaleString()}</p>
				</div>

				<div class="card">
					<h3 class="text-sm font-medium text-neutral-500 mb-2">Conversions</h3>
					<p class="text-3xl font-bold text-emerald-400">{analytics.summary.totalConversions.toLocaleString()}</p>
					<p class="text-xs text-neutral-500 mt-1">{analytics.summary.uniqueConvertingVisitors} unique</p>
				</div>

				<div class="card">
					<h3 class="text-sm font-medium text-neutral-500 mb-2">Visit Conv. Rate</h3>
					<p class="text-3xl font-bold text-primary-400">{analytics.summary.conversionRate}%</p>
				</div>

				<div class="card">
					<h3 class="text-sm font-medium text-neutral-500 mb-2">Visitor Conv. Rate</h3>
					<p class="text-3xl font-bold text-violet-400">{analytics.summary.uniqueConversionRate}%</p>
				</div>

				<div class="card">
					<h3 class="text-sm font-medium text-neutral-500 mb-2">Avg. Time to Convert</h3>
					<p class="text-3xl font-bold text-amber-400">{formatSeconds(analytics.summary.avgTimeToConvert)}</p>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<!-- Traffic Sources -->
				<div class="card">
					<h2 class="text-xl font-bold text-white mb-4">Traffic Sources (Visits)</h2>
					{#if analytics.trafficSources.length > 0}
						<div class="space-y-3">
							{#each analytics.trafficSources as source}
								<div class="flex items-center justify-between p-3 bg-surface-200 rounded-lg">
									<div>
										<p class="font-semibold text-white">
											{source.source || 'Direct'}
											{#if source.medium} / {source.medium}{/if}
										</p>
										{#if source.campaign}
											<p class="text-sm text-neutral-400">{source.campaign}</p>
										{/if}
									</div>
									<span class="text-lg font-bold text-primary-400">{source.visits}</span>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-neutral-500 text-center py-4">No traffic data yet</p>
					{/if}
				</div>

				<!-- Conversions by Source -->
				<div class="card">
					<h2 class="text-xl font-bold text-white mb-4">Conversions by Source</h2>
					{#if analytics.conversionsBySource.length > 0}
						<div class="space-y-3">
							{#each analytics.conversionsBySource as source}
								<div class="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
									<div>
										<p class="font-semibold text-white">
											{source.source || 'Direct'}
											{#if source.medium} / {source.medium}{/if}
										</p>
										{#if source.campaign}
											<p class="text-sm text-neutral-400">{source.campaign}</p>
										{/if}
									</div>
									<span class="text-lg font-bold text-emerald-400">{source.count}</span>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-neutral-500 text-center py-4">No conversions yet</p>
					{/if}
				</div>

				<!-- Device Breakdown -->
				<div class="card">
					<h2 class="text-xl font-bold text-white mb-4">Device Breakdown</h2>
					{#if analytics.deviceBreakdown.length > 0}
						<div class="space-y-3">
							{#each analytics.deviceBreakdown as device}
								<div class="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
									<p class="font-semibold text-white capitalize">{device.deviceType || 'Unknown'}</p>
									<span class="text-lg font-bold text-blue-400">{device.visits}</span>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-neutral-500 text-center py-4">No device data yet</p>
					{/if}
				</div>

				<!-- Browser Breakdown -->
				<div class="card">
					<h2 class="text-xl font-bold text-white mb-4">Browser Breakdown</h2>
					{#if analytics.browserBreakdown.length > 0}
						<div class="space-y-3">
							{#each analytics.browserBreakdown as browser}
								<div class="flex items-center justify-between p-3 bg-violet-500/10 rounded-lg">
									<p class="font-semibold text-white">{browser.browserName || 'Unknown'}</p>
									<span class="text-lg font-bold text-violet-400">{browser.visits}</span>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-neutral-500 text-center py-4">No browser data yet</p>
					{/if}
				</div>

				<!-- CTA Performance -->
				<div class="card lg:col-span-2">
					<h2 class="text-xl font-bold text-white mb-4">CTA Button Performance</h2>
					{#if analytics.ctaPerformance.length > 0}
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{#each analytics.ctaPerformance as cta}
								<div class="flex items-center justify-between p-4 bg-amber-500/10 rounded-lg">
									<p class="font-semibold text-white capitalize">{cta.location}</p>
									<span class="text-xl font-bold text-amber-400">{cta.clicks} clicks</span>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-neutral-500 text-center py-4">No CTA click data yet</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
