/**
 * Security Middleware
 * CSRF protection, security headers, and input sanitization
 */

import { error, json, type RequestEvent } from '@sveltejs/kit';
import { Logger } from '$lib/utils/app-logger';
import crypto from 'crypto';

// ==================== CSRF Protection ====================

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
	return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Verify CSRF token
 */
export function verifyCsrfToken(event: RequestEvent): boolean {
	// Skip CSRF for GET, HEAD, OPTIONS
	if (['GET', 'HEAD', 'OPTIONS'].includes(event.request.method)) {
		return true;
	}

	// Get token from cookie
	const cookieToken = event.cookies.get(CSRF_COOKIE_NAME);
	if (!cookieToken) {
		return false;
	}

	// Get token from header or body
	const headerToken = event.request.headers.get('X-CSRF-Token') || 
	                    event.request.headers.get('X-XSRF-Token');

	if (!headerToken) {
		return false;
	}

	// Constant-time comparison
	return crypto.timingSafeEqual(
		Buffer.from(cookieToken),
		Buffer.from(headerToken)
	);
}

/**
 * CSRF middleware - set token in cookie and verify on state-changing requests
 */
export async function csrfMiddleware(event: RequestEvent): Promise<Response | null> {
	// Set CSRF token cookie if not present
	if (!event.cookies.get(CSRF_COOKIE_NAME)) {
		const token = generateCsrfToken();
		event.cookies.set(CSRF_COOKIE_NAME, token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 // 24 hours
		});
	}

	// Verify CSRF token for state-changing methods
	if (!['GET', 'HEAD', 'OPTIONS'].includes(event.request.method)) {
		if (!verifyCsrfToken(event)) {
			Logger.root.warn(
				{ context: 'security', method: event.request.method, path: event.url.pathname },
				'CSRF token verification failed'
			);

			return json(
				{ error: 'CSRF_TOKEN_INVALID', message: 'CSRF token validation failed' },
				{ status: 403 }
			);
		}
	}

	return null;
}

// ==================== Security Headers ====================

/**
 * Set comprehensive security headers
 */
export function setSecurityHeaders(headers: Headers): void {
	// Prevent clickjacking
	headers.set('X-Frame-Options', 'DENY');
	
	// Prevent MIME sniffing
	headers.set('X-Content-Type-Options', 'nosniff');
	
	// XSS protection (legacy, but doesn't hurt)
	headers.set('X-XSS-Protection', '1; mode=block');
	
	// Referrer policy
	headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	
	// Permissions policy
	headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
	
	// Content Security Policy
	headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: https:",
			"font-src 'self' data:",
			"connect-src 'self' https://challenges.cloudflare.com",
			"frame-src https://challenges.cloudflare.com",
			"base-uri 'self'",
			"form-action 'self'",
			"object-src 'none'",
			"upgrade-insecure-requests"
		].join('; ')
	);
	
	// HSTS (only in production)
	if (process.env.NODE_ENV === 'production') {
		headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
	}
}

// ==================== Request Signing (API Authentication) ====================

interface SignedRequest {
	timestamp: number;
	signature: string;
}

/**
 * Sign API request
 */
export function signRequest(
	body: string,
	apiKey: string,
	timestamp: number = Date.now()
): SignedRequest {
	const message = `${timestamp}:${body}`;
	const signature = crypto
		.createHmac('sha256', apiKey)
		.update(message)
		.digest('hex');

	return { timestamp, signature };
}

/**
 * Verify API request signature
 */
export function verifyRequestSignature(
	event: RequestEvent,
	body: string,
	apiKey: string,
	maxAgeMs: number = 5 * 60 * 1000 // 5 minutes
): boolean {
	const timestamp = event.request.headers.get('X-Request-Timestamp');
	const signature = event.request.headers.get('X-Request-Signature');

	if (!timestamp || !signature) {
		return false;
	}

	const requestTime = parseInt(timestamp);
	const now = Date.now();

	// Check timestamp freshness
	if (Math.abs(now - requestTime) > maxAgeMs) {
		Logger.root.warn(
			{ context: 'security', timeDiff: now - requestTime },
			'Request signature expired'
		);
		return false;
	}

	// Verify signature
	const expected = signRequest(body, apiKey, requestTime);
	
	return crypto.timingSafeEqual(
		Buffer.from(signature),
		Buffer.from(expected.signature)
	);
}

// ==================== Input Sanitization ====================

/**
 * Sanitize HTML - remove dangerous tags and attributes
 */
export function sanitizeHtml(input: string): string {
	return input
		.replace(/<script[^>]*>.*?<\/script>/gi, '')
		.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
		.replace(/<object[^>]*>.*?<\/object>/gi, '')
		.replace(/<embed[^>]*>/gi, '')
		.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
		.replace(/javascript:/gi, '')
		.trim();
}

/**
 * Sanitize SQL - escape special characters (use parameterized queries instead!)
 */
export function sanitizeSql(input: string): string {
	return input
		.replace(/'/g, "''")
		.replace(/;/g, '')
		.replace(/--/g, '')
		.replace(/\/\*/g, '')
		.replace(/\*\//g, '');
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
	try {
		const parsed = new URL(url);
		// Only allow http and https
		if (!['http:', 'https:'].includes(parsed.protocol)) {
			return null;
		}
		return parsed.href;
	} catch {
		return null;
	}
}

/**
 * Check for common attack patterns
 */
export function detectAttackPattern(input: string): boolean {
	const patterns = [
		// SQL Injection
		/(\bunion\b.*\bselect\b)|(\bselect\b.*\bfrom\b)/i,
		/(\bdrop\b.*\btable\b)|(\bdelete\b.*\bfrom\b)/i,
		
		// XSS
		/<script[^>]*>.*?<\/script>/i,
		/javascript:/i,
		/on\w+\s*=/i,
		
		// Path traversal
		/\.\.[\/\\]/,
		
		// Command injection
		/[;&|`$()]/
	];

	return patterns.some(pattern => pattern.test(input));
}

/**
 * Input sanitization middleware
 */
export async function sanitizationMiddleware(event: RequestEvent): Promise<Response | null> {
	// Check query parameters
	for (const [key, value] of event.url.searchParams.entries()) {
		if (detectAttackPattern(value)) {
			Logger.root.warn(
				{ context: 'security', param: key, path: event.url.pathname },
				'Malicious pattern detected in query parameter'
			);

			return json(
				{ error: 'INVALID_INPUT', message: 'Invalid input detected' },
				{ status: 400 }
			);
		}
	}

	return null;
}
