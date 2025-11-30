import { z } from 'zod';

/**
 * Validation schemas for respondent data
 */

export const RespondentSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().max(255).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  status: z.enum(['active', 'suspended', 'banned', 'inactive', 'pending_verification']).default('active'),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']).default('bronze'),
  verificationStatus: z.enum(['pending', 'verified', 'rejected', 'incomplete']).default('pending'),
  timezone: z.string().max(50).default('UTC'),
  locale: z.string().max(10).default('en'),
  registrationSource: z.string().max(100).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
});

export const RespondentProfileSchema = z.object({
  respondentId: z.string().uuid(),
  dateOfBirth: z.date().optional(),
  gender: z.string().max(20).optional(),
  maritalStatus: z.string().max(20).optional(),
  ethnicity: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  timeZone: z.string().max(50).optional(),
  education: z.string().max(100).optional(),
  employment: z.string().max(100).optional(),
  occupation: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  companySize: z.string().max(50).optional(),
  workExperience: z.number().min(0).max(70).optional(),
  income: z.string().max(50).optional(),
  householdIncome: z.string().max(50).optional(),
  householdSize: z.number().min(1).max(20).optional(),
  hasChildren: z.boolean().default(false),
  preferredLanguage: z.string().max(10).default('en'),
  privacyLevel: z.enum(['minimal', 'standard', 'detailed']).default('standard'),
  dataSharing: z.boolean().default(true),
});

export const RespondentSegmentSchema = z.object({
  respondentId: z.string().uuid(),
  segmentName: z.string().max(100),
  segmentType: z.enum(['demographic', 'behavioral', 'quality', 'custom']),
  segmentValue: z.string().max(100),
  confidence: z.number().min(0).max(1).default(1),
  source: z.enum(['profile', 'behavior', 'survey_response', 'ml_prediction', 'manual', 'auto_profile']),
});

/**
 * Data sanitization functions
 */

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function sanitizePhone(phone: string): string {
  // Remove all non-numeric characters except + for international
  return phone.replace(/[^\d+]/g, '');
}

export function sanitizeZipCode(zipCode: string): string {
  return zipCode.trim().toUpperCase();
}

/**
 * Validation helper functions
 */

export function validateAge(dateOfBirth: Date): boolean {
  const age = new Date().getFullYear() - dateOfBirth.getFullYear();
  return age >= 13 && age <= 120; // Reasonable age range
}

export function validateTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function validateCountryCode(country: string): boolean {
  // ISO 3166-1 alpha-2 country codes (simplified validation)
  const countryPattern = /^[A-Z]{2}$/;
  return countryPattern.test(country.toUpperCase());
}

/**
 * Profile completeness scoring
 */

interface ProfileData {
  dateOfBirth?: Date | string;
  gender?: string;
  country?: string;
  city?: string;
  zipCode?: string;
  education?: string;
  employment?: string;
  occupation?: string;
  industry?: string;
  income?: string;
  householdSize?: number;
  interests?: string;
  preferredLanguage?: string;
  communicationChannel?: string;
  surveyTopicsInterest?: string;
}

export function calculateProfileScore(profile: ProfileData): number {
  const weights = {
    // Core demographics (40%)
    dateOfBirth: 10,
    gender: 8,
    country: 10,
    city: 5,
    zipCode: 7,
    
    // Professional (25%)
    education: 8,
    employment: 8,
    occupation: 5,
    industry: 4,
    
    // Financial (15%)
    income: 10,
    householdSize: 5,
    
    // Preferences (20%)
    interests: 8,
    preferredLanguage: 4,
    communicationChannel: 4,
    surveyTopicsInterest: 4,
  };
  
  let totalScore = 0;
  let maxPossibleScore = 0;
  
  for (const [field, weight] of Object.entries(weights)) {
    maxPossibleScore += weight;
    const value = (profile as Record<string, unknown>)[field];
    if (value && value !== '') {
      totalScore += weight;
    }
  }
  
  return Math.round((totalScore / maxPossibleScore) * 100);
}

/**
 * Data quality checks
 */

export function validateProfileConsistency(profile: ProfileData): string[] {
  const errors: string[] = [];
  
  // Age consistency check
  if (profile.dateOfBirth && profile.education) {
    const age = new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear();
    if (age < 16 && ['graduate', 'postgraduate', 'doctorate'].includes(profile.education)) {
      errors.push('Education level inconsistent with age');
    }
  }
  
  // Employment consistency
  if (profile.employment === 'unemployed' && profile.income && 
      !['no_income', 'under_10k'].includes(profile.income)) {
    errors.push('Income inconsistent with employment status');
  }
  
  // Location consistency
  if (profile.country === 'US' && profile.zipCode && 
      !/^\d{5}(-\d{4})?$/.test(profile.zipCode)) {
    errors.push('Invalid US ZIP code format');
  }
  
  return errors;
}

/**
 * Security and privacy functions
 */

export function maskSensitiveData(data: Record<string, unknown>, fields: string[] = ['email', 'phone', 'dateOfBirth']): Record<string, unknown> {
  const masked = { ...data };
  
  function maskValue(value: unknown, fieldName: string): unknown {
    if (value && typeof value === 'string') {
      if (fieldName === 'email') {
        const [local, domain] = value.split('@');
        return `${local.charAt(0)}***@${domain}`;
      } else if (fieldName === 'phone') {
        return `***-***-${value.slice(-4)}`;
      } else if (fieldName === 'dateOfBirth') {
        const date = new Date(value);
        return `****-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      } else {
        return '***';
      }
    }
    return value;
  }
  
  function maskObject(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (fields.includes(key)) {
        result[key] = maskValue(value, key);
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = maskObject(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  return maskObject(masked);
}

export function checkDataRetentionPolicy(createdAt: Date, retentionPeriodMonths: number = 36): boolean {
  const retentionDate = new Date(createdAt);
  retentionDate.setMonth(retentionDate.getMonth() + retentionPeriodMonths);
  return new Date() > retentionDate;
}

/**
 * Demographic analysis helpers
 */

export function categorizeAge(dateOfBirth: Date): string {
  const age = new Date().getFullYear() - dateOfBirth.getFullYear();
  if (age < 18) return 'under_18';
  if (age < 25) return '18_24';
  if (age < 35) return '25_34';
  if (age < 45) return '35_44';
  if (age < 55) return '45_54';
  if (age < 65) return '55_64';
  return '65_plus';
}

export function categorizeIncome(income: string): string {
  const incomeMap: Record<string, string> = {
    'under_10k': 'low',
    '10k_25k': 'low',
    '25k_50k': 'lower_middle',
    '50k_75k': 'middle',
    '75k_100k': 'upper_middle',
    '100k_150k': 'high',
    'over_150k': 'high',
  };
  return incomeMap[income] || 'unknown';
}

/**
 * Export types for TypeScript
 */

export type RespondentInput = z.infer<typeof RespondentSchema>;
export type RespondentProfileInput = z.infer<typeof RespondentProfileSchema>;
export type RespondentSegmentInput = z.infer<typeof RespondentSegmentSchema>;
