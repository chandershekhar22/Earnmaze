/**
 * Referral system validation tests
 * Tests the referral-related validation schemas and edge cases
 */
import { describe, it, expect } from 'vitest';
import { registerSchema } from './api-schemas';

describe('Referral validation in registration', () => {
	const validBase = {
		email: 'test@example.com',
		password: 'Test1234',
		name: 'Test User',
		turnstileToken: 'valid-token',
	};

	it('accepts registration without referral code', () => {
		expect(() => registerSchema.parse(validBase)).not.toThrow();
	});

	it('accepts registration with valid referral code', () => {
		expect(() => registerSchema.parse({ ...validBase, referralCode: 'ABC12345' })).not.toThrow();
	});

	it('accepts empty string referral code', () => {
		expect(() => registerSchema.parse({ ...validBase, referralCode: '' })).not.toThrow();
	});

	it('rejects referral code longer than 50 chars', () => {
		expect(() => registerSchema.parse({ ...validBase, referralCode: 'A'.repeat(51) })).toThrow();
	});

	it('accepts UTM parameters', () => {
		const result = registerSchema.parse({
			...validBase,
			utmSource: 'facebook',
			utmMedium: 'cpc',
			utmCampaign: 'spring2026',
			registrationSource: 'ad-campaign',
		});
		expect(result.utmSource).toBe('facebook');
		expect(result.utmMedium).toBe('cpc');
		expect(result.utmCampaign).toBe('spring2026');
		expect(result.registrationSource).toBe('ad-campaign');
	});

	it('UTM fields are optional', () => {
		const result = registerSchema.parse(validBase);
		expect(result.utmSource).toBeUndefined();
		expect(result.utmMedium).toBeUndefined();
		expect(result.utmCampaign).toBeUndefined();
	});

	it('rejects UTM source longer than 255 chars', () => {
		expect(() => registerSchema.parse({ ...validBase, utmSource: 'A'.repeat(256) })).toThrow();
	});
});
