import type {
  AuthUser,
  BillingWebhookEventRecord,
  PasswordResetTokenRecord,
  RefreshTokenRecord,
  UserProfile
} from './types.js';

export interface ConsumeRefreshTokenInput {
  tokenId: string;
  userId: string;
  sessionId: string;
  tokenHash: string;
  nowIso: string;
}

export interface ConsumePasswordResetTokenInput {
  userId: string;
  tokenHash: string;
  nowIso: string;
}

export interface UserRepository {
  createAuthUser(user: AuthUser): Promise<AuthUser>;
  getAuthUserByEmail(email: string): Promise<AuthUser | null>;
  getAuthUserById(userId: string): Promise<AuthUser | null>;
  updateAuthUserPassword(userId: string, passwordHash: string): Promise<void>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
  upsertUserProfile(profile: UserProfile): Promise<UserProfile>;
  storeRefreshToken(record: RefreshTokenRecord): Promise<void>;
  getRefreshToken(tokenId: string): Promise<RefreshTokenRecord | null>;
  listRefreshTokensByUser(userId: string): Promise<RefreshTokenRecord[]>;
  consumeRefreshToken(input: ConsumeRefreshTokenInput): Promise<RefreshTokenRecord | null>;
  revokeRefreshToken(tokenId: string): Promise<void>;
  revokeRefreshTokensByUser(userId: string): Promise<void>;
  revokeRefreshTokensBySession(userId: string, sessionId: string): Promise<void>;
  deletePasswordResetTokensByUser(userId: string): Promise<void>;
  storePasswordResetToken(record: PasswordResetTokenRecord): Promise<void>;
  consumePasswordResetToken(input: ConsumePasswordResetTokenInput): Promise<PasswordResetTokenRecord | null>;
  pruneExpiredPasswordResetTokens(nowIso: string): Promise<number>;
  hasProcessedBillingWebhookEvent(eventId: string): Promise<boolean>;
  listBillingWebhookEventsByUser(userId: string): Promise<BillingWebhookEventRecord[]>;
  markBillingWebhookEventProcessed(record: BillingWebhookEventRecord): Promise<void>;
  deleteUserAccount(userId: string): Promise<boolean>;
  pruneExpiredRefreshTokens(nowIso: string): Promise<number>;
  checkReadiness(): Promise<boolean>;
}
