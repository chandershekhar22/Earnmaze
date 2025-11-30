/**
 * API Versioning Utilities
 * Helpers for implementing versioned API responses
 */

import { json as svelteJson, type RequestEvent } from '@sveltejs/kit';

export const API_VERSION = '1';

/**
 * Create a versioned JSON response
 * Automatically adds API version headers
 */
export function json(data: any, init?: ResponseInit) {
	const headers = new Headers(init?.headers || {});
	
	// Add API version header
	headers.set('X-API-Version', API_VERSION);
	
	// Add CORS headers if needed
	if (!headers.has('Access-Control-Allow-Origin')) {
		headers.set('Access-Control-Allow-Origin', '*');
	}
	
	return svelteJson(data, {
		...init,
		headers
	});
}

/**
 * Create a deprecated JSON response
 * Adds deprecation warning headers
 */
export function deprecatedJson(data: any, init?: ResponseInit, message?: string) {
	const headers = new Headers(init?.headers || {});
	
	// Add deprecation headers
	headers.set('X-API-Deprecated', 'true');
	headers.set(
		'X-API-Deprecation-Message',
		message || 'This endpoint is deprecated. Please use /api/v1/ endpoints instead.'
	);
	headers.set('X-API-Sunset-Date', '2026-06-01'); // 6 months from now
	
	// Include warning in response body
	const responseData = {
		...data,
		_deprecated: {
			message: message || 'This endpoint is deprecated',
			migrateAf: '/api/v1/',
			sunsetDate: '2026-06-01'
		}
	};
	
	return svelteJson(responseData, {
		...init,
		headers
	});
}

/**
 * Extract API version from request
 */
export function getApiVersion(event: RequestEvent): string {
	// Check header first
	const headerVersion = event.request.headers.get('X-API-Version');
	if (headerVersion) {
		return headerVersion;
	}
	
	// Check URL path
	const pathMatch = event.url.pathname.match(/\/api\/v(\d+)\//);
	if (pathMatch) {
		return pathMatch[1];
	}
	
	// Default to v1
	return '1';
}

/**
 * Check if request is using latest API version
 */
export function isLatestVersion(event: RequestEvent): boolean {
	return getApiVersion(event) === API_VERSION;
}

/**
 * Standard error response for API
 */
export function errorResponse(
	message: string,
	status: number = 400,
	details?: any
) {
	return json(
		{
			error: message,
			status,
			...(details && { details })
		},
		{ status }
	);
}

/**
 * Standard success response for API
 */
export function successResponse(data: any, message?: string) {
	return json({
		success: true,
		...(message && { message }),
		data
	});
}
