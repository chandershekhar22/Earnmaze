<script lang="ts">
	import Icon from './Icon.svelte';

	const year = new Date().getFullYear();

	const stores = ['App Store', 'Google Play'];

	const socials = [
		{ href: '/', label: 'X', icon: 'x', external: false },
		{ href: 'https://www.instagram.com/earnmaze.official/', label: 'Instagram', icon: 'ig', external: true },
		{ href: 'https://www.facebook.com/earnmazeofficial/', label: 'Facebook', icon: 'fb', external: true }
	];

	type FooterLink = { href: string; label: string; reload?: boolean };
	const columns: { title: string; links: FooterLink[] }[] = [
		{
			title: 'Earn',
			links: [
				{ href: '/streaks', label: 'Daily streaks', reload: true },
				{ href: '/quizzes', label: 'Quizzes', reload: true },
				{ href: '/artifacts', label: 'Artifacts', reload: true },
				{ href: '/games', label: 'Play', reload: true },
				{ href: '/paid-surveys', label: 'Surveys', reload: true },
				{ href: '/weekly-challenges', label: 'Challenges', reload: true }
			]
		},
		{
			title: 'Learn',
			links: [
				{ href: '#how', label: 'How it works' },
				{ href: '/about', label: 'About' },
				{ href: '#streaks', label: 'Streak tips' },
				{ href: '#quizzes', label: 'Quiz categories' }
			]
		},
		{
			title: 'Company',
			links: [
				{ href: '/about', label: 'About' },
				{ href: '/help', label: 'Help' },
				{ href: '/privacy-policy', label: 'Privacy' },
				{ href: '/terms-of-service', label: 'Terms' }
			]
		}
	];

	const trust = [
		{ icon: 'lock', label: '256-bit SSL' },
		{ icon: 'shield', label: 'SOC 2 Type II' },
		{ icon: 'check', label: 'GDPR / CCPA' },
		{ icon: 'globe', label: 'US-based' }
	];

	let subscribed = $state(false);

	function subscribe(e: SubmitEvent) {
		e.preventDefault();
		subscribed = true;
	}
</script>

<!-- ============ FOOTER ============ -->
<footer class="home-footer">
	<div class="wrap">
		<div class="foot-top">
			<div class="foot-brand">
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
				<p>
					Turning everyday moments into real rewards. Streaks, quizzes, surveys, games, and deals —
					all in one wallet.
				</p>
				<div class="foot-stores">
					{#each stores as store (store)}
						<a href="/" class="fs">{store}</a>
					{/each}
				</div>
				<div class="foot-social">
					{#each socials as social (social.label)}
						<a href={social.href} aria-label={social.label} target={social.external ? '_blank' : undefined} rel={social.external ? 'noopener noreferrer' : undefined}><Icon name={social.icon} /></a>
					{/each}
				</div>
			</div>
			{#each columns as col (col.title)}
				<div class="foot-col">
					<h5>{col.title}</h5>
					{#each col.links as link (link.href)}<a
							href={link.href}
							data-sveltekit-reload={link.reload ? '' : undefined}>{link.label}</a
						>{/each}
				</div>
			{/each}
			<div class="foot-news">
				<h5>Stay updated</h5>
				<p>Tips, new features, and earning hacks. Twice a month, never more.</p>
				<form class="news-form" onsubmit={subscribe}>
					<input type="email" placeholder="you@email.com" required />
					<button type="submit">{subscribed ? '✓ Subscribed' : 'Subscribe'}</button>
				</form>
			</div>
		</div>
		<div class="foot-trust">
			{#each trust as item (item.label)}
				<span><Icon name={item.icon} /> {item.label}</span>
			{/each}
		</div>
		<div class="foot-bot">
			<span>© {year} EarnMaze, Inc.</span>
			<span style="font-style:italic">Give your free time a raise.</span>
			<span>Available in the United States</span>
		</div>
	</div>
</footer>
