import { env } from '$env/dynamic/public';
import { cookieConsent } from '$lib/stores/cookie-consent.svelte';

// Tracks whether we've already injected the gtag script. Re-grants of consent
// within the same session call gtag('consent','update'); revokes also use
// the consent API.
let scriptInjected = false;

type GAWindow = {
	dataLayer: unknown[];
	gtag: (...args: unknown[]) => void;
};

export function loadGA() {
	if (typeof window === 'undefined') return;
	// Defence-in-depth: refuse if consent isn't granted, even if a caller
	// forgets to gate. The (public) layout's $effect handles the normal path.
	if (!cookieConsent.analytics) return;
	const id = env.PUBLIC_GA_ID;
	if (!id) return;
	const w = window as unknown as GAWindow;

	if (scriptInjected) {
		// Already injected — re-grant consent via Consent Mode v2.
		if (typeof w.gtag === 'function') {
			try {
				w.gtag('consent', 'update', { analytics_storage: 'granted' });
			} catch {
				/* ignore */
			}
		}
		return;
	}

	scriptInjected = true;

	const script = document.createElement('script');
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
	document.head.appendChild(script);

	w.dataLayer = w.dataLayer || [];
	w.gtag = function (...args: unknown[]) {
		w.dataLayer.push(args);
	};
	w.gtag('js', new Date());
	w.gtag('config', id, { anonymize_ip: true });
}

/**
 * Revoke GA consent via Consent Mode v2. The script stays loaded but stops
 * recording analytics events.
 */
export function stopGA() {
	if (typeof window === 'undefined') return;
	const w = window as unknown as GAWindow;
	if (typeof w.gtag === 'function') {
		try {
			w.gtag('consent', 'update', { analytics_storage: 'denied' });
		} catch {
			/* ignore */
		}
	}
}
