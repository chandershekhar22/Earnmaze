/**
 * Geo-Restriction Middleware
 * Restricts access based on user's geographic location
 */

import type { RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { Logger } from '$lib/utils/app-logger';

// Configuration for allowed/blocked countries
export const GEO_CONFIG = {
	// Restriction mode: 'allowlist' or 'blocklist'
	mode: 'allowlist' as 'allowlist' | 'blocklist',
	
	// List of country codes (ISO 3166-1 alpha-2)
	allowedCountries: [
		'US', // United States
	],
	
	// Blocked countries (if mode is 'blocklist')
	blockedCountries: [
		'KP', // North Korea
		'IR', // Iran
		'SY', // Syria
		'CU', // Cuba
		'VE', // Venezuela
	],
	
	// Paths that require geo-restriction (only these paths will be checked)
	// Use '*' wildcard for matching all sub-paths (e.g., '/dashboard/*' matches '/dashboard/profile')
	restrictedPaths: [
		'/earn-points',
	],
	
	// Error message
	message: 'Service not available in your country'
};

export interface GeoLocation {
	country: string;
	countryCode: string;
	ipAddress: string;
}

/**
 * Extract IP address from request (Cloudflare)
 */
export function getClientIP(event: RequestEvent): string {
	// Use CF-Connecting-IP (real client IP behind Cloudflare)
	return event.request.headers.get('cf-connecting-ip') || event.getClientAddress();
}

/**
 * Get country code from Cloudflare headers
 */
export function getCountryFromCloudflare(event: RequestEvent): string | null {
	// Try both cases since header names can vary
	const country = event.request.headers.get('cf-ipcountry') || 
	                event.request.headers.get('CF-IPCountry');
	
	if (!country) {
		Logger.root.debug(
			{ context: 'security', headers: Array.from(event.request.headers.keys()) },
			'CF-IPCountry header not found'
		);
	}
	
	return country;
}



/**
 * Check if country is allowed
 */
export function isCountryAllowed(countryCode: string): boolean {
	if (GEO_CONFIG.mode === 'allowlist') {
		return GEO_CONFIG.allowedCountries.includes(countryCode);
	} else {
		return !GEO_CONFIG.blockedCountries.includes(countryCode);
	}
}

/**
 * Check if path requires geo-restriction
 */
export function isPathRestricted(pathname: string): boolean {
	return GEO_CONFIG.restrictedPaths.some(restrictedPath => {
		if (restrictedPath.endsWith('/*')) {
			const prefix = restrictedPath.slice(0, -2);
			return pathname.startsWith(prefix);
		}
		return pathname === restrictedPath || pathname.startsWith(restrictedPath + '/');
	});
}

/**
 * Main geo-restriction check
 */
export async function checkGeoRestriction(event: RequestEvent): Promise<{
	allowed: boolean;
	reason?: string;
	location?: GeoLocation;
}> {
	const pathname = event.url.pathname;
	
	// Skip geo-restriction entirely in development
	if (dev) {
		return { allowed: true };
	}

	// Only check restricted paths
	if (!isPathRestricted(pathname)) {
		return { allowed: true };
	}
	
	// Get IP address
	const ipAddress = getClientIP(event);
	
	// Skip for localhost/development
	if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
		return { allowed: true };
	}
	
	// Get country from Cloudflare header
	const cfCountry = getCountryFromCloudflare(event);
	
	if (!cfCountry || cfCountry === 'XX') {
		// Cloudflare header not present or unknown country
		// In production behind Cloudflare, this should never happen
		Logger.root.warn(
			{ context: 'security', ipAddress, cfCountry },
			'CF-IPCountry header missing or unknown'
		);
		// Block access if Cloudflare headers are missing (production security)
		// This ensures geo-restriction can't be bypassed by direct server access
		return {
			allowed: false,
			reason: 'Geographic verification required. Please access through the main domain.',
			location: {
				country: 'Unknown',
				countryCode: cfCountry || 'UNKNOWN',
				ipAddress: ipAddress,
			}
		};
	}
	
	// Check if country is allowed
	if (!isCountryAllowed(cfCountry)) {
		return {
			allowed: false,
			reason: GEO_CONFIG.message,
			location: {
				country: cfCountry,
				countryCode: cfCountry,
				ipAddress: ipAddress,
			}
		};
	}
	
	return { allowed: true };
}

/**
 * Log geo-restriction event (for analytics/monitoring)
 */
export async function logGeoRestrictionEvent(
	ipAddress: string,
	location: GeoLocation | undefined,
	allowed: boolean,
	reason: string | undefined,
	pathname: string
) {
	// Log to monitoring service
	Logger.root.info(
		{
			context: 'security',
			timestamp: new Date().toISOString(),
			ipAddress,
			country: location?.countryCode,
			allowed,
			reason,
			pathname,
		},
		'Geo-restriction event'
	);
	
	// TODO: Store in database for analytics
	// await db.insert(geoRestrictionLogs).values({...})
}
