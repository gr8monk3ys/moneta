import type {
  EntitlementSource,
  SubscriptionEntitlement,
  SubscriptionPlan,
  UserProfile
} from './types.js';

const VALID_SOURCES: EntitlementSource[] = ['none', 'ios', 'android', 'web', 'admin'];
const VALID_PLANS: SubscriptionPlan[] = ['free', 'pro'];

export const FREE_DUE_REVIEWS_LIMIT = 3;

export interface FeatureAccess {
  advancedTracks: boolean;
  certificates: boolean;
  streakRepair: boolean;
  unlimitedReviews: boolean;
  maxDueReviews: number | null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function resolveIsoDate(value: unknown): string | undefined {
  if (!isNonEmptyString(value)) {
    return undefined;
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return new Date(parsed).toISOString();
}

function isValidSource(value: unknown): value is EntitlementSource {
  return typeof value === 'string' && VALID_SOURCES.includes(value as EntitlementSource);
}

function isValidPlan(value: unknown): value is SubscriptionPlan {
  return typeof value === 'string' && VALID_PLANS.includes(value as SubscriptionPlan);
}

export function createDefaultEntitlement(now: Date = new Date()): SubscriptionEntitlement {
  return {
    plan: 'free',
    isActive: true,
    source: 'none',
    updatedAt: now.toISOString()
  };
}

export function normalizeEntitlement(
  input: Partial<SubscriptionEntitlement> | null | undefined,
  now: Date = new Date()
): SubscriptionEntitlement {
  const fallback = createDefaultEntitlement(now);
  if (!input) {
    return fallback;
  }

  const plan = isValidPlan(input.plan) ? input.plan : fallback.plan;
  const isActive = typeof input.isActive === 'boolean' ? input.isActive : fallback.isActive;
  const source = isValidSource(input.source) ? input.source : fallback.source;
  const productId = isNonEmptyString(input.productId) ? input.productId : undefined;
  const currentPeriodEndsAt = resolveIsoDate(input.currentPeriodEndsAt);
  const updatedAt = resolveIsoDate(input.updatedAt) ?? fallback.updatedAt;

  return {
    plan,
    isActive,
    source,
    productId,
    currentPeriodEndsAt,
    updatedAt
  };
}

export function isProEntitled(entitlement: SubscriptionEntitlement, now: Date = new Date()): boolean {
  if (!entitlement.isActive || entitlement.plan !== 'pro') {
    return false;
  }

  if (!entitlement.currentPeriodEndsAt) {
    return true;
  }

  return new Date(entitlement.currentPeriodEndsAt).getTime() > now.getTime();
}

export function resolveFeatureAccess(entitlement: SubscriptionEntitlement, now: Date = new Date()): FeatureAccess {
  const isPro = isProEntitled(entitlement, now);

  if (isPro) {
    return {
      advancedTracks: true,
      certificates: true,
      streakRepair: true,
      unlimitedReviews: true,
      maxDueReviews: null
    };
  }

  return {
    advancedTracks: false,
    certificates: false,
    streakRepair: false,
    unlimitedReviews: false,
    maxDueReviews: FREE_DUE_REVIEWS_LIMIT
  };
}

interface SyncEntitlementInput {
  source: EntitlementSource;
  productId?: string;
  isActive: boolean;
  currentPeriodEndsAt?: string;
}

export function applyEntitlementSync(
  profile: UserProfile,
  input: SyncEntitlementInput,
  now: Date = new Date()
): SubscriptionEntitlement {
  const parsedEndsAt = resolveIsoDate(input.currentPeriodEndsAt);
  const nextEntitlement = normalizeEntitlement({
    plan: input.isActive ? 'pro' : 'free',
    isActive: input.isActive,
    source: input.source,
    productId: input.productId,
    currentPeriodEndsAt: parsedEndsAt,
    updatedAt: now.toISOString()
  }, now);

  profile.entitlement = nextEntitlement;
  return nextEntitlement;
}
