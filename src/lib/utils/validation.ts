/**
 * Validation Utilities
 * Common validation functions and regex patterns
 */

/**
 * Email validation regex pattern
 * Validates basic email format: user@domain.tld
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns true if valid email format, false otherwise
 */
export function isValidEmail(email: unknown): email is string {
	if (!email || typeof email !== 'string') {
		return false;
	}
	return EMAIL_REGEX.test(email.trim());
}

/**
 * Normalize email address (trim and lowercase)
 * @param email - Email address to normalize
 * @returns Normalized email address
 */
export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}
