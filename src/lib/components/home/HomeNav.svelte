<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { explorationPointsDisplay } from '$lib/stores/exploration-points.svelte';

	let { onOpenNotif, isLoggedIn = false, guestPoints = 0 }: { onOpenNotif: () => void; isLoggedIn?: boolean; guestPoints?: number } = $props();

	let navEl: HTMLElement;
	// Anyone not signed into a full account — whether a completely anonymous
	// visitor or someone with just a guest email-capture session — sees their
	// real (starts-at-0) balance instead of the decorative marketing number.
	let coinCount = $state(isLoggedIn ? 2480 : guestPoints);
	const isGuest = $derived(!isLoggedIn);

	// Keeps the pill in sync with points won from today's tile in any section
	// (see $lib/stores/exploration-points.svelte) without needing a reload.
	$effect(() => {
		if (isGuest) coinCount = guestPoints + explorationPointsDisplay.pendingTotal;
	});

	const navLinks: { href: string; label: string; reload?: boolean }[] = [
		{ href: '#how', label: m.home_nav_link_how() },
		{ href: '#earn', label: m.home_nav_link_earn() },
		{ href: '/games', label: m.home_nav_link_play(), reload: true },
		{ href: '/paid-surveys', label: m.nav_surveys(), reload: true },
		{ href: '/quizzes', label: m.home_nav_link_quizzes(), reload: true },
		{ href: '/artifacts', label: m.home_nav_link_artifacts(), reload: true },
		{ href: '/faq', label: m.home_nav_link_faq(), reload: true }
	];

	function triggerCoinBurst() {
		const cc = document.createElement('div');
		cc.className = 'confetti-container';
		document.body.appendChild(cc);
		const colors = ['#c7f463', '#7ab8ff', '#ffb74a', '#b48cff', '#7eddb5'];
		for (let i = 0; i < 20; i++) {
			const p = document.createElement('div');
			p.className = 'confetti-piece';
			p.style.left = Math.random() * 100 + '%';
			p.style.background = colors[Math.floor(Math.random() * colors.length)];
			p.style.animationDelay = Math.random() * 0.5 + 's';
			p.style.width = Math.random() * 8 + 4 + 'px';
			p.style.height = Math.random() * 8 + 4 + 'px';
			cc.appendChild(p);
		}
		setTimeout(() => cc.remove(), 2000);
		// The random increment is a decorative easter egg for anonymous
		// visitors only — a guest's pill shows a real balance, so it must not
		// be inflated by fake clicks.
		if (!isGuest) coinCount += Math.floor(Math.random() * 50 + 10);
	}

	onMount(() => {
		const onScroll = () => navEl?.classList.toggle('scrolled', window.scrollY > 40);
		window.addEventListener('scroll', onScroll);
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<nav class="home-nav" bind:this={navEl}>
	<div class="wrap nav-row">
		<a href={localizeHref('/')} class="brand">
			<span class="brand-mark">
				<svg
					class="i"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path
						d="M13 2L4.09 12.97a.5.5 0 0 0 .41.8H11l-1 8.23a.5.5 0 0 0 .9.34L19.91 11.03a.5.5 0 0 0-.41-.8H13l1-8.23a.5.5 0 0 0-1-0Z"
					/></svg
				>
			</span>
			EarnMaze
		</a>
		<div class="nav-links">
			{#each navLinks as link (link.href)}
				<a href={link.href.startsWith('#') ? link.href : localizeHref(link.href)} data-sveltekit-reload={link.reload ? '' : undefined}>{link.label}</a>
			{/each}
		</div>
		<div class="nav-actions">
			<button type="button" class="coin-pill" onclick={triggerCoinBurst}>
				<span class="dot"></span>
				<span>{coinCount.toLocaleString()}</span> {m.home_nav_pts()}
			</button>
			<button class="bell" aria-label={m.home_nav_notifications()} onclick={onOpenNotif}>
				<Icon name="bell" />
				<span class="pip"></span>
			</button>
			<a href={localizeHref('/login')} class="btn-ghost">{m.home_nav_login()}</a>
			<a href={localizeHref('/register')} class="btn btn-pri">{m.home_nav_get_started()}</a>
		</div>
	</div>
</nav>
