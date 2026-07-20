<script lang="ts">
	import Icon from './Icon.svelte';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';

	const stores = ['App Store', 'Google Play'];

	const socials = [
		{ href: '/', label: 'X', icon: 'x', external: false },
		{ href: 'https://www.instagram.com/earnmaze.official/', label: 'Instagram', icon: 'ig', external: true },
		{ href: 'https://www.facebook.com/earnmazeofficial/', label: 'Facebook', icon: 'fb', external: true }
	];

	type FooterLink = { href: string; label: string; reload?: boolean };
	const columns: { title: string; links: FooterLink[] }[] = [
		{
			title: m.home_nav_link_earn(),
			links: [
				{ href: '/streaks', label: m.home_footer_link_streaks(), reload: true },
				{ href: '/quizzes', label: m.home_nav_link_quizzes(), reload: true },
				{ href: '/artifacts', label: m.home_nav_link_artifacts(), reload: true },
				{ href: '/games', label: m.home_nav_link_play(), reload: true },
				{ href: '/paid-surveys', label: m.nav_surveys(), reload: true },
				{ href: '/weekly-challenges', label: m.home_footer_link_challenges(), reload: true }
			]
		},
		{
			title: m.home_footer_col_learn(),
			links: [
				{ href: '#how', label: m.home_nav_link_how() },
				{ href: '/about', label: m.nav_about() },
				{ href: '#streaks', label: m.home_footer_link_streak_tips() },
				{ href: '#quizzes', label: m.home_footer_link_quiz_categories() }
			]
		},
		{
			title: m.home_footer_col_company(),
			links: [
				{ href: '/about', label: m.nav_about() },
				{ href: '/help', label: m.nav_help() },
				{ href: '/privacy-policy', label: m.home_footer_link_privacy() },
				{ href: '/terms-of-service', label: m.home_footer_link_terms() }
			]
		}
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
				<p>
					{m.home_footer_tagline()}
				</p>
				<div class="foot-stores">
					{#each stores as store (store)}
						<a href={localizeHref('/')} class="fs">{store}</a>
					{/each}
				</div>
				<div class="foot-social">
					{#each socials as social (social.label)}
						<a href={social.external ? social.href : localizeHref(social.href)} aria-label={social.label} target={social.external ? '_blank' : undefined} rel={social.external ? 'noopener noreferrer' : undefined}><Icon name={social.icon} /></a>
					{/each}
				</div>
			</div>
			{#each columns as col (col.title)}
				<div class="foot-col">
					<h5>{col.title}</h5>
					{#each col.links as link (link.href)}<a
							href={link.href.startsWith('#') ? link.href : localizeHref(link.href)}
							data-sveltekit-reload={link.reload ? '' : undefined}>{link.label}</a
						>{/each}
				</div>
			{/each}
			<div class="foot-news">
				<h5>{m.home_footer_news_title()}</h5>
				<p>{m.home_footer_news_desc()}</p>
				<form class="news-form" onsubmit={subscribe}>
					<input type="email" placeholder={m.home_footer_news_placeholder()} required />
					<button type="submit">{subscribed ? m.home_footer_subscribed() : m.home_footer_subscribe()}</button>
				</form>
			</div>
		</div>

		<div class="foot-bottom">
			<span>{m.footer_copyright()}</span>
			<LanguageSwitcher variant="public" placement="top" />
		</div>
	</div>
</footer>
