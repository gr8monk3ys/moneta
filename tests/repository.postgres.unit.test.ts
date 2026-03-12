import { describe, expect, it, vi } from 'vitest';
import { createDefaultEntitlement } from '../src/billing.js';
import { PostgresUserRepository } from '../src/repository.postgres.js';

function buildPoolMock() {
  return {
    query: vi.fn(),
    connect: vi.fn()
  };
}

describe('PostgresUserRepository', () => {
  it('maps auth/profile/token queries and list operations', async () => {
    const pool = buildPoolMock();
    const repo = new PostgresUserRepository(pool as never);

    pool.query.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM auth_users WHERE email')) {
        return { rows: [{ user_id: 'u1', email: 'a@example.com', password_hash: 'hash' }], rowCount: 1 };
      }

      if (sql.includes('FROM auth_users WHERE user_id')) {
        return { rows: [{ user_id: 'u1', email: 'a@example.com', password_hash: 'hash' }], rowCount: 1 };
      }

      if (sql.includes('FROM user_profiles')) {
        return {
          rows: [{
            user_id: 'u1',
            current_level: 'F3',
            streak_days: 4,
            last_active_date: '2026-01-01',
            skills_json: JSON.stringify({ skill: { skillId: 'skill', mastery: 0.8 } }),
            entitlement_json: JSON.stringify({
              plan: 'pro',
              isActive: true,
              source: 'ios',
              updatedAt: '2026-01-01T00:00:00.000Z'
            })
          }],
          rowCount: 1
        };
      }

      if (sql.includes('FROM refresh_tokens WHERE token_id')) {
        return {
          rows: [{
            token_id: 't1',
            user_id: 'u1',
            session_id: 's1',
            token_hash: 'h1',
            created_at: '2026-01-01',
            expires_at: '2026-01-02',
            revoked_at: null
          }],
          rowCount: 1
        };
      }

      if (sql.includes('FROM refresh_tokens') && sql.includes('ORDER BY created_at DESC')) {
        return {
          rows: [
            {
              token_id: 't2',
              user_id: 'u1',
              session_id: 's2',
              token_hash: 'h2',
              created_at: '2026-01-02',
              expires_at: '2026-01-03',
              revoked_at: null
            },
            {
              token_id: 't1',
              user_id: 'u1',
              session_id: 's1',
              token_hash: 'h1',
              created_at: '2026-01-01',
              expires_at: '2026-01-02',
              revoked_at: null
            }
          ],
          rowCount: 2
        };
      }

      if (sql.includes('FROM billing_webhook_events') && sql.includes('ORDER BY processed_at DESC')) {
        return {
          rows: [{
            event_id: 'evt_1',
            user_id: 'u1',
            platform: 'ios',
            product_id: 'moneta.pro.monthly',
            payload_hash: 'hash',
            processed_at: '2026-01-02T00:00:00.000Z'
          }],
          rowCount: 1
        };
      }

      throw new Error(`Unhandled SQL in test: ${sql}`);
    });

    const authByEmail = await repo.getAuthUserByEmail('A@EXAMPLE.COM');
    const authById = await repo.getAuthUserById('u1');
    const profile = await repo.getUserProfile('u1');
    const token = await repo.getRefreshToken('t1');
    const tokens = await repo.listRefreshTokensByUser('u1');
    const events = await repo.listBillingWebhookEventsByUser('u1');

    expect(authByEmail?.email).toBe('a@example.com');
    expect(authById?.userId).toBe('u1');
    expect(profile?.currentLevel).toBe('F3');
    expect(profile?.skills.skill.mastery).toBe(0.8);
    expect(profile?.entitlement.plan).toBe('pro');
    expect(token?.tokenId).toBe('t1');
    expect(tokens).toHaveLength(2);
    expect(events[0]?.eventId).toBe('evt_1');
  });

  it('returns null/missing defaults for absent rows or malformed json', async () => {
    const pool = buildPoolMock();
    const repo = new PostgresUserRepository(pool as never);

    pool.query.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM auth_users WHERE email')) {
        return { rows: [], rowCount: 0 };
      }

      if (sql.includes('FROM auth_users WHERE user_id')) {
        return { rows: [], rowCount: 0 };
      }

      if (sql.includes('FROM user_profiles')) {
        return {
          rows: [{
            user_id: 'u1',
            current_level: 'F1',
            streak_days: 0,
            skills_json: 'not-json',
            entitlement_json: 'not-json'
          }],
          rowCount: 1
        };
      }

      if (sql.includes('FROM refresh_tokens WHERE token_id')) {
        return { rows: [], rowCount: 0 };
      }

      if (sql.includes('FROM refresh_tokens') && sql.includes('ORDER BY created_at DESC')) {
        return { rows: [], rowCount: 0 };
      }

      if (sql.includes('FROM billing_webhook_events') && sql.includes('ORDER BY processed_at DESC')) {
        return { rows: [], rowCount: 0 };
      }

      if (sql.includes('UPDATE refresh_tokens') && sql.includes('RETURNING')) {
        return { rows: [], rowCount: 0 };
      }

      throw new Error(`Unhandled SQL in test: ${sql}`);
    });

    expect(await repo.getAuthUserByEmail('nobody@example.com')).toBeNull();
    expect(await repo.getAuthUserById('missing')).toBeNull();
    expect((await repo.getUserProfile('u1'))?.skills).toEqual({});
    expect(await repo.getRefreshToken('missing')).toBeNull();
    expect(await repo.listRefreshTokensByUser('u1')).toEqual([]);
    expect(await repo.listBillingWebhookEventsByUser('u1')).toEqual([]);
    expect(await repo.consumeRefreshToken({
      tokenId: 'missing',
      userId: 'u1',
      sessionId: 's1',
      tokenHash: 'hash',
      nowIso: '2026-01-01T00:00:00Z'
    })).toBeNull();
  });

  it('executes writes, account deletion transaction, and readiness checks', async () => {
    const pool = buildPoolMock();
    const repo = new PostgresUserRepository(pool as never);

    let readinessCalls = 0;
    let processedEvent = false;

    pool.query.mockImplementation(async (sql: string) => {
      if (
        sql.startsWith('INSERT INTO auth_users') ||
        sql.includes('INSERT INTO user_profiles') ||
        sql.includes('INSERT INTO refresh_tokens') ||
        sql.startsWith('UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, NOW()) WHERE token_id') ||
        sql.includes('WHERE user_id = $1 AND revoked_at IS NULL') ||
        sql.includes('WHERE user_id = $1 AND session_id = $2 AND revoked_at IS NULL')
      ) {
        return {};
      }

      if (sql.includes('UPDATE refresh_tokens') && sql.includes('RETURNING')) {
        return {
          rows: [{
            token_id: 't1',
            user_id: 'u1',
            session_id: 's1',
            token_hash: 'h',
            created_at: '2026-01-01',
            expires_at: '2026-01-02',
            revoked_at: '2026-01-01T00:00:10Z'
          }],
          rowCount: 1
        };
      }

      if (sql.startsWith('DELETE FROM refresh_tokens WHERE expires_at <= $1')) {
        return { rowCount: 3 };
      }

      if (sql.includes('SELECT event_id FROM billing_webhook_events')) {
        return processedEvent
          ? { rows: [{ event_id: 'evt_1' }], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }

      if (sql.includes('INSERT INTO billing_webhook_events')) {
        processedEvent = true;
        return {};
      }

      if (sql === 'SELECT 1') {
        readinessCalls += 1;
        if (readinessCalls > 1) {
          throw new Error('db down');
        }
        return { rows: [{ '?column?': 1 }], rowCount: 1 };
      }

      throw new Error(`Unhandled SQL in test: ${sql}`);
    });

	    const transactionClient = {
	      query: vi.fn()
	        .mockResolvedValueOnce({})
	        .mockResolvedValueOnce({ rowCount: 2 })
	        .mockResolvedValueOnce({ rowCount: 0 })
	        .mockResolvedValueOnce({ rowCount: 1 })
	        .mockResolvedValueOnce({ rowCount: 1 })
	        .mockResolvedValueOnce({ rowCount: 1 })
	        .mockResolvedValueOnce({}),
      release: vi.fn()
    };
    pool.connect.mockResolvedValue(transactionClient);

    await repo.createAuthUser({ userId: 'u1', email: 'x@example.com', passwordHash: 'hash' });
    await repo.upsertUserProfile({
      userId: 'u1',
      currentLevel: 'F1',
      streakDays: 0,
      skills: {},
      entitlement: createDefaultEntitlement()
    });
    await repo.storeRefreshToken({
      tokenId: 't1',
      userId: 'u1',
      sessionId: 's1',
      tokenHash: 'h',
      createdAt: '2026-01-01',
      expiresAt: '2026-01-02'
    });
    await repo.revokeRefreshToken('t1');
    await repo.revokeRefreshTokensByUser('u1');
    await repo.revokeRefreshTokensBySession('u1', 's1');

    expect(await repo.consumeRefreshToken({
      tokenId: 't1',
      userId: 'u1',
      sessionId: 's1',
      tokenHash: 'h',
      nowIso: '2026-01-01T00:00:10Z'
    })).toMatchObject({ tokenId: 't1', revokedAt: '2026-01-01T00:00:10.000Z' });

    expect(await repo.pruneExpiredRefreshTokens('2026-02-01')).toBe(3);
    expect(await repo.hasProcessedBillingWebhookEvent('evt_1')).toBe(false);

    await repo.markBillingWebhookEventProcessed({
      eventId: 'evt_1',
      userId: 'u1',
      platform: 'android',
      productId: 'moneta.pro.yearly',
      payloadHash: 'hash',
      processedAt: '2026-02-01T00:00:00.000Z'
    });

	    expect(await repo.hasProcessedBillingWebhookEvent('evt_1')).toBe(true);
	    expect(await repo.deleteUserAccount('u1')).toBe(true);
	    expect(transactionClient.query).toHaveBeenCalledTimes(7);
	    expect(transactionClient.release).toHaveBeenCalledTimes(1);
	    expect(await repo.checkReadiness()).toBe(true);
	    expect(await repo.checkReadiness()).toBe(false);
	  });

  it('maps password-reset helpers, completed lessons, and missing-user password updates', async () => {
    const pool = buildPoolMock();
    const repo = new PostgresUserRepository(pool as never);

    let passwordUpdateCalls = 0;

    pool.query.mockImplementation(async (sql: string) => {
      if (sql.startsWith('UPDATE auth_users SET password_hash')) {
        passwordUpdateCalls += 1;
        return { rowCount: passwordUpdateCalls === 1 ? 1 : 0 };
      }

      if (sql.includes('FROM user_profiles')) {
        return {
          rows: [{
            user_id: 'u1',
            current_level: 'F2',
            streak_days: 3,
            last_active_date: '2026-01-01',
            skills_json: JSON.stringify({}),
            entitlement_json: JSON.stringify(createDefaultEntitlement()),
            completed_lessons_json: JSON.stringify({
              'lesson-1': {
                lessonId: 'lesson-1',
                completedAt: '2026-01-02T00:00:00.000Z',
                score: 1,
                correctCount: 2,
                totalItems: 2
              }
            })
          }],
          rowCount: 1
        };
      }

      if (sql.startsWith('DELETE FROM password_reset_tokens WHERE user_id = $1')) {
        return {};
      }

      if (sql.includes('INSERT INTO password_reset_tokens')) {
        return {};
      }

      if (sql.includes('UPDATE password_reset_tokens') && sql.includes('RETURNING')) {
        return {
          rows: [{
            token_id: 'reset-1',
            user_id: 'u1',
            token_hash: 'hash',
            created_at: '2026-01-01T00:00:00.000Z',
            expires_at: '2026-01-01T00:15:00.000Z',
            used_at: '2026-01-01T00:05:00.000Z'
          }],
          rowCount: 1
        };
      }

      if (sql.startsWith('DELETE FROM password_reset_tokens WHERE expires_at <= $1::timestamptz')) {
        return { rowCount: 2 };
      }

      throw new Error(`Unhandled SQL in test: ${sql}`);
    });

    await repo.updateAuthUserPassword('u1', 'hash-2');
    await expect(repo.updateAuthUserPassword('missing', 'hash-3')).rejects.toThrow('User not found');

    const profile = await repo.getUserProfile('u1');
    expect(profile?.completedLessons?.['lesson-1']?.lessonId).toBe('lesson-1');

    await repo.deletePasswordResetTokensByUser('u1');
    await repo.storePasswordResetToken({
      tokenId: 'reset-1',
      userId: 'u1',
      tokenHash: 'hash',
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-01T00:15:00.000Z'
    });

    const consumed = await repo.consumePasswordResetToken({
      userId: 'u1',
      tokenHash: 'hash',
      nowIso: '2026-01-01T00:05:00.000Z'
    });

    expect(consumed).toMatchObject({
      tokenId: 'reset-1',
      userId: 'u1',
      usedAt: '2026-01-01T00:05:00.000Z'
    });
    expect(await repo.pruneExpiredPasswordResetTokens('2026-01-02T00:00:00.000Z')).toBe(2);
  });

  it('returns false for empty account deletion and rolls back failed transactions', async () => {
    const pool = buildPoolMock();
    const repo = new PostgresUserRepository(pool as never);

    const emptyClient = {
      query: vi.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rowCount: 0 })
        .mockResolvedValueOnce({ rowCount: 0 })
        .mockResolvedValueOnce({ rowCount: 0 })
        .mockResolvedValueOnce({ rowCount: 0 })
        .mockResolvedValueOnce({ rowCount: 0 })
        .mockResolvedValueOnce({}),
      release: vi.fn()
    };

    const failingClient = {
      query: vi.fn()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('delete failed'))
        .mockResolvedValueOnce({}),
      release: vi.fn()
    };

    pool.connect
      .mockResolvedValueOnce(emptyClient)
      .mockResolvedValueOnce(failingClient);

    expect(await repo.deleteUserAccount('u1')).toBe(false);
    expect(emptyClient.release).toHaveBeenCalledTimes(1);

    await expect(repo.deleteUserAccount('u1')).rejects.toThrow('delete failed');
    expect(failingClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(failingClient.release).toHaveBeenCalledTimes(1);
  });
});
