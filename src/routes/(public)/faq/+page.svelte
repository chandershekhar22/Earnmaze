<script lang="ts">
	import { onMount } from 'svelte';
	import '$lib/components/home/home.css';
	import IconSprite from '$lib/components/home/IconSprite.svelte';
	import HomeNav from '$lib/components/home/HomeNav.svelte';
	import NotificationDrawer from '$lib/components/home/NotificationDrawer.svelte';
	import FeedbackWidget from '$lib/components/home/FeedbackWidget.svelte';
	import ReferEarn from '$lib/components/home/ReferEarn.svelte';
	import FaqSection from '$lib/components/home/FaqSection.svelte';
	import HomeFooter from '$lib/components/home/HomeFooter.svelte';
	import LiveToasts from '$lib/components/home/LiveToasts.svelte';

	// Shared between the nav (bell opens it) and the drawer/overlay (close).
	let notifOpen = $state(false);

	onMount(() => {
		document.documentElement.classList.add('home-smooth-scroll');

		// Reveal-on-scroll: applied to `.reveal` elements, same as the homepage.
		const rObs = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => {
					if (e.isIntersecting) e.target.classList.add('in');
				}),
			{ threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
		);
		document.querySelectorAll('.reveal').forEach((el) => rObs.observe(el));

		return () => {
			document.documentElement.classList.remove('home-smooth-scroll');
			rObs.disconnect();
		};
	});
</script>

<svelte:head>
	<title>FAQ — EarnMaze</title>
	<meta
		name="description"
		content="Answers to common questions about EarnMaze — streaks, quizzes, payouts, and more."
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

<div class="faq-page-top">
	<FaqSection />
</div>

<HomeFooter />

<LiveToasts />

<style>
	.faq-page-top {
		padding-top: 64px;
	}
	@media (max-width: 980px) {
		.faq-page-top {
			padding-top: 48px;
		}
	}
	@media (max-width: 560px) {
		.faq-page-top {
			padding-top: 32px;
		}
	}
</style>
