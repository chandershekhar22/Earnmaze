<script lang="ts">
	import type { PageData } from './$types';
	import type { PointsTransactionItem } from '$types/api-responses';
	import { Coins, BarChart3, Star, ClipboardList, Gift, History, ChevronRight, CircleCheckBig, CircleX, RefreshCw, AlertTriangle, SlidersHorizontal, TrendingUp, Rocket } from '@lucide/svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { signedTransactionPoints } from '$lib/constants/constants';

	let { data }: { data: PageData } = $props();

	let pointsData = $derived(data.pointsData);
	let transactions = $derived(data.transactions as PointsTransactionItem[]);

	function formatDate(dateString: string | Date) {
		return new Date(dateString).toLocaleDateString(getLocale(), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
			completed: m.pts_type_completed(),
			terminated: m.pts_type_terminated(),
			quota_full: m.pts_type_quota_full(),
			disqualified: m.pts_type_disqualified(),
			redeemed: m.pts_type_redeemed(),
			bonus: m.pts_type_bonus(),
			confirmed: m.pts_type_confirmed(),
			rejected: m.pts_type_rejected(),
			penalty: m.pts_type_penalty(),
			adjustment: m.pts_type_adjustment(),
			refund: m.pts_type_refund(),
			expired: m.pts_type_expired(),
		};
		return labels[type] || type;
	}
</script>

<svelte:head>
	<title>{m.pts_meta_title()}</title>
	<meta name="description" content={m.pts_meta_description()} />
</svelte:head>

<div class="space-y-5 animate-fade-in">
	<InfoBanner id="points-how" message={m.pts_info()} color="primary" />

	<!-- Stats -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
		<div class="group relative overflow-hidden bg-surface-100 border border-white/[0.06] rounded-2xl p-4 md:p-5 hover:border-emerald-500/20 transition-all duration-300">
			<div class="absolute -top-8 -end-8 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors"></div>
			<div class="relative">
				<div class="p-2 bg-emerald-500/10 rounded-xl w-fit mb-3">
					<Coins class="w-4 h-4 text-emerald-400" />
				</div>
				<div class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">{m.pts_stat_available()}</div>
				<div class="text-2xl font-black text-white tracking-tight">{pointsData.availablePoints?.toLocaleString() ?? 0}</div>
			</div>
		</div>

		<div class="group relative overflow-hidden bg-surface-100 border border-white/[0.06] rounded-2xl p-4 md:p-5 hover:border-violet-500/20 transition-all duration-300">
			<div class="absolute -top-8 -end-8 w-20 h-20 bg-violet-500/5 rounded-full blur-xl group-hover:bg-violet-500/10 transition-colors"></div>
			<div class="relative">
				<div class="p-2 bg-violet-500/10 rounded-xl w-fit mb-3">
					<TrendingUp class="w-4 h-4 text-violet-400" />
				</div>
				<div class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">{m.pts_stat_lifetime()}</div>
				<div class="text-2xl font-black text-white tracking-tight">{pointsData.lifetimeEarned?.toLocaleString() ?? 0}</div>
			</div>
		</div>

		<div class="group relative overflow-hidden bg-surface-100 border border-white/[0.06] rounded-2xl p-4 md:p-5 hover:border-pink-500/20 transition-all duration-300">
			<div class="absolute -top-8 -end-8 w-20 h-20 bg-pink-500/5 rounded-full blur-xl group-hover:bg-pink-500/10 transition-colors"></div>
			<div class="relative">
				<div class="p-2 bg-pink-500/10 rounded-xl w-fit mb-3">
					<Gift class="w-4 h-4 text-pink-400" />
				</div>
				<div class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">{m.pts_stat_redeemed()}</div>
				<div class="text-2xl font-black text-white tracking-tight">{pointsData.lifetimeRedeemed?.toLocaleString() ?? 0}</div>
			</div>
		</div>

		<div class="group relative overflow-hidden bg-surface-100 border border-white/[0.06] rounded-2xl p-4 md:p-5 hover:border-sky-500/20 transition-all duration-300">
			<div class="absolute -top-8 -end-8 w-20 h-20 bg-sky-500/5 rounded-full blur-xl group-hover:bg-sky-500/10 transition-colors"></div>
			<div class="relative">
				<div class="p-2 bg-sky-500/10 rounded-xl w-fit mb-3">
					<BarChart3 class="w-4 h-4 text-sky-400" />
				</div>
				<div class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">{m.pts_stat_net()}</div>
				<div class="text-2xl font-black text-white tracking-tight">{((pointsData.lifetimeEarned ?? 0) - (pointsData.lifetimeRedeemed ?? 0)).toLocaleString()}</div>
			</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
		<a href={localizeHref('/surveys')} class="group flex items-center gap-3 p-4 bg-surface-100 border border-white/[0.06] hover:border-primary-500/20 hover:bg-surface-200 rounded-xl transition-all">
			<div class="p-2 bg-primary-500/10 rounded-lg group-hover:bg-primary-500/15 transition-colors">
				<ClipboardList class="w-4 h-4 text-primary-400" />
			</div>
			<div class="flex-1">
				<div class="font-semibold text-white text-sm">{m.pts_action_earn_title()}</div>
				<div class="text-[10px] text-neutral-600">{m.pts_action_earn_desc()}</div>
			</div>
			<ChevronRight class="w-4 h-4 text-neutral-700 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all rtl:-scale-x-100" />
		</a>

		<a href={localizeHref('/rewards')} class="group flex items-center gap-3 p-4 bg-surface-100 border border-white/[0.06] hover:border-emerald-500/20 hover:bg-surface-200 rounded-xl transition-all">
			<div class="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/15 transition-colors">
				<Gift class="w-4 h-4 text-emerald-400" />
			</div>
			<div class="flex-1">
				<div class="font-semibold text-white text-sm">{m.pts_action_redeem_title()}</div>
				<div class="text-[10px] text-neutral-600">{m.pts_action_redeem_desc()}</div>
			</div>
			<ChevronRight class="w-4 h-4 text-neutral-700 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all rtl:-scale-x-100" />
		</a>

		<a href={localizeHref('/history')} class="group flex items-center gap-3 p-4 bg-surface-100 border border-white/[0.06] hover:border-sky-500/20 hover:bg-surface-200 rounded-xl transition-all">
			<div class="p-2 bg-sky-500/10 rounded-lg group-hover:bg-sky-500/15 transition-colors">
				<History class="w-4 h-4 text-sky-400" />
			</div>
			<div class="flex-1">
				<div class="font-semibold text-white text-sm">{m.pts_action_history_title()}</div>
				<div class="text-[10px] text-neutral-600">{m.pts_action_history_desc()}</div>
			</div>
			<ChevronRight class="w-4 h-4 text-neutral-700 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all rtl:-scale-x-100" />
		</a>
	</div>

	<!-- Transactions -->
	<div class="card !p-0 overflow-hidden">
		<div class="flex items-center justify-between px-5 pt-5 pb-3">
			<h2 class="text-sm font-bold text-white">{m.pts_recent()}</h2>
			<a href={localizeHref('/history')} class="group inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-primary-400 transition-colors uppercase tracking-wider">
				{m.pts_all()}
				<ChevronRight class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform rtl:-scale-x-100" />
			</a>
		</div>

		{#if !transactions || transactions.length === 0}
			<div class="text-center py-16 px-6">
				<div class="w-14 h-14 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-3">
					<BarChart3 class="w-7 h-7 text-neutral-700" />
				</div>
				<h3 class="text-sm font-bold text-white mb-1">{m.pts_empty_title()}</h3>
				<p class="text-xs text-neutral-600 mb-4">{m.pts_empty_desc()}</p>
				<a href={localizeHref('/surveys')} class="btn-primary !text-xs">
					<Rocket class="w-3.5 h-3.5" />
					{m.hist_browse_surveys()}
				</a>
			</div>
		{:else}
			<div class="divide-y divide-white/[0.04]">
				{#each transactions.slice(0, 10) as transaction}
					{@const style = getTypeStyle(transaction.type)}
					{@const signed = signedTransactionPoints(transaction.type, transaction.points)}
					<div class="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
						<div class="w-8 h-8 rounded-lg flex items-center justify-center {style.bg} flex-shrink-0">
							<style.icon class="w-3.5 h-3.5 {style.color}" />
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-white/80 truncate">{transaction.description}</div>
							<div class="flex items-center gap-2 mt-0.5">
								<span class="text-[10px] text-neutral-600">{formatDate(transaction.createdAt)}</span>
								<span class="text-[10px] font-semibold {style.color} bg-white/[0.03] px-1.5 py-0.5 rounded">{getTypeLabel(transaction.type)}</span>
							</div>
						</div>
						<div class="text-end flex-shrink-0">
							<div class="text-sm font-black {signed > 0 ? 'text-emerald-400' : signed < 0 ? 'text-rose-400' : 'text-neutral-400'}">
								{signed > 0 ? '+' : ''}{signed.toLocaleString()}
							</div>
							<div class="text-[10px] text-neutral-700">{m.pts_balance_short()} {transaction.currentBalance.toLocaleString()}</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
