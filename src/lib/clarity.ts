import { env } from '$env/dynamic/public';
import { cookieConsent } from '$lib/stores/cookie-consent.svelte';

// Tracks whether we've already injected the Clarity script. Re-grants of
// consent within the same session call clarity('consent', true); revokes
// call clarity('consent', false). A page reload is the cleanest path for a
// fresh start, but consent toggles do take effect immediately.
let scriptInjected = false;

export function loadClarity() {
	if (typeof window === 'undefined') return;
	// Defence-in-depth: refuse if consent isn't granted, even if a caller
	// forgets to gate. The (public) layout's $effect handles the normal path.
	if (!cookieConsent.analytics) return;
	const id = env.PUBLIC_CLARITY_ID;
	if (!id) return;

	if (scriptInjected) {
		// Already injected earlier — just re-grant consent in case it was revoked.
		const c = (window as unknown as { clarity?: (...args: unknown[]) => void }).clarity;
		if (typeof c === 'function') {
			try {
				c('consent', true);
			} catch {
				/* ignore — older Clarity versions may not support consent API */
			}
		}
		return;
	}

	scriptInjected = true;

	(function (c: any, l: Document, a: string, r: string, i: string) {
		c[a] =
			c[a] ||
			function (...args: unknown[]) {
				(c[a].q = c[a].q || []).push(args);
			};
		const t = l.createElement(r) as HTMLScriptElement;
		t.async = true;
		t.src = 'https://www.clarity.ms/tag/' + i;
		const y = l.getElementsByTagName(r)[0];
		y.parentNode!.insertBefore(t, y);
	})(window, document, 'clarity', 'script', id);
}

/**
 * Revoke Clarity consent. The script may stay loaded for the rest of the
 * session, but Clarity stops collecting telemetry after this call.
 */
export function stopClarity() {
	if (typeof window === 'undefined') return;
	const c = (window as unknown as { clarity?: (...args: unknown[]) => void }).clarity;
	if (typeof c === 'function') {
		try {
			c('consent', false);
		} catch {
			/* ignore */
		}
	}
}
