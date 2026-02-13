export type FinanceLevel = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6';
export type SubscriptionPlan = 'free' | 'pro';
export type EntitlementSource = 'none' | 'ios' | 'android' | 'web' | 'admin';
export type BillingPlatform = 'ios' | 'android' | 'web';

export interface SubscriptionEntitlement {
  plan: SubscriptionPlan;
  isActive: boolean;
  source: EntitlementSource;
  productId?: string;
  currentPeriodEndsAt?: string;
  updatedAt: string;
}

export interface SkillState {
  skillId: string;
  mastery: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
}

export interface UserProfile {
  userId: string;
  currentLevel: FinanceLevel;
  streakDays: number;
  lastActiveDate?: string;
  skills: Record<string, SkillState>;
  entitlement: SubscriptionEntitlement;
}

export interface AuthUser {
  userId: string;
  email: string;
  passwordHash: string;
}

export interface RefreshTokenRecord {
  tokenId: string;
  userId: string;
  sessionId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface BillingWebhookEventRecord {
  eventId: string;
  userId: string;
  platform: BillingPlatform;
  productId: string;
  payloadHash: string;
  processedAt: string;
}

export interface LessonItem {
  itemId: string;
  skillId: string;
  prompt: string;
  correctAnswer: string;
}

export interface Lesson {
  lessonId: string;
  title: string;
  estimatedMinutes: number;
  level: FinanceLevel;
  items: LessonItem[];
}

export interface ReviewItem {
  itemId: string;
  skillId: string;
  dueDate: string;
}
