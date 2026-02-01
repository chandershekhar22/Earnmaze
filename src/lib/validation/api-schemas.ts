/**
 * API Input Validation Schemas
 * Comprehensive Zod schemas for all API endpoints
 */

import { z } from 'zod';

// ==================== Common Schemas ====================

export const emailSchema = z.string()
	.email('Invalid email format')
	.min(3, 'Email too short')
	.max(255, 'Email too long')
	.toLowerCase()
	.trim();

export const passwordSchema = z.string()
	.min(8, 'Password must be at least 8 characters')
	.max(128, 'Password too long')
	.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
	.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
	.regex(/[0-9]/, 'Password must contain at least one number');

export const turnstileTokenSchema = z.string().min(1, 'Turnstile token required');

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const otpSchema = z.string()
	.length(6, 'OTP must be exactly 6 digits')
	.regex(/^\d{6}$/, 'OTP must contain only digits');

// ==================== Auth Endpoints ====================

export const loginSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, 'Password required'),
	turnstileToken: turnstileTokenSchema
});

export const registerSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
	name: z.string().min(1, 'Name required').max(255, 'Name too long').trim(),
	turnstileToken: turnstileTokenSchema,
	referralCode: z.string().max(50).optional()
});

export const forgotPasswordSchema = z.object({
	email: emailSchema
});

export const resetPasswordSchema = z.object({
	token: z.string().min(1, 'Reset token required'),
	password: passwordSchema
});

// ==================== Guest Endpoints ====================

export const guestLoginSchema = z.object({
	token: z.string().min(1, 'Guest token required'),
	turnstileToken: turnstileTokenSchema.optional()
});

export const guestUpgradeStartSchema = z.object({
	turnstileToken: turnstileTokenSchema
});

export const guestUpgradeVerifySchema = z.object({
	otp: otpSchema
});

export const guestUpgradeCheckPasswordSchema = z.object({
	email: emailSchema
});

export const guestUpgradeSetPasswordSchema = z.object({
	upgradeToken: z.string().min(1, 'Upgrade token required'),
	password: passwordSchema
});

// ==================== Survey Endpoints ====================

export const surveySchema = z.object({
	title: z.string().min(1, 'Title required').max(255, 'Title too long').trim(),
	description: z.string().max(1000, 'Description too long').optional().nullable(),
	points: z.number().int('Points must be an integer').min(1, 'Points must be at least 1').max(10000, 'Points too high'),
	link: z.string().url('Must be a valid URL').max(2048, 'URL too long'),
	isActive: z.boolean().optional().default(true)
});

export const surveyUpdateSchema = surveySchema.partial();

// ==================== Admin Endpoints ====================

export const adminSettingsSchema = z.object({
	key: z.string().min(1, 'Key required').max(100, 'Key too long').regex(/^[a-z0-9_]+$/, 'Key must be lowercase alphanumeric with underscores'),
	value: z.string().max(10000, 'Value too long'),
	description: z.string().max(500, 'Description too long').optional()
});

export const geoSettingsSchema = z.object({
	enabled: z.boolean(),
	mode: z.enum(['allow', 'block']),
	countries: z.array(z.string().length(2, 'Country code must be 2 characters')).max(300, 'Too many countries'),
	blockVPN: z.boolean().optional().default(true),
	blockTOR: z.boolean().optional().default(true),
	exemptPaths: z.array(z.string().max(200)).max(100, 'Too many exempt paths').optional().default([])
});

// ==================== Analytics Endpoints ====================

export const trackVisitSchema = z.object({
	visitorId: z.string().min(1).max(100),
	sessionId: z.string().min(1).max(100),
	fingerprint: z.string().max(64).optional(),
	utm_source: z.string().max(100).optional().nullable(),
	utm_medium: z.string().max(100).optional().nullable(),
	utm_campaign: z.string().max(100).optional().nullable(),
	utm_term: z.string().max(100).optional().nullable(),
	utm_content: z.string().max(100).optional().nullable(),
	referrer: z.string().max(2048).optional().nullable(),
	landingPage: z.string().max(2048),
	userAgent: z.string().max(500),
	deviceType: z.enum(['desktop', 'mobile', 'tablet', 'unknown']),
	browserName: z.string().max(50),
	osName: z.string().max(50),
	screenResolution: z.string().max(20),
	timezone: z.string().max(50),
	language: z.string().max(10),
	ipAddress: z.string().max(45).optional()
});

export const trackCtaSchema = z.object({
	visitorId: z.string().min(1).max(100),
	sessionId: z.string().min(1).max(100),
	buttonLocation: z.string().min(1, 'Button location required').max(200)
});

export const saveEmailSchema = z.object({
	email: emailSchema,
	referralCode: z.string().max(50).optional(),
	turnstileToken: turnstileTokenSchema,
	source: z.string().max(100).optional(),
	utmSource: z.string().max(100).optional(),
	utmMedium: z.string().max(100).optional(),
	utmCampaign: z.string().max(100).optional()
});

// ==================== Rewards Endpoints ====================

export const redeemRewardSchema = z.object({
	rewardId: z.string().min(1, 'Reward ID required').max(50)
});

// ==================== Helper Functions ====================

/**
 * Sanitize string input - remove HTML tags and trim
 */
export function sanitizeString(input: unknown): string {
	if (typeof input !== 'string') return '';
	return input
		.replace(/<[^>]*>/g, '') // Remove HTML tags
		.replace(/[<>]/g, '') // Remove < and > characters
		.trim();
}

/**
 * Sanitize object - recursively sanitize all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
	const result: any = {};
	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'string') {
			result[key] = sanitizeString(value);
		} else if (value && typeof value === 'object' && !Array.isArray(value)) {
			result[key] = sanitizeObject(value);
		} else if (Array.isArray(value)) {
			result[key] = value.map(item => 
				typeof item === 'string' ? sanitizeString(item) :
				item && typeof item === 'object' ? sanitizeObject(item) :
				item
			);
		} else {
			result[key] = value;
		}
	}
	return result as T;
}

/**
 * Validate and sanitize API input
 */
export async function validateInput<T>(
	schema: z.ZodSchema<T>,
	input: unknown,
	sanitize: boolean = true
): Promise<{ success: true; data: T } | { success: false; error: string }> {
	try {
		// Sanitize if enabled
		const sanitized = sanitize && typeof input === 'object' && input !== null
			? sanitizeObject(input as Record<string, any>)
			: input;

		// Validate with Zod
		const parsed = await schema.parseAsync(sanitized);
		return { success: true, data: parsed };
	} catch (error) {
		if (error instanceof z.ZodError) {
			const firstError = error.issues[0];
			return {
				success: false,
				error: firstError?.message || 'Validation failed'
			};
		}
		return { success: false, error: 'Invalid input' };
	}
}

/**
 * SvelteKit request body size limit (10MB default)
 */
export const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Check request body size
 */
export async function checkBodySize(request: Request): Promise<boolean> {
	const contentLength = request.headers.get('content-length');
	if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
		return false;
	}
	return true;
}
