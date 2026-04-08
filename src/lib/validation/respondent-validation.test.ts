/**
 * Expanded tests for respondent validation utilities (respondent-validation.ts)
 * Covers: schemas, sanitization helpers, masking, age/income categorisation,
 * data-retention policy, and location/demographic consistency checks.
 */

import { describe, it, expect } from 'vitest';
import {
	RespondentSchema,
	RespondentProfileSchema,
	RespondentSegmentSchema,
	sanitizeEmail,
	sanitizeName,
	sanitizePhone,
	sanitizeZipCode,
	maskSensitiveData,
	checkDataRetentionPolicy,
	categorizeAge,
	categorizeIncome,
} from '$lib/validation/respondent-validation';

// ==================== sanitizeEmail ====================

describe('sanitizeEmail', () => {
	it('converts email to lowercase', () => {
		expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com');
	});

	it('trims leading and trailing whitespace', () => {
		expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
	});

	it('handles already-clean emails', () => {
		expect(sanitizeEmail('jane@domain.org')).toBe('jane@domain.org');
	});

	it('handles mixed case with whitespace together', () => {
		expect(sanitizeEmail(' ADMIN@EARNMAZE.COM ')).toBe('admin@earnmaze.com');
	});
});

// ==================== sanitizeName ====================

describe('sanitizeName', () => {
	it('trims leading and trailing whitespace', () => {
		expect(sanitizeName('  Alice  ')).toBe('Alice');
	});

	it('collapses multiple internal spaces to one', () => {
		expect(sanitizeName('John   Doe')).toBe('John Doe');
	});

	it('handles name with no extra whitespace', () => {
		expect(sanitizeName('Bob Smith')).toBe('Bob Smith');
	});

	it('returns empty string for whitespace-only input', () => {
		expect(sanitizeName('   ')).toBe('');
	});
});

// ==================== sanitizePhone ====================

describe('sanitizePhone', () => {
	it('removes dashes, spaces, and parentheses', () => {
		expect(sanitizePhone('(123) 456-7890')).toBe('1234567890');
	});

	it('preserves + for international numbers', () => {
		expect(sanitizePhone('+1 234 567 8901')).toBe('+12345678901');
	});

	it('removes dot separators', () => {
		expect(sanitizePhone('123.456.7890')).toBe('1234567890');
	});

	it('handles already-clean phone number', () => {
		expect(sanitizePhone('1234567890')).toBe('1234567890');
	});
});

// ==================== sanitizeZipCode ====================

describe('sanitizeZipCode', () => {
	it('trims whitespace', () => {
		expect(sanitizeZipCode('  10001  ')).toBe('10001');
	});

	it('converts to uppercase', () => {
		expect(sanitizeZipCode('sw1a 1aa')).toBe('SW1A 1AA');
	});

	it('handles already-clean US ZIP code', () => {
		expect(sanitizeZipCode('90210')).toBe('90210');
	});
});

// ==================== maskSensitiveData (original + expanded) ====================

describe('maskSensitiveData', () => {
	it('masks email address (default fields)', () => {
		const data = {
			email: 'john.doe@example.com',
			name: 'John Doe',
			otherField: 'some value',
		};
		const masked = maskSensitiveData(data);
		expect((masked as any).email).toBe('j***@example.com');
		expect((masked as any).name).toBe('John Doe');
		expect((masked as any).otherField).toBe('some value');
	});

	it('masks single-character local part of email', () => {
		const data = { email: 'a@test.com' };
		const masked = maskSensitiveData(data);
		expect((masked as any).email).toBe('a***@test.com');
	});

	it('masks phone numbers (last 4 digits visible)', () => {
		const data = { phone: '+1234567890', name: 'John Doe' };
		const masked = maskSensitiveData(data);
		expect((masked as any).phone).toBe('***-***-7890');
		expect((masked as any).name).toBe('John Doe');
	});

	it('masks short phone number preserving last 4 digits', () => {
		const data = { phone: '1234567890' };
		const masked = maskSensitiveData(data);
		expect((masked as any).phone).toBe('***-***-7890');
	});

	it('masks dateOfBirth preserving month/day', () => {
		const data = { dateOfBirth: '1990-06-15' };
		const masked = maskSensitiveData(data);
		const result = (masked as any).dateOfBirth as string;
		expect(result).toMatch(/^\*{4}-\d{2}-\d{2}$/);
		expect(result).toContain('-06-15');
	});

	it('recursively masks nested objects', () => {
		const data = {
			user: {
				email: 'test@example.com',
				phone: '1234567890',
			},
			metadata: {
				ip: '192.168.1.1',
			},
		};
		const masked = maskSensitiveData(data);
		expect((masked as any).user.email).toBe('t***@example.com');
		expect((masked as any).user.phone).toBe('***-***-7890');
		expect((masked as any).metadata.ip).toBe('192.168.1.1');
	});

	it('masks custom fields list', () => {
		const data = { secretCode: 'TOP_SECRET', publicName: 'Alice' };
		const masked = maskSensitiveData(data, ['secretCode']);
		expect((masked as any).secretCode).toBe('***');
		expect((masked as any).publicName).toBe('Alice');
	});

	it('does not mutate the original object', () => {
		const data = { email: 'user@example.com' };
		maskSensitiveData(data);
		expect(data.email).toBe('user@example.com');
	});

	it('ignores null field values gracefully', () => {
		const data = { email: null as unknown as string };
		expect(() => maskSensitiveData(data)).not.toThrow();
	});
});

// ==================== checkDataRetentionPolicy ====================

describe('checkDataRetentionPolicy', () => {
	it('returns true when record is beyond default retention period (36 months)', () => {
		const old = new Date();
		old.setFullYear(old.getFullYear() - 4);
		expect(checkDataRetentionPolicy(old)).toBe(true);
	});

	it('returns false when record is within default retention period', () => {
		const recent = new Date();
		recent.setMonth(recent.getMonth() - 6);
		expect(checkDataRetentionPolicy(recent)).toBe(false);
	});

	it('honours a custom retention period', () => {
		const tenMonthsAgo = new Date();
		tenMonthsAgo.setMonth(tenMonthsAgo.getMonth() - 10);
		expect(checkDataRetentionPolicy(tenMonthsAgo, 6)).toBe(true);
		expect(checkDataRetentionPolicy(tenMonthsAgo, 12)).toBe(false);
	});

	it('returns false for a record created today', () => {
		expect(checkDataRetentionPolicy(new Date())).toBe(false);
	});
});

// ==================== categorizeAge ====================

describe('categorizeAge', () => {
	function dob(yearsAgo: number): Date {
		const d = new Date();
		d.setFullYear(d.getFullYear() - yearsAgo);
		return d;
	}

	it('returns under_18 for age < 18', () => {
		expect(categorizeAge(dob(15))).toBe('under_18');
	});

	it('returns 18_24 for age 20', () => {
		expect(categorizeAge(dob(20))).toBe('18_24');
	});

	it('returns 25_34 for age 30', () => {
		expect(categorizeAge(dob(30))).toBe('25_34');
	});

	it('returns 35_44 for age 40', () => {
		expect(categorizeAge(dob(40))).toBe('35_44');
	});

	it('returns 45_54 for age 50', () => {
		expect(categorizeAge(dob(50))).toBe('45_54');
	});

	it('returns 55_64 for age 60', () => {
		expect(categorizeAge(dob(60))).toBe('55_64');
	});

	it('returns 65_plus for age >= 65', () => {
		expect(categorizeAge(dob(70))).toBe('65_plus');
	});
});

// ==================== categorizeIncome ====================

describe('categorizeIncome', () => {
	it('returns low for under_10k', () => {
		expect(categorizeIncome('under_10k')).toBe('low');
	});

	it('returns low for 10k_25k', () => {
		expect(categorizeIncome('10k_25k')).toBe('low');
	});

	it('returns lower_middle for 25k_50k', () => {
		expect(categorizeIncome('25k_50k')).toBe('lower_middle');
	});

	it('returns middle for 50k_75k', () => {
		expect(categorizeIncome('50k_75k')).toBe('middle');
	});

	it('returns upper_middle for 75k_100k', () => {
		expect(categorizeIncome('75k_100k')).toBe('upper_middle');
	});

	it('returns high for 100k_150k', () => {
		expect(categorizeIncome('100k_150k')).toBe('high');
	});

	it('returns high for over_150k', () => {
		expect(categorizeIncome('over_150k')).toBe('high');
	});

	it('returns unknown for unrecognised bracket', () => {
		expect(categorizeIncome('mystery_income')).toBe('unknown');
		expect(categorizeIncome('')).toBe('unknown');
	});
});

// ==================== RespondentSchema ====================

describe('RespondentSchema', () => {
	it('accepts minimal valid respondent with email only', () => {
		expect(() => RespondentSchema.parse({ email: 'user@example.com' })).not.toThrow();
	});

	it('applies default values when optional fields are omitted', () => {
		const result = RespondentSchema.parse({ email: 'user@example.com' });
		expect(result.status).toBe('active');
		expect(result.tier).toBe('bronze');
		expect(result.verificationStatus).toBe('pending');
		expect(result.timezone).toBe('UTC');
		expect(result.locale).toBe('en');
	});

	it('rejects invalid email format', () => {
		expect(() => RespondentSchema.parse({ email: 'not-email' })).toThrow();
	});

	it('rejects invalid status enum value', () => {
		expect(() => RespondentSchema.parse({ email: 'u@x.com', status: 'unknown_status' })).toThrow();
	});

	it('rejects invalid tier value', () => {
		expect(() => RespondentSchema.parse({ email: 'u@x.com', tier: 'legendary' })).toThrow();
	});

	it('accepts all valid status values', () => {
		for (const status of ['active', 'suspended', 'banned', 'inactive', 'pending_verification']) {
			expect(() => RespondentSchema.parse({ email: 'u@x.com', status })).not.toThrow();
		}
	});

	it('accepts all valid tier values', () => {
		for (const tier of ['bronze', 'silver', 'gold', 'platinum', 'diamond']) {
			expect(() => RespondentSchema.parse({ email: 'u@x.com', tier })).not.toThrow();
		}
	});
});

// ==================== RespondentProfileSchema ====================

describe('RespondentProfileSchema', () => {
	const validId = '550e8400-e29b-41d4-a716-446655440000';

	it('accepts minimal valid profile (respondentId only)', () => {
		expect(() => RespondentProfileSchema.parse({ respondentId: validId })).not.toThrow();
	});

	it('applies default values', () => {
		const result = RespondentProfileSchema.parse({ respondentId: validId });
		expect(result.hasChildren).toBe(false);
		expect(result.preferredLanguage).toBe('en');
		expect(result.privacyLevel).toBe('standard');
		expect(result.dataSharing).toBe(true);
	});

	it('rejects invalid UUID', () => {
		expect(() => RespondentProfileSchema.parse({ respondentId: 'not-a-uuid' })).toThrow();
	});

	it('rejects workExperience below 0', () => {
		expect(() => RespondentProfileSchema.parse({ respondentId: validId, workExperience: -1 })).toThrow();
	});

	it('rejects workExperience above 70', () => {
		expect(() => RespondentProfileSchema.parse({ respondentId: validId, workExperience: 71 })).toThrow();
	});

	it('rejects householdSize of 0', () => {
		expect(() => RespondentProfileSchema.parse({ respondentId: validId, householdSize: 0 })).toThrow();
	});

	it('rejects householdSize above 20', () => {
		expect(() => RespondentProfileSchema.parse({ respondentId: validId, householdSize: 21 })).toThrow();
	});

	it('accepts all valid privacy levels', () => {
		for (const level of ['minimal', 'standard', 'detailed']) {
			expect(() => RespondentProfileSchema.parse({ respondentId: validId, privacyLevel: level })).not.toThrow();
		}
	});
});

// ==================== RespondentSegmentSchema ====================

describe('RespondentSegmentSchema', () => {
	const validId = '550e8400-e29b-41d4-a716-446655440000';

	const valid = {
		respondentId: validId,
		segmentName: 'high_value',
		segmentType: 'quality' as const,
		segmentValue: 'top_10_percent',
		source: 'ml_prediction' as const,
	};

	it('accepts valid segment', () => {
		expect(() => RespondentSegmentSchema.parse(valid)).not.toThrow();
	});

	it('defaults confidence to 1', () => {
		expect(RespondentSegmentSchema.parse(valid).confidence).toBe(1);
	});

	it('rejects confidence below 0', () => {
		expect(() => RespondentSegmentSchema.parse({ ...valid, confidence: -0.1 })).toThrow();
	});

	it('rejects confidence above 1', () => {
		expect(() => RespondentSegmentSchema.parse({ ...valid, confidence: 1.1 })).toThrow();
	});

	it('accepts confidence of exactly 0 and 1', () => {
		expect(() => RespondentSegmentSchema.parse({ ...valid, confidence: 0 })).not.toThrow();
		expect(() => RespondentSegmentSchema.parse({ ...valid, confidence: 1 })).not.toThrow();
	});

	it('rejects invalid segmentType', () => {
		expect(() => RespondentSegmentSchema.parse({ ...valid, segmentType: 'unknown' })).toThrow();
	});

	it('accepts all valid segmentType values', () => {
		for (const segmentType of ['demographic', 'behavioral', 'quality', 'custom']) {
			expect(() => RespondentSegmentSchema.parse({ ...valid, segmentType })).not.toThrow();
		}
	});

	it('rejects invalid source value', () => {
		expect(() => RespondentSegmentSchema.parse({ ...valid, source: 'external_api' })).toThrow();
	});

	it('accepts all valid source values', () => {
		const sources = ['profile', 'behavior', 'survey_response', 'ml_prediction', 'manual', 'auto_profile'];
		for (const source of sources) {
			expect(() => RespondentSegmentSchema.parse({ ...valid, source })).not.toThrow();
		}
	});
});