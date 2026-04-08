<script lang="ts">
	import type { PageData } from './$types';
	import {
		ArrowLeft, User, Mail, Shield, Calendar, LogIn, Hash, Coins, TrendingUp, Gift,
		Zap, CircleCheckBig, CircleX, ClipboardList, AlertTriangle, SlidersHorizontal,
		RefreshCw, HelpCircle, Flame, Check, X, Copy
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();
	import { Users, Share2 } from '@lucide/svelte';
	let activeTab = $state<'transactions' | 'surveys' | 'tickets' | 'referrals'>('transactions');
	let idCopied = $state(false);

	function copyPanelistId() {
		navigator.clipboard.writeText(data.panelist.id);
		idCopied = true;
		setTimeout(() => idCopied = false, 2000);
	}

	function formatDate(d: string | null) {
		if (!d) return '--';
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function getTypeStyle(type: string) {
		const positive = ['completed', 'terminated', 'quota_full', 'bonus', 'refund', 'confirmed'];
		if (positive.includes(type)) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
		if (type === 'rejected') return { color: 'text-amber-400', bg: 'bg-amber-500/10' };
		if (type === 'adjustment') return { color: 'text-sky-400', bg: 'bg-sky-500/10' };
		return { color: 'text-rose-400', bg: 'bg-rose-500/10' };
	}

	function getSurveyStatusStyle(status: string) {
		switch (status) {
			case 'completed': return 'badge-success';
			case 'started': return 'badge-primary';
			case 'disqualified': return 'badge-danger';
			case 'expired': return 'badge-warning';
			default: return 'badge-neutral';
		}
	}

	function getTicketStatusStyle(status: string) {
		switch (status) {
			case 'open': return 'badge-primary';
			case 'in_progress': return 'badge-warning';
			case 'resolved': return 'badge-success';
			case 'closed': return 'badge-neutral';
			default: return 'badge-neutral';
		}
	}
</script>

<svelte:head>
	<title>{data.panelist.name || data.panelist.email} - Admin</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
	<!-- Back -->
	<a href="/admin/users" class="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-white mb-6 transition-colors">
		<ArrowLeft class="w-3.5 h-3.5" /> Back to Users
	</a>

	<!-- Profile Header -->
	<div class="card mb-6">
		<div class="flex flex-col sm:flex-row sm:items-center gap-4">
			<!-- Avatar -->
			<div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-fuchsia-500 flex items-center justify-center text-white text-xl font-black flex-shrink-0">
				{(data.panelist.name || data.panelist.email || 'U').charAt(0).toUpperCase()}
			</div>

			<!-- Info -->
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 flex-wrap">
					<h1 class="text-xl font-bold text-white">{data.panelist.name || 'Unnamed'}</h1>
					<span class="badge-primary text-[10px]">{data.panelist.userType}</span>
					{#if data.panelist.isActive}
						<span class="badge-success text-[10px]">Active</span>
					{:else}
						<span class="badge-danger text-[10px]">Inactive</span>
					{/if}
					{#if data.panelist.emailVerified}
						<span class="badge bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 text-[10px]">
							<Check class="w-2.5 h-2.5" /> Verified
						</span>
					{/if}
				</div>
				<p class="text-sm text-neutral-500 mt-0.5">{data.panelist.email}</p>
			</div>

			<!-- ID — copyable -->
			<button
				onclick={copyPanelistId}
				class="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg hover:bg-white/[0.1] transition-colors flex-shrink-0 group"
				title="Click to copy full ID"
			>
				<span class="text-[10px] text-neutral-400 font-mono">{data.panelist.id.slice(0, 12)}...</span>
				{#if idCopied}
					<Check class="w-3 h-3 text-emerald-400" />
				{:else}
					<Copy class="w-3 h-3 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
				{/if}
			</button>
		</div>

		<!-- Meta row -->
		<div class="flex flex-wrap gap-4 mt-5 pt-4 border-t border-white/[0.06] text-xs text-neutral-500">
			<span class="flex items-center gap-1.5"><Calendar class="w-3.5 h-3.5" /> Joined {formatDate(data.panelist.createdAt)}</span>
			<span class="flex items-center gap-1.5"><LogIn class="w-3.5 h-3.5" /> Last login {formatDate(data.panelist.lastLoginAt)}</span>
			<span class="flex items-center gap-1.5"><Hash class="w-3.5 h-3.5" /> {data.panelist.loginCount ?? 0} logins</span>
			{#if data.panelist.referralCode}
				<span class="flex items-center gap-1.5"><Zap class="w-3.5 h-3.5" /> Ref: {data.panelist.referralCode}</span>
			{/if}
			{#if data.panelist.registrationSource}
				<span class="flex items-center gap-1.5"><Shield class="w-3.5 h-3.5" /> Source: {data.panelist.registrationSource}</span>
			{/if}
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
		<div class="bg-surface-100 border border-white/[0.06] rounded-xl p-4">
			<div class="flex items-center gap-2 mb-2">
				<div class="p-1.5 bg-emerald-500/10 rounded-lg"><Coins class="w-3.5 h-3.5 text-emerald-400" /></div>
				<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Balance</span>
			</div>
			<div class="text-xl font-black text-white">{data.points.current.toLocaleString()}</div>
		</div>
		<div class="bg-surface-100 border border-white/[0.06] rounded-xl p-4">
			<div class="flex items-center gap-2 mb-2">
				<div class="p-1.5 bg-violet-500/10 rounded-lg"><TrendingUp class="w-3.5 h-3.5 text-violet-400" /></div>
				<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Lifetime</span>
			</div>
			<div class="text-xl font-black text-white">{data.points.lifetime.toLocaleString()}</div>
		</div>
		<div class="bg-surface-100 border border-white/[0.06] rounded-xl p-4">
			<div class="flex items-center gap-2 mb-2">
				<div class="p-1.5 bg-pink-500/10 rounded-lg"><Gift class="w-3.5 h-3.5 text-pink-400" /></div>
				<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Redeemed</span>
			</div>
			<div class="text-xl font-black text-white">{Math.abs(data.points.redeemed).toLocaleString()}</div>
		</div>
		<div class="bg-surface-100 border border-white/[0.06] rounded-xl p-4">
			<div class="flex items-center gap-2 mb-2">
				<div class="p-1.5 bg-cyan-500/10 rounded-lg"><ClipboardList class="w-3.5 h-3.5 text-cyan-400" /></div>
				<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Surveys</span>
			</div>
			<div class="text-xl font-black text-white">{data.stats.totalSurveysCompleted}</div>
			{#if data.stats.completionRate > 0}
				<div class="text-[10px] text-emerald-400 font-bold mt-0.5">{data.stats.completionRate.toFixed(0)}% rate</div>
			{/if}
		</div>
	</div>

	<!-- Tabs -->
	<div class="tab-group max-w-md mb-5">
		<button onclick={() => activeTab = 'transactions'} class={activeTab === 'transactions' ? 'tab-active' : 'tab'}>
			<Coins class="w-3.5 h-3.5 mr-1.5 inline" /> Transactions ({data.transactions.length})
		</button>
		<button onclick={() => activeTab = 'surveys'} class={activeTab === 'surveys' ? 'tab-active' : 'tab'}>
			<ClipboardList class="w-3.5 h-3.5 mr-1.5 inline" /> Surveys ({data.surveys.length})
		</button>
		<button onclick={() => activeTab = 'tickets'} class={activeTab === 'tickets' ? 'tab-active' : 'tab'}>
			<HelpCircle class="w-3.5 h-3.5 mr-1.5 inline" /> Tickets ({data.tickets.length})
		</button>
		<button onclick={() => activeTab = 'referrals'} class={activeTab === 'referrals' ? 'tab-active' : 'tab'}>
			<Share2 class="w-3.5 h-3.5 mr-1.5 inline" /> Referrals ({data.referrals.length})
		</button>
	</div>

	<!-- Transactions Tab -->
	{#if activeTab === 'transactions'}
		{#if data.transactions.length === 0}
			<div class="card text-center py-12">
				<Coins class="w-8 h-8 text-neutral-700 mx-auto mb-3" />
				<p class="text-sm text-neutral-500">No transactions</p>
			</div>
		{:else}
			<div class="card !p-0 overflow-hidden">
				<div class="overflow-x-auto">
					<table class="min-w-full">
						<thead>
							<tr class="table-header">
								<th class="table-th">Type</th>
								<th class="table-th">Description</th>
								<th class="table-th text-right">Points</th>
								<th class="table-th text-right">Balance</th>
								<th class="table-th">Ref</th>
								<th class="table-th">Date</th>
							</tr>
						</thead>
						<tbody>
							{#each data.transactions as tx}
								{@const s = getTypeStyle(tx.type)}
								<tr class="table-row">
									<td class="table-td"><span class="badge {s.bg} {s.color} text-[10px]">{tx.type}</span></td>
									<td class="table-td text-sm text-neutral-300 max-w-[200px] truncate">{tx.description}</td>
									<td class="table-td text-right font-bold {tx.points > 0 ? 'text-emerald-400' : 'text-rose-400'}">{tx.points > 0 ? '+' : ''}{tx.points}</td>
									<td class="table-td text-right text-neutral-500">{tx.currentBalance}</td>
									<td class="table-td text-[10px] text-neutral-600 font-mono">{tx.referenceType || '--'}</td>
									<td class="table-td text-xs text-neutral-500 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Surveys Tab -->
	{#if activeTab === 'surveys'}
		{#if data.surveys.length === 0}
			<div class="card text-center py-12">
				<ClipboardList class="w-8 h-8 text-neutral-700 mx-auto mb-3" />
				<p class="text-sm text-neutral-500">No survey history</p>
			</div>
		{:else}
			<div class="card !p-0 overflow-hidden">
				<div class="overflow-x-auto">
					<table class="min-w-full">
						<thead>
							<tr class="table-header">
								<th class="table-th">Survey ID</th>
								<th class="table-th">Status</th>
								<th class="table-th text-right">Points</th>
								<th class="table-th">Started</th>
								<th class="table-th">Completed</th>
							</tr>
						</thead>
						<tbody>
							{#each data.surveys as s}
								<tr class="table-row">
									<td class="table-td text-xs font-mono text-neutral-400">{s.surveyId?.slice(0, 8) ?? '--'}...</td>
									<td class="table-td"><span class="badge {getSurveyStatusStyle(s.status)} text-[10px]">{s.status}</span></td>
									<td class="table-td text-right font-bold text-white">{s.awardedPoints ?? 0}</td>
									<td class="table-td text-xs text-neutral-500 whitespace-nowrap">{formatDate(s.startedAt)}</td>
									<td class="table-td text-xs text-neutral-500 whitespace-nowrap">{formatDate(s.completedAt)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Tickets Tab -->
	{#if activeTab === 'tickets'}
		{#if data.tickets.length === 0}
			<div class="card text-center py-12">
				<HelpCircle class="w-8 h-8 text-neutral-700 mx-auto mb-3" />
				<p class="text-sm text-neutral-500">No support tickets</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each data.tickets as ticket}
					<a href="/admin/support" class="card !p-4 flex items-center justify-between hover:bg-surface-200 transition-colors block">
						<div>
							<div class="text-sm font-semibold text-white">{ticket.subject}</div>
							<div class="text-[10px] text-neutral-600 mt-0.5">{formatDate(ticket.createdAt)}</div>
						</div>
						<span class="badge {getTicketStatusStyle(ticket.status)} text-[10px]">{ticket.status.replace('_', ' ')}</span>
					</a>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Referrals Tab -->
	{#if activeTab === 'referrals'}
		{#if data.referrals.length === 0}
			<div class="card text-center py-12">
				<Share2 class="w-8 h-8 text-neutral-700 mx-auto mb-3" />
				<p class="text-sm text-neutral-500">No referrals from this user</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each data.referrals as ref}
					<div class="bg-surface-100 border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
						<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
							{ref.referredName.charAt(0).toUpperCase()}
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-white">{ref.referredName}</div>
							<div class="text-[10px] text-neutral-600">{formatDate(ref.createdAt)}</div>
						</div>
						<span class="badge {ref.status === 'paid' || ref.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20' : ref.status === 'qualified' ? 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/20' : 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20'} text-[9px]">{ref.status}</span>
						{#if ref.bonus > 0}
							<span class="text-sm font-black {ref.status === 'paid' || ref.status === 'completed' ? 'text-emerald-400' : 'text-neutral-600'}">+{ref.bonus}</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
