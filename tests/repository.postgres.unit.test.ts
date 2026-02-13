import { describe, expect, it, vi } from 'vitest';
import { createDefaultEntitlement } from '../src/billing.js';
import { PostgresUserRepository } from '../src/repository.postgres.js';

function buildPoolMock() {
  return {
    query: vi.fn()
  };
}

describe('PostgresUserRepository', () => {
  it('maps auth and profile rows from query results', async () => {
    const pool = buildPoolMock();
    const repo = new PostgresUserRepository(pool as never);

    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 'u1', email: 'a@example.com', password_hash: 'hash' }], rowCount: 1 })
      .mockResolvedValueOnce({
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
      })
      .mockResolvedValueOnce({ rows: [{ token_id: 't1', user_id: 'u1', session_id: 's1', token_hash: 'h1', created_at: '2026-01-01', expires_at: '2026-01-02', revoked_at: null }], rowCount: 1 });

    const auth = await repo.getAuthUserByEmail('A@EXAMPLE.COM');
    const profile = await repo.getUserProfile('u1');
    const token = await repo.getRefreshToken('t1');

    expect(auth?.email).toBe('a@example.com');
    expect(profile?.currentLevel).toBe('F3');
    expect(profile?.skills.skill.mastery).toBe(0.8);
    expect(profile?.entitlement.plan).toBe('pro');
    expect(token?.tokenId).toBe('t1');
  });

  it('returns null when rows are missing and handles malformed skills', async () => {
    const pool = buildPoolMock();
    const repo = new PostgresUserRepository(pool as never);

    pool.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({
        rows: [{
          user_id: 'u1',
          current_level: 'F1',
          streak_days: 0,
          skills_json: 'not-json',
          entitlement_json: 'not-json'
        }],
        rowCount: 1
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    expect(await repo.getAuthUserByEmail('nobody@example.com')).toBeNull();
    expect((await repo.getUserProfile('u1'))?.skills).toEqual({});
    expect(await repo.getRefreshToken('missing')).toBeNull();
    expect(await repo.consumeRefreshToken({
      tokenId: 'missing',
      userId: 'u1',
      sessionId: 's1',
      tokenHash: 'hash',
      nowIso: '2026-01-01T00:00:00Z'
    })).toBeNull();
  });

  it('executes write operations and readiness checks', async () => {
    const pool = buildPoolMock();
    const repo = new PostgresUserRepository(pool as never);

    pool.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
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
      })
      .mockResolvedValueOnce({ rowCount: 3 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ event_id: 'evt_1' }], rowCount: 1 })
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('db down'));

    await repo.createAuthUser({ userId: 'u1', email: 'x@example.com', passwordHash: 'hash' });
    await repo.upsertUserProfile({
      userId: 'u1',
      currentLevel: 'F1',
      streakDays: 0,
      skills: {},
      entitlement: createDefaultEntitlement()
    });
    await repo.storeRefreshToken({ tokenId: 't1', userId: 'u1', sessionId: 's1', tokenHash: 'h', createdAt: '2026-01-01', expiresAt: '2026-01-02' });
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
    expect(await repo.checkReadiness()).toBe(true);
    expect(await repo.checkReadiness()).toBe(false);
  });
});
