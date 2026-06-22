<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { Gift, Clock, CircleCheckBig, CircleX, Loader2, ArrowLeft, ArrowRight, AlertTriangle, ChevronDown, ChevronUp, Send } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let redemptions = $state(data.redemptions);
	let expandedId = $state<string | null>(null);
	let updatingId = $state<string | null>(null);
	let noteText = $state('');
	let statusFilter = $state(data.filters.status);

	function applyFilter() {
		const params = new URLSearchParams();
		if (statusFilter !== 'all') params.set('status', statusFilter);
		goto(`/admin/redemptions?${params.toString()}`);
	}

	function getStatusStyle(status: string) {
		switch (status) {
			case 'pending': return { class: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20', icon: Clock };
			case 'processing': return { class: 'bg-primary-500/15 text-primary-400 ring-1 ring-primary-500/20', icon: Loader2 };
			case 'completed': return { class: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20', icon: CircleCheckBig };
			case 'on_hold': return { class: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20', icon: AlertTriangle };
			case 'failed': case 'cancelled': return { class: 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20', icon: CircleX };
			default: return { class: 'bg-white/5 text-neutral-400', icon: Clock };
		}
	}

	function formatDate(d: string | null) {
		if (!d) return '--';
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	async function updateStatus(id: string, status: string) {
		updatingId = id;
		try {
			const body: any = { status };
			if (noteText.trim()) body.processingNotes = noteText.trim();
			const res = await fetch(`/api/admin/redemptions/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			if (res.ok) {
				redemptions = redemptions.map(r => r.id === id ? { ...r, status, processingNotes: noteText.trim() || r.processingNotes } : r);
				noteText = '';
			}
		} catch { /* ignore */ }
		updatingId = null;
	}
</script>

<svelte:head>
	<title>Redemptions - Admin</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-white">Redemptions</h1>
			<p class="text-sm text-neutral-500 mt-1">{data.pagination.total} total requests</p>
		</div>
		<select bind:value={statusFilter} onchange={applyFilter} class="select !py-2 !text-xs !w-auto">
			<option value="all">All ({data.statusCounts.all ?? 0})</option>
			<option value="pending">Pending ({data.statusCounts.pending ?? 0})</option>
			<option value="processing">Processing ({data.statusCounts.processing ?? 0})</option>
			<option value="completed">Completed ({data.statusCounts.completed ?? 0})</option>
			<option value="on_hold">On Hold ({data.statusCounts.on_hold ?? 0})</option>
			<option value="failed">Failed ({data.statusCounts.failed ?? 0})</option>
			<option value="cancelled">Cancelled ({data.statusCounts.cancelled ?? 0})</option>
		</select>
	</div>

	<!-- Status summary -->
	<div class="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
		{#each [
			{ key: 'pending', label: 'Pending', color: 'amber' },
			{ key: 'processing', label: 'Processing', color: 'violet' },
			{ key: 'completed', label: 'Done', color: 'emerald' },
			{ key: 'on_hold', label: 'Hold', color: 'amber' },
			{ key: 'failed', label: 'Failed', color: 'rose' },
			{ key: 'cancelled', label: 'Cancelled', color: 'neutral' },
		] as item}
			<div class="bg-surface-100 border border-white/[0.06] rounded-xl p-3 text-center">
				<div class="text-lg font-black text-{item.color}-400">{data.statusCounts[item.key] ?? 0}</div>
				<div class="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">{item.label}</div>
			</div>
		{/each}
	</div>

	<!-- Table -->
	{#if redemptions.length === 0}
		<div class="card text-center py-16">
			<Gift class="w-10 h-10 text-neutral-700 mx-auto mb-3" />
			<p class="font-medium text-neutral-400">No redemption requests</p>
		</div>
	{:else}
		<div class="space-y-2.5">
			{#each redemptions as r}
				{@const ss = getStatusStyle(r.status)}
				<div class="card !p-0 overflow-hidden">
					<button type="button" onclick={() => expandedId = expandedId === r.id ? null : r.id} class="w-full px-5 py-3.5 flex items-center gap-4 text-start hover:bg-white/[0.02] transition-colors">
						<div class="p-2 {ss.class} rounded-xl flex-shrink-0">
							<ss.icon class="w-4 h-4" />
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<span class="text-sm font-semibold text-white">{r.rewardName}</span>
								<span class="badge {ss.class} text-[10px]">{r.status.replace('_', ' ')}</span>
							</div>
							<div class="flex items-center gap-3 text-[10px] text-neutral-600 mt-1">
								<a href="/admin/users/{r.panelistId}" onclick={(e) => e.stopPropagation()} class="text-primary-400 hover:text-primary-300 transition-colors">{r.panelistName || r.panelistEmail}</a>
								<span>|</span>
								<span>{r.amount.toLocaleString()} pts (${r.value.toFixed(2)})</span>
								<span>|</span>
								<span>{formatDate(r.createdAt)}</span>
							</div>
						</div>
						<div class="text-neutral-600 flex-shrink-0">
							{#if expandedId === r.id}<ChevronUp class="w-4 h-4" />{:else}<ChevronDown class="w-4 h-4" />{/if}
						</div>
					</button>

					{#if expandedId === r.id}
						<div class="px-5 pb-4 border-t border-white/[0.04] animate-fade-in">
							<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 mb-4">
								<div>
									<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Type</span>
									<p class="text-sm text-neutral-300 mt-0.5">{r.type}</p>
								</div>
								<div>
									<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Provider</span>
									<p class="text-sm text-neutral-300 mt-0.5">{r.provider || '--'}</p>
								</div>
								<div>
									<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Panelist</span>
									<a href="/admin/users/{r.panelistId}" class="text-sm text-primary-400 hover:text-primary-300 mt-0.5 block transition-colors">{r.panelistName || 'View'}</a>
								</div>
								<div>
									<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Completed</span>
									<p class="text-sm text-neutral-300 mt-0.5">{formatDate(r.completedAt)}</p>
								</div>
							</div>

							{#if r.processingNotes}
								<div class="bg-surface-200 rounded-lg p-3 mb-4">
									<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Notes</span>
									<p class="text-xs text-neutral-400 mt-1">{r.processingNotes}</p>
								</div>
							{/if}

							<!-- Actions -->
							<div class="flex items-end gap-2 flex-wrap">
								<div class="flex-1 min-w-[150px]">
									<input type="text" bind:value={noteText} placeholder="Processing notes (optional)" class="input !py-2 !text-xs" />
								</div>
								{#if r.status === 'pending'}
									<button onclick={() => updateStatus(r.id, 'processing')} disabled={updatingId === r.id} class="btn-primary !py-2 !px-3 !text-xs">
										{updatingId === r.id ? 'Updating...' : 'Start Processing'}
									</button>
								{/if}
								{#if r.status === 'processing' || r.status === 'pending'}
									<button onclick={() => updateStatus(r.id, 'completed')} disabled={updatingId === r.id} class="btn-success !py-2 !px-3 !text-xs">
										Mark Complete
									</button>
									<button onclick={() => updateStatus(r.id, 'on_hold')} disabled={updatingId === r.id} class="btn-secondary !py-2 !px-3 !text-xs">
										Hold
									</button>
									<button onclick={() => updateStatus(r.id, 'cancelled')} disabled={updatingId === r.id} class="btn-danger !py-2 !px-3 !text-xs">
										Cancel
									</button>
								{/if}
								{#if r.status === 'on_hold'}
									<button onclick={() => updateStatus(r.id, 'processing')} disabled={updatingId === r.id} class="btn-primary !py-2 !px-3 !text-xs">
										Resume
									</button>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if data.pagination.totalPages > 1}
			<div class="flex items-center justify-between mt-5">
				<span class="text-sm text-neutral-500">Page {data.pagination.page} of {data.pagination.totalPages}</span>
				<div class="flex gap-2">
					{#if data.pagination.page > 1}
						<a href="/admin/redemptions?page={data.pagination.page - 1}{data.filters.status !== 'all' ? `&status=${data.filters.status}` : ''}" class="btn-secondary !text-xs">
							<ArrowLeft class="w-3.5 h-3.5 rtl:-scale-x-100" /> Prev
						</a>
					{/if}
					{#if data.pagination.page < data.pagination.totalPages}
						<a href="/admin/redemptions?page={data.pagination.page + 1}{data.filters.status !== 'all' ? `&status=${data.filters.status}` : ''}" class="btn-secondary !text-xs">
							Next <ArrowRight class="w-3.5 h-3.5 rtl:-scale-x-100" />
						</a>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</div>
