<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';

	let { onOpenNotif }: { onOpenNotif: () => void } = $props();

	let navEl: HTMLElement;
	let coinCount = $state(2480);

	const navLinks: { href: string; label: string; reload?: boolean }[] = [
		{ href: '#how', label: 'How it works' },
		{ href: '#earn', label: 'Earn' },
		{ href: '/games', label: 'Play', reload: true },
		{ href: '/paid-surveys', label: 'Surveys', reload: true },
		{ href: '/quizzes', label: 'Quizzes', reload: true },
		{ href: '/artifacts', label: 'Artifacts', reload: true },
		{ href: '/faq', label: 'FAQ', reload: true }
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
		coinCount += Math.floor(Math.random() * 50 + 10);
	}

	onMount(() => {
		const onScroll = () => navEl?.classList.toggle('scrolled', window.scrollY > 40);
		window.addEventListener('scroll', onScroll);
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<nav class="home-nav" bind:this={navEl}>
	<div class="wrap nav-row">
		<a href="/" class="brand">
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
				<a href={link.href} data-sveltekit-reload={link.reload ? '' : undefined}>{link.label}</a>
			{/each}
		</div>
		<div class="nav-actions">
			<button type="button" class="coin-pill" onclick={triggerCoinBurst}>
				<span class="dot"></span>
				<span>{coinCount.toLocaleString()}</span> pts
			</button>
			<button class="bell" aria-label="Notifications" onclick={onOpenNotif}>
				<Icon name="bell" />
				<span class="pip"></span>
			</button>
			<a href="/login" class="btn-ghost">Log in</a>
			<a href="/register" class="btn btn-pri">Get started</a>
		</div>
	</div>
</nav>
