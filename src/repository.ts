import type { AuthUser, BillingWebhookEventRecord, RefreshTokenRecord, UserProfile } from './types.js';

export interface ConsumeRefreshTokenInput {
  tokenId: string;
  userId: string;
  sessionId: string;
  tokenHash: string;
  nowIso: string;
}

export interface UserRepository {
  createAuthUser(user: AuthUser): Promise<AuthUser>;
  getAuthUserByEmail(email: string): Promise<AuthUser | null>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
  upsertUserProfile(profile: UserProfile): Promise<UserProfile>;
  storeRefreshToken(record: RefreshTokenRecord): Promise<void>;
  getRefreshToken(tokenId: string): Promise<RefreshTokenRecord | null>;
  consumeRefreshToken(input: ConsumeRefreshTokenInput): Promise<RefreshTokenRecord | null>;
  revokeRefreshToken(tokenId: string): Promise<void>;
  revokeRefreshTokensByUser(userId: string): Promise<void>;
  revokeRefreshTokensBySession(userId: string, sessionId: string): Promise<void>;
  hasProcessedBillingWebhookEvent(eventId: string): Promise<boolean>;
  markBillingWebhookEventProcessed(record: BillingWebhookEventRecord): Promise<void>;
  pruneExpiredRefreshTokens(nowIso: string): Promise<number>;
  checkReadiness(): Promise<boolean>;
}
