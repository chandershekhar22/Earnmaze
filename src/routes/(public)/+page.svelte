<script lang="ts">
	import { onMount } from 'svelte';
	import '$lib/components/home/home.css';
	import IconSprite from '$lib/components/home/IconSprite.svelte';
	import HomeNav from '$lib/components/home/HomeNav.svelte';
	import NotificationDrawer from '$lib/components/home/NotificationDrawer.svelte';
	import FeedbackWidget from '$lib/components/home/FeedbackWidget.svelte';
	import ReferEarn from '$lib/components/home/ReferEarn.svelte';
	import HeroSection from '$lib/components/home/HeroSection.svelte';
	import StatsSection from '$lib/components/home/StatsSection.svelte';
	import HowItWorksSection from '$lib/components/home/HowItWorksSection.svelte';
	import WaysToEarnSection from '$lib/components/home/WaysToEarnSection.svelte';
	import DashboardSection from '$lib/components/home/DashboardSection.svelte';
	import GamesSection from '$lib/components/home/GamesSection.svelte';
	import StreaksSection from '$lib/components/home/StreaksSection.svelte';
	import QuizzesSection from '$lib/components/home/QuizzesSection.svelte';
	import ReferralSection from '$lib/components/home/ReferralSection.svelte';
	import WhySection from '$lib/components/home/WhySection.svelte';
	import ReviewsSection from '$lib/components/home/ReviewsSection.svelte';
	import CtaSection from '$lib/components/home/CtaSection.svelte';
	import HomeFooter from '$lib/components/home/HomeFooter.svelte';
	import LiveToasts from '$lib/components/home/LiveToasts.svelte';

	// Shared between the nav (bell opens it) and the drawer/overlay (close).
	let notifOpen = $state(false);

	onMount(() => {
		// Smooth in-page anchor scrolling (#how, #earn, ...) is homepage-only.
		// Scoped here rather than left as a global `html` rule so it can't leak
		// onto other pages during SPA navigation and fight SvelteKit's
		// scroll-to-top reset there.
		document.documentElement.classList.add('home-smooth-scroll');
		const cleanupFns: Array<() => void> = [() => document.documentElement.classList.remove('home-smooth-scroll')];

		// Reveal-on-scroll: applied to `.reveal` elements across every section.
		const rObs = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => {
					if (e.isIntersecting) e.target.classList.add('in');
				}),
			{ threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
		);
		document.querySelectorAll('.reveal').forEach((el) => rObs.observe(el));
		cleanupFns.push(() => rObs.disconnect());

		// Count-up animation for any `[data-count]` stat as it scrolls into view.
		const fmt = (v: number, s: string) => {
			if (s && s.endsWith('M+')) return v.toFixed(1) + 'M+';
			if (s && s.endsWith('K+')) return Math.round(v) + 'K+';
			return Math.round(v).toLocaleString();
		};
		const cObs = new IntersectionObserver(
			(entries) =>
				entries.forEach((n) => {
					const el = n.target as HTMLElement;
					if (!n.isIntersecting || el.dataset.done) return;
					el.dataset.done = '1';
					const t = parseFloat(el.dataset.count || '0');
					const s = el.dataset.suffix || '';
					const p = el.dataset.prefix || '';
					let st: number | null = null;
					const d = 1800;
					const step = (ts: number) => {
						if (!st) st = ts;
						const k = Math.min((ts - st) / d, 1);
						const v = t * (1 - Math.pow(1 - k, 3));
						el.textContent = p + fmt(v, s);
						if (k < 1) requestAnimationFrame(step);
					};
					requestAnimationFrame(step);
				}),
			{ threshold: 0.4 }
		);
		document.querySelectorAll('[data-count]').forEach((el) => cObs.observe(el));
		cleanupFns.push(() => cObs.disconnect());

		return () => cleanupFns.forEach((fn) => fn());
	});
</script>

<svelte:head>
	<title>EarnMaze — Earn Rewards for Your Opinions</title>
	<meta
		name="description"
		content="Daily streaks, brain-boosting quizzes, paid surveys, games & exclusive deals — all rewarding you with real, redeemable points."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<IconSprite />

<NotificationDrawer open={notifOpen} onClose={() => (notifOpen = false)} />
<FeedbackWidget />
<ReferEarn />

<HomeNav onOpenNotif={() => (notifOpen = true)} />

<HeroSection />
<StatsSection />
<HowItWorksSection />
<WaysToEarnSection />
<DashboardSection />
<GamesSection />
<StreaksSection />
<QuizzesSection />
<ReferralSection />
<WhySection />
<ReviewsSection />
<CtaSection />
<HomeFooter />

<LiveToasts />
