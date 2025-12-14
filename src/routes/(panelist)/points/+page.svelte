<script lang="ts">
	import type { PageData } from './$types';
	import type { PointsTransactionItem } from '$types/api-responses';

	let { data }: { data: PageData } = $props();

	let pointsData = $derived(data.pointsData);
	let transactions = $derived(data.transactions as PointsTransactionItem[]);

	function formatDate(dateString: string | Date) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Get color based on transaction type from schema
	function getTransactionColor(type: string) {
		switch (type) {
			case 'earned':
			case 'bonus':
			case 'refund':
			case 'confirmed':
				return 'text-emerald-600';
			case 'redeemed':
			case 'penalty':
			case 'expired':
				return 'text-rose-600';
			case 'rejected':
				return 'text-amber-600';
			case 'adjustment':
				return 'text-blue-600';
			default:
				return 'text-neutral-600';
		}
	}

	// Get background color based on transaction type
	function getTransactionBg(type: string) {
		switch (type) {
			case 'earned':
			case 'bonus':
			case 'refund':
			case 'confirmed':
				return 'bg-emerald-100';
			case 'redeemed':
			case 'penalty':
			case 'expired':
				return 'bg-rose-100';
			case 'rejected':
				return 'bg-amber-100';
			case 'adjustment':
				return 'bg-blue-100';
			default:
				return 'bg-neutral-100';
		}
	}

	// Get icon color based on transaction type
	function getIconColor(type: string) {
		switch (type) {
			case 'earned':
			case 'bonus':
			case 'refund':
			case 'confirmed':
				return 'text-emerald-600';
			case 'redeemed':
			case 'penalty':
			case 'expired':
				return 'text-rose-600';
			case 'rejected':
				return 'text-amber-600';
			case 'adjustment':
				return 'text-blue-600';
			default:
				return 'text-neutral-600';
		}
	}

	// Format transaction type label
	function getTypeLabel(type: string) {
		const labels: Record<string, string> = {
			earned: 'Earned',
			redeemed: 'Redeemed',
			bonus: 'Bonus',
			confirmed: 'Confirmed',
			rejected: 'Rejected',
			penalty: 'Penalty',
			adjustment: 'Adjustment',
			refund: 'Refund',
			expired: 'Expired'
		};
		return labels[type] || type;
	}
</script>

<svelte:head>
	<title>My Points - EarnMaze Panel</title>
	<meta name="description" content="Track your points balance and transaction history on EarnMaze." />
</svelte:head>

<div class="space-y-5">
	<!-- Points Overview -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
		<!-- Current/Available Points -->
		<div class="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md hover:border-emerald-200 transition-all">
			<div class="flex items-center gap-3 mb-2">
				<div class="p-2 bg-emerald-50 rounded-lg">
					<svg class="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
						<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
					</svg>
				</div>
			</div>
			<div class="text-xs font-medium text-neutral-500 mb-0.5">Available</div>
			<div class="text-2xl font-bold text-neutral-900">{pointsData.availablePoints?.toLocaleString() ?? 0}</div>
		</div>

		<!-- Pending Points -->
		<div class="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md hover:border-amber-200 transition-all">
			<div class="flex items-center gap-3 mb-2">
				<div class="p-2 bg-amber-50 rounded-lg">
					<svg class="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
					</svg>
				</div>
			</div>
			<div class="text-xs font-medium text-neutral-500 mb-0.5">Pending</div>
			<div class="text-2xl font-bold text-neutral-900">{pointsData.pendingPoints?.toLocaleString() ?? 0}</div>
		</div>

		<!-- Total Points -->
		<div class="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md hover:border-violet-200 transition-all">
			<div class="flex items-center gap-3 mb-2">
				<div class="p-2 bg-violet-50 rounded-lg">
					<svg class="w-4 h-4 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
						<path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
					</svg>
				</div>
			</div>
			<div class="text-xs font-medium text-neutral-500 mb-0.5">Total</div>
			<div class="text-2xl font-bold text-neutral-900">{pointsData.totalPoints?.toLocaleString() ?? 0}</div>
		</div>

		<!-- Lifetime Earned -->
		<div class="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all">
			<div class="flex items-center gap-3 mb-2">
				<div class="p-2 bg-blue-50 rounded-lg">
					<svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
					</svg>
				</div>
			</div>
			<div class="text-xs font-medium text-neutral-500 mb-0.5">Lifetime</div>
			<div class="text-2xl font-bold text-neutral-900">{pointsData.lifetimeEarned?.toLocaleString() ?? 0}</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="bg-white border border-neutral-200 rounded-xl p-4 md:p-5">
		<h2 class="text-base font-bold text-neutral-900 mb-3">Quick Actions</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
			<!-- Earn More -->
			<a href="/surveys" class="group flex items-center gap-3 p-4 bg-neutral-50 hover:bg-violet-50 border border-neutral-200 hover:border-violet-300 rounded-xl transition-all">
				<div class="p-2.5 bg-white border border-neutral-200 group-hover:border-violet-300 rounded-lg">
					<svg class="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
						<path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
					</svg>
				</div>
				<div class="flex-1">
					<div class="font-semibold text-neutral-900 text-sm">Earn More</div>
					<div class="text-xs text-neutral-500">Take surveys</div>
				</div>
				<svg class="w-4 h-4 text-neutral-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
				</svg>
			</a>

			<!-- Redeem -->
			<a href="/rewards" class="group flex items-center gap-3 p-4 bg-neutral-50 hover:bg-emerald-50 border border-neutral-200 hover:border-emerald-300 rounded-xl transition-all">
				<div class="p-2.5 bg-white border border-neutral-200 group-hover:border-emerald-300 rounded-lg">
					<svg class="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clip-rule="evenodd"/>
						<path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z"/>
					</svg>
				</div>
				<div class="flex-1">
					<div class="font-semibold text-neutral-900 text-sm">Redeem</div>
					<div class="text-xs text-neutral-500">Get rewards</div>
				</div>
				<svg class="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
				</svg>
			</a>

			<!-- History -->
			<a href="/history" class="group flex items-center gap-3 p-4 bg-neutral-50 hover:bg-blue-50 border border-neutral-200 hover:border-blue-300 rounded-xl transition-all">
				<div class="p-2.5 bg-white border border-neutral-200 group-hover:border-blue-300 rounded-lg">
					<svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
					</svg>
				</div>
				<div class="flex-1">
					<div class="font-semibold text-neutral-900 text-sm">History</div>
					<div class="text-xs text-neutral-500">All activity</div>
				</div>
				<svg class="w-4 h-4 text-neutral-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
				</svg>
			</a>
		</div>
	</div>

	<!-- Recent Transactions -->
	<div class="bg-white border border-neutral-200 rounded-xl p-4 md:p-5">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-base font-bold text-neutral-900">Recent Transactions</h2>
			<a href="/history" class="text-sm font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1">
				View all
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
				</svg>
			</a>
		</div>

		{#if !transactions || transactions.length === 0}
			<div class="text-center py-10">
				<div class="w-14 h-14 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3">
					<svg class="w-7 h-7 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
						<path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
					</svg>
				</div>
				<h3 class="text-base font-semibold text-neutral-900 mb-1">No transactions yet</h3>
				<p class="text-sm text-neutral-500 mb-4">Start completing surveys to earn points!</p>
				<a href="/surveys" class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all">
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
						<path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
					</svg>
					Browse Surveys
				</a>
			</div>
		{:else}
			<div class="space-y-2">
				{#each transactions.slice(0, 10) as transaction}
					<div class="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors">
						<div class="flex items-center gap-3">
							<div class="w-9 h-9 rounded-lg flex items-center justify-center {getTransactionBg(transaction.type)}">
								{#if transaction.type === 'earned' || transaction.type === 'bonus' || transaction.type === 'confirmed'}
									<svg class="w-4 h-4 {getIconColor(transaction.type)}" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
									</svg>
								{:else if transaction.type === 'redeemed'}
									<svg class="w-4 h-4 {getIconColor(transaction.type)}" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clip-rule="evenodd"/>
									</svg>
								{:else if transaction.type === 'refund'}
									<svg class="w-4 h-4 {getIconColor(transaction.type)}" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
									</svg>
								{:else if transaction.type === 'penalty' || transaction.type === 'expired'}
									<svg class="w-4 h-4 {getIconColor(transaction.type)}" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
									</svg>
								{:else if transaction.type === 'rejected'}
									<svg class="w-4 h-4 {getIconColor(transaction.type)}" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
									</svg>
								{:else if transaction.type === 'adjustment'}
									<svg class="w-4 h-4 {getIconColor(transaction.type)}" fill="currentColor" viewBox="0 0 20 20">
										<path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"/>
									</svg>
								{:else}
									<svg class="w-4 h-4 {getIconColor(transaction.type)}" fill="currentColor" viewBox="0 0 20 20">
										<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
									</svg>
								{/if}
							</div>
							<div>
								<p class="text-sm font-medium text-neutral-900">{transaction.description}</p>
								<div class="flex items-center gap-2 text-xs text-neutral-500">
									<span>{formatDate(transaction.createdAt)}</span>
									<span class="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-medium">{getTypeLabel(transaction.type)}</span>
								</div>
							</div>
						</div>
						<div class="text-right">
							<p class="text-sm font-semibold {getTransactionColor(transaction.type)}">
								{transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()} pts
							</p>
							<p class="text-xs text-neutral-400">Bal: {transaction.currentBalance.toLocaleString()}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
