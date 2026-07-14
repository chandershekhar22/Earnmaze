<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { getDashboardUrl } from '$lib/utils/dashboard-routing';
	import { loadClarity, stopClarity } from '$lib/clarity';
	import { loadGA, stopGA } from '$lib/ga';
	import { cookieConsent } from '$lib/stores/cookie-consent.svelte';
	import CookieBanner from '$lib/components/CookieBanner.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import * as m from '$lib/paraglide/messages';
	import { deLocalizeUrl, localizeHref } from '$lib/paraglide/runtime';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	let authChecked = $state(false);

	// Reactive analytics gate: loads on consent grant, halts on revoke.
	// Loaders are idempotent (script injected at most once, re-grants flip
	// the consent flag via the provider's API); stop functions tell the
	// already-loaded scripts to pause data collection.
	$effect(() => {
		if (authStore.state.user) return; // logged-in pages don't track
		if (!cookieConsent.loaded) return; // wait for store to hydrate

		if (cookieConsent.analytics) {
			loadClarity();
			loadGA();
		} else {
			stopClarity();
			stopGA();
		}
	});

	// Server-side hooks already redirect logged-in users away from public routes.
	// This $effect is a fallback for client-side navigation (SPA transitions),
	// where the server hooks don't run.
	$effect(() => {
		if (!authStore.state.isLoading && !authChecked) {
			authChecked = true;
			if (authStore.state.user) {
				goto(getDashboardUrl(authStore.state.user.userType));
			}
		}
	});

	// Use the de-localized pathname so the auth-layout / earn-money checks
	// match regardless of which language prefix is on the URL (e.g. both
	// `/login` and `/es/login` should render as auth pages).
	let basePath = $derived(deLocalizeUrl($page.url).pathname);

	let isAuthPage = $derived(
		basePath.includes('/auth') ||
		basePath === '/login' ||
		basePath === '/register' ||
		basePath === '/forgot-password' ||
		basePath === '/reset-password'
	);

	let isStandalonePage = $derived(
		$page.url.pathname === '/' ||
		$page.url.pathname === '/login' ||
		$page.url.pathname === '/register' ||
		$page.url.pathname === '/faq'
	);

	let isEarnMoneyPage = $derived(basePath === '/earn-points');
</script>

<svelte:head>
	<title>EarnMaze Panel - Professional Survey Platform</title>
	<meta
		name="description"
		content="EarnMaze Panel - Earn rewards by participating in surveys and research studies"
	/>
</svelte:head>

{#if isAuthPage}
	<!-- Auth pages layout -->
		<main
			class="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8"
		>
			<!-- Background gradient blobs -->
			<div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
				<div class="absolute -top-40 -start-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl"></div>
				<div class="absolute -bottom-40 -end-40 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl"></div>
				<div class="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
			</div>
			<!-- Language switcher pinned to the top-end corner. Drops down because
			     there's room below; flips automatically via the placement prop. -->
			<div class="absolute top-4 end-4 z-20">
				<LanguageSwitcher variant="public" />
			</div>
			<div class="relative z-10 w-full flex items-center justify-center">
				{@render children()}
			</div>
		</main>
	{:else if isStandalonePage}
		<!-- Home and auth pages render their own shell -->
		{@render children()}
	{:else}
		<!-- Public pages layout -->
		<div class="min-h-screen bg-surface">
			<header class="border-b border-white/[0.06] sticky top-0 z-40 backdrop-blur-xl bg-surface/80">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div class="flex justify-between items-center py-3 md:py-4">
					<div class="flex items-center">
						<a href={localizeHref('/')} dir="ltr" class="text-xl md:text-2xl font-bold text-white flex items-center">
							<img src="/favicon.svg?v=2" alt="EarnMaze Logo" class="w-8 h-8 md:w-10 md:h-10 me-2" />
							<span>EarnMaze</span>
						</a>
					</div>
						{#if !isEarnMoneyPage}
							<nav class="flex items-center space-x-2 md:space-x-4">
								<a href={localizeHref('/')} class="hidden sm:inline-block text-neutral-400 hover:text-white transition-colors text-sm md:text-base">{m.nav_home()}</a>
								<a href={localizeHref('/about')} class="hidden sm:inline-block text-neutral-400 hover:text-white transition-colors text-sm md:text-base">{m.nav_about()}</a>
								<a href={localizeHref('/contact')} class="hidden md:inline-block text-neutral-400 hover:text-white transition-colors text-sm md:text-base">{m.nav_contact()}</a>
								<a href={localizeHref('/login')} class="text-sm md:text-base px-3 py-1.5 md:px-4 md:py-2 text-neutral-300 hover:text-white font-medium transition-colors touch-manipulation">{m.common_signin()}</a>
								<a href={localizeHref('/register')} class="btn-primary text-sm md:text-base !px-3 !py-1.5 md:!px-4 md:!py-2 touch-manipulation">{m.common_signup()}</a>
							</nav>
						{/if}
					</div>
				</div>
			</header>
			<main>
				{@render children()}
			</main>
			<footer class="bg-surface-50 border-t border-white/[0.06] mt-16">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
						<!-- Brand -->
						<div>
							<a href={localizeHref('/')} dir="ltr" class="text-lg font-bold text-white flex items-center mb-2">
								<img src="/favicon.svg?v=2" alt="EarnMaze Logo" class="w-6 h-6 me-2" />
								EarnMaze
							</a>
							<p class="text-sm text-neutral-500">{m.footer_brand_tagline()}</p>
						</div>

						<!-- Quick Links -->
						<div>
							<h3 class="font-semibold text-white mb-4">{m.footer_quick_links()}</h3>
							<ul class="space-y-2 text-sm">
								<li><a href={localizeHref('/')} class="text-neutral-400 hover:text-primary-400 transition-colors">{m.nav_home()}</a></li>
								<li><a href={localizeHref('/about')} class="text-neutral-400 hover:text-primary-400 transition-colors">{m.nav_about()}</a></li>
								<li><a href={localizeHref('/contact')} class="text-neutral-400 hover:text-primary-400 transition-colors">{m.nav_contact()}</a></li>
								<li><a href={localizeHref('/help')} class="text-neutral-400 hover:text-primary-400 transition-colors">{m.nav_help()}</a></li>
								<li><a href={localizeHref('/login')} class="text-neutral-400 hover:text-primary-400 transition-colors">{m.common_signin()}</a></li>
							</ul>
						</div>

						<!-- Legal -->
						<div>
							<h3 class="font-semibold text-white mb-4">{m.footer_legal()}</h3>
							<ul class="space-y-2 text-sm">
								<li><a href={localizeHref('/privacy-policy')} class="text-neutral-400 hover:text-primary-400 transition-colors">{m.footer_privacy()}</a></li>
								<li><a href={localizeHref('/terms-of-service')} class="text-neutral-400 hover:text-primary-400 transition-colors">{m.footer_terms()}</a></li>
								<li><button type="button" onclick={() => cookieConsent.reopen()} class="text-neutral-400 hover:text-primary-400 transition-colors">{m.footer_cookie_settings()}</button></li>
							</ul>
						</div>
					</div>

					<!-- Bottom -->
					<div class="mt-8 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-neutral-600">
						<p>{m.footer_copyright()}</p>
						<LanguageSwitcher variant="public" placement="top" />
					</div>
				</div>
			</footer>
	</div>
{/if}

<CookieBanner />
