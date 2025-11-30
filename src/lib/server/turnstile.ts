/**
 * Cloudflare Turnstile Integration
 * Server-side verification for Turnstile tokens
 */

import { env } from '$env/dynamic/private';

const TURNSTILE_SECRET_KEY = env.TURNSTILE_SECRET_KEY;

export interface TurnstileVerificationResult {
	success: boolean;
	challengeTs?: string;
	hostname?: string;
	errorCodes?: string[];
	action?: string;
	cdata?: string;
}

/**
 * Verify Turnstile token with Cloudflare
 */
export async function verifyTurnstile(
	token: string,
	remoteip?: string
): Promise<TurnstileVerificationResult> {
	// Skip verification in development if using test keys
	if (env.NODE_ENV === 'development' && TURNSTILE_SECRET_KEY?.startsWith('1x')) {
		console.log('Development mode: Skipping Turnstile verification (test keys)');
		return {
			success: true,
			challengeTs: new Date().toISOString(),
			hostname: 'localhost',
			errorCodes: [],
		};
	}

	try {
		// Cloudflare Turnstile verification endpoint
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

		const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				secret: TURNSTILE_SECRET_KEY,
				response: token,
				remoteip: remoteip, // Optional: Include user's IP
			}),
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			console.error('Turnstile verification request failed:', response.status);
			return {
				success: false,
				errorCodes: ['network-error'],
			};
		}

		const data = await response.json();

		return {
			success: data.success,
			challengeTs: data.challenge_ts,
			hostname: data.hostname,
			errorCodes: data['error-codes'] || [],
			action: data.action,
			cdata: data.cdata,
		};
	} catch (error) {
		console.error('Turnstile verification error:', error);
		return {
			success: false,
			errorCodes: ['verification-failed'],
		};
	}
}

/**
 * Validate Turnstile token from request
 * Returns error message if validation fails, null if successful
 */
export async function validateTurnstileToken(
	token: string | null | undefined,
	remoteip?: string
): Promise<string | null> {
	// Check if token exists
	if (!token || typeof token !== 'string') {
		return 'CAPTCHA verification is required';
	}

	// Check if secret key is configured
	if (!TURNSTILE_SECRET_KEY) {
		console.error('TURNSTILE_SECRET_KEY not configured');
		return 'CAPTCHA verification unavailable';
	}

	// Verify token with Cloudflare
	const result = await verifyTurnstile(token, remoteip);

	if (!result.success) {
		console.error('Turnstile verification failed:', result.errorCodes);
		
		// Map error codes to user-friendly messages
		if (result.errorCodes?.includes('timeout-or-duplicate')) {
			return 'CAPTCHA expired or already used. Please try again.';
		}
		if (result.errorCodes?.includes('invalid-input-response')) {
			return 'Invalid CAPTCHA response. Please try again.';
		}
		if (result.errorCodes?.includes('bad-request')) {
			return 'CAPTCHA verification failed. Please refresh and try again.';
		}
		
		return 'CAPTCHA verification failed. Please try again.';
	}

	return null; // Verification successful
}

/**
 * Turnstile error code descriptions
 */
export const TURNSTILE_ERROR_CODES: Record<string, string> = {
	'missing-input-secret': 'The secret parameter was not passed',
	'invalid-input-secret': 'The secret parameter was invalid or did not exist',
	'missing-input-response': 'The response parameter was not passed',
	'invalid-input-response': 'The response parameter is invalid or has expired',
	'bad-request': 'The request was rejected because it was malformed',
	'timeout-or-duplicate': 'The response parameter has already been validated before',
	'internal-error': 'An internal error happened while validating the response',
};

/**
 * Check if Turnstile is enabled
 */
export function isTurnstileEnabled(): boolean {
	return !!TURNSTILE_SECRET_KEY;
}
