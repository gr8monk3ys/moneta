import { describe, expect, it } from 'vitest';
import {
  applyEntitlementSync,
  createDefaultEntitlement,
  isProEntitled,
  normalizeEntitlement,
  resolveFeatureAccess
} from '../src/billing.js';
import type { UserProfile } from '../src/types.js';

function buildProfile(): UserProfile {
  return {
    userId: 'billing-user',
    currentLevel: 'F1',
    streakDays: 0,
    skills: {},
    entitlement: createDefaultEntitlement()
  };
}

describe('billing helpers', () => {
  it('normalizes missing and malformed entitlement values', () => {
    const fallback = normalizeEntitlement(undefined);
    expect(fallback.plan).toBe('free');
    expect(fallback.isActive).toBe(true);

    const malformed = normalizeEntitlement({
      plan: 'unknown' as never,
      source: 'invalid' as never,
      currentPeriodEndsAt: 'not-a-date'
    });
    expect(malformed.plan).toBe('free');
    expect(malformed.source).toBe('none');
    expect(malformed.currentPeriodEndsAt).toBeUndefined();
  });

  it('resolves pro access only for active, unexpired pro entitlement', () => {
    const now = new Date('2026-02-13T12:00:00.000Z');
    const activePro = normalizeEntitlement({
      plan: 'pro',
      isActive: true,
      source: 'ios',
      currentPeriodEndsAt: '2026-02-20T12:00:00.000Z'
    }, now);

    const expiredPro = normalizeEntitlement({
      plan: 'pro',
      isActive: true,
      source: 'ios',
      currentPeriodEndsAt: '2026-02-10T12:00:00.000Z'
    }, now);

    expect(isProEntitled(activePro, now)).toBe(true);
    expect(isProEntitled(expiredPro, now)).toBe(false);
    expect(resolveFeatureAccess(activePro, now).maxDueReviews).toBeNull();
    expect(resolveFeatureAccess(expiredPro, now).maxDueReviews).toBe(3);
  });

  it('applies entitlement sync updates onto a profile', () => {
    const profile = buildProfile();
    const synced = applyEntitlementSync(profile, {
      source: 'android',
      productId: 'moneta.pro.yearly',
      isActive: true,
      currentPeriodEndsAt: '2026-03-01T00:00:00.000Z'
    });

    expect(synced.plan).toBe('pro');
    expect(profile.entitlement.plan).toBe('pro');
    expect(profile.entitlement.source).toBe('android');
  });
});
