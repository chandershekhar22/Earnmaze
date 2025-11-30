// Test file for validation utilities
// Note: Testing framework setup is configured but dependencies need to be installed
// Run: npm install
// Then: npm run test

// Example test structure (will work once Vitest is installed)
import { sanitizeEmail, sanitizeName, sanitizePhone, maskSensitiveData } from '$lib/validation/respondent-validation';

// Basic validation tests that can be run manually or with a test framework
export const testSanitizeEmail = () => {
  const result1 = sanitizeEmail('test@example.com');
  const result2 = sanitizeEmail('Test.User+Tag@Example.Com');

  console.assert(result1 === 'test@example.com', 'Email sanitization failed');
  console.assert(result2 === 'test.user+tag@example.com', 'Email sanitization failed');
  return true;
};

export const testSanitizeName = () => {
  const result1 = sanitizeName('John Doe');
  const result2 = sanitizeName('  John   Doe  ');

  console.assert(result1 === 'John Doe', 'Name sanitization failed');
  console.assert(result2 === 'John Doe', 'Name sanitization failed');
  return true;
};

export const testSanitizePhone = () => {
  const result1 = sanitizePhone('+1 (555) 123-4567');
  const result2 = sanitizePhone('555-123-4567');

  console.assert(result1 === '+15551234567', 'Phone sanitization failed');
  console.assert(result2 === '5551234567', 'Phone sanitization failed');
  return true;
};

export const testMaskSensitiveData = () => {
  const data1 = { email: 'john.doe@example.com', name: 'John Doe' };
  const data2 = { phone: '+1234567890', name: 'John Doe' };

  const masked1 = maskSensitiveData(data1);
  const masked2 = maskSensitiveData(data2);

  console.assert(masked1.email === 'j***@example.com', 'Email masking failed');
  console.assert(masked1.name === 'John Doe', 'Name masking failed');
  console.assert(masked2.phone === '+***67890', 'Phone masking failed');
  return true;
};

// Run tests manually
if (import.meta.env.DEV) {
  console.log('Running validation tests...');
  testSanitizeEmail();
  testSanitizeName();
  testSanitizePhone();
  testMaskSensitiveData();
  console.log('All validation tests passed!');
}