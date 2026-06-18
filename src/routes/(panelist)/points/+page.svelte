<script lang="ts">
	import type { PageData } from './$types';
	import type { PointsTransactionItem } from '$types/api-responses';
	import { Coins, BarChart3, ClipboardList, Gift, History, ChevronRight, CircleCheckBig, CircleX, AlertTriangle, SlidersHorizontal, TrendingUp, Rocket } from '@lucide/svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';

	let { data }: { data: PageData } = $props();

	let pointsData = $derived(data.pointsData);
	let transactions = $derived(data.transactions as PointsTransactionItem[]);

	function formatDate(dateString: string | Date) {
		return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

	function getTypeLabel(type: string) {
		const labels: Record<string, string> = {
			completed: 'Completed', terminated: 'Terminated', quota_full: 'Quota Full',
			disqualified: 'Disqualified', redeemed: 'Redeemed', bonus: 'Bonus',
			confirmed: 'Confirmed', rejected: 'Rejected', penalty: 'Penalty',
			adjustment: 'Adjustment', refund: 'Refund', expired: 'Expired'
		};
		return labels[type] || type;
	}
</script>

<svelte:head>
	<title>Points - EarnMaze</title>
	<meta name="description" content="Track your points balance and transaction history." />
</svelte:head>

<div class="space-y-[22px] animate-fade-in">
	<InfoBanner id="points-how" message="Points are earned by completing surveys. Available = your spendable balance. Lifetime = total ever earned. Redeemed = points exchanged for gift cards." color="primary" />

	<!-- Stats -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
		<div class="em-stat">
			<span class="absolute top-0 left-0 right-0 h-[2px] bg-emerald-400 opacity-85"></span>
			<div class="flex items-center gap-2.5 mb-4">
				<span class="w-[30px] h-[30px] rounded-[9px] bg-emerald-400/12 text-emerald-400 grid place-items-center">
					<Coins class="w-4 h-4" />
				</span>
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">Available</span>
			</div>
			<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{pointsData.availablePoints?.toLocaleString() ?? 0}</div>
			<div class="font-mono text-[11px] text-neutral-500 mt-2">spendable now</div>
		</div>

		<div class="em-stat">
			<span class="absolute top-0 left-0 right-0 h-[2px] bg-primary-400 opacity-85"></span>
			<div class="flex items-center gap-2.5 mb-4">
				<span class="w-[30px] h-[30px] rounded-[9px] bg-primary-400/12 text-primary-400 grid place-items-center">
					<TrendingUp class="w-4 h-4" />
				</span>
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">Lifetime</span>
			</div>
			<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{pointsData.lifetimeEarned?.toLocaleString() ?? 0}</div>
			<div class="font-mono text-[11px] text-neutral-500 mt-2">total earned</div>
		</div>

		<div class="em-stat">
			<span class="absolute top-0 left-0 right-0 h-[2px] bg-fuchsia-400 opacity-85"></span>
			<div class="flex items-center gap-2.5 mb-4">
				<span class="w-[30px] h-[30px] rounded-[9px] bg-fuchsia-500/12 text-fuchsia-400 grid place-items-center">
					<Gift class="w-4 h-4" />
				</span>
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">Redeemed</span>
			</div>
			<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{pointsData.lifetimeRedeemed?.toLocaleString() ?? 0}</div>
			<div class="font-mono text-[11px] text-neutral-500 mt-2">cashed out</div>
		</div>

		<div class="em-stat">
			<span class="absolute top-0 left-0 right-0 h-[2px] bg-sky-400 opacity-85"></span>
			<div class="flex items-center gap-2.5 mb-4">
				<span class="w-[30px] h-[30px] rounded-[9px] bg-sky-400/12 text-sky-400 grid place-items-center">
					<BarChart3 class="w-4 h-4" />
				</span>
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">Net</span>
			</div>
			<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{((pointsData.lifetimeEarned ?? 0) - (pointsData.lifetimeRedeemed ?? 0)).toLocaleString()}</div>
			<div class="font-mono text-[11px] text-neutral-500 mt-2">current standing</div>
		</div>
	</div>

	<!-- Action rows -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
		<a href="/surveys" class="group flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-surface-50 border border-white/[0.07] hover:border-white/[0.13] hover:-translate-y-0.5 transition-all">
			<span class="w-[42px] h-[42px] rounded-[11px] bg-primary-400/12 text-primary-400 grid place-items-center flex-shrink-0">
				<ClipboardList class="w-[18px] h-[18px]" />
			</span>
			<div class="flex-1">
				<h4 class="text-[14.5px] font-semibold text-white tracking-tight">Earn more</h4>
				<p class="font-mono text-[11px] text-neutral-500 mt-0.5">Take surveys</p>
			</div>
			<ChevronRight class="w-4 h-4 text-neutral-500 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all" />
		</a>

		<a href="/rewards" class="group flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-surface-50 border border-white/[0.07] hover:border-white/[0.13] hover:-translate-y-0.5 transition-all">
			<span class="w-[42px] h-[42px] rounded-[11px] bg-emerald-400/12 text-emerald-400 grid place-items-center flex-shrink-0">
				<Gift class="w-[18px] h-[18px]" />
			</span>
			<div class="flex-1">
				<h4 class="text-[14.5px] font-semibold text-white tracking-tight">Redeem</h4>
				<p class="font-mono text-[11px] text-neutral-500 mt-0.5">Get rewards</p>
			</div>
			<ChevronRight class="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
		</a>

		<a href="/history" class="group flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-surface-50 border border-white/[0.07] hover:border-white/[0.13] hover:-translate-y-0.5 transition-all">
			<span class="w-[42px] h-[42px] rounded-[11px] bg-fuchsia-500/12 text-fuchsia-400 grid place-items-center flex-shrink-0">
				<History class="w-[18px] h-[18px]" />
			</span>
			<div class="flex-1">
				<h4 class="text-[14.5px] font-semibold text-white tracking-tight">History</h4>
				<p class="font-mono text-[11px] text-neutral-500 mt-0.5">All activity</p>
			</div>
			<ChevronRight class="w-4 h-4 text-neutral-500 group-hover:text-fuchsia-400 group-hover:translate-x-0.5 transition-all" />
		</a>
	</div>

	<!-- Recent Transactions -->
	<div class="em-panel">
		<div class="em-panel-h">
			<span class="em-panel-title"><BarChart3 class="w-4 h-4 text-primary-400" /> Recent Transactions</span>
			<a href="/history" class="font-mono text-[11px] text-neutral-500 hover:text-primary-400 uppercase tracking-[0.06em] inline-flex items-center gap-1 transition-colors">
				All <ChevronRight class="w-3.5 h-3.5" />
			</a>
		</div>

		{#if !transactions || transactions.length === 0}
			<div class="em-empty">
				<span class="em-empty-icon"><BarChart3 class="w-[30px] h-[30px]" /></span>
				<h4 class="text-[17px] font-semibold text-white tracking-tight">No transactions yet</h4>
				<p class="text-[13.5px] text-neutral-400 mb-4">Complete surveys to start earning.</p>
				<a href="/surveys" class="btn-primary"><Rocket class="w-4 h-4" /> Browse surveys</a>
			</div>
		{:else}
			<div class="divide-y divide-white/[0.04]">
				{#each transactions.slice(0, 10) as transaction}
					{@const style = getTypeStyle(transaction.type)}
					<div class="flex items-center gap-3.5 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
						<div class="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center {style.bg} flex-shrink-0">
							<style.icon class="w-4 h-4 {style.color}" />
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-[13.5px] font-medium text-white truncate">{transaction.description}</div>
							<div class="flex items-center gap-2 mt-0.5">
								<span class="font-mono text-[11px] text-neutral-500">{formatDate(transaction.createdAt)}</span>
								<span class="text-[10px] font-semibold {style.color} bg-white/[0.03] px-1.5 py-0.5 rounded">{getTypeLabel(transaction.type)}</span>
							</div>
						</div>
						<div class="text-right flex-shrink-0">
							<div class="font-mono text-sm font-semibold {transaction.points > 0 ? 'text-primary-400' : 'text-rose-400'}">
								{transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()}
							</div>
							<div class="font-mono text-[10px] text-neutral-500">Bal: {transaction.currentBalance.toLocaleString()}</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
