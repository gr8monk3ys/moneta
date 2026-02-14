export type FinanceLevel = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6';
export type SubscriptionPlan = 'free' | 'pro';
export type EntitlementSource = 'none' | 'ios' | 'android' | 'web' | 'admin';
export type BillingPlatform = 'ios' | 'android' | 'web';
export type LessonTrack = 'core' | 'advanced';
export type LessonItemFormat = 'mcq' | 'numeric' | 'scenario';
export type EditorialReviewStatus = 'approved' | 'provisional';

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

export interface LessonCompletionRecord {
  lessonId: string;
  completedAt: string;
  score: number;
  correctCount: number;
  totalItems: number;
}

export interface UserProfile {
  userId: string;
  currentLevel: FinanceLevel;
  streakDays: number;
  lastActiveDate?: string;
  skills: Record<string, SkillState>;
  entitlement: SubscriptionEntitlement;
  completedLessons?: Record<string, LessonCompletionRecord>;
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
  acceptableAnswers?: string[];
  format?: LessonItemFormat;
  choices?: string[];
  explanation?: string;
}

export interface LessonEditorialReview {
  status: EditorialReviewStatus;
  reviewer: string;
  reviewedAt: string;
  notes: string;
}

export interface Lesson {
  lessonId: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  level: FinanceLevel;
  track: LessonTrack;
  premium: boolean;
  items: LessonItem[];
  editorial?: LessonEditorialReview;
}

export interface ReviewItem {
  itemId: string;
  skillId: string;
  dueDate: string;
  contentItemId?: string;
  prompt?: string;
  format?: LessonItemFormat;
  choices?: string[];
  explanation?: string;
  locked?: boolean;
}
