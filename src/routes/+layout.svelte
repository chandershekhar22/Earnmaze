<script lang="ts">
	import { page, navigating } from '$app/stores';
	import { beforeNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { initializeAppLogging, Logger, Features, Session } from '$lib/utils/app-logger';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import ExplorationPointsWatcher from '$lib/components/ExplorationPointsWatcher.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import type { Snippet } from 'svelte';
	import '../app.pcss';

	let { children }: { children: Snippet } = $props();

	let mounted = $state(false);

	// Locales that get a URL prefix. Mirrors the server-side hook config.
	const LOCALE_PREFIXED = ['es', 'fr', 'pt', 'ar'];

	// SvelteKit's SPA router intercepts popstate (browser Back/Forward) and
	// fetches `<route>/__data.json` instead of doing a full document reload.
	// That data fetch DOES get our cookie-locale redirect server-side, but
	// SvelteKit then renders the popped-to URL in the address bar (the un-
	// prefixed one) regardless. The cleanest fix is to detect the mismatch
	// up front and force a full-document navigation to the localized URL —
	// the server then renders the correct locale and the URL bar matches.
	beforeNavigate((nav) => {
		console.log('[beforeNavigate]', { type: nav.type, to: nav.to?.url.pathname });
		if (nav.type !== 'popstate' || !nav.to) return;
		const pathname = nav.to.url.pathname;
		if (
			pathname.startsWith('/admin') ||
			pathname.startsWith('/client') ||
			pathname.startsWith('/moderator') ||
			pathname.startsWith('/api/') ||
			pathname.startsWith('/_app/')
		)
			return;
		const cookieLocale = document.cookie
			.split('; ')
			.find((c) => c.startsWith('em_locale='))
			?.split('=')[1];
		console.log('[beforeNavigate] cookie:', cookieLocale, 'path:', pathname);
		if (!cookieLocale || !LOCALE_PREFIXED.includes(cookieLocale)) return;
		if (/^\/(es|fr|pt|ar)(\/|$)/.test(pathname)) return;
		const target = `/${cookieLocale}${pathname === '/' ? '' : pathname}${nav.to.url.search}`;
		console.log('[beforeNavigate] FORCING RELOAD to', target);
		nav.cancel();
		window.location.assign(target);
	});

	onMount(() => {
		mounted = true;

		// Initialize app-wide logging
		initializeAppLogging();

		// Initialize auth state — skip if already authenticated (e.g. just logged in)
		if (!authStore.state.user) {
			authStore.checkAuth();
		}

		// Initialize theme — applies the `dark` class to <html> directly
		themeStore.initialize();

		// Log application startup
		Logger.root.info({ context: 'app', route: $page.route.id, url: $page.url.pathname, timestamp: new Date().toISOString() }, 'Application mounted and initialized');

		// Force reload when the page is restored from bfcache (back/forward
		// cache) and the active locale no longer matches the user's cookie
		// preference. Without this, clicking Browser Back after a language
		// switch shows the page in the previous locale because the bfcache
		// restore skips the server entirely (and our cookie-driven redirect
		// in hooks.server.ts never runs).
		const onPageShow = (e: PageTransitionEvent) => {
			if (!e.persisted) return;
			const cookieLocale = document.cookie
				.split('; ')
				.find((c) => c.startsWith('em_locale='))
				?.split('=')[1];
			if (cookieLocale && cookieLocale !== document.documentElement.lang) {
				location.reload();
			}
		};
		window.addEventListener('pageshow', onPageShow);
		return () => window.removeEventListener('pageshow', onPageShow);
	});

	// Track route changes
	$effect(() => {
		if (mounted && $page.route.id) {
			Features.trackPageView($page.url.pathname);
			Logger.root.info({ context: 'ui', route: $page.route.id, path: $page.url.pathname, params: $page.params }, 'Route changed');
		}
	});

	// Track user authentication state changes
	$effect(() => {
		if (mounted && authStore.state.user) {
			Session.setUser();
			Logger.root.info({ context: 'auth', userId: authStore.state.user.id, email: authStore.state.user.email }, 'User session active');
		}
	});

</script>

<svelte:head>
	<title>EarnMaze Panel - Professional Survey Platform</title>
	<meta
		name="description"
		content="EarnMaze Panel - Earn rewards by participating in surveys and research studies"
	/>
</svelte:head>

<ErrorBoundary>
	<!-- Global navigation loader -->
	{#if $navigating}
		<div class="fixed top-0 start-0 end-0 z-[100]">
			<div class="h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 nav-progress"></div>
		</div>
	{/if}

	<!-- Render content unconditionally so SSR delivers real HTML to crawlers
	     and social-card scrapers. The theme class is set on <html> by
	     themeStore.applyTheme() in onMount, not on a wrapping div. -->
	<div class="min-h-screen">
		{@render children()}
		<ToastContainer />
		<ExplorationPointsWatcher />
	</div>
</ErrorBoundary>
