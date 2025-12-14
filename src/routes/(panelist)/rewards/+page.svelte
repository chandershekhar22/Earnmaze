<script lang="ts">
	import { onMount } from 'svelte';
	import { Logger } from '$lib/utils/app-logger';

	interface Reward {
		id: string;
		title: string;
		description: string;
		pointsCost: number;
		imageUrl?: string;
		emoji?: string;
		originalPrice?: number;
		stock?: number;
	}

	let rewards = $state<Reward[]>([]);
	let userPoints = $state(0);
	let loading = $state(true);
	let redeeming = $state<string | null>(null);

	onMount(async () => {
		try {
			const [rewardsResponse, pointsResponse] = await Promise.all([
				fetch('/api/rewards'),
				fetch('/api/panelist/points')
			]);

			if (rewardsResponse.ok) {
				rewards = await rewardsResponse.json();
			}
			
			if (pointsResponse.ok) {
				const pointsData = await pointsResponse.json();
				userPoints = pointsData.availablePoints || 0;
			}
		} catch (error) {
			Logger.root.error({ context: 'errors', error }, 'Failed to fetch rewards');
		} finally {
			loading = false;
		}
	});

	async function redeemReward(rewardId: string, pointsCost: number) {
		if (userPoints < pointsCost) {
			alert('Insufficient points to redeem this reward.');
			return;
		}

		if (!confirm(`Are you sure you want to redeem this reward for ${pointsCost.toLocaleString()} points?`)) {
			return;
		}

		redeeming = rewardId;
		
		try {
			const response = await fetch('/api/rewards/redeem', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ rewardId })
			});

			if (response.ok) {
				alert('Reward redeemed successfully! Check your email for details.');
				userPoints -= pointsCost;
				// Refresh the page to get updated data
				window.location.reload();
			} else {
				const error = await response.text();
				alert(`Failed to redeem reward: ${error}`);
			}
		} catch (error) {
			Logger.root.error({ context: 'errors', error }, 'Failed to redeem reward');
			alert('Failed to redeem reward. Please try again.');
		} finally {
			redeeming = null;
		}
	}

	function canAfford(pointsCost: number) {
		return userPoints >= pointsCost;
	}
</script>

<svelte:head>
	<title>Rewards - EarnMaze Panel</title>
	<meta name="description" content="Redeem your points for exciting rewards on EarnMaze." />
</svelte:head>

<div class="space-y-6 animate-fade-in">
	<!-- Page Header -->
	<!-- <div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-neutral-900">Rewards</h1>
			<p class="text-neutral-500 mt-1">Redeem your points for exciting rewards</p>
		</div>
		<div class="card flex items-center gap-3 !py-3 !px-4">
			<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-glow-emerald">
				<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<div>
				<p class="text-xs text-neutral-500">Available</p>
				<p class="text-xl font-bold text-emerald-600">{userPoints.toLocaleString()} pts</p>
			</div>
		</div>
	</div> -->

	{#if loading}
		<div class="card text-center py-16">
			<div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
				<svg class="w-6 h-6 text-primary-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			</div>
			<p class="text-neutral-500">Loading rewards...</p>
		</div>
	{:else if rewards.length === 0}
		<div class="card text-center py-16">
			<div class="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
				</svg>
			</div>
			<h3 class="text-lg font-semibold text-neutral-900 mb-2">No rewards available</h3>
			<p class="text-neutral-500 mb-6 max-w-sm mx-auto">Check back later for new reward opportunities.</p>
			<a href="/surveys" class="btn-primary">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
				</svg>
				Earn Points
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each rewards as reward, index}
				<div class="card-hover overflow-hidden !p-0 animate-slide-up" style="animation-delay: {index * 50}ms">
					{#if reward.imageUrl}
						<img src={reward.imageUrl} alt={reward.title} class="w-full h-48 object-cover" />
					{:else}
						<div class="w-full h-48 bg-gradient-to-br from-primary-100 via-primary-50 to-neutral-100 flex items-center justify-center">
							<div class="w-20 h-20 rounded-2xl bg-white/80 backdrop-blur flex items-center justify-center shadow-lg">
								<svg class="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
								</svg>
							</div>
						</div>
					{/if}
					
					<div class="p-6">
						<div class="flex items-start justify-between gap-2 mb-3">
							<h3 class="text-lg font-semibold text-neutral-900">{reward.title}</h3>
							{#if !canAfford(reward.pointsCost)}
								<span class="badge-danger flex-shrink-0">
									<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
									</svg>
									Need more
								</span>
							{/if}
						</div>
						
						<p class="text-neutral-500 text-sm mb-4 line-clamp-2">{reward.description}</p>
						
						<div class="flex items-center justify-between mb-4">
							<div class="flex items-center gap-2">
								<span class="text-xl font-bold text-primary-600">{reward.pointsCost.toLocaleString()}</span>
								<span class="text-sm text-neutral-400">pts</span>
							</div>
							{#if reward.originalPrice}
								<span class="badge-neutral">
									Value: ${reward.originalPrice}
								</span>
							{/if}
						</div>

						{#if reward.stock !== undefined && reward.stock <= 10 && reward.stock > 0}
							<div class="flex items-center gap-1.5 text-xs text-amber-600 mb-3 bg-amber-50 px-3 py-1.5 rounded-lg">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
								Only {reward.stock} left in stock
							</div>
						{/if}

						<button 
							onclick={() => redeemReward(reward.id, reward.pointsCost)}
							disabled={!canAfford(reward.pointsCost) || redeeming === reward.id || (reward.stock !== undefined && reward.stock <= 0)}
							class="w-full transition-all {canAfford(reward.pointsCost) && reward.stock !== 0 
								? 'btn-primary hover:shadow-glow' 
								: 'btn bg-neutral-100 text-neutral-400 cursor-not-allowed border-transparent'}"
						>
							{#if redeeming === reward.id}
								<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
								Redeeming...
							{:else if reward.stock !== undefined && reward.stock <= 0}
								Out of Stock
							{:else if !canAfford(reward.pointsCost)}
								Need {(reward.pointsCost - userPoints).toLocaleString()} more pts
							{:else}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
								</svg>
								Redeem Now
							{/if}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Earning Tips -->
	<div class="card bg-gradient-to-r from-primary-50 to-neutral-50 border-primary-200/50">
		<div class="flex items-start gap-4">
			<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-glow">
				<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
				</svg>
			</div>
			<div>
				<h2 class="text-lg font-semibold text-neutral-900 mb-3">Tips to Earn More Points</h2>
				<ul class="text-sm text-neutral-600 space-y-2">
					<li class="flex items-start gap-2">
						<svg class="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Complete surveys regularly to maximize your earnings
					</li>
					<li class="flex items-start gap-2">
						<svg class="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Look out for high-value surveys with bonus points
					</li>
					<li class="flex items-start gap-2">
						<svg class="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Provide quality responses to unlock more opportunities
					</li>
					<li class="flex items-start gap-2">
						<svg class="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Check back frequently for new surveys and limited-time offers
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>
