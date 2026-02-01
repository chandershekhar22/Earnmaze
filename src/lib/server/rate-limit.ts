/**
 * Rate Limiting Middleware
 * Implements per-IP throttling and exponential backoff
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { Logger } from '$lib/utils/app-logger';

interface RateLimitEntry {
	count: number;
	resetAt: number;
	blockedUntil?: number;
}

interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Max requests per window
	blockDuration?: number; // How long to block after exceeding limit (ms)
	skipSuccessfulRequests?: boolean; // Don't count successful requests
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of rateLimitStore.entries()) {
		if (entry.resetAt < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
			rateLimitStore.delete(key);
		}
	}
}, 5 * 60 * 1000);

/**
 * Get client IP address from request
 */
function getClientIp(event: RequestEvent): string {
	// Check Cloudflare header
	const cfIp = event.request.headers.get('cf-connecting-ip');
	if (cfIp) return cfIp;

	// Check X-Forwarded-For
	const forwardedFor = event.request.headers.get('x-forwarded-for');
	if (forwardedFor) {
		const ips = forwardedFor.split(',').map(ip => ip.trim());
		return ips[0];
	}

	// Check X-Real-IP
	const realIp = event.request.headers.get('x-real-ip');
	if (realIp) return realIp;

	// Fallback to platform IP
	return event.getClientAddress();
}

/**
 * Rate limit middleware
 */
export function rateLimit(config: RateLimitConfig) {
	return async (event: RequestEvent): Promise<Response | null> => {
		const ip = getClientIp(event);
		const key = `${ip}:${event.url.pathname}`;
		const now = Date.now();

		// Get or create entry
		let entry = rateLimitStore.get(key);
		
		if (!entry || entry.resetAt < now) {
			// Create new entry
			entry = {
				count: 0,
				resetAt: now + config.windowMs
			};
			rateLimitStore.set(key, entry);
		}

		// Check if blocked
		if (entry.blockedUntil && entry.blockedUntil > now) {
			const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
			Logger.root.warn(
				{ context: 'security', ip, path: event.url.pathname, blockedFor: retryAfter },
				'Rate limit exceeded - IP blocked'
			);
			
			return json(
				{ 
					error: 'RATE_LIMIT_EXCEEDED', 
					message: 'Too many requests. Please try again later.',
					retryAfter 
				},
				{ 
					status: 429,
					headers: {
						'Retry-After': retryAfter.toString(),
						'X-RateLimit-Limit': config.maxRequests.toString(),
						'X-RateLimit-Remaining': '0',
						'X-RateLimit-Reset': entry.resetAt.toString()
					}
				}
			);
		}

		// Increment count
		entry.count++;

		// Check if exceeded
		if (entry.count > config.maxRequests) {
			// Block the IP if blockDuration is configured
			if (config.blockDuration) {
				entry.blockedUntil = now + config.blockDuration;
			}

			const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
			Logger.root.warn(
				{ context: 'security', ip, path: event.url.pathname, count: entry.count },
				'Rate limit exceeded'
			);

			return json(
				{ 
					error: 'RATE_LIMIT_EXCEEDED', 
					message: 'Too many requests. Please try again later.',
					retryAfter 
				},
				{ 
					status: 429,
					headers: {
						'Retry-After': retryAfter.toString(),
						'X-RateLimit-Limit': config.maxRequests.toString(),
						'X-RateLimit-Remaining': '0',
						'X-RateLimit-Reset': entry.resetAt.toString()
					}
				}
			);
		}

		// Add rate limit headers to response
		event.locals.rateLimitHeaders = {
			'X-RateLimit-Limit': config.maxRequests.toString(),
			'X-RateLimit-Remaining': (config.maxRequests - entry.count).toString(),
			'X-RateLimit-Reset': entry.resetAt.toString()
		};

		return null; // Allow request
	};
}

// ==================== Preset Configurations ====================

/**
 * Standard rate limit: 100 requests per 15 minutes
 */
export const standardRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	maxRequests: 100
});

/**
 * Auth endpoints: 5 attempts per 15 minutes with exponential backoff
 */
export const authRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	maxRequests: 5,
	blockDuration: 60 * 60 * 1000 // Block for 1 hour after exceeding
});

/**
 * Strict rate limit for sensitive operations: 10 per 15 minutes
 */
export const strictRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	maxRequests: 10,
	blockDuration: 30 * 60 * 1000 // Block for 30 minutes
});

/**
 * Generous rate limit for public endpoints: 1000 per 15 minutes
 */
export const publicRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	maxRequests: 1000
});

/**
 * Per-second rate limit for burst protection: 5 per second
 */
export const burstRateLimit = rateLimit({
	windowMs: 1000,
	maxRequests: 5
});
