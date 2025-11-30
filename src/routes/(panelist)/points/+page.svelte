<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let pointsData = $derived(data.pointsData);
	let transactions = $derived(data.transactions);

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getTransactionIcon(type: string) {
		switch (type) {
			case 'earned': return '💰';
			case 'redeemed': return '🎁';
			case 'bonus': return '🎉';
			case 'refund': return '↩️';
			default: return '📊';
		}
	}

	function getTransactionColor(type: string) {
		switch (type) {
			case 'earned': 
			case 'bonus': 
			case 'refund': 
				return 'text-green-600';
			case 'redeemed': 
				return 'text-red-600';
			default: 
				return 'text-gray-600';
		}
	}
</script>

<svelte:head>
	<title>My Points - EarnMaze Panel</title>
	<meta name="description" content="Track your points balance and transaction history on EarnMaze." />
</svelte:head>

<div class="space-y-6">
	<!-- <div>
		<h1 class="text-2xl font-bold text-gray-900">My Points</h1>
		<p class="text-gray-600">Track your points balance and earnings</p>
	</div> -->

	<!-- Points Overview -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
							<span class="text-green-600 font-semibold">💰</span>
						</div>
					</div>
					<div class="ml-4">
						<h3 class="text-sm font-medium text-gray-500">Available Points</h3>
						<p class="text-2xl font-bold text-gray-900">{pointsData.availablePoints.toLocaleString()}</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
							<span class="text-blue-600 font-semibold">⏳</span>
						</div>
					</div>
					<div class="ml-4">
						<h3 class="text-sm font-medium text-gray-500">Pending Points</h3>
						<p class="text-2xl font-bold text-gray-900">{pointsData.pendingPoints.toLocaleString()}</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
							<span class="text-purple-600 font-semibold">📊</span>
						</div>
					</div>
					<div class="ml-4">
						<h3 class="text-sm font-medium text-gray-500">Total Points</h3>
						<p class="text-2xl font-bold text-gray-900">{pointsData.totalPoints.toLocaleString()}</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
							<span class="text-yellow-600 font-semibold">🏆</span>
						</div>
					</div>
					<div class="ml-4">
						<h3 class="text-sm font-medium text-gray-500">Lifetime Earned</h3>
						<p class="text-2xl font-bold text-gray-900">{pointsData.lifetimeEarned.toLocaleString()}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<a href="/surveys" class="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
					<span class="text-2xl mr-3">📋</span>
					<div>
						<h3 class="font-medium text-gray-900">Earn More Points</h3>
						<p class="text-sm text-gray-600">Complete available surveys</p>
					</div>
				</a>
				
				<a href="/rewards" class="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
					<span class="text-2xl mr-3">🎁</span>
					<div>
						<h3 class="font-medium text-gray-900">Redeem Rewards</h3>
						<p class="text-sm text-gray-600">Use your points for rewards</p>
					</div>
				</a>
				
				<a href="/history" class="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
					<span class="text-2xl mr-3">📊</span>
					<div>
						<h3 class="font-medium text-gray-900">View History</h3>
						<p class="text-sm text-gray-600">See all transactions</p>
					</div>
				</a>
			</div>
		</div>

		<!-- Recent Transactions -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-gray-900">Recent Transactions</h2>
				<a href="/history" class="text-sm text-primary-600 hover:text-primary-700">View all</a>
			</div>
			
			{#if transactions.length === 0}
				<div class="text-center py-8">
					<div class="text-4xl mb-2">📊</div>
					<p class="text-gray-600">No transactions yet. Start completing surveys to earn points!</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each transactions.slice(0, 10) as transaction}
						<div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
							<div class="flex items-center">
								<span class="text-xl mr-3">{getTransactionIcon(transaction.type)}</span>
								<div>
									<p class="text-sm font-medium text-gray-900">{transaction.description}</p>
									<p class="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
								</div>
							</div>
							<div class="text-right">
								<p class="text-sm font-medium {getTransactionColor(transaction.type)}">
									{transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} points
								</p>
								{#if transaction.status === 'pending'}
									<p class="text-xs text-yellow-600">Pending</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
</div>
