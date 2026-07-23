<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import {
		Coins, Flame, Sparkles, Gamepad2, ShoppingBag, Trophy, Layers,
		TrendingUp, Target, Gift, ArrowRight, ChevronRight, Check, Zap,
		Loader2, CircleCheckBig, CircleX, FileText, Lock
	} from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { EXPLORATION_REDEEM_THRESHOLD } from '$lib/utils/exploration-points';

	let { data }: { data: { discover: {
		currentPoints: number;
		lifetimePoints: number;
		surveyPoints: number;
		redeemedPoints: number;
		streakDays: number;
		availableSurveys: number;
	} } } = $props();

	let d = $derived(data.discover);
	let firstName = $derived(authStore.state.user?.name?.split(' ')[0] || m.dash_default_name());

	let greeting = $derived(() => {
		const h = new Date().getHours();
		if (h < 12) return m.dash_greeting_morning();
		if (h < 17) return m.dash_greeting_afternoon();
		return m.dash_greeting_evening();
	});

	// Balance count-up
	let dBalance = $state(0);
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
	$effect(() => { if (ready) ease(0, d.currentPoints, 1000, (v) => (dBalance = v)); });

	// Redeeming exploration points requires an equal (>=EXPLORATION_REDEEM_THRESHOLD)
	// survey-points balance alongside the exploration-points balance — see
	// EXPLORATION_REDEEM_THRESHOLD and /api/panelist/exploration-points/redeem.
	let needExploration = $derived(d.currentPoints < EXPLORATION_REDEEM_THRESHOLD);
	let needSurvey = $derived(d.surveyPoints < EXPLORATION_REDEEM_THRESHOLD);
	let redeemEligible = $derived(!needExploration && !needSurvey);
	// 'exploration' takes priority when both are short — it's checked first
	// and the status card can only show one message at a time — but the two
	// "Earn ___ Points" CTAs below it are independent and can both show.
	let redeemStatusVariant: 'ready' | 'exploration' | 'survey' = $derived(
		redeemEligible ? 'ready' : needExploration ? 'exploration' : 'survey'
	);
	let redeemMessage = $derived(
		needExploration
			? m.disc_redeem_need_more({ points: (EXPLORATION_REDEEM_THRESHOLD - d.currentPoints).toLocaleString() })
			: needSurvey
				? m.disc_redeem_need_survey()
				: ''
	);

	let redeeming = $state(false);
	let showRedeemConfirm = $state(false);
	let redeemResult = $state<'success' | 'error' | null>(null);
	let redeemErrorMsg = $state('');

	async function confirmRedeem() {
		showRedeemConfirm = false;
		redeeming = true;
		try {
			const response = await fetch('/api/panelist/exploration-points/redeem', { method: 'POST' });
			const result = await response.json();
			if (response.ok && result.success) {
				redeemResult = 'success';
				await invalidateAll();
			} else {
				redeemErrorMsg = result?.message || m.disc_redeem_error_title();
				redeemResult = 'error';
			}
		} catch {
			redeemErrorMsg = m.disc_redeem_error_title();
			redeemResult = 'error';
		} finally {
			redeeming = false;
		}
	}

	// 7-day streak calendar — claimed days reflect the real current streak.
	// Weekday abbreviations are locale-derived rather than translation keys, using a
	// fixed Mon..Sun reference week (2024-01-01 was a Monday) to get correct order.
	let dayLabels = $derived(() => {
		const fmt = new Intl.DateTimeFormat(getLocale(), { weekday: 'short' });
		return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
	});
	let todayIdx = $derived((new Date().getDay() + 6) % 7); // Mon=0 … Sun=6
	function dayState(i: number): 'claimed' | 'today' | 'locked' {
		if (i < todayIdx) return i < d.streakDays || d.streakDays >= todayIdx ? 'claimed' : 'locked';
		if (i === todayIdx) return 'today';
		return 'locked';
	}

	let quiz = $derived({
		points: 120,
		question: m.disc_quiz_question(),
		options: [
			{ key: 'A', label: m.disc_quiz_opt_a() },
			{ key: 'B', label: m.disc_quiz_opt_b() },
			{ key: 'C', label: m.disc_quiz_opt_c() },
		],
	});

	let waysToEarn = $derived([
		{ icon: Flame, title: m.disc_way_streaks_title(), desc: m.disc_way_streaks_desc(), tag: m.disc_way_streaks_tag(), href: '/streaks', color: 'amber' },
		{ icon: Zap, title: m.disc_way_quizzes_title(), desc: m.disc_way_quizzes_desc(), tag: m.disc_way_quizzes_tag(), href: '/quizzes', color: 'primary' },
		{ icon: Layers, title: m.disc_way_artifacts_title(), desc: m.disc_way_artifacts_desc(), tag: m.disc_way_artifacts_tag(), href: '/artifacts', color: 'sky' },
		{ icon: Gamepad2, title: m.disc_way_games_title(), desc: m.disc_way_games_desc(), tag: m.disc_way_games_tag(), href: '/games', color: 'violet' },
		{ icon: ShoppingBag, title: m.disc_way_deals_title(), desc: m.disc_way_deals_desc(), tag: m.disc_way_deals_tag(), href: '/exclusive-deals', color: 'emerald' },
		{ icon: Trophy, title: m.disc_way_challenges_title(), desc: m.disc_way_challenges_desc(), tag: m.disc_way_challenges_tag(), href: '/weekly-challenges', color: 'rose' },
	]);

	const colorMap: Record<string, string> = {
		amber: 'bg-amber-400/12 text-amber-400',
		primary: 'bg-primary-400/12 text-primary-400',
		sky: 'bg-sky-400/12 text-sky-400',
		violet: 'bg-violet-400/12 text-violet-400',
		emerald: 'bg-emerald-400/12 text-emerald-400',
		rose: 'bg-rose-400/12 text-rose-400',
	};
	const tagColorMap: Record<string, string> = {
		amber: 'text-amber-400 border-amber-400/20',
		primary: 'text-primary-400 border-primary-400/20',
		sky: 'text-sky-400 border-sky-400/20',
		violet: 'text-violet-400 border-violet-400/20',
		emerald: 'text-emerald-400 border-emerald-400/20',
		rose: 'text-rose-400 border-rose-400/20',
	};
</script>

<svelte:head>
	<title>{m.disc_meta_title()}</title>
</svelte:head>

<div class="space-y-[22px] animate-fade-in">
	<!-- Page heading -->
	<div>
		<h1 class="text-[26px] font-bold text-white tracking-tight">{m.disc_heading()}</h1>
		<p class="text-[14px] text-neutral-400 mt-0.5">{m.disc_subheading()}</p>
	</div>

	<!-- Greeting hero -->
	<div class="relative overflow-hidden rounded-[20px] border border-white/[0.13] bg-gradient-to-br from-primary-400/[0.1] via-surface-100/40 to-surface-50/50 px-7 py-8 md:px-9 md:py-9 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
		<div class="absolute -top-20 -right-24 w-[340px] h-[340px] rounded-full bg-primary-400/20 blur-[42px] pointer-events-none"></div>
		<div class="relative z-10">
			<div class="flex items-center gap-2 mb-3.5">
				<span class="relative flex h-[7px] w-[7px]">
					<span class="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60"></span>
					<span class="relative rounded-full h-[7px] w-[7px] bg-emerald-400 shadow-[0_0_8px_var(--tw-shadow-color)] shadow-emerald-400"></span>
				</span>
				<span class="font-mono text-[11px] font-semibold text-emerald-400 uppercase tracking-[0.12em]">{m.dash_status_online()}</span>
			</div>
			<h2 class="text-[clamp(26px,3.4vw,38px)] font-bold text-white tracking-tight leading-[1.05] mb-2">
				{greeting()}, <span class="text-primary-400">{firstName}</span>
			</h2>
			<p class="text-[14.5px] text-neutral-400 max-w-md">
				{m.disc_hero_desc()}
			</p>

			<div class="mt-5 space-y-3 max-w-md">
				<div class="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
					<div class="flex items-center justify-between mb-2.5">
						<span class="inline-flex items-center gap-2 text-[13px] font-semibold text-white">
							<Zap class="w-3.5 h-3.5 text-primary-400" /> {m.disc_redeem_progress_exploration()}
						</span>
						<span class="font-mono text-[12px] text-neutral-500">{Math.min(d.currentPoints, EXPLORATION_REDEEM_THRESHOLD).toLocaleString()} / {EXPLORATION_REDEEM_THRESHOLD}</span>
					</div>
					<div class="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
						<div class="h-full rounded-full bg-gradient-to-r {d.currentPoints >= EXPLORATION_REDEEM_THRESHOLD ? 'from-sky-400 to-sky-500' : 'from-rose-400 to-rose-500'} transition-all duration-500" style="width:{Math.min(100, (d.currentPoints / EXPLORATION_REDEEM_THRESHOLD) * 100)}%"></div>
					</div>
				</div>
				<div class="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
					<div class="flex items-center justify-between mb-2.5">
						<span class="inline-flex items-center gap-2 text-[13px] font-semibold text-white">
							<FileText class="w-3.5 h-3.5 text-primary-400" /> {m.disc_redeem_progress_survey()}
						</span>
						<span class="font-mono text-[12px] text-neutral-500">{Math.min(d.surveyPoints, EXPLORATION_REDEEM_THRESHOLD).toLocaleString()} / {EXPLORATION_REDEEM_THRESHOLD}</span>
					</div>
					<div class="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
						<div class="h-full rounded-full bg-gradient-to-r {d.surveyPoints >= EXPLORATION_REDEEM_THRESHOLD ? 'from-sky-400 to-sky-500' : 'from-rose-400 to-rose-500'} transition-all duration-500" style="width:{Math.min(100, (d.surveyPoints / EXPLORATION_REDEEM_THRESHOLD) * 100)}%"></div>
					</div>
				</div>
			</div>
		</div>

		<div class="relative z-10 px-6 py-4 rounded-2xl bg-surface/45 border border-white/[0.07] backdrop-blur-md text-right min-w-[150px]">
			<div class="flex items-center justify-end gap-[7px] mb-2">
				<Coins class="w-3.5 h-3.5 text-amber-400" />
				<span class="font-mono text-[10px] font-semibold text-amber-400 uppercase tracking-[0.14em]">{m.dash_balance()}</span>
			</div>
			<div class="text-[42px] font-bold text-white tracking-tight leading-none tabular-nums">{dBalance.toLocaleString()}</div>
			<div class="font-mono text-[11px] text-neutral-500 mt-1">{m.dash_pts_short()}</div>

			<div class="mt-4 pt-4 border-t border-white/[0.08] space-y-3">
				<button
					onclick={() => { if (redeemEligible) showRedeemConfirm = true; }}
					disabled={!redeemEligible || redeeming}
					class="w-full justify-center {redeemEligible ? 'btn-primary' : 'btn bg-white/[0.04] text-neutral-500 border-white/[0.04] cursor-not-allowed'}"
				>
					{#if redeeming}
						<Loader2 class="w-4 h-4 animate-spin" />
					{:else}
						<Gift class="w-4 h-4" />
					{/if}
					{m.disc_redeem_btn()}
				</button>

				<div class="rounded-xl border {redeemStatusVariant === 'ready' ? 'border-emerald-400/20 bg-emerald-400/[0.06]' : redeemStatusVariant === 'exploration' ? 'border-rose-500/20 bg-rose-500/[0.08]' : 'border-amber-400/20 bg-amber-400/[0.08]'} px-3.5 py-3 text-left">
					<div class="flex items-center gap-2 text-[13px] font-semibold {redeemStatusVariant === 'ready' ? 'text-emerald-400' : redeemStatusVariant === 'exploration' ? 'text-rose-400' : 'text-amber-400'}">
						{#if redeemStatusVariant === 'ready'}
							<Check class="w-4 h-4 flex-shrink-0" /> {m.disc_redeem_status_ready_title()}
						{:else}
							<Lock class="w-4 h-4 flex-shrink-0" />
							{redeemStatusVariant === 'exploration' ? m.disc_redeem_status_need_exploration_title() : m.disc_redeem_status_need_survey_title()}
						{/if}
					</div>
					<p class="text-[11.5px] text-neutral-400 mt-1 leading-snug">
						{redeemStatusVariant === 'ready' ? m.disc_redeem_status_ready_desc() : redeemMessage}
					</p>
				</div>

				{#if needExploration}
					<a href="#ways-to-earn" class="btn-primary w-full justify-center">
						<Zap class="w-4 h-4" /> {m.disc_earn_exploration_btn()}
					</a>
				{/if}
				{#if needSurvey}
					<a href={localizeHref('/surveys')} class="btn-primary w-full justify-center !bg-gradient-to-r !from-sky-400 !to-sky-500 !text-white">
						<FileText class="w-4 h-4" /> {m.disc_earn_survey_btn()}
					</a>
				{/if}
			</div>
		</div>
	</div>

	<!-- Streak + Quiz -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
		<!-- Daily streak -->
		<div class="lg:col-span-2 em-panel p-5 md:p-6">
			<div class="flex items-start justify-between mb-5">
				<div class="flex items-center gap-3.5">
					<span class="w-11 h-11 rounded-[12px] bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center text-white flex-shrink-0 shadow-[0_8px_24px_rgba(251,146,60,0.25)]">
						<Flame class="w-[22px] h-[22px]" />
					</span>
					<div>
						<h3 class="text-[16px] font-semibold text-white tracking-tight">{m.disc_streak_title()}</h3>
						<p class="text-[12.5px] text-neutral-400">{m.disc_streak_desc()}</p>
					</div>
				</div>
				<div class="text-right">
					<div class="text-[26px] font-bold text-amber-400 leading-none tabular-nums">{d.streakDays}</div>
					<div class="font-mono text-[10px] text-neutral-500 uppercase tracking-[0.12em] mt-1">{m.disc_day_streak()}</div>
				</div>
			</div>

			<div class="grid grid-cols-7 gap-2 mb-5">
				{#each dayLabels() as label, i}
					{@const st = dayState(i)}
					<div class="aspect-square rounded-xl grid place-items-center text-center transition-colors
						{st === 'claimed' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : ''}
						{st === 'today' ? 'border border-dashed border-amber-400/60 text-amber-400' : ''}
						{st === 'locked' ? 'bg-white/[0.03] border border-white/[0.06] text-neutral-600' : ''}">
						<div>
							<div class="font-mono text-[10px] uppercase tracking-[0.08em] {st === 'claimed' ? 'text-white/90' : ''}">{label}</div>
							<div class="mt-1.5 grid place-items-center">
								{#if st === 'claimed'}<Check class="w-4 h-4" />
								{:else if st === 'today'}<Flame class="w-4 h-4" />
								{:else if i === 6}<Gift class="w-4 h-4" />
								{:else}<Coins class="w-4 h-4" />{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="flex items-center gap-4 flex-wrap">
				<button class="btn-primary !bg-gradient-to-r !from-amber-400 !to-orange-500 !text-white">
					{m.disc_claim_today()} <Sparkles class="w-4 h-4" />
				</button>
				<p class="text-[12.5px] text-neutral-400">{m.disc_next_reward_prefix()} <span class="text-white font-semibold">{m.disc_next_reward_name()}</span> {m.disc_next_reward_suffix()}</p>
			</div>
		</div>

		<!-- Daily quiz -->
		<div class="em-panel p-5 md:p-6 flex flex-col">
			<div class="flex items-center justify-between mb-4">
				<span class="inline-flex items-center gap-2 font-mono text-[11px] font-semibold text-primary-400 uppercase tracking-[0.12em]">
					<Zap class="w-4 h-4" /> {m.disc_daily_quiz()}
				</span>
				<span class="px-2.5 py-1 rounded-md bg-primary-400/12 border border-primary-400/20 font-mono text-[11px] font-semibold text-primary-400">{m.disc_quiz_pts({ points: quiz.points })}</span>
			</div>
			<h4 class="text-[15.5px] font-semibold text-white leading-snug mb-4">{quiz.question}</h4>
			<div class="space-y-2.5">
				{#each quiz.options as opt}
					<button class="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] text-left hover:border-primary-400/40 hover:bg-primary-400/[0.06] transition-colors group">
						<span class="w-6 h-6 rounded-md bg-white/[0.05] grid place-items-center font-mono text-[12px] font-semibold text-neutral-400 group-hover:text-primary-400 flex-shrink-0">{opt.key}</span>
						<span class="text-[13.5px] text-white">{opt.label}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Stat tiles -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
		<div class="em-stat">
			<span class="absolute top-0 left-0 right-0 h-[2px] bg-primary-400 opacity-85"></span>
			<div class="flex items-center gap-2.5 mb-4">
				<span class="w-[30px] h-[30px] rounded-[9px] bg-primary-400/12 text-primary-400 grid place-items-center"><TrendingUp class="w-4 h-4" /></span>
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">{m.disc_stat_lifetime()}</span>
			</div>
			<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{d.lifetimePoints.toLocaleString()}</div>
			<div class="font-mono text-[11px] text-neutral-500 mt-2">{m.disc_stat_lifetime_sub()}</div>
		</div>

		<div class="em-stat">
			<span class="absolute top-0 left-0 right-0 h-[2px] bg-sky-400 opacity-85"></span>
			<div class="flex items-center gap-2.5 mb-4">
				<span class="w-[30px] h-[30px] rounded-[9px] bg-sky-400/12 text-sky-400 grid place-items-center"><Target class="w-4 h-4" /></span>
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">{m.disc_stat_available()}</span>
			</div>
			<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{d.currentPoints.toLocaleString()}</div>
			<div class="font-mono text-[11px] text-neutral-500 mt-2">{m.disc_stat_available_sub()}</div>
		</div>

		<div class="em-stat">
			<span class="absolute top-0 left-0 right-0 h-[2px] bg-amber-400 opacity-85"></span>
			<div class="flex items-center gap-2.5 mb-4">
				<span class="w-[30px] h-[30px] rounded-[9px] bg-amber-400/12 text-amber-400 grid place-items-center"><Flame class="w-4 h-4" /></span>
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">{m.disc_stat_streak()}</span>
			</div>
			<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{d.streakDays.toLocaleString()}</div>
			<div class="font-mono text-[11px] text-neutral-500 mt-2">{m.disc_stat_streak_sub()}</div>
		</div>

		<div class="em-stat">
			<span class="absolute top-0 left-0 right-0 h-[2px] bg-rose-400 opacity-85"></span>
			<div class="flex items-center gap-2.5 mb-4">
				<span class="w-[30px] h-[30px] rounded-[9px] bg-rose-400/12 text-rose-400 grid place-items-center"><Gift class="w-4 h-4" /></span>
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">{m.disc_stat_redeemed()}</span>
			</div>
			<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{Math.abs(d.redeemedPoints).toLocaleString()}</div>
			<div class="font-mono text-[11px] text-neutral-500 mt-2">{m.disc_stat_redeemed_sub()}</div>
		</div>
	</div>

	<!-- Ways to earn -->
	<div id="ways-to-earn">
		<div class="flex items-center justify-between mb-3.5">
			<h3 class="text-[18px] font-bold text-white tracking-tight">{m.disc_ways_heading()}</h3>
			<a href={localizeHref('/rewards')} class="font-mono text-[11px] text-neutral-500 hover:text-primary-400 uppercase tracking-[0.06em] inline-flex items-center gap-1 transition-colors">
				{m.disc_view_all()} <ArrowRight class="w-3.5 h-3.5" />
			</a>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
			{#each waysToEarn as w}
				<a href={localizeHref(w.href)}
					class="group relative em-panel p-6 flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
					<span class="absolute top-6 right-6 w-7 h-7 rounded-full grid place-items-center text-neutral-500 border border-white/[0.06] opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-white group-hover:border-white/20">
						<ArrowRight class="w-3.5 h-3.5" />
					</span>
					<span class="w-11 h-11 rounded-[12px] grid place-items-center mb-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 {colorMap[w.color]}">
						<w.icon class="w-[22px] h-[22px]" />
					</span>
					<h4 class="text-[16px] font-semibold text-white tracking-tight mb-2">{w.title}</h4>
					<p class="text-[13px] text-neutral-400 leading-relaxed mb-5 flex-1">{w.desc}</p>
					<span class="self-start px-3 py-1.5 rounded-lg bg-white/[0.03] border font-mono text-[11px] transition-colors {tagColorMap[w.color]}">{w.tag}</span>
				</a>
			{/each}
		</div>
	</div>

	<!-- Weekly challenge banner -->
	<div class="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-r from-rose-500/[0.12] via-surface-100/50 to-surface-50/50 px-6 py-6 flex flex-col md:flex-row md:items-center gap-5">
		<div class="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-rose-500/15 blur-[44px] pointer-events-none"></div>
		<span class="relative w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 grid place-items-center text-white flex-shrink-0 shadow-[0_8px_24px_rgba(244,63,94,0.25)]">
			<Trophy class="w-[26px] h-[26px]" />
		</span>
		<div class="relative flex-1 min-w-0">
			<h3 class="text-[17px] font-semibold text-white tracking-tight mb-1">{m.disc_challenge_title()}</h3>
			<p class="text-[13px] text-neutral-400 mb-3">{m.disc_challenge_desc()}</p>
			<div class="h-2 rounded-full bg-white/[0.07] overflow-hidden max-w-md">
				<div class="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600" style="width:60%"></div>
			</div>
			<p class="font-mono text-[11px] text-neutral-500 mt-2">{m.disc_challenge_progress({ done: 6, total: 10, remaining: 4 })}</p>
		</div>
		<button class="relative btn-secondary flex-shrink-0">{m.disc_challenge_cta()} <ChevronRight class="w-4 h-4" /></button>
	</div>
</div>

<!-- ═══ REDEEM CONFIRM MODAL ═══ -->
{#if showRedeemConfirm}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onclick={() => (showRedeemConfirm = false)} onkeydown={(e) => e.key === 'Escape' && (showRedeemConfirm = false)}>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="bg-surface-100 rounded-2xl border border-white/[0.06] shadow-2xl max-w-sm w-full p-6 animate-scale-in" onclick={(e) => e.stopPropagation()}>
			<div class="text-center mb-5">
				<div class="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
					<Gift class="w-7 h-7 text-primary-400" />
				</div>
				<h3 class="text-lg font-bold text-white">{m.disc_redeem_confirm_title()}</h3>
			</div>
			<div class="bg-surface-200 rounded-xl p-4 mb-5">
				<div class="flex items-center justify-between text-xs text-neutral-400">
					<span>{m.disc_redeem_confirm_desc({ points: EXPLORATION_REDEEM_THRESHOLD.toLocaleString() })}</span>
				</div>
			</div>
			<div class="flex gap-3">
				<button onclick={() => (showRedeemConfirm = false)} class="btn-secondary flex-1">{m.common_cancel()}</button>
				<button onclick={confirmRedeem} class="btn-primary flex-1"><Gift class="w-4 h-4" /> {m.disc_redeem_confirm_btn()}</button>
			</div>
		</div>
	</div>
{/if}

<!-- ═══ REDEEM SUCCESS MODAL ═══ -->
{#if redeemResult === 'success'}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onclick={() => (redeemResult = null)} onkeydown={(e) => e.key === 'Escape' && (redeemResult = null)}>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="bg-surface-100 rounded-2xl border border-white/[0.06] shadow-2xl max-w-sm w-full p-6 animate-scale-in" onclick={(e) => e.stopPropagation()}>
			<div class="text-center">
				<div class="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
					<CircleCheckBig class="w-7 h-7 text-emerald-400" />
				</div>
				<h3 class="text-lg font-bold text-white mb-1">{m.disc_redeem_success_title()}</h3>
				<p class="text-sm text-neutral-400 mb-5">{m.disc_redeem_success_desc({ points: EXPLORATION_REDEEM_THRESHOLD.toLocaleString() })}</p>
				<button onclick={() => (redeemResult = null)} class="btn-primary w-full"><Check class="w-4 h-4" /> {m.disc_redeem_close()}</button>
			</div>
		</div>
	</div>
{/if}

<!-- ═══ REDEEM ERROR MODAL ═══ -->
{#if redeemResult === 'error'}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onclick={() => (redeemResult = null)} onkeydown={(e) => e.key === 'Escape' && (redeemResult = null)}>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="bg-surface-100 rounded-2xl border border-white/[0.06] shadow-2xl max-w-sm w-full p-6 animate-scale-in" onclick={(e) => e.stopPropagation()}>
			<div class="text-center">
				<div class="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
					<CircleX class="w-7 h-7 text-rose-400" />
				</div>
				<h3 class="text-lg font-bold text-white mb-2">{m.disc_redeem_error_title()}</h3>
				<p class="text-sm text-neutral-400 mb-5">{redeemErrorMsg}</p>
				<button onclick={() => (redeemResult = null)} class="btn-secondary w-full">{m.disc_redeem_close()}</button>
			</div>
		</div>
	</div>
{/if}
