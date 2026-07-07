<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { Share2, Users, Clock, CircleCheckBig, Coins, ArrowLeft, ArrowRight, User } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let statusFilter = $state(data.filters.status);

	function applyFilter() {
		const params = new URLSearchParams();
		if (statusFilter !== 'all') params.set('status', statusFilter);
		goto(`/admin/referrals?${params.toString()}`);
	}

	function getStatusStyle(status: string) {
		switch (status) {
			case 'pending': return 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20';
			case 'qualified': return 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/20';
			case 'completed': case 'paid': return 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20';
			case 'expired': return 'bg-neutral-500/15 text-neutral-400 ring-1 ring-neutral-500/20';
			default: return 'bg-white/5 text-neutral-400 ring-1 ring-white/10';
		}
	}

	function formatDate(d: string | null) {
		if (!d) return '--';
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>Referrals - Admin</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-white">Referrals</h1>
			<p class="text-sm text-neutral-500 mt-1">{data.pagination.total} total referrals</p>
		</div>
		<select bind:value={statusFilter} onchange={applyFilter} class="select !py-2 !text-xs w-full sm:!w-auto">
			<option value="all">All ({data.statusCounts.all ?? 0})</option>
			<option value="pending">Pending ({data.statusCounts.pending ?? 0})</option>
			<option value="qualified">Qualified ({data.statusCounts.qualified ?? 0})</option>
			<option value="completed">Completed ({data.statusCounts.completed ?? 0})</option>
			<option value="paid">Paid ({data.statusCounts.paid ?? 0})</option>
			<option value="expired">Expired ({data.statusCounts.expired ?? 0})</option>
		</select>
	</div>

	<!-- Summary cards -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
		<div class="relative overflow-hidden bg-gradient-to-br from-sky-500/[0.08] to-surface-100 rounded-xl p-4 border border-sky-500/10">
			<div class="absolute -top-6 -end-6 w-16 h-16 bg-sky-500/10 rounded-full blur-xl"></div>
			<div class="relative">
				<div class="text-[10px] font-bold text-sky-300/40 uppercase tracking-widest">Total</div>
				<div class="text-xl font-black text-white mt-1">{data.statusCounts.all ?? 0}</div>
			</div>
		</div>
		<div class="relative overflow-hidden bg-gradient-to-br from-amber-500/[0.08] to-surface-100 rounded-xl p-4 border border-amber-500/10">
			<div class="absolute -top-6 -end-6 w-16 h-16 bg-amber-500/10 rounded-full blur-xl"></div>
			<div class="relative">
				<div class="text-[10px] font-bold text-amber-300/40 uppercase tracking-widest">Pending</div>
				<div class="text-xl font-black text-amber-400 mt-1">{data.statusCounts.pending ?? 0}</div>
			</div>
		</div>
		<div class="relative overflow-hidden bg-gradient-to-br from-emerald-500/[0.08] to-surface-100 rounded-xl p-4 border border-emerald-500/10">
			<div class="absolute -top-6 -end-6 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl"></div>
			<div class="relative">
				<div class="text-[10px] font-bold text-emerald-300/40 uppercase tracking-widest">Paid</div>
				<div class="text-xl font-black text-emerald-400 mt-1">{(data.statusCounts.completed ?? 0) + (data.statusCounts.paid ?? 0)}</div>
			</div>
		</div>
		<div class="relative overflow-hidden bg-gradient-to-br from-violet-500/[0.08] to-surface-100 rounded-xl p-4 border border-violet-500/10">
			<div class="absolute -top-6 -end-6 w-16 h-16 bg-violet-500/10 rounded-full blur-xl"></div>
			<div class="relative">
				<div class="text-[10px] font-bold text-violet-300/40 uppercase tracking-widest">Bonus Paid</div>
				<div class="text-xl font-black text-violet-400 mt-1">{data.totalBonusPaid.toLocaleString()}</div>
				<div class="text-[10px] text-neutral-600 mt-0.5">pts</div>
			</div>
		</div>
	</div>

	<!-- Referrals Table -->
	{#if data.referrals.length === 0}
		<div class="card text-center py-16">
			<Share2 class="w-10 h-10 text-neutral-700 mx-auto mb-3" />
			<p class="font-medium text-neutral-400">No referrals found</p>
		</div>
	{:else}
		<div class="card !p-0 overflow-hidden">
			<div class="overflow-x-auto">
				<table class="min-w-full">
					<thead>
						<tr class="table-header">
							<th class="table-th">Referrer</th>
							<th class="table-th">Referred</th>
							<th class="table-th">Code</th>
							<th class="table-th">Status</th>
							<th class="table-th text-end">Bonus</th>
							<th class="table-th">Joined</th>
							<th class="table-th">Qualified</th>
							<th class="table-th"></th>
						</tr>
					</thead>
					<tbody>
						{#each data.referrals as ref}
							<tr class="table-row">
								<td class="table-td">
									<a href="/admin/users/{ref.referrerId}" class="hover:text-primary-400 transition-colors">
										<div class="text-sm font-medium text-white">{ref.referrerName}</div>
										<div class="text-[10px] text-neutral-600">{ref.referrerEmail}</div>
									</a>
								</td>
								<td class="table-td">
									<a href="/admin/users/{ref.referredId}" class="hover:text-primary-400 transition-colors">
										<div class="text-sm font-medium text-white">{ref.referredName}</div>
										<div class="text-[10px] text-neutral-600">{ref.referredEmail}</div>
									</a>
								</td>
								<td class="table-td">
									<span class="text-xs font-mono text-neutral-400">{ref.referralCode}</span>
								</td>
								<td class="table-td">
									<span class="badge {getStatusStyle(ref.status)} text-[10px]">{ref.status}</span>
								</td>
								<td class="table-td text-end">
									{#if ref.referrerBonus > 0}
										<span class="font-bold {ref.status === 'paid' || ref.status === 'completed' ? 'text-emerald-400' : 'text-neutral-500'}">+{ref.referrerBonus}</span>
									{:else}
										<span class="text-neutral-700">--</span>
									{/if}
								</td>
								<td class="table-td text-xs text-neutral-500 whitespace-nowrap">{formatDate(ref.createdAt)}</td>
								<td class="table-td text-xs text-neutral-500 whitespace-nowrap">{formatDate(ref.qualifiedAt)}</td>
								<td class="table-td">
									<a href="/admin/users/{ref.referrerId}" class="text-primary-400 hover:text-primary-300 text-xs" title="View referrer">
										<User class="w-3.5 h-3.5" />
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if data.pagination.totalPages > 1}
				<div class="bg-surface-50 px-6 py-4 flex items-center justify-between border-t border-white/[0.06]">
					<span class="text-sm text-neutral-500">Page {data.pagination.page} of {data.pagination.totalPages}</span>
					<div class="flex gap-2">
						{#if data.pagination.page > 1}
							<a href="/admin/referrals?page={data.pagination.page - 1}{data.filters.status !== 'all' ? `&status=${data.filters.status}` : ''}" class="btn-secondary !text-xs">
								<ArrowLeft class="w-3.5 h-3.5 rtl:-scale-x-100" /> Prev
							</a>
						{/if}
						{#if data.pagination.page < data.pagination.totalPages}
							<a href="/admin/referrals?page={data.pagination.page + 1}{data.filters.status !== 'all' ? `&status=${data.filters.status}` : ''}" class="btn-secondary !text-xs">
								Next <ArrowRight class="w-3.5 h-3.5 rtl:-scale-x-100" />
							</a>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
