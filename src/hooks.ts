/**
 * Universal SvelteKit reroute hook — strips the locale prefix from public
 * URLs (e.g. `/hi/about` → `/about`) so the same route file handles all
 * languages without us having to duplicate routes under `[[lang]]`.
 *
 * Paraglide JS computes the un-prefixed pathname based on the configured
 * urlPatterns in vite.config.ts. The hook runs on both server and client
 * for client-side navigation.
 */
import { deLocalizeUrl } from '$lib/paraglide/runtime';
import type { Reroute } from '@sveltejs/kit';

export const reroute: Reroute = (request) => {
	return deLocalizeUrl(request.url).pathname;
};
