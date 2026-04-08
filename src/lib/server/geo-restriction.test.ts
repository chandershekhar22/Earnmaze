/**
 * Tests for geo-restriction utilities (geo-restriction.ts)
 * Covers: isCountryAllowed, isPathRestricted, getClientIP,
 * getCountryFromCloudflare, and checkGeoRestriction.
 *
 * Note: checkGeoRestriction uses Logger, which is mocked below.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---- Mock the logger so tests don't need a real pino instance ----
vi.mock('$lib/utils/app-logger', () => ({
	Logger: {
		root: {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
		},
	},
}));

import {
	isCountryAllowed,
	isPathRestricted,
	getClientIP,
	getCountryFromCloudflare,
	checkGeoRestriction,
	GEO_CONFIG,
} from '$lib/server/geo-restriction';

// ==================== Helper: make a lightweight fake RequestEvent ====================

function makeEvent(headers: Record<string, string | null> = {}, clientAddress = '1.2.3.4') {
	return {
		request: {
			headers: {
				get: (name: string) => headers[name.toLowerCase()] ?? null,
				keys: () => Object.keys(headers),
			},
		},
		getClientAddress: () => clientAddress,
		url: { pathname: '/test' },
	} as any;
}

// ==================== isCountryAllowed ====================

describe('isCountryAllowed (allowlist mode)', () => {
	// GEO_CONFIG.mode defaults to 'allowlist' with ['US'] as allowedCountries

	it('allows a country in the allowlist', () => {
		expect(isCountryAllowed('US')).toBe(true);
	});

	it('blocks a country not in the allowlist', () => {
		expect(isCountryAllowed('CN')).toBe(false);
		expect(isCountryAllowed('RU')).toBe(false);
	});

	it('is case-sensitive (ISO codes are uppercase)', () => {
		expect(isCountryAllowed('us')).toBe(false);
	});
});

describe('isCountryAllowed (blocklist mode via temporary override)', () => {
	beforeEach(() => {
		(GEO_CONFIG as any).mode = 'blocklist';
	});

	it('blocks a country in the blocklist', () => {
		expect(isCountryAllowed('KP')).toBe(false);
		expect(isCountryAllowed('IR')).toBe(false);
	});

	it('allows a country not in the blocklist', () => {
		expect(isCountryAllowed('US')).toBe(true);
		expect(isCountryAllowed('DE')).toBe(true);
	});

	// Restore allowlist mode after each test
	afterEach(() => {
		(GEO_CONFIG as any).mode = 'allowlist';
	});
});

// ==================== isPathRestricted ====================

describe('isPathRestricted', () => {
	it('returns true for /earn-money (exact match)', () => {
		expect(isPathRestricted('/earn-money')).toBe(true);
	});

	it('returns true for sub-paths of a restricted path', () => {
		expect(isPathRestricted('/earn-money/more-info')).toBe(true);
	});

	it('returns false for paths not in the restricted list', () => {
		expect(isPathRestricted('/dashboard')).toBe(false);
		expect(isPathRestricted('/login')).toBe(false);
		expect(isPathRestricted('/')).toBe(false);
	});

	it('returns false for empty path', () => {
		expect(isPathRestricted('')).toBe(false);
	});

	it('handles wildcard restricted paths', () => {
		// The implementation uses startsWith(prefix) where prefix = '/special'
		// so '/special' itself also matches the '/special/*' pattern.
		const original = [...GEO_CONFIG.restrictedPaths];
		try {
			(GEO_CONFIG as any).restrictedPaths = ['/special/*'];
			expect(isPathRestricted('/special/page')).toBe(true);
			expect(isPathRestricted('/special')).toBe(true); // startsWith prefix matches
			expect(isPathRestricted('/other')).toBe(false);
			expect(isPathRestricted('/specialpage')).toBe(true); // startsWith still matches
		} finally {
			(GEO_CONFIG as any).restrictedPaths = original;
		}
	});
});

// ==================== getClientIP ====================

describe('getClientIP', () => {
	it('prefers cf-connecting-ip header', () => {
		const event = makeEvent({ 'cf-connecting-ip': '10.20.30.40' }, '1.2.3.4');
		expect(getClientIP(event)).toBe('10.20.30.40');
	});

	it('falls back to getClientAddress when cf header is absent', () => {
		const event = makeEvent({}, '5.6.7.8');
		expect(getClientIP(event)).toBe('5.6.7.8');
	});

	it('returns empty string when both cf header and getClientAddress return empty', () => {
		const event = makeEvent({}, '');
		expect(getClientIP(event)).toBe('');
	});
});

// ==================== getCountryFromCloudflare ====================

describe('getCountryFromCloudflare', () => {
	it('returns country code from cf-ipcountry header', () => {
		const event = makeEvent({ 'cf-ipcountry': 'US' });
		expect(getCountryFromCloudflare(event)).toBe('US');
	});

	it('returns country code from CF-IPCountry header (alternate casing, lowercased by getter)', () => {
		// Our makeEvent normalises header names to lowercase via keys,
		// but real Cloudflare sends 'CF-IPCountry'. The implementation
		// tries both. Here we test direct lowercase representation:
		const event = makeEvent({ 'cf-ipcountry': 'GB' });
		expect(getCountryFromCloudflare(event)).toBe('GB');
	});

	it('returns null when header is missing', () => {
		const event = makeEvent({});
		expect(getCountryFromCloudflare(event)).toBeNull();
	});
});

// ==================== checkGeoRestriction ====================

describe('checkGeoRestriction', () => {
	it('allows requests to non-restricted paths without checking country', async () => {
		const event = {
			...makeEvent({ 'cf-connecting-ip': '203.0.113.0' }),
			url: { pathname: '/dashboard' },
		} as any;
		const result = await checkGeoRestriction(event);
		expect(result.allowed).toBe(true);
	});

	it('allows localhost IPs on restricted paths (dev bypass)', async () => {
		const event = {
			...makeEvent({ 'cf-connecting-ip': '127.0.0.1' }),
			url: { pathname: '/earn-money' },
		} as any;
		const result = await checkGeoRestriction(event);
		expect(result.allowed).toBe(true);
	});

	it('allows 192.168.x.x on restricted paths (dev bypass)', async () => {
		const event = {
			...makeEvent({ 'cf-connecting-ip': '192.168.1.100' }),
			url: { pathname: '/earn-money' },
		} as any;
		const result = await checkGeoRestriction(event);
		expect(result.allowed).toBe(true);
	});

	it('allows allowed country on restricted path', async () => {
		const event = {
			...makeEvent({
				'cf-connecting-ip': '104.18.0.1',
				'cf-ipcountry': 'US',
			}),
			url: { pathname: '/earn-money' },
		} as any;
		const result = await checkGeoRestriction(event);
		expect(result.allowed).toBe(true);
	});

	it('blocks a disallowed country on a restricted path', async () => {
		const event = {
			...makeEvent({
				'cf-connecting-ip': '203.0.113.5',
				'cf-ipcountry': 'CN',
			}),
			url: { pathname: '/earn-money' },
		} as any;
		const result = await checkGeoRestriction(event);
		expect(result.allowed).toBe(false);
		expect(result.reason).toBe(GEO_CONFIG.message);
	});

	it('blocks when cf-ipcountry header is missing on restricted path', async () => {
		const event = {
			...makeEvent({ 'cf-connecting-ip': '203.0.113.5' }),
			url: { pathname: '/earn-money' },
		} as any;
		const result = await checkGeoRestriction(event);
		expect(result.allowed).toBe(false);
	});

	it('blocks when cf-ipcountry is "XX" (unknown) on restricted path', async () => {
		const event = {
			...makeEvent({
				'cf-connecting-ip': '203.0.113.5',
				'cf-ipcountry': 'XX',
			}),
			url: { pathname: '/earn-money' },
		} as any;
		const result = await checkGeoRestriction(event);
		expect(result.allowed).toBe(false);
	});
});
