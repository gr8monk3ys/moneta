import { Pool } from 'pg';
import { normalizeEntitlement } from './billing.js';
import type { ConsumePasswordResetTokenInput, ConsumeRefreshTokenInput, UserRepository } from './repository.js';
import type {
  AuthUser,
  BillingWebhookEventRecord,
  LessonCompletionRecord,
  PasswordResetTokenRecord,
  RefreshTokenRecord,
  SkillState,
  SubscriptionEntitlement,
  UserProfile
} from './types.js';

function serializeSkills(skills: Record<string, SkillState>): string {
  return JSON.stringify(skills);
}

function serializeEntitlement(entitlement: SubscriptionEntitlement): string {
  return JSON.stringify(entitlement);
}

function serializeCompletedLessons(completedLessons: Record<string, LessonCompletionRecord> | undefined): string {
  return JSON.stringify(completedLessons ?? {});
}

function parseSkills(raw: unknown): Record<string, SkillState> {
  if (!raw || typeof raw !== 'string') {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, SkillState>;
  } catch {
    return {};
  }
}

function parseEntitlement(raw: unknown): SubscriptionEntitlement {
  if (!raw || typeof raw !== 'string') {
    return normalizeEntitlement(undefined);
  }

  try {
    return normalizeEntitlement(JSON.parse(raw) as Partial<SubscriptionEntitlement>);
  } catch {
    return normalizeEntitlement(undefined);
  }
}

function parseCompletedLessons(raw: unknown): Record<string, LessonCompletionRecord> {
  if (!raw || typeof raw !== 'string') {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, LessonCompletionRecord>;
  } catch {
    return {};
  }
}

function toRefreshRecord(row: Record<string, unknown>): RefreshTokenRecord {
  return {
    tokenId: String(row.token_id),
    userId: String(row.user_id),
    sessionId: String(row.session_id),
    tokenHash: String(row.token_hash),
    createdAt: new Date(row.created_at as string).toISOString(),
    expiresAt: new Date(row.expires_at as string).toISOString(),
    revokedAt: row.revoked_at ? new Date(row.revoked_at as string).toISOString() : undefined
  };
}

function toPasswordResetTokenRecord(row: Record<string, unknown>): PasswordResetTokenRecord {
  return {
    tokenId: String(row.token_id),
    userId: String(row.user_id),
    tokenHash: String(row.token_hash),
    createdAt: new Date(row.created_at as string).toISOString(),
    expiresAt: new Date(row.expires_at as string).toISOString(),
    usedAt: row.used_at ? new Date(row.used_at as string).toISOString() : undefined
  };
}

function toBillingWebhookRecord(row: Record<string, unknown>): BillingWebhookEventRecord {
  return {
    eventId: String(row.event_id),
    userId: String(row.user_id),
    platform: String(row.platform) as BillingWebhookEventRecord['platform'],
    productId: String(row.product_id),
    payloadHash: String(row.payload_hash),
    processedAt: new Date(String(row.processed_at)).toISOString()
  };
}

export class PostgresUserRepository implements UserRepository {
  public constructor(private readonly pool: Pool) {}

  public async createAuthUser(user: AuthUser): Promise<AuthUser> {
    await this.pool.query(
      'INSERT INTO auth_users (user_id, email, password_hash) VALUES ($1, $2, $3)',
      [user.userId, user.email, user.passwordHash]
    );
    return user;
  }

  public async getAuthUserByEmail(email: string): Promise<AuthUser | null> {
    const result = await this.pool.query(
      'SELECT user_id, email, password_hash FROM auth_users WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      userId: String(row.user_id),
      email: String(row.email),
      passwordHash: String(row.password_hash)
    };
  }

  public async getAuthUserById(userId: string): Promise<AuthUser | null> {
    const result = await this.pool.query(
      'SELECT user_id, email, password_hash FROM auth_users WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      userId: String(row.user_id),
      email: String(row.email),
      passwordHash: String(row.password_hash)
    };
  }

  public async updateAuthUserPassword(userId: string, passwordHash: string): Promise<void> {
    const result = await this.pool.query(
      'UPDATE auth_users SET password_hash = $2 WHERE user_id = $1',
      [userId, passwordHash]
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new Error('User not found');
    }
  }

  public async getUserProfile(userId: string): Promise<UserProfile | null> {
    const result = await this.pool.query(
      `
      SELECT user_id, current_level, streak_days, last_active_date, skills_json, entitlement_json, completed_lessons_json
      FROM user_profiles
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      userId: String(row.user_id),
      currentLevel: String(row.current_level) as UserProfile['currentLevel'],
      streakDays: Number(row.streak_days),
      lastActiveDate: row.last_active_date ? String(row.last_active_date) : undefined,
      skills: parseSkills(row.skills_json),
      entitlement: parseEntitlement(row.entitlement_json),
      completedLessons: parseCompletedLessons(row.completed_lessons_json)
    };
  }

  public async upsertUserProfile(profile: UserProfile): Promise<UserProfile> {
    await this.pool.query(
      `
      INSERT INTO user_profiles (
        user_id,
        current_level,
        streak_days,
        last_active_date,
        skills_json,
        entitlement_json,
        completed_lessons_json
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        current_level = EXCLUDED.current_level,
        streak_days = EXCLUDED.streak_days,
        last_active_date = EXCLUDED.last_active_date,
        skills_json = EXCLUDED.skills_json,
        entitlement_json = EXCLUDED.entitlement_json,
        completed_lessons_json = EXCLUDED.completed_lessons_json
      `,
      [
        profile.userId,
        profile.currentLevel,
        profile.streakDays,
        profile.lastActiveDate ?? null,
        serializeSkills(profile.skills),
        serializeEntitlement(profile.entitlement),
        serializeCompletedLessons(profile.completedLessons)
      ]
    );

    return profile;
  }

  public async storeRefreshToken(record: RefreshTokenRecord): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO refresh_tokens (token_id, user_id, session_id, token_hash, created_at, expires_at, revoked_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        record.tokenId,
        record.userId,
        record.sessionId,
        record.tokenHash,
        record.createdAt,
        record.expiresAt,
        record.revokedAt ?? null
      ]
    );
  }

  public async getRefreshToken(tokenId: string): Promise<RefreshTokenRecord | null> {
    const result = await this.pool.query(
      'SELECT token_id, user_id, session_id, token_hash, created_at, expires_at, revoked_at FROM refresh_tokens WHERE token_id = $1 LIMIT 1',
      [tokenId]
    );

    const row = result.rows[0];
    return row ? toRefreshRecord(row as Record<string, unknown>) : null;
  }

  public async listRefreshTokensByUser(userId: string): Promise<RefreshTokenRecord[]> {
    const result = await this.pool.query(
      `
      SELECT token_id, user_id, session_id, token_hash, created_at, expires_at, revoked_at
      FROM refresh_tokens
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return result.rows.map((row) => toRefreshRecord(row as Record<string, unknown>));
  }

  public async consumeRefreshToken(input: ConsumeRefreshTokenInput): Promise<RefreshTokenRecord | null> {
    const result = await this.pool.query(
      `
      UPDATE refresh_tokens
      SET revoked_at = $5::timestamptz
      WHERE token_id = $1
        AND user_id = $2
        AND session_id = $3
        AND token_hash = $4
        AND revoked_at IS NULL
        AND expires_at > $5::timestamptz
      RETURNING token_id, user_id, session_id, token_hash, created_at, expires_at, revoked_at
      `,
      [
        input.tokenId,
        input.userId,
        input.sessionId,
        input.tokenHash,
        input.nowIso
      ]
    );

    const row = result.rows[0];
    return row ? toRefreshRecord(row as Record<string, unknown>) : null;
  }

  public async revokeRefreshToken(tokenId: string): Promise<void> {
    await this.pool.query(
      'UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, NOW()) WHERE token_id = $1',
      [tokenId]
    );
  }

  public async revokeRefreshTokensByUser(userId: string): Promise<void> {
    await this.pool.query(
      'UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, NOW()) WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    );
  }

  public async revokeRefreshTokensBySession(userId: string, sessionId: string): Promise<void> {
    await this.pool.query(
      `
      UPDATE refresh_tokens
      SET revoked_at = COALESCE(revoked_at, NOW())
      WHERE user_id = $1 AND session_id = $2 AND revoked_at IS NULL
      `,
      [userId, sessionId]
    );
  }

  public async deletePasswordResetTokensByUser(userId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [userId]
    );
  }

  public async storePasswordResetToken(record: PasswordResetTokenRecord): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO password_reset_tokens (token_id, user_id, token_hash, created_at, expires_at, used_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        record.tokenId,
        record.userId,
        record.tokenHash,
        record.createdAt,
        record.expiresAt,
        record.usedAt ?? null
      ]
    );
  }

  public async consumePasswordResetToken(input: ConsumePasswordResetTokenInput): Promise<PasswordResetTokenRecord | null> {
    const result = await this.pool.query(
      `
      UPDATE password_reset_tokens
      SET used_at = $3::timestamptz
      WHERE user_id = $1
        AND token_hash = $2
        AND used_at IS NULL
        AND expires_at > $3::timestamptz
      RETURNING token_id, user_id, token_hash, created_at, expires_at, used_at
      `,
      [input.userId, input.tokenHash, input.nowIso]
    );

    const row = result.rows[0];
    return row ? toPasswordResetTokenRecord(row as Record<string, unknown>) : null;
  }

  public async pruneExpiredPasswordResetTokens(nowIso: string): Promise<number> {
    const result = await this.pool.query(
      'DELETE FROM password_reset_tokens WHERE expires_at <= $1::timestamptz RETURNING token_id',
      [nowIso]
    );

    return result.rowCount ?? 0;
  }

  public async hasProcessedBillingWebhookEvent(eventId: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT event_id FROM billing_webhook_events WHERE event_id = $1 LIMIT 1',
      [eventId]
    );

    return (result.rowCount ?? 0) > 0;
  }

  public async listBillingWebhookEventsByUser(userId: string): Promise<BillingWebhookEventRecord[]> {
    const result = await this.pool.query(
      `
      SELECT event_id, user_id, platform, product_id, payload_hash, processed_at
      FROM billing_webhook_events
      WHERE user_id = $1
      ORDER BY processed_at DESC
      `,
      [userId]
    );

    return result.rows.map((row) => toBillingWebhookRecord(row as Record<string, unknown>));
  }

  public async markBillingWebhookEventProcessed(record: BillingWebhookEventRecord): Promise<boolean> {
    const result = await this.pool.query(
      `
      INSERT INTO billing_webhook_events (event_id, user_id, platform, product_id, payload_hash, processed_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (event_id) DO NOTHING
      `,
      [
        record.eventId,
        record.userId,
        record.platform,
        record.productId,
        record.payloadHash,
        record.processedAt
      ]
    );

    // rowCount is 1 when this call inserted the row, 0 when ON CONFLICT skipped it.
    return (result.rowCount ?? 0) > 0;
  }

  public async deleteUserAccount(userId: string): Promise<boolean> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const tokenResult = await client.query(
        'DELETE FROM refresh_tokens WHERE user_id = $1',
        [userId]
      );
      const resetResult = await client.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
        [userId]
      );
      const billingResult = await client.query(
        'DELETE FROM billing_webhook_events WHERE user_id = $1',
        [userId]
      );
      const profileResult = await client.query(
        'DELETE FROM user_profiles WHERE user_id = $1',
        [userId]
      );
      const authResult = await client.query(
        'DELETE FROM auth_users WHERE user_id = $1',
        [userId]
      );

      await client.query('COMMIT');

      const removed = (
        (tokenResult.rowCount ?? 0) +
        (resetResult.rowCount ?? 0) +
        (billingResult.rowCount ?? 0) +
        (profileResult.rowCount ?? 0) +
        (authResult.rowCount ?? 0)
      );

      return removed > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async pruneExpiredRefreshTokens(nowIso: string): Promise<number> {
    const result = await this.pool.query(
      'DELETE FROM refresh_tokens WHERE expires_at <= $1 RETURNING token_id',
      [nowIso]
    );

    return result.rowCount ?? 0;
  }

  public async checkReadiness(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
