import { describe, it, expect } from 'vitest';
import { maskSensitiveData } from '$lib/validation/respondent-validation';

describe('Validation Utilities', () => {
  describe('maskSensitiveData', () => {
    it('should mask email addresses', () => {
      const data = {
        email: 'john.doe@example.com',
        name: 'John Doe',
        otherField: 'some value'
      };

      const masked = maskSensitiveData(data);
      expect((masked as any).email).toBe('j***@example.com');
      expect((masked as any).name).toBe('John Doe');
      expect((masked as any).otherField).toBe('some value');
    });

    it('should mask phone numbers', () => {
      const data = {
        phone: '+1234567890',
        name: 'John Doe'
      };

      const masked = maskSensitiveData(data);
      expect((masked as any).phone).toBe('***-***-7890');
      expect((masked as any).name).toBe('John Doe');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          email: 'test@example.com',
          phone: '1234567890'
        },
        metadata: {
          ip: '192.168.1.1'
        }
      };

      const masked = maskSensitiveData(data);
      expect((masked as any).user.email).toBe('t***@example.com');
      expect((masked as any).user.phone).toBe('***-***-7890');
      expect((masked as any).metadata.ip).toBe('192.168.1.1');
    });
  });
});