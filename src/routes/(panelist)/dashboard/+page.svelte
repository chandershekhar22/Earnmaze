<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import type { PanelistDashboardData } from '$lib/types/panelist';
	import SkeletonStats from '$lib/components/SkeletonStats.svelte';
	import SkeletonActivity from '$lib/components/SkeletonActivity.svelte';
	import {
		Coins, ClipboardList, CircleCheckBig, CircleX, Gift, ChevronRight,
		TrendingUp, Target, Flame, ArrowRight, Sparkles, Zap,
		Rocket, ArrowUpRight, Users, Copy, Check, Info, X
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';

	let { data }: { data: {
		dashboardData: PanelistDashboardData;
		availableSurveyCards: { id: string; title: string; points: number }[];
	} } = $props();

	let dd = $derived(data.dashboardData);

	let totalAvailable = $derived(dd?.availableSurveys || 0);
	let completedSurveys = $derived(dd?.engagement?.completedSurveys || 0);
	let currentPoints = $derived(dd?.points?.currentPoints || 0);
	let lifetimePoints = $derived(dd?.points?.lifetimePoints || 0);
	let redeemedPoints = $derived(dd?.points?.redeemedPoints || 0);
	let streakDays = $derived(dd?.engagement?.streakDays || 0);
	let isLoaded = $derived(!!dd);
	let isNewUser = $derived(isLoaded && completedSurveys === 0 && lifetimePoints === 0);
	let firstName = $derived(authStore.state.user?.name?.split(' ')[0] || m.dash_default_name());
	let referralCode = $derived(dd?.panelist?.referralCode || '');
	let referralLink = $derived(referralCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}` : '');
	let copied = $state(false);
	let bannerOpen = $state(true);

	function copyReferral() {
		if (!referralLink) return;
		navigator.clipboard.writeText(referralLink);
		copied = true;
		setTimeout(() => copied = false, 2000);
	}

	let greeting = $derived(() => {
		const h = new Date().getHours();
		if (h < 12) return m.dash_greeting_morning();
		if (h < 17) return m.dash_greeting_afternoon();
		return m.dash_greeting_evening();
	});

	let dPoints = $state(0);
	let dLifetime = $state(0);
	let dCompleted = $state(0);
	let dRedeemed = $state(0);
	let ready = $state(false);

	function ease(from: number, to: number, ms: number, set: (v: number) => void) {
		const t0 = performance.now();
		(function tick(now: number) {
			const p = Math.min((now - t0) / ms, 1);
			set(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
			if (p < 1) requestAnimationFrame(tick);
		})(t0);
	}

	onMount(() => { ready = true; });

	$effect(() => {
		if (ready && isLoaded) {
			ease(0, currentPoints, 1000, v => dPoints = v);
			ease(0, lifetimePoints, 1200, v => dLifetime = v);
			ease(0, completedSurveys, 700, v => dCompleted = v);
			ease(0, Math.abs(redeemedPoints), 900, v => dRedeemed = v);
		}
	});

	function startSurvey(id: string, title: string) {
		toastStore.info(m.dash_toast_starting(), m.dash_toast_loading({ title }));
		window.location.href = `/start-survey?surveyId=${id}`;
	}

	// Locale-aware relative time. Uses Intl.RelativeTimeFormat so we get
	// natural strings ("hace 5 minutos", "il y a 2 heures") for free.
	function relTime(date: Date | string): string {
		const locale = getLocale();
		const ms = Date.now() - new Date(date).getTime();
		const minutes = Math.floor(ms / 60000);
		const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
		if (minutes < 1) return rtf.format(0, 'second');
		if (minutes < 60) return rtf.format(-minutes, 'minute');
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return rtf.format(-hours, 'hour');
		const days = Math.floor(hours / 24);
		if (days < 7) return rtf.format(-days, 'day');
		return new Date(date).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
	}

	function actStyle(type: string) {
		if (['completed', 'bonus', 'refund'].includes(type)) return { icon: CircleCheckBig, color: 'text-primary-400', bg: 'bg-primary-400/10' };
		if (['terminated', 'quota_full'].includes(type)) return { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' };
		if (type === 'redeemed') return { icon: Gift, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' };
		if (['rejected', 'penalty', 'expired', 'disqualified'].includes(type)) return { icon: CircleX, color: 'text-rose-400', bg: 'bg-rose-500/10' };
		return { icon: ClipboardList, color: 'text-sky-400', bg: 'bg-sky-500/10' };
	}
</script>

<svelte:head>
	<title>{m.dash_meta_title()}</title>
</svelte:head>

<div class="space-y-[22px] animate-fade-in">
	<!-- Banner -->
	{#if bannerOpen}
		<div class="em-banner-info">
			<Info class="w-[18px] h-[18px] text-sky-400 flex-shrink-0 mt-0.5" />
			<p class="flex-1">Complete surveys to earn points. Redeem your points for gift cards from top brands. Check available surveys below!</p>
			<button onclick={() => bannerOpen = false} class="text-neutral-500 hover:text-white transition-colors flex-shrink-0" aria-label="Dismiss">
				<X class="w-4 h-4" />
			</button>
		</div>
	{/if}

	<!-- Greeting hero -->
	<div class="relative overflow-hidden rounded-[20px] border border-white/[0.13] bg-gradient-to-br from-violet-400/[0.12] via-surface-100/40 to-surface-50/50 px-7 py-8 md:px-9 md:py-9 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
		<div class="absolute -top-20 -right-24 w-[340px] h-[340px] rounded-full bg-violet-400/25 blur-[40px] pointer-events-none"></div>
		<div class="relative z-10">
			<div class="flex items-center gap-2 mb-3.5">
				<span class="relative flex h-[7px] w-[7px]">
					<span class="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60"></span>
					<span class="relative rounded-full h-[7px] w-[7px] bg-emerald-400 shadow-[0_0_8px_var(--tw-shadow-color)] shadow-emerald-400"></span>
				</span>
				<span class="font-mono text-[11px] font-semibold text-emerald-400 uppercase tracking-[0.12em]">{m.dash_status_online()}</span>
				{#if streakDays > 0}
					<span class="mx-1 text-white/15">·</span>
					<Flame class="w-3.5 h-3.5 text-amber-400" />
					<span class="font-mono text-[11px] font-semibold text-amber-400 uppercase tracking-[0.12em]">{m.dash_streak_days({ days: streakDays })}</span>
				{/if}
			</div>
			<h2 class="text-[clamp(26px,3.4vw,38px)] font-bold text-white tracking-tight leading-[1.05] mb-2">
				{greeting()}, {firstName}
			</h2>
			<p class="text-[14.5px] text-neutral-400">
				{#if totalAvailable > 0}
					{totalAvailable === 1 ? m.dash_surveys_ready_singular({ count: totalAvailable }) : m.dash_surveys_ready_plural({ count: totalAvailable })}
				{:else}
					{m.dash_no_surveys()}
				{/if}
			</p>
		</div>

		{#if isLoaded}
			<div class="relative z-10 px-6 py-4 rounded-2xl bg-surface/45 border border-white/[0.07] backdrop-blur-md text-right min-w-[150px]">
				<div class="flex items-center justify-end gap-[7px] mb-2">
					<Coins class="w-3.5 h-3.5 text-amber-400" />
					<span class="font-mono text-[10px] font-semibold text-amber-400 uppercase tracking-[0.14em]">{m.dash_balance()}</span>
				</div>
				<div class="text-[42px] font-bold text-white tracking-tight leading-none tabular-nums">{dPoints.toLocaleString()}</div>
				<div class="font-mono text-[11px] text-neutral-500 mt-1">{m.dash_pts_short()}</div>
				{#if currentPoints > 0}
					<a href={localizeHref('/rewards')} class="mt-1 inline-flex items-center justify-end gap-0.5 text-[10px] font-bold text-fuchsia-400 hover:text-fuchsia-300 transition-colors uppercase tracking-wider">
						{m.dash_redeem()} <ArrowUpRight class="w-2.5 h-2.5" />
					</a>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Welcome strip (new users only) -->
	{#if isNewUser}
		<div class="flex items-center gap-[18px] px-6 py-5 rounded-2xl border border-white/[0.07] bg-gradient-to-r from-violet-400/10 to-surface-100/50 flex-wrap">
			<span class="w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-violet-400 to-violet-700 grid place-items-center text-white flex-shrink-0 shadow-[0_8px_24px_rgba(167,139,250,0.25)]">
				<Rocket class="w-[26px] h-[26px]" />
			</span>
			<div class="flex-1 min-w-[200px]">
				<h3 class="text-[17px] font-semibold text-white tracking-tight mb-1">{m.dash_welcome_title()}</h3>
				<p class="text-[13.5px] text-neutral-400">{m.dash_welcome_desc()}</p>
			</div>
			<a href={localizeHref('/surveys')} class="btn-primary">{m.dash_start_earning()} <ArrowRight class="w-4 h-4" /></a>
		</div>
	{/if}

	<!-- Stat tiles -->
	{#if isLoaded}
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
			<div class="em-stat" style="--c:#c7f463;--cs:rgba(199,244,99,0.12)">
				<span class="absolute top-0 left-0 right-0 h-[2px] bg-primary-400 opacity-85"></span>
				<div class="flex items-center gap-2.5 mb-4">
					<span class="w-[30px] h-[30px] rounded-[9px] bg-primary-400/12 text-primary-400 grid place-items-center">
						<TrendingUp class="w-4 h-4" />
					</span>
					<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">{m.dash_stat_lifetime()}</span>
				</div>
				<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{dLifetime.toLocaleString()}</div>
				<div class="font-mono text-[11px] text-neutral-500 mt-2">total earned</div>
			</div>

			<div class="em-stat">
				<span class="absolute top-0 left-0 right-0 h-[2px] bg-sky-400 opacity-85"></span>
				<div class="flex items-center gap-2.5 mb-4">
					<span class="w-[30px] h-[30px] rounded-[9px] bg-sky-400/12 text-sky-400 grid place-items-center">
						<Target class="w-4 h-4" />
					</span>
					<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">{m.dash_stat_available()}</span>
					{#if totalAvailable > 0}
						<span class="relative flex h-2 w-2 ms-auto">
							<span class="animate-ping absolute h-full w-full rounded-full bg-sky-400 opacity-50"></span>
							<span class="relative rounded-full h-2 w-2 bg-sky-400"></span>
						</span>
					{/if}
				</div>
				<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{totalAvailable.toLocaleString()}</div>
				<div class="font-mono text-[11px] text-neutral-500 mt-2">spendable now</div>
			</div>

			<div class="em-stat">
				<span class="absolute top-0 left-0 right-0 h-[2px] bg-emerald-400 opacity-85"></span>
				<div class="flex items-center gap-2.5 mb-4">
					<span class="w-[30px] h-[30px] rounded-[9px] bg-emerald-400/12 text-emerald-400 grid place-items-center">
						<CircleCheckBig class="w-4 h-4" />
					</span>
					<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">{m.dash_stat_done()}</span>
				</div>
				<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{dCompleted.toLocaleString()}</div>
				<div class="font-mono text-[11px] text-neutral-500 mt-2">surveys completed</div>
			</div>

			<div class="em-stat">
				<span class="absolute top-0 left-0 right-0 h-[2px] bg-rose-400 opacity-85"></span>
				<div class="flex items-center gap-2.5 mb-4">
					<span class="w-[30px] h-[30px] rounded-[9px] bg-rose-400/12 text-rose-400 grid place-items-center">
						<Gift class="w-4 h-4" />
					</span>
					<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">{m.dash_stat_redeemed()}</span>
				</div>
				<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{dRedeemed.toLocaleString()}</div>
				<div class="font-mono text-[11px] text-neutral-500 mt-2">pts cashed out</div>
			</div>
		</div>
	{:else}
		<SkeletonStats />
	{/if}

	<!-- Quick actions -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
		<a href={localizeHref('/surveys')} class="group relative overflow-hidden rounded-2xl p-6 text-white min-h-[118px] flex flex-col justify-between hover:-translate-y-0.5 transition-transform"
		   style="background:linear-gradient(135deg,#b06bff,#7a3ed6)">
			<ArrowUpRight class="absolute top-5 right-5 w-[18px] h-[18px] text-white/90 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
			<span class="w-10 h-10 rounded-[11px] bg-white/[0.16] backdrop-blur-md grid place-items-center"><Rocket class="w-5 h-5" /></span>
			<div>
				<div class="text-[17px] font-bold tracking-tight">{m.dash_q_surveys_title()}</div>
				<div class="text-[12.5px] text-white/80">{m.dash_q_surveys_desc()}</div>
			</div>
		</a>
		<a href={localizeHref('/points')} class="group relative overflow-hidden rounded-2xl p-6 text-white min-h-[118px] flex flex-col justify-between hover:-translate-y-0.5 transition-transform"
		   style="background:linear-gradient(135deg,#19c98f,#0f8f66)">
			<ArrowUpRight class="absolute top-5 right-5 w-[18px] h-[18px] text-white/90 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
			<span class="w-10 h-10 rounded-[11px] bg-white/[0.16] backdrop-blur-md grid place-items-center"><Coins class="w-5 h-5" /></span>
			<div>
				<div class="text-[17px] font-bold tracking-tight">{m.dash_q_points_title()}</div>
				<div class="text-[12.5px] text-white/80">{m.dash_q_points_desc()}</div>
			</div>
		</a>
		<a href={localizeHref('/rewards')} class="group relative overflow-hidden rounded-2xl p-6 text-white min-h-[118px] flex flex-col justify-between hover:-translate-y-0.5 transition-transform"
		   style="background:linear-gradient(135deg,#ff5a7c,#d63356)">
			<ArrowUpRight class="absolute top-5 right-5 w-[18px] h-[18px] text-white/90 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
			<span class="w-10 h-10 rounded-[11px] bg-white/[0.16] backdrop-blur-md grid place-items-center"><Gift class="w-5 h-5" /></span>
			<div>
				<div class="text-[17px] font-bold tracking-tight">{m.dash_q_rewards_title()}</div>
				<div class="text-[12.5px] text-white/80">{m.dash_q_rewards_desc()}</div>
			</div>
		</a>
	</div>

	<!-- Referral strip -->
	{#if referralCode}
		<div class="px-6 py-5 rounded-2xl bg-surface-50 border border-white/[0.07]">
			<div class="flex items-center gap-3.5 mb-4">
				<span class="w-[42px] h-[42px] rounded-[11px] bg-fuchsia-500/12 border border-fuchsia-400/20 text-fuchsia-400 grid place-items-center">
					<Users class="w-5 h-5" />
				</span>
				<div>
					<h4 class="text-[15px] font-semibold text-white tracking-tight">{m.dash_referral_title()}</h4>
					<p class="text-[12.5px] text-neutral-400">{m.dash_referral_desc()}</p>
				</div>
			</div>
			<div class="flex gap-2">
				<div class="flex-1 px-4 py-3 rounded-xl bg-surface/50 border border-white/[0.07] font-mono text-[13px] text-primary-500 truncate">
					{referralLink}
				</div>
				<button
					onclick={copyReferral}
					class="w-12 grid place-items-center rounded-xl bg-white/[0.04] border border-white/[0.13] text-neutral-400 hover:text-primary-400 hover:bg-primary-400/10 hover:border-primary-400/25 transition-colors flex-shrink-0"
					aria-label="Copy link"
				>
					{#if copied}
						<Check class="w-4 h-4 text-primary-400" />
					{:else}
						<Copy class="w-4 h-4" />
					{/if}
				</button>
			</div>
		</div>
	{/if}

	<!-- Activity panel -->
	{#if isLoaded}
		<div class="em-panel">
			<div class="em-panel-h">
				<span class="em-panel-title"><Sparkles class="w-4 h-4 text-primary-400" /> {m.dash_activity()}</span>
				<a href={localizeHref('/history')} class="font-mono text-[11px] text-neutral-500 hover:text-primary-400 uppercase tracking-[0.06em] inline-flex items-center gap-1 transition-colors">
					{m.dash_activity_all()} <ChevronRight class="w-3.5 h-3.5" />
				</a>
			</div>

			{#if dd?.recentActivity && dd.recentActivity.length > 0}
				<div class="p-2">
					{#each dd.recentActivity as a}
						{@const s = actStyle(a.type)}
						<div class="flex items-center gap-3.5 px-3.5 py-3 rounded-xl hover:bg-white/[0.02] transition-colors">
							<div class="w-[38px] h-[38px] rounded-[10px] {s.bg} grid place-items-center flex-shrink-0">
								<s.icon class="w-4 h-4 {s.color}" />
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-[13.5px] font-semibold text-white truncate">{a.description}</div>
								<div class="font-mono text-[11px] text-neutral-500 mt-0.5">{relTime(a.createdAt)}</div>
							</div>
							<span class="font-mono text-sm font-semibold tabular-nums flex-shrink-0 {a.amount > 0 ? 'text-primary-400' : a.amount < 0 ? 'text-rose-400' : 'text-neutral-500'}">
								{a.amount > 0 ? '+' : ''}{a.amount.toLocaleString()}
							</span>
						</div>
					{/each}
				</div>
			{:else}
				<div class="em-empty">
					<span class="em-empty-icon"><ClipboardList class="w-[30px] h-[30px]" /></span>
					<h4 class="text-[17px] font-semibold text-white tracking-tight">{m.dash_activity_empty_title()}</h4>
					<p class="text-[13.5px] text-neutral-400 mb-4">{m.dash_activity_empty_desc()}</p>
					<a href={localizeHref('/surveys')} class="btn-primary"><Rocket class="w-4 h-4" /> {m.dash_activity_empty_cta()}</a>
				</div>
			{/if}
		</div>
	{:else}
		<SkeletonActivity />
	{/if}
</div>
