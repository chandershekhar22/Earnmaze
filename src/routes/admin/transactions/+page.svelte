<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { ArrowLeft, ArrowRight, CircleCheckBig, CircleX, Gift, Coins, RefreshCw, AlertTriangle, SlidersHorizontal, Zap } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let typeFilter = $state(data.filters.type);

	function applyFilter() {
		const params = new URLSearchParams();
		if (typeFilter !== 'all') params.set('type', typeFilter);
		goto(`/admin/transactions?${params.toString()}`);
	}

	function getTypeStyle(type: string) {
		const positive = ['completed', 'terminated', 'quota_full', 'bonus', 'refund', 'confirmed'];
		const negative = ['redeemed', 'penalty', 'expired', 'disqualified'];
		if (positive.includes(type)) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CircleCheckBig };
		if (type === 'rejected') return { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertTriangle };
		if (type === 'adjustment') return { color: 'text-sky-400', bg: 'bg-sky-500/10', icon: SlidersHorizontal };
		if (negative.includes(type)) return { color: 'text-rose-400', bg: 'bg-rose-500/10', icon: CircleX };
		return { color: 'text-neutral-400', bg: 'bg-white/5', icon: Coins };
	}

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>Transactions - Admin</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-white">Transactions</h1>
			<p class="text-sm text-neutral-500 mt-1">{data.pagination.total} total transactions</p>
		</div>

		<!-- Filter -->
		<div class="flex items-center gap-2">
			<select bind:value={typeFilter} onchange={applyFilter} class="select !py-2 !text-sm w-full sm:!w-auto">
				<option value="all">All Types</option>
				<option value="completed">Completed</option>
				<option value="terminated">Terminated</option>
				<option value="quota_full">Quota Full</option>
				<option value="bonus">Bonus</option>
				<option value="redeemed">Redeemed</option>
				<option value="adjustment">Adjustment</option>
				<option value="penalty">Penalty</option>
				<option value="refund">Refund</option>
				<option value="rejected">Rejected</option>
				<option value="expired">Expired</option>
				<option value="disqualified">Disqualified</option>
			</select>
		</div>
	</div>

	<!-- Table -->
	<div class="card !p-0 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full">
				<thead>
					<tr class="table-header">
						<th class="table-th">Type</th>
						<th class="table-th">Panelist</th>
						<th class="table-th">Description</th>
						<th class="table-th text-end">Points</th>
						<th class="table-th text-end">Balance</th>
						<th class="table-th">Reference</th>
						<th class="table-th">Date</th>
					</tr>
				</thead>
				<tbody>
					{#each data.transactions as tx}
						{@const s = getTypeStyle(tx.type)}
						<tr class="table-row">
							<td class="table-td">
								<span class="badge {s.bg} {s.color} ring-1 ring-current/20">
									<s.icon class="w-3 h-3" />
									{tx.type}
								</span>
							</td>
							<td class="table-td">
								<div class="text-sm text-white">{tx.panelistName || '--'}</div>
								<div class="text-[10px] text-neutral-600">{tx.panelistEmail}</div>
							</td>
							<td class="table-td text-sm text-neutral-300 max-w-[200px] truncate">
								{tx.description}
							</td>
							<td class="table-td text-end">
								<span class="font-bold {tx.points > 0 ? 'text-emerald-400' : 'text-rose-400'}">
									{tx.points > 0 ? '+' : ''}{tx.points}
								</span>
							</td>
							<td class="table-td text-end text-neutral-500 text-sm">
								{tx.currentBalance}
							</td>
							<td class="table-td text-[10px] text-neutral-600 font-mono">
								{tx.referenceType || '--'}
							</td>
							<td class="table-td text-xs text-neutral-500 whitespace-nowrap">
								{formatDate(tx.createdAt)}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="px-6 py-16 text-center text-neutral-500">
								<Coins class="w-10 h-10 mx-auto mb-3 text-neutral-700" />
								<p class="font-medium text-neutral-400">No transactions found</p>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if data.pagination.totalPages > 1}
			<div class="bg-surface-50 px-6 py-4 flex items-center justify-between border-t border-white/[0.06]">
				<div class="text-sm text-neutral-500">
					Page {data.pagination.page} of {data.pagination.totalPages}
				</div>
				<div class="flex gap-2">
					{#if data.pagination.page > 1}
						<a
							href="/admin/transactions?page={data.pagination.page - 1}{data.filters.type !== 'all' ? `&type=${data.filters.type}` : ''}"
							class="btn-secondary !text-xs"
						>
							<ArrowLeft class="w-3.5 h-3.5 rtl:-scale-x-100" /> Prev
						</a>
					{/if}
					{#if data.pagination.page < data.pagination.totalPages}
						<a
							href="/admin/transactions?page={data.pagination.page + 1}{data.filters.type !== 'all' ? `&type=${data.filters.type}` : ''}"
							class="btn-secondary !text-xs"
						>
							Next <ArrowRight class="w-3.5 h-3.5 rtl:-scale-x-100" />
						</a>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
