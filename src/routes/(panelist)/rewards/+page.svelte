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
			Logger.errors.error('Failed to fetch rewards', { error });
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
			Logger.errors.error('Failed to redeem reward', { error });
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

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<!-- <h1 class="text-2xl font-bold text-gray-900">Rewards</h1>
			<p class="text-gray-600">Redeem your points for exciting rewards</p> -->
		</div>
		<div class="text-right">
			<p class="text-sm text-gray-500">Your available points</p>
			<p class="text-2xl font-bold text-green-600">{userPoints.toLocaleString()}</p>
		</div>
	</div>

	{#if loading}
		<div class="text-center py-12">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
			<p class="mt-2 text-gray-600">Loading rewards...</p>
		</div>
	{:else if rewards.length === 0}
		<div class="text-center py-12">
			<div class="text-6xl mb-4">🎁</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No rewards available</h3>
			<p class="text-gray-600 mb-6">Check back later for new reward opportunities.</p>
			<a href="/surveys" class="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
				Earn Points
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each rewards as reward}
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
					{#if reward.imageUrl}
						<img src={reward.imageUrl} alt={reward.title} class="w-full h-48 object-cover" />
					{:else}
						<div class="w-full h-48 bg-gradient-to-br from-primary-50 to-gray-100 flex items-center justify-center">
							<span class="text-6xl">{reward.emoji || '🎁'}</span>
						</div>
					{/if}
					
					<div class="p-6">
						<div class="flex items-start justify-between mb-2">
							<h3 class="text-lg font-semibold text-gray-900">{reward.title}</h3>
							{#if !canAfford(reward.pointsCost)}
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
									Need more points
								</span>
							{/if}
						</div>
						
						<p class="text-gray-600 text-sm mb-4">{reward.description}</p>
						
						<div class="flex items-center justify-between mb-4">
							<div class="flex items-center">
								<span class="text-lg font-bold text-primary-600">{reward.pointsCost.toLocaleString()}</span>
								<span class="text-sm text-gray-500 ml-1">points</span>
							</div>
							{#if reward.originalPrice}
								<div class="text-sm text-gray-500">
									Value: ${reward.originalPrice}
								</div>
							{/if}
						</div>

						{#if reward.stock !== undefined && reward.stock <= 10}
							<div class="text-xs text-orange-600 mb-3">
								Only {reward.stock} left in stock
							</div>
						{/if}

						<button 
							onclick={() => redeemReward(reward.id, reward.pointsCost)}
							disabled={!canAfford(reward.pointsCost) || redeeming === reward.id || (reward.stock !== undefined && reward.stock <= 0)}
							class="w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors
								{canAfford(reward.pointsCost) && reward.stock !== 0 
									? 'bg-primary-600 text-white hover:bg-primary-700' 
									: 'bg-gray-100 text-gray-400 cursor-not-allowed'}"
						>
							{#if redeeming === reward.id}
								<div class="flex items-center justify-center">
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Redeeming...
								</div>
							{:else if reward.stock !== undefined && reward.stock <= 0}
								Out of Stock
							{:else if !canAfford(reward.pointsCost)}
								Need {(reward.pointsCost - userPoints).toLocaleString()} more points
							{:else}
								Redeem Now
							{/if}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Earning Tips -->
	<div class="bg-blue-50 rounded-lg p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-2">💡 Tips to Earn More Points</h2>
		<ul class="text-sm text-gray-600 space-y-1">
			<li>• Complete surveys regularly to maximize your earnings</li>
			<li>• Look out for high-value surveys with bonus points</li>
			<li>• Make sure to provide quality responses to unlock more survey opportunities</li>
			<li>• Check back frequently for new surveys and limited-time offers</li>
		</ul>
	</div>
</div>
