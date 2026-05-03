/**
 * Reactive cookie-consent store (Svelte 5 runes, persisted to localStorage).
 *
 * Categories:
 *   - essential  — always on (session, CSRF, auth). Cannot be disabled.
 *   - analytics  — Microsoft Clarity, Google Analytics. Off by default.
 *
 * Bump VERSION when categories change or you publish a new privacy policy
 * that requires re-acceptance.
 */
import { browser } from '$app/environment';

const STORAGE_KEY = 'em:cookie-consent';
const VERSION = 1;
// 12 months — re-prompt after this even if previously accepted.
const MAX_AGE_DAYS = 365;

export interface ConsentState {
	version: number;
	analytics: boolean;
	acceptedAt: string; // ISO timestamp
}

interface StoreShape {
	loaded: boolean;
	needsConsent: boolean;
	analytics: boolean;
	acceptedAt: Date | null;
}

function readStored(): ConsentState | null {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as ConsentState;
		if (parsed.version !== VERSION) return null;
		if (parsed.acceptedAt) {
			const ageDays = (Date.now() - new Date(parsed.acceptedAt).getTime()) / 86_400_000;
			if (ageDays > MAX_AGE_DAYS) return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

function writeStored(state: ConsentState): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// Quota exceeded or storage disabled — accept the loss; banner will re-show.
	}
}

const internal = $state<StoreShape>({
	loaded: false,
	needsConsent: true,
	analytics: false,
	acceptedAt: null,
});

if (browser) {
	const stored = readStored();
	if (stored) {
		internal.analytics = stored.analytics;
		internal.acceptedAt = stored.acceptedAt ? new Date(stored.acceptedAt) : null;
		internal.needsConsent = false;
	}
	internal.loaded = true;
}

function persist(): void {
	writeStored({
		version: VERSION,
		analytics: internal.analytics,
		acceptedAt: internal.acceptedAt?.toISOString() ?? new Date().toISOString(),
	});
}

export const cookieConsent = {
	get loaded() {
		return internal.loaded;
	},
	get needsConsent() {
		return internal.needsConsent;
	},
	get analytics() {
		return internal.analytics;
	},
	get acceptedAt() {
		return internal.acceptedAt;
	},
	acceptAll(): void {
		internal.analytics = true;
		internal.acceptedAt = new Date();
		internal.needsConsent = false;
		persist();
	},
	rejectAll(): void {
		internal.analytics = false;
		internal.acceptedAt = new Date();
		internal.needsConsent = false;
		persist();
	},
	setAnalytics(granted: boolean): void {
		internal.analytics = granted;
		internal.acceptedAt = new Date();
		internal.needsConsent = false;
		persist();
	},
	/** Re-open the banner — for "Cookie settings" link in the footer. */
	reopen(): void {
		internal.needsConsent = true;
	},
};
