<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import type { PanelistDashboardData } from '$lib/types/panelist';
	import SkeletonStats from '$lib/components/SkeletonStats.svelte';
	import SkeletonActivity from '$lib/components/SkeletonActivity.svelte';
	import {
		Coins, ClipboardList, CircleCheckBig, CircleX, Gift, ChevronRight,
		TrendingUp, Target, Flame, ArrowRight, Sparkles, Zap,
		Rocket, ArrowUpRight, FileText, Users, Copy, Check
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { Logger } from '$lib/utils/app-logger';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';

	let { data }: { data: {
		dashboardData: PanelistDashboardData;
		availableSurveyCards: { id: string; title: string; points: number }[];
	} } = $props();

	let dd = $derived(data.dashboardData);
	let surveys = $derived(data.availableSurveyCards ?? []);

	let totalAvailable = $derived(dd?.availableSurveys || 0);
	let completedSurveys = $derived(dd?.engagement?.completedSurveys || 0);
	let currentPoints = $derived(dd?.points?.currentPoints || 0);
	let lifetimePoints = $derived(dd?.points?.lifetimePoints || 0);
	let redeemedPoints = $derived(dd?.points?.redeemedPoints || 0);
	let streakDays = $derived(dd?.engagement?.streakDays || 0);
	let completionRate = $derived(dd?.engagement?.completionRate || 0);
	let isLoaded = $derived(!!dd);
	let isNewUser = $derived(isLoaded && completedSurveys === 0 && lifetimePoints === 0);
	let firstName = $derived(authStore.state.user?.name?.split(' ')[0] || m.dash_default_name());
	let referralCode = $derived(dd?.panelist?.referralCode || '');
	let referralLink = $derived(referralCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}` : '');
	let copied = $state(false);

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

	// Animated counters
	let dPoints = $state(0);
	let dLifetime = $state(0);
	let dCompleted = $state(0);
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
		if (['completed', 'bonus', 'refund'].includes(type)) return { icon: CircleCheckBig, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
		if (['terminated', 'quota_full'].includes(type)) return { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' };
		if (type === 'redeemed') return { icon: Gift, color: 'text-pink-400', bg: 'bg-pink-500/10' };
		if (['rejected', 'penalty', 'expired', 'disqualified'].includes(type)) return { icon: CircleX, color: 'text-red-400', bg: 'bg-red-500/10' };
		return { icon: ClipboardList, color: 'text-violet-400', bg: 'bg-violet-500/10' };
	}
</script>

<svelte:head>
	<title>{m.dash_meta_title()}</title>
</svelte:head>

<style>
	@keyframes float    { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
	@keyframes float-x  { 0%,100% { transform: translateX(0) } 50% { transform: translateX(8px) } }
	@keyframes glow-p   { 0%,100% { opacity:.35; transform:scale(1) } 50% { opacity:.7; transform:scale(1.04) } }
	@keyframes fade-up  { 0% { opacity:0; transform:translateY(12px) } 100% { opacity:1; transform:translateY(0) } }
	@keyframes slide-r  { 0% { opacity:0; transform:translateX(16px) } 100% { opacity:1; transform:translateX(0) } }
	@keyframes pop      { 0% { opacity:0; transform:scale(.85) } 60% { transform:scale(1.04) } 100% { opacity:1; transform:scale(1) } }
	@keyframes row-in   { 0% { opacity:0; transform:translateX(-8px) } 100% { opacity:1; transform:translateX(0) } }

	.fl-s  { animation: float   7s ease-in-out infinite }
	.fl-m  { animation: float   5s ease-in-out infinite .4s }
	.fl-f  { animation: float   3.5s ease-in-out infinite .9s }
	.fl-x  { animation: float-x 9s ease-in-out infinite }
	.glow  { animation: glow-p  4s ease-in-out infinite }

	.in-1 { animation: fade-up .45s ease-out .05s both }
	.in-2 { animation: fade-up .45s ease-out .12s both }
	.in-3 { animation: fade-up .45s ease-out .19s both }
	.in-4 { animation: fade-up .45s ease-out .26s both }
	.in-5 { animation: fade-up .45s ease-out .33s both }
	.in-6 { animation: fade-up .45s ease-out .40s both }
	.in-7 { animation: fade-up .45s ease-out .47s both }
	.sl-r { animation: slide-r .5s ease-out .2s both }
	.pop  { animation: pop .35s ease-out both }
	.row  { animation: row-in .35s ease-out both }
</style>

<!-- ─── Hero: compact greeting + balance ─── -->
<div class="relative overflow-hidden rounded-2xl mb-5 bg-gradient-to-br from-surface-50 to-surface-100 border border-white/[0.04] in-1">
	<div class="absolute top-0 start-0 w-80 h-80 bg-violet-500/25 rounded-full blur-[80px] fl-s"></div>
	<div class="absolute bottom-0 end-0 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[70px] fl-m"></div>
	<div class="absolute top-1/2 start-1/2 w-48 h-48 bg-sky-500/12 rounded-full blur-[50px] fl-f -translate-x-1/2 -translate-y-1/2"></div>
	<div class="absolute bottom-0 start-1/4 w-40 h-40 bg-amber-500/12 rounded-full blur-[50px] fl-x"></div>

	<div class="relative px-5 py-6 md:px-7 md:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
		<!-- Left: greeting -->
		<div class="in-2">
			<div class="flex items-center gap-2 mb-2">
				<div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
				<span class="text-[10px] font-bold text-emerald-300/80 uppercase tracking-widest">{m.dash_status_online()}</span>
				{#if streakDays > 0}
					<span class="mx-1 text-white/10">|</span>
					<Flame class="w-3 h-3 text-orange-400" />
					<span class="text-[10px] font-bold text-orange-300">{m.dash_streak_days({ days: streakDays })}</span>
				{/if}
			</div>
			<h1 class="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
				{greeting()}, {firstName}
			</h1>
			<p class="text-sm text-white/40 mt-1">
				{#if totalAvailable > 0}
					{totalAvailable === 1 ? m.dash_surveys_ready_singular({ count: totalAvailable }) : m.dash_surveys_ready_plural({ count: totalAvailable })}
				{:else}
					{m.dash_no_surveys()}
				{/if}
			</p>
		</div>

		<!-- Right: balance -->
		{#if isLoaded}
			<div class="relative group sl-r flex-shrink-0">
				<div class="absolute -inset-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-400 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity glow"></div>
				<div class="relative bg-surface-100/80 backdrop-blur-xl border border-white/10 rounded-xl px-5 py-4">
					<div class="flex items-center gap-1.5 mb-1">
						<Coins class="w-3.5 h-3.5 text-yellow-400" />
						<span class="text-[9px] font-bold text-white/35 uppercase tracking-[0.15em]">{m.dash_balance()}</span>
					</div>
					<div class="text-3xl font-black text-white tracking-tighter tabular-nums">
						{dPoints.toLocaleString()}
					</div>
					<div class="flex items-center gap-2 mt-1">
						<span class="text-[10px] text-white/25 font-medium">{m.dash_pts_short()}</span>
						{#if currentPoints > 0}
							<a href={localizeHref('/rewards')} class="text-[10px] font-bold text-fuchsia-400 hover:text-fuchsia-300 transition-colors uppercase tracking-wider flex items-center gap-0.5">
								{m.dash_redeem()} <ArrowUpRight class="w-2.5 h-2.5" />
							</a>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Info tips -->
{#if isLoaded}
	<div class="space-y-2 mb-3 in-2">
		<InfoBanner id="dash-how" message={m.dash_info_how()} color="primary" />
		{#if currentPoints > 0 && currentPoints < 500}
			<InfoBanner id="dash-redeem" message={m.dash_info_threshold()} color="amber" />
		{/if}
	</div>
{/if}

<!-- ─── New User Welcome ─── -->
{#if isNewUser}
	<div class="relative overflow-hidden bg-gradient-to-br from-violet-600/15 via-fuchsia-600/10 to-surface-100 border border-violet-500/15 rounded-2xl p-5 md:p-6 mb-5 in-3">
		<div class="absolute -top-16 -end-16 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl"></div>
		<div class="relative flex flex-col sm:flex-row sm:items-center gap-4">
			<div class="p-3 bg-violet-500/15 rounded-xl flex-shrink-0 w-fit">
				<Rocket class="w-6 h-6 text-violet-400" />
			</div>
			<div class="flex-1">
				<h3 class="text-base font-bold text-white mb-1">{m.dash_welcome_title()}</h3>
				<p class="text-sm text-neutral-400">{m.dash_welcome_desc()}</p>
			</div>
			<a href={localizeHref('/surveys')} class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex-shrink-0">
				{m.dash_start_earning()} <ArrowRight class="w-4 h-4 rtl:-scale-x-100" />
			</a>
		</div>
	</div>
{/if}

<!-- ─── Available Surveys (the #1 action) ─── -->
{#if surveys.length > 0}
	<div class="mb-5 in-3">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-xs font-bold text-white/40 uppercase tracking-widest">{m.dash_ready_to_earn()}</h2>
			<a href={localizeHref('/surveys')} class="group flex items-center gap-1 text-[10px] font-bold text-primary-400/70 hover:text-primary-400 uppercase tracking-wider transition-colors">
				{m.dash_see_all()} <ChevronRight class="w-3 h-3 group-hover:translate-x-0.5 transition-transform rtl:-scale-x-100" />
			</a>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
			{#each surveys as s, i}
				<button
					onclick={() => startSurvey(s.id, s.title)}
					class="group text-start bg-surface-100 border border-white/[0.06] rounded-xl p-4 hover:border-primary-500/25 hover:bg-surface-200 transition-all duration-200 active:scale-[0.98]"
					style="animation: fade-up .4s ease-out {0.25 + i * 0.07}s both"
				>
					<div class="flex items-center gap-3">
						<div class="p-2 bg-primary-500/10 rounded-lg group-hover:bg-primary-500/15 group-hover:scale-105 transition-all flex-shrink-0">
							<FileText class="w-4 h-4 text-primary-400" />
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-semibold text-white/80 truncate group-hover:text-white transition-colors">{s.title}</div>
							<div class="text-xs font-bold text-emerald-400 mt-0.5">+{s.points} {m.dash_pts_short()}</div>
						</div>
						<ArrowRight class="w-4 h-4 text-white/15 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 rtl:-scale-x-100" />
					</div>
				</button>
			{/each}
		</div>
	</div>
{/if}

<!-- ─── Stats ─── -->
{#if isLoaded}
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
		<div class="group relative overflow-hidden bg-gradient-to-br from-violet-500/[0.08] to-surface-100 rounded-xl p-4 border border-violet-500/10 hover:border-violet-500/25 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 in-3">
			<div class="absolute -top-6 -end-6 w-16 h-16 bg-violet-500/10 rounded-full blur-xl group-hover:bg-violet-500/20 transition-colors"></div>
			<div class="relative">
				<div class="flex items-center gap-2.5 mb-2.5">
					<div class="p-1.5 bg-violet-500/15 rounded-lg group-hover:scale-110 transition-transform">
						<TrendingUp class="w-3.5 h-3.5 text-violet-400" />
					</div>
					<span class="text-[10px] font-bold text-violet-300/40 uppercase tracking-widest">{m.dash_stat_lifetime()}</span>
				</div>
				<div class="text-xl font-black text-white tracking-tight tabular-nums">{dLifetime.toLocaleString()}</div>
			</div>
		</div>

		<div class="group relative overflow-hidden bg-gradient-to-br from-sky-500/[0.08] to-surface-100 rounded-xl p-4 border border-sky-500/10 hover:border-sky-500/25 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300 in-4">
			<div class="absolute -top-6 -end-6 w-16 h-16 bg-sky-500/10 rounded-full blur-xl group-hover:bg-sky-500/20 transition-colors"></div>
			<div class="relative">
				<div class="flex items-center gap-2.5 mb-2.5">
					<div class="p-1.5 bg-sky-500/15 rounded-lg group-hover:scale-110 transition-transform">
						<Target class="w-3.5 h-3.5 text-sky-400" />
					</div>
					<span class="text-[10px] font-bold text-sky-300/40 uppercase tracking-widest">{m.dash_stat_available()}</span>
					{#if totalAvailable > 0}
						<span class="relative flex h-2 w-2 ms-auto">
							<span class="animate-ping absolute h-full w-full rounded-full bg-sky-400 opacity-50"></span>
							<span class="relative rounded-full h-2 w-2 bg-sky-400 shadow-sm shadow-sky-400/50"></span>
						</span>
					{/if}
				</div>
				<div class="text-xl font-black text-white tracking-tight">{totalAvailable}</div>
			</div>
		</div>

		<div class="group relative overflow-hidden bg-gradient-to-br from-emerald-500/[0.08] to-surface-100 rounded-xl p-4 border border-emerald-500/10 hover:border-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 in-5">
			<div class="absolute -top-6 -end-6 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors"></div>
			<div class="relative">
				<div class="flex items-center gap-2.5 mb-2.5">
					<div class="p-1.5 bg-emerald-500/15 rounded-lg group-hover:scale-110 transition-transform">
						<CircleCheckBig class="w-3.5 h-3.5 text-emerald-400" />
					</div>
					<span class="text-[10px] font-bold text-emerald-300/40 uppercase tracking-widest">{m.dash_stat_done()}</span>
				</div>
				<div class="text-xl font-black text-white tracking-tight tabular-nums">{dCompleted}</div>
				{#if completionRate > 0}
					<div class="text-[10px] font-bold text-emerald-400/70 mt-0.5">{m.dash_stat_rate({ rate: completionRate.toFixed(0) })}</div>
				{/if}
			</div>
		</div>

		<div class="group relative overflow-hidden bg-gradient-to-br from-rose-500/[0.08] to-surface-100 rounded-xl p-4 border border-rose-500/10 hover:border-rose-500/25 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300 in-6">
			<div class="absolute -top-6 -end-6 w-16 h-16 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-colors"></div>
			<div class="relative">
				<div class="flex items-center gap-2.5 mb-2.5">
					<div class="p-1.5 bg-rose-500/15 rounded-lg group-hover:scale-110 transition-transform">
						<Gift class="w-3.5 h-3.5 text-rose-400" />
					</div>
					<span class="text-[10px] font-bold text-rose-300/40 uppercase tracking-widest">{m.dash_stat_redeemed()}</span>
				</div>
				<div class="text-xl font-black text-white tracking-tight tabular-nums">{Math.abs(redeemedPoints).toLocaleString()}</div>
			</div>
		</div>
	</div>
{:else}
	<div class="mb-5"><SkeletonStats /></div>
{/if}

<!-- ─── Quick Nav ─── -->
<div class="grid grid-cols-3 gap-2.5 mb-5">
	<a href={localizeHref('/surveys')} class="group relative overflow-hidden bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl p-4 text-white hover:shadow-xl hover:shadow-violet-500/20 hover:-translate-y-1 transition-all duration-300 in-5">
		<div class="absolute -top-4 -end-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:bg-white/15 transition-colors"></div>
		<Rocket class="w-5 h-5 mb-3 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all relative" />
		<div class="text-sm font-bold relative">{m.dash_q_surveys_title()}</div>
		<div class="text-[10px] text-white/60 mt-0.5 relative">{m.dash_q_surveys_desc()}</div>
	</a>
	<a href={localizeHref('/points')} class="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl p-4 text-white hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-300 in-6">
		<div class="absolute -top-4 -end-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:bg-white/15 transition-colors"></div>
		<Coins class="w-5 h-5 mb-3 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all relative" />
		<div class="text-sm font-bold relative">{m.dash_q_points_title()}</div>
		<div class="text-[10px] text-white/60 mt-0.5 relative">{m.dash_q_points_desc()}</div>
	</a>
	<a href={localizeHref('/rewards')} class="group relative overflow-hidden bg-gradient-to-br from-rose-600 to-pink-600 rounded-xl p-4 text-white hover:shadow-xl hover:shadow-rose-500/20 hover:-translate-y-1 transition-all duration-300 in-7">
		<div class="absolute -top-4 -end-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:bg-white/15 transition-colors"></div>
		<Gift class="w-5 h-5 mb-3 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all relative" />
		<div class="text-sm font-bold relative">{m.dash_q_rewards_title()}</div>
		<div class="text-[10px] text-white/60 mt-0.5 relative">{m.dash_q_rewards_desc()}</div>
	</a>
</div>

<!-- ─── Referral Card ─── -->
{#if referralCode}
	<div class="bg-surface-100 border border-white/[0.06] rounded-xl p-4 mb-5 in-7">
		<div class="flex items-center gap-3 mb-3">
			<div class="p-1.5 bg-fuchsia-500/10 rounded-lg">
				<Users class="w-3.5 h-3.5 text-fuchsia-400" />
			</div>
			<div>
				<h3 class="text-xs font-bold text-white">{m.dash_referral_title()}</h3>
				<p class="text-[10px] text-neutral-600">{m.dash_referral_desc()}</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<div class="flex-1 bg-surface-200 border border-white/[0.04] rounded-lg px-3 py-2 text-xs text-neutral-400 font-mono truncate">
				{referralLink}
			</div>
			<button onclick={copyReferral} class="btn-secondary !px-3 !py-2 !text-xs flex-shrink-0">
				{#if copied}
					<Check class="w-3.5 h-3.5 text-emerald-400" />
				{:else}
					<Copy class="w-3.5 h-3.5" />
				{/if}
			</button>
		</div>
	</div>
{/if}

<!-- ─── Recent Activity ─── -->
{#if isLoaded}
	<div class="bg-surface-100 border border-white/[0.06] rounded-xl overflow-hidden in-7">
		<div class="flex items-center justify-between px-4 pt-4 pb-2">
			<div class="flex items-center gap-2">
				<Sparkles class="w-3.5 h-3.5 text-violet-400/60" />
				<h2 class="text-xs font-bold text-white/40 uppercase tracking-widest">{m.dash_activity()}</h2>
			</div>
			<a href={localizeHref('/history')} class="group flex items-center gap-1 text-[10px] font-bold text-white/25 hover:text-violet-400 uppercase tracking-wider transition-colors">
				{m.dash_activity_all()} <ChevronRight class="w-3 h-3 group-hover:translate-x-0.5 transition-transform rtl:-scale-x-100" />
			</a>
		</div>

		{#if dd?.recentActivity && dd.recentActivity.length > 0}
			<div class="divide-y divide-white/[0.04]">
				{#each dd.recentActivity as a, i}
					{@const s = actStyle(a.type)}
					<div class="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors row" style="animation-delay: {0.5 + i * 0.05}s">
						<div class="p-1.5 {s.bg} rounded-lg flex-shrink-0">
							<s.icon class="w-3.5 h-3.5 {s.color}" />
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-[13px] font-medium text-white/70 truncate">{a.description}</div>
							<div class="text-[10px] text-white/20 mt-0.5">{relTime(a.createdAt)}</div>
						</div>
						<span class="text-sm font-black tabular-nums flex-shrink-0 {a.amount > 0 ? 'text-emerald-400' : a.amount < 0 ? 'text-red-400' : 'text-white/30'}">
							{a.amount > 0 ? '+' : ''}{a.amount.toLocaleString()}
						</span>
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-center py-12 px-6">
				<div class="w-12 h-12 bg-white/[0.03] rounded-xl flex items-center justify-center mx-auto mb-3 pop">
					<ClipboardList class="w-6 h-6 text-white/10" />
				</div>
				<p class="text-xs font-semibold text-white/30 mb-1">{m.dash_activity_empty_title()}</p>
				<p class="text-[10px] text-white/15 mb-4">{m.dash_activity_empty_desc()}</p>
				<a href={localizeHref('/surveys')} class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-[11px] font-bold rounded-lg hover:bg-primary-500 transition-colors">
					<Rocket class="w-3 h-3" /> {m.dash_activity_empty_cta()}
				</a>
			</div>
		{/if}
	</div>
{:else}
	<SkeletonActivity />
{/if}
