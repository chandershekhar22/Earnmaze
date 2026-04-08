/**
 * Tests for API validation schemas (api-schemas.ts)
 * Covers: email, password, OTP, auth, survey, profile, rewards schemas
 * and sanitization/validation utilities.
 */

import { describe, it, expect } from 'vitest';
import {
	emailSchema,
	passwordSchema,
	otpSchema,
	uuidSchema,
	turnstileTokenSchema,
	loginSchema,
	registerSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	guestLoginSchema,
	guestUpgradeStartSchema,
	guestUpgradeVerifySchema,
	guestUpgradeSetPasswordSchema,
	surveySchema,
	surveyUpdateSchema,
	adminSettingsSchema,
	geoSettingsSchema,
	profileUpdateSchema,
	redeemRewardSchema,
	sanitizeString,
	sanitizeObject,
	validateInput,
} from '$lib/validation/api-schemas';
import { z } from 'zod';

// ==================== emailSchema ====================

describe('emailSchema', () => {
	it('accepts valid email', () => {
		expect(() => emailSchema.parse('user@example.com')).not.toThrow();
	});

	it('normalises email to lowercase', () => {
		const result = emailSchema.parse('User@Example.COM');
		expect(result).toBe('user@example.com');
	});

	it('rejects email with surrounding whitespace (Zod v4 validates before transforming)', () => {
		// In Zod v4 .email() validation runs before .trim(), so padded input fails
		expect(() => emailSchema.parse('  user@example.com  ')).toThrow();
	});

	it('rejects invalid email format', () => {
		expect(() => emailSchema.parse('not-an-email')).toThrow();
		expect(() => emailSchema.parse('missing@')).toThrow();
		expect(() => emailSchema.parse('@nodomain.com')).toThrow();
	});

	it('rejects email that is too short', () => {
		expect(() => emailSchema.parse('a@b')).toThrow();
	});

	it('rejects email that is too long (> 255 chars)', () => {
		const long = 'a'.repeat(250) + '@x.com';
		expect(() => emailSchema.parse(long)).toThrow();
	});
});

// ==================== passwordSchema ====================

describe('passwordSchema', () => {
	it('accepts a strong password', () => {
		expect(() => passwordSchema.parse('MyP4ssword!')).not.toThrow();
	});

	it('rejects password shorter than 8 characters', () => {
		expect(() => passwordSchema.parse('Ab1!')).toThrow();
	});

	it('rejects password longer than 128 characters', () => {
		const long = 'Aa1' + 'b'.repeat(130);
		expect(() => passwordSchema.parse(long)).toThrow();
	});

	it('rejects password without uppercase letter', () => {
		expect(() => passwordSchema.parse('mypassword1')).toThrow();
	});

	it('rejects password without lowercase letter', () => {
		expect(() => passwordSchema.parse('MYPASSWORD1')).toThrow();
	});

	it('rejects password without a digit', () => {
		expect(() => passwordSchema.parse('MyPassword!')).toThrow();
	});

	it('accepts password with exactly 8 characters meeting all rules', () => {
		expect(() => passwordSchema.parse('Passw0rd')).not.toThrow();
	});
});

// ==================== otpSchema ====================

describe('otpSchema', () => {
	it('accepts a valid 6-digit OTP', () => {
		expect(() => otpSchema.parse('123456')).not.toThrow();
	});

	it('rejects OTP shorter than 6 digits', () => {
		expect(() => otpSchema.parse('12345')).toThrow();
	});

	it('rejects OTP longer than 6 characters', () => {
		expect(() => otpSchema.parse('1234567')).toThrow();
	});

	it('rejects OTP containing non-digit characters', () => {
		expect(() => otpSchema.parse('12345a')).toThrow();
		expect(() => otpSchema.parse('12 456')).toThrow();
	});

	it('rejects empty string', () => {
		expect(() => otpSchema.parse('')).toThrow();
	});
});

// ==================== uuidSchema ====================

describe('uuidSchema', () => {
	it('accepts a valid UUID v4', () => {
		expect(() => uuidSchema.parse('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
	});

	it('rejects a non-UUID string', () => {
		expect(() => uuidSchema.parse('not-a-uuid')).toThrow();
		expect(() => uuidSchema.parse('12345')).toThrow();
	});
});

// ==================== turnstileTokenSchema ====================

describe('turnstileTokenSchema', () => {
	it('accepts a non-empty token string', () => {
		expect(() => turnstileTokenSchema.parse('some-token-value')).not.toThrow();
	});

	it('rejects an empty string', () => {
		expect(() => turnstileTokenSchema.parse('')).toThrow();
	});
});

// ==================== loginSchema ====================

describe('loginSchema', () => {
	const valid = {
		email: 'user@example.com',
		password: 'anypassword',
		turnstileToken: 'token123',
	};

	it('accepts valid login payload', () => {
		expect(() => loginSchema.parse(valid)).not.toThrow();
	});

	it('normalises email to lowercase', () => {
		const result = loginSchema.parse({ ...valid, email: 'User@Example.COM' });
		expect(result.email).toBe('user@example.com');
	});

	it('rejects missing email', () => {
		const { email: _, ...rest } = valid;
		expect(() => loginSchema.parse(rest)).toThrow();
	});

	it('rejects missing password', () => {
		expect(() => loginSchema.parse({ ...valid, password: '' })).toThrow();
	});

	it('rejects missing turnstile token', () => {
		expect(() => loginSchema.parse({ ...valid, turnstileToken: '' })).toThrow();
	});

	it('accepts any non-empty password (login does not enforce complexity)', () => {
		expect(() => loginSchema.parse({ ...valid, password: 'weak' })).not.toThrow();
	});
});

// ==================== registerSchema ====================

describe('registerSchema', () => {
	const valid = {
		email: 'new@example.com',
		password: 'Secur3Pass',
		name: 'Jane Doe',
		turnstileToken: 'token-abc',
	};

	it('accepts valid registration payload', () => {
		expect(() => registerSchema.parse(valid)).not.toThrow();
	});

	it('accepts optional referralCode', () => {
		expect(() => registerSchema.parse({ ...valid, referralCode: 'REF123' })).not.toThrow();
	});

	it('rejects weak password', () => {
		expect(() => registerSchema.parse({ ...valid, password: 'weakpassword' })).toThrow();
	});

	it('rejects empty name', () => {
		expect(() => registerSchema.parse({ ...valid, name: '' })).toThrow();
	});

	it('rejects name longer than 255 characters', () => {
		expect(() => registerSchema.parse({ ...valid, name: 'a'.repeat(256) })).toThrow();
	});

	it('rejects invalid email', () => {
		expect(() => registerSchema.parse({ ...valid, email: 'not-email' })).toThrow();
	});

	it('rejects missing turnstile token', () => {
		expect(() => registerSchema.parse({ ...valid, turnstileToken: '' })).toThrow();
	});
});

// ==================== forgotPasswordSchema ====================

describe('forgotPasswordSchema', () => {
	it('accepts valid email', () => {
		expect(() => forgotPasswordSchema.parse({ email: 'user@example.com' })).not.toThrow();
	});

	it('rejects invalid email', () => {
		expect(() => forgotPasswordSchema.parse({ email: 'invalid' })).toThrow();
	});
});

// ==================== resetPasswordSchema ====================

describe('resetPasswordSchema', () => {
	const valid = {
		token: 'reset-token-xyz',
		password: 'NewP4ssword',
	};

	it('accepts valid reset payload', () => {
		expect(() => resetPasswordSchema.parse(valid)).not.toThrow();
	});

	it('rejects empty token', () => {
		expect(() => resetPasswordSchema.parse({ ...valid, token: '' })).toThrow();
	});

	it('rejects weak new password', () => {
		expect(() => resetPasswordSchema.parse({ ...valid, password: 'weak' })).toThrow();
	});
});

// ==================== guestLoginSchema ====================

describe('guestLoginSchema', () => {
	it('accepts token without turnstile', () => {
		expect(() => guestLoginSchema.parse({ token: 'guest-token' })).not.toThrow();
	});

	it('accepts token with optional turnstile token', () => {
		expect(() => guestLoginSchema.parse({ token: 'guest-token', turnstileToken: 'cap-token' })).not.toThrow();
	});

	it('rejects empty token', () => {
		expect(() => guestLoginSchema.parse({ token: '' })).toThrow();
	});
});

// ==================== guestUpgradeStartSchema ====================

describe('guestUpgradeStartSchema', () => {
	it('accepts valid turnstile token', () => {
		expect(() => guestUpgradeStartSchema.parse({ turnstileToken: 'my-token' })).not.toThrow();
	});

	it('rejects empty turnstile token', () => {
		expect(() => guestUpgradeStartSchema.parse({ turnstileToken: '' })).toThrow();
	});
});

// ==================== guestUpgradeVerifySchema ====================

describe('guestUpgradeVerifySchema', () => {
	it('accepts valid 6-digit OTP', () => {
		expect(() => guestUpgradeVerifySchema.parse({ otp: '654321' })).not.toThrow();
	});

	it('rejects non-digit OTP', () => {
		expect(() => guestUpgradeVerifySchema.parse({ otp: 'abcdef' })).toThrow();
	});
});

// ==================== guestUpgradeSetPasswordSchema ====================

describe('guestUpgradeSetPasswordSchema', () => {
	const valid = {
		upgradeToken: 'upgrade-abc',
		password: 'StrongPass1',
	};

	it('accepts valid payload', () => {
		expect(() => guestUpgradeSetPasswordSchema.parse(valid)).not.toThrow();
	});

	it('rejects empty upgradeToken', () => {
		expect(() => guestUpgradeSetPasswordSchema.parse({ ...valid, upgradeToken: '' })).toThrow();
	});

	it('rejects weak password', () => {
		expect(() => guestUpgradeSetPasswordSchema.parse({ ...valid, password: 'weak' })).toThrow();
	});
});

// ==================== surveySchema ====================

describe('surveySchema', () => {
	const valid = {
		title: 'Consumer Opinions Survey',
		points: 50,
		link: 'https://survey.example.com/s/123',
	};

	it('accepts valid survey', () => {
		expect(() => surveySchema.parse(valid)).not.toThrow();
	});

	it('defaults isActive to true when not provided', () => {
		const result = surveySchema.parse(valid);
		expect(result.isActive).toBe(true);
	});

	it('accepts optional description and explicit isActive', () => {
		expect(() => surveySchema.parse({ ...valid, description: 'Some desc', isActive: false })).not.toThrow();
	});

	it('rejects empty title', () => {
		expect(() => surveySchema.parse({ ...valid, title: '' })).toThrow();
	});

	it('rejects title longer than 255 characters', () => {
		expect(() => surveySchema.parse({ ...valid, title: 'A'.repeat(256) })).toThrow();
	});

	it('rejects points less than 1', () => {
		expect(() => surveySchema.parse({ ...valid, points: 0 })).toThrow();
	});

	it('rejects points greater than 10000', () => {
		expect(() => surveySchema.parse({ ...valid, points: 10001 })).toThrow();
	});

	it('rejects non-integer points', () => {
		expect(() => surveySchema.parse({ ...valid, points: 50.5 })).toThrow();
	});

	it('rejects invalid URL for link', () => {
		expect(() => surveySchema.parse({ ...valid, link: 'not-a-url' })).toThrow();
	});
});

// ==================== surveyUpdateSchema (partial) ====================

describe('surveyUpdateSchema', () => {
	it('accepts an empty object (fully partial)', () => {
		expect(() => surveyUpdateSchema.parse({})).not.toThrow();
	});

	it('accepts partial update with only title', () => {
		expect(() => surveyUpdateSchema.parse({ title: 'New Title' })).not.toThrow();
	});

	it('still validates provided fields', () => {
		expect(() => surveyUpdateSchema.parse({ points: -1 })).toThrow();
		expect(() => surveyUpdateSchema.parse({ link: 'bad-url' })).toThrow();
	});
});

// ==================== adminSettingsSchema ====================

describe('adminSettingsSchema', () => {
	const valid = {
		key: 'site_name',
		value: 'EarnMaze',
	};

	it('accepts valid settings update', () => {
		expect(() => adminSettingsSchema.parse(valid)).not.toThrow();
	});

	it('rejects key with uppercase or special characters', () => {
		expect(() => adminSettingsSchema.parse({ ...valid, key: 'Site-Name' })).toThrow();
		expect(() => adminSettingsSchema.parse({ ...valid, key: 'SiteName' })).toThrow();
	});

	it('rejects empty key', () => {
		expect(() => adminSettingsSchema.parse({ ...valid, key: '' })).toThrow();
	});

	it('rejects value longer than 10000 characters', () => {
		expect(() => adminSettingsSchema.parse({ ...valid, value: 'v'.repeat(10001) })).toThrow();
	});

	it('allows underscore-separated keys', () => {
		expect(() => adminSettingsSchema.parse({ ...valid, key: 'max_points_per_day' })).not.toThrow();
	});
});

// ==================== geoSettingsSchema ====================

describe('geoSettingsSchema', () => {
	const valid = {
		enabled: true,
		mode: 'allow' as const,
		countries: ['US', 'CA', 'GB'],
	};

	it('accepts valid geo settings', () => {
		expect(() => geoSettingsSchema.parse(valid)).not.toThrow();
	});

	it('rejects invalid mode', () => {
		expect(() => geoSettingsSchema.parse({ ...valid, mode: 'whitelist' })).toThrow();
	});

	it('rejects country code that is not 2 characters', () => {
		expect(() => geoSettingsSchema.parse({ ...valid, countries: ['USA'] })).toThrow();
		expect(() => geoSettingsSchema.parse({ ...valid, countries: ['U'] })).toThrow();
	});

	it('accepts block mode', () => {
		expect(() => geoSettingsSchema.parse({ ...valid, mode: 'block' })).not.toThrow();
	});

	it('defaults blockVPN and blockTOR to true', () => {
		const result = geoSettingsSchema.parse(valid);
		expect(result.blockVPN).toBe(true);
		expect(result.blockTOR).toBe(true);
	});

	it('defaults exemptPaths to empty array', () => {
		const result = geoSettingsSchema.parse(valid);
		expect(result.exemptPaths).toEqual([]);
	});
});

// ==================== profileUpdateSchema ====================

describe('profileUpdateSchema', () => {
	it('accepts empty object (all optional)', () => {
		expect(() => profileUpdateSchema.parse({})).not.toThrow();
	});

	it('accepts full valid profile update', () => {
		expect(() => profileUpdateSchema.parse({
			name: 'Alice',
			demographics: {
				age: '25',
				gender: 'female',
				country: 'US',
				education: 'bachelor',
				employment: 'full_time',
				income: '50k_75k',
			},
			preferences: {
				emailNotifications: true,
				smsNotifications: false,
				surveyCategories: ['Technology', 'Finance'],
			},
		})).not.toThrow();
	});

	it('rejects name longer than 100 characters', () => {
		expect(() => profileUpdateSchema.parse({ name: 'a'.repeat(101) })).toThrow();
	});

	it('rejects surveyCategories with more than 20 items', () => {
		expect(() => profileUpdateSchema.parse({
			preferences: {
				surveyCategories: Array.from({ length: 21 }, (_, i) => `Cat${i}`),
			},
		})).toThrow();
	});
});

// ==================== redeemRewardSchema ====================

describe('redeemRewardSchema', () => {
	it('accepts valid rewardId', () => {
		expect(() => redeemRewardSchema.parse({ rewardId: 'amazon-gift-25' })).not.toThrow();
	});

	it('rejects empty rewardId', () => {
		expect(() => redeemRewardSchema.parse({ rewardId: '' })).toThrow();
	});

	it('rejects rewardId longer than 50 characters', () => {
		expect(() => redeemRewardSchema.parse({ rewardId: 'r'.repeat(51) })).toThrow();
	});
});

// ==================== sanitizeString ====================

describe('sanitizeString', () => {
	it('returns the input string trimmed', () => {
		expect(sanitizeString('  hello  ')).toBe('hello');
	});

	it('removes HTML tags but keeps their text content', () => {
		// The regex /<[^>]*>/g strips tags; content between tags is preserved
		expect(sanitizeString('<b>bold</b> text')).toBe('bold text');
		expect(sanitizeString('<script>alert(1)</script>hello')).toBe('alert(1)hello');
	});

	it('removes standalone angle-bracket characters', () => {
		// <World> is stripped as a tag (including 'World'); lone > is also stripped
		expect(sanitizeString('Hello <World> & > done')).toBe('Hello  &  done');
	});

	it('returns empty string for non-string input', () => {
		expect(sanitizeString(42 as unknown as string)).toBe('');
		expect(sanitizeString(null as unknown as string)).toBe('');
		expect(sanitizeString(undefined as unknown as string)).toBe('');
	});

	it('handles already clean string unchanged', () => {
		expect(sanitizeString('Hello World')).toBe('Hello World');
	});
});

// ==================== sanitizeObject ====================

describe('sanitizeObject', () => {
	it('sanitizes all string values', () => {
		const input = { title: '  <b>Bold</b>  ', count: 5 };
		const result = sanitizeObject(input);
		expect(result.title).toBe('Bold');
		expect(result.count).toBe(5);
	});

	it('recursively sanitizes nested objects', () => {
		const input = { user: { name: '<em>Alice</em>', age: 30 } };
		const result = sanitizeObject(input);
		expect(result.user.name).toBe('Alice');
		expect(result.user.age).toBe(30);
	});

	it('sanitizes string items inside arrays', () => {
		const input = { tags: ['<script>bad</script>', 'good'] };
		const result = sanitizeObject(input);
		expect(result.tags[0]).toBe('bad');
		expect(result.tags[1]).toBe('good');
	});

	it('preserves non-string, non-object values', () => {
		const input = { active: true, count: 42, ratio: 3.14, nothing: null };
		const result = sanitizeObject(input);
		expect(result.active).toBe(true);
		expect(result.count).toBe(42);
		expect(result.ratio).toBeCloseTo(3.14);
		expect(result.nothing).toBeNull();
	});
});

// ==================== validateInput ====================

describe('validateInput', () => {
	const testSchema = z.object({
		name: z.string().min(1),
		age: z.number().int().min(0),
	});

	it('returns success with parsed data for valid input', async () => {
		const result = await validateInput(testSchema, { name: 'Alice', age: 25 });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe('Alice');
			expect(result.data.age).toBe(25);
		}
	});

	it('sanitizes string values before validation when sanitize is true', async () => {
		const result = await validateInput(testSchema, { name: '<b>Alice</b>', age: 25 });
		expect(result.success).toBe(true);
		if (result.success) {
			// The sanitized name should have tags removed
			expect(result.data.name).toBe('Alice');
		}
	});

	it('returns failure with error message for invalid input', async () => {
		const result = await validateInput(testSchema, { name: '', age: 25 });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeTruthy();
		}
	});

	it('returns failure for completely wrong type', async () => {
		const result = await validateInput(testSchema, 'not an object');
		expect(result.success).toBe(false);
	});

	it('skips sanitization when sanitize is false', async () => {
		const schema = z.object({ tag: z.string() });
		const result = await validateInput(schema, { tag: '<b>bold</b>' }, false);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.tag).toBe('<b>bold</b>');
		}
	});
});
