<script lang="ts">
	import type { PageData } from './$types';
	import type { PointsTransactionItem } from '$types/api-responses';
	import { Coins, BarChart3, ClipboardList, Gift, History, ChevronRight, CircleCheckBig, CircleX, AlertTriangle, SlidersHorizontal, TrendingUp, Rocket } from '@lucide/svelte';
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

<div class="space-y-[22px] animate-fade-in">
	<InfoBanner id="points-how" message={m.pts_info()} color="primary" />

	<!-- Stats -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
		<div class="em-stat">
			<span class="absolute top-0 left-0 right-0 h-[2px] bg-emerald-400 opacity-85"></span>
			<div class="flex items-center gap-2.5 mb-4">
				<span class="w-[30px] h-[30px] rounded-[9px] bg-emerald-400/12 text-emerald-400 grid place-items-center">
					<Coins class="w-4 h-4" />
				</span>
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">{m.pts_stat_available()}</span>
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
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">{m.pts_stat_lifetime()}</span>
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
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">{m.pts_stat_redeemed()}</span>
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
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">{m.pts_stat_net()}</span>
			</div>
			<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{((pointsData.lifetimeEarned ?? 0) - (pointsData.lifetimeRedeemed ?? 0)).toLocaleString()}</div>
			<div class="font-mono text-[11px] text-neutral-500 mt-2">current standing</div>
		</div>
	</div>

	<!-- Action rows -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
		<a href={localizeHref('/surveys')} class="group flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-surface-50 border border-white/[0.07] hover:border-white/[0.13] hover:-translate-y-0.5 transition-all">
			<span class="w-[42px] h-[42px] rounded-[11px] bg-primary-400/12 text-primary-400 grid place-items-center flex-shrink-0">
				<ClipboardList class="w-[18px] h-[18px]" />
			</span>
			<div class="flex-1">
				<h4 class="text-[14.5px] font-semibold text-white tracking-tight">{m.pts_action_earn_title()}</h4>
				<p class="font-mono text-[11px] text-neutral-500 mt-0.5">{m.pts_action_earn_desc()}</p>
			</div>
			<ChevronRight class="w-4 h-4 text-neutral-500 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all rtl:-scale-x-100" />
		</a>

		<a href={localizeHref('/rewards')} class="group flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-surface-50 border border-white/[0.07] hover:border-white/[0.13] hover:-translate-y-0.5 transition-all">
			<span class="w-[42px] h-[42px] rounded-[11px] bg-emerald-400/12 text-emerald-400 grid place-items-center flex-shrink-0">
				<Gift class="w-[18px] h-[18px]" />
			</span>
			<div class="flex-1">
				<h4 class="text-[14.5px] font-semibold text-white tracking-tight">{m.pts_action_redeem_title()}</h4>
				<p class="font-mono text-[11px] text-neutral-500 mt-0.5">{m.pts_action_redeem_desc()}</p>
			</div>
			<ChevronRight class="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all rtl:-scale-x-100" />
		</a>

		<a href={localizeHref('/history')} class="group flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-surface-50 border border-white/[0.07] hover:border-white/[0.13] hover:-translate-y-0.5 transition-all">
			<span class="w-[42px] h-[42px] rounded-[11px] bg-fuchsia-500/12 text-fuchsia-400 grid place-items-center flex-shrink-0">
				<History class="w-[18px] h-[18px]" />
			</span>
			<div class="flex-1">
				<h4 class="text-[14.5px] font-semibold text-white tracking-tight">{m.pts_action_history_title()}</h4>
				<p class="font-mono text-[11px] text-neutral-500 mt-0.5">{m.pts_action_history_desc()}</p>
			</div>
			<ChevronRight class="w-4 h-4 text-neutral-500 group-hover:text-fuchsia-400 group-hover:translate-x-0.5 transition-all rtl:-scale-x-100" />
		</a>
	</div>

	<!-- Recent Transactions -->
	<div class="em-panel">
		<div class="em-panel-h">
			<span class="em-panel-title"><BarChart3 class="w-4 h-4 text-primary-400" /> {m.pts_recent()}</span>
			<a href={localizeHref('/history')} class="font-mono text-[11px] text-neutral-500 hover:text-primary-400 uppercase tracking-[0.06em] inline-flex items-center gap-1 transition-colors">
				{m.pts_all()} <ChevronRight class="w-3.5 h-3.5 rtl:-scale-x-100" />
			</a>
		</div>

		{#if !transactions || transactions.length === 0}
			<div class="em-empty">
				<span class="em-empty-icon"><BarChart3 class="w-[30px] h-[30px]" /></span>
				<h4 class="text-[17px] font-semibold text-white tracking-tight">{m.pts_empty_title()}</h4>
				<p class="text-[13.5px] text-neutral-400 mb-4">{m.pts_empty_desc()}</p>
				<a href={localizeHref('/surveys')} class="btn-primary"><Rocket class="w-4 h-4" /> {m.hist_browse_surveys()}</a>
			</div>
		{:else}
			<div class="divide-y divide-white/[0.04]">
				{#each transactions.slice(0, 10) as transaction}
					{@const style = getTypeStyle(transaction.type)}
					{@const signed = signedTransactionPoints(transaction.type, transaction.points)}
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
						<div class="text-end flex-shrink-0">
							<div class="font-mono text-sm font-semibold {signed > 0 ? 'text-primary-400' : signed < 0 ? 'text-rose-400' : 'text-neutral-400'}">
								{signed > 0 ? '+' : ''}{signed.toLocaleString()}
							</div>
							<div class="font-mono text-[10px] text-neutral-500">{m.pts_balance_short()} {transaction.currentBalance.toLocaleString()}</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
