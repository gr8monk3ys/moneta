import { describe, expect, it } from 'vitest';
import { isWeakSecret, resolveProtectedToken, resolveRequiredSecret } from '../src/security.js';

describe('security helpers', () => {
  describe('isWeakSecret', () => {
    it('rejects short or placeholder values', () => {
      expect(isWeakSecret('short', 32)).toBe(true);
      expect(isWeakSecret('change-me-in-production', 32)).toBe(true);
      expect(isWeakSecret('my-long-change-me-secret-value-123456789', 32)).toBe(true);
    });

    it('accepts strong values when minimum length is met', () => {
      expect(isWeakSecret('v8G7rQ6zJ2kN5pM3tW9yH4uC1xD0bF8s', 32)).toBe(false);
    });
  });

  describe('resolveRequiredSecret', () => {
    it('uses fallback in development when missing', () => {
      const resolved = resolveRequiredSecret({
        nodeEnv: 'development',
        configured: undefined,
        envName: 'JWT_SECRET',
        minLength: 32,
        devFallback: 'dev-secret-change-me'
      });
      expect(resolved).toBe('dev-secret-change-me');
    });

    it('throws in production when missing or weak', () => {
      expect(() => resolveRequiredSecret({
        nodeEnv: 'production',
        configured: undefined,
        envName: 'JWT_SECRET',
        minLength: 32,
        devFallback: 'dev-secret-change-me'
      })).toThrow('JWT_SECRET must be set in production');

      expect(() => resolveRequiredSecret({
        nodeEnv: 'production',
        configured: 'change-me-in-production',
        envName: 'JWT_SECRET',
        minLength: 32,
        devFallback: 'dev-secret-change-me'
      })).toThrow('JWT_SECRET must be at least 32 characters');
    });

    it('accepts strong secret in production', () => {
      const strong = '8eWf3Nq1Qb5Lm7Zx9Pc2Vr6Jt4Ks0UyH';
      const resolved = resolveRequiredSecret({
        nodeEnv: 'production',
        configured: strong,
        envName: 'JWT_SECRET',
        minLength: 32,
        devFallback: 'dev-secret-change-me'
      });
      expect(resolved).toBe(strong);
    });
  });

  describe('resolveProtectedToken', () => {
    it('is optional in development', () => {
      const resolved = resolveProtectedToken({
        nodeEnv: 'development',
        configured: undefined,
        envName: 'METRICS_TOKEN',
        minLength: 24
      });
      expect(resolved).toBeUndefined();
    });

    it('is required and strong in production', () => {
      expect(() => resolveProtectedToken({
        nodeEnv: 'production',
        configured: undefined,
        envName: 'METRICS_TOKEN',
        minLength: 24
      })).toThrow('METRICS_TOKEN must be set in production');

      expect(() => resolveProtectedToken({
        nodeEnv: 'production',
        configured: 'replace-with-strong-token',
        envName: 'METRICS_TOKEN',
        minLength: 24
      })).toThrow('METRICS_TOKEN must be at least 24 characters');

      const strong = 'METRICS_9f3k2m1q8t7z6x5c4v3b2n1';
      expect(resolveProtectedToken({
        nodeEnv: 'production',
        configured: strong,
        envName: 'METRICS_TOKEN',
        minLength: 24
      })).toBe(strong);
    });
  });
});
