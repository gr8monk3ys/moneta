import { normalizeEntitlement } from './billing.js';
import { users } from './data.js';
import type { ConsumeRefreshTokenInput, UserRepository } from './repository.js';
import type { AuthUser, BillingWebhookEventRecord, RefreshTokenRecord, UserProfile } from './types.js';

export class InMemoryUserRepository implements UserRepository {
  private readonly authUsersByEmail: Map<string, AuthUser> = new Map();
  private readonly refreshTokens: Map<string, RefreshTokenRecord> = new Map();
  private readonly billingWebhookEvents: Map<string, BillingWebhookEventRecord> = new Map();

  public async createAuthUser(user: AuthUser): Promise<AuthUser> {
    this.authUsersByEmail.set(user.email.toLowerCase(), user);
    return user;
  }

  public async getAuthUserByEmail(email: string): Promise<AuthUser | null> {
    return this.authUsersByEmail.get(email.toLowerCase()) ?? null;
  }

  public async getAuthUserById(userId: string): Promise<AuthUser | null> {
    for (const user of this.authUsersByEmail.values()) {
      if (user.userId === userId) {
        return user;
      }
    }

    return null;
  }

  public async getUserProfile(userId: string): Promise<UserProfile | null> {
    const existing = users[userId];
    if (!existing) {
      return null;
    }

    return {
      ...existing,
      entitlement: normalizeEntitlement(existing.entitlement)
    };
  }

  public async upsertUserProfile(profile: UserProfile): Promise<UserProfile> {
    const normalized: UserProfile = {
      ...profile,
      entitlement: normalizeEntitlement(profile.entitlement)
    };
    users[profile.userId] = normalized;
    return normalized;
  }

  public async storeRefreshToken(record: RefreshTokenRecord): Promise<void> {
    this.refreshTokens.set(record.tokenId, record);
  }

  public async getRefreshToken(tokenId: string): Promise<RefreshTokenRecord | null> {
    return this.refreshTokens.get(tokenId) ?? null;
  }

  public async listRefreshTokensByUser(userId: string): Promise<RefreshTokenRecord[]> {
    return [...this.refreshTokens.values()]
      .filter((record) => record.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async consumeRefreshToken(input: ConsumeRefreshTokenInput): Promise<RefreshTokenRecord | null> {
    const record = this.refreshTokens.get(input.tokenId);
    if (!record) {
      return null;
    }

    const isMatch = (
      record.userId === input.userId &&
      record.sessionId === input.sessionId &&
      record.tokenHash === input.tokenHash
    );

    if (!isMatch || record.revokedAt || new Date(record.expiresAt).getTime() <= new Date(input.nowIso).getTime()) {
      return null;
    }

    this.refreshTokens.set(input.tokenId, {
      ...record,
      revokedAt: input.nowIso
    });

    return record;
  }

  public async revokeRefreshToken(tokenId: string): Promise<void> {
    const record = this.refreshTokens.get(tokenId);
    if (!record) {
      return;
    }

    this.refreshTokens.set(tokenId, {
      ...record,
      revokedAt: new Date().toISOString()
    });
  }

  public async revokeRefreshTokensByUser(userId: string): Promise<void> {
    for (const [tokenId, record] of this.refreshTokens.entries()) {
      if (record.userId !== userId || record.revokedAt) {
        continue;
      }

      this.refreshTokens.set(tokenId, {
        ...record,
        revokedAt: new Date().toISOString()
      });
    }
  }

  public async revokeRefreshTokensBySession(userId: string, sessionId: string): Promise<void> {
    for (const [tokenId, record] of this.refreshTokens.entries()) {
      if (record.userId !== userId || record.sessionId !== sessionId || record.revokedAt) {
        continue;
      }

      this.refreshTokens.set(tokenId, {
        ...record,
        revokedAt: new Date().toISOString()
      });
    }
  }

  public async hasProcessedBillingWebhookEvent(eventId: string): Promise<boolean> {
    return this.billingWebhookEvents.has(eventId);
  }

  public async listBillingWebhookEventsByUser(userId: string): Promise<BillingWebhookEventRecord[]> {
    return [...this.billingWebhookEvents.values()]
      .filter((record) => record.userId === userId)
      .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime());
  }

  public async markBillingWebhookEventProcessed(record: BillingWebhookEventRecord): Promise<void> {
    this.billingWebhookEvents.set(record.eventId, record);
  }

  public async deleteUserAccount(userId: string): Promise<boolean> {
    let deleted = false;

    for (const [email, user] of this.authUsersByEmail.entries()) {
      if (user.userId === userId) {
        this.authUsersByEmail.delete(email);
        deleted = true;
      }
    }

    for (const [tokenId, token] of this.refreshTokens.entries()) {
      if (token.userId === userId) {
        this.refreshTokens.delete(tokenId);
      }
    }

    for (const [eventId, event] of this.billingWebhookEvents.entries()) {
      if (event.userId === userId) {
        this.billingWebhookEvents.delete(eventId);
      }
    }

    if (users[userId]) {
      delete users[userId];
      deleted = true;
    }

    return deleted;
  }

  public async pruneExpiredRefreshTokens(nowIso: string): Promise<number> {
    let removed = 0;
    const nowMs = new Date(nowIso).getTime();

    for (const [tokenId, record] of this.refreshTokens.entries()) {
      if (new Date(record.expiresAt).getTime() <= nowMs) {
        this.refreshTokens.delete(tokenId);
        removed += 1;
      }
    }

    return removed;
  }

  public async checkReadiness(): Promise<boolean> {
    return true;
  }
}
