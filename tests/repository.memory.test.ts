import { describe, expect, it } from 'vitest';
import { createDefaultEntitlement } from '../src/billing.js';
import { InMemoryUserRepository } from '../src/repository.memory.js';

describe('InMemoryUserRepository', () => {
  it('creates, fetches, revokes, and prunes refresh tokens', async () => {
    const repo = new InMemoryUserRepository();
    const nowIso = new Date().toISOString();

    await repo.createAuthUser({ userId: 'u1', email: 'a@example.com', passwordHash: 'hash' });
    const auth = await repo.getAuthUserByEmail('a@example.com');
    expect(auth?.userId).toBe('u1');
    expect((await repo.getAuthUserById('u1'))?.email).toBe('a@example.com');

    await repo.upsertUserProfile({
      userId: 'u1',
      currentLevel: 'F1',
      streakDays: 0,
      skills: {},
      entitlement: createDefaultEntitlement()
    });
    const profile = await repo.getUserProfile('u1');
    expect(profile?.userId).toBe('u1');

    await repo.storeRefreshToken({
      tokenId: 't1',
      userId: 'u1',
      sessionId: 's1',
      tokenHash: 'h1',
      createdAt: nowIso,
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    });
    await repo.storeRefreshToken({
      tokenId: 't2',
      userId: 'u1',
      sessionId: 's2',
      tokenHash: 'h2',
      createdAt: nowIso,
      expiresAt: new Date(Date.now() - 60_000).toISOString()
    });

    const consumed = await repo.consumeRefreshToken({
      tokenId: 't1',
      userId: 'u1',
      sessionId: 's1',
      tokenHash: 'h1',
      nowIso
    });
    expect(consumed?.tokenId).toBe('t1');
    // Parity with the Postgres repository: the consumed record reflects revocation.
    expect(consumed?.revokedAt).toBe(nowIso);

    const consumedAgain = await repo.consumeRefreshToken({
      tokenId: 't1',
      userId: 'u1',
      sessionId: 's1',
      tokenHash: 'h1',
      nowIso
    });
    expect(consumedAgain).toBeNull();
    expect((await repo.listRefreshTokensByUser('u1')).length).toBe(2);

    expect(await repo.hasProcessedBillingWebhookEvent('evt_1')).toBe(false);
    await repo.markBillingWebhookEventProcessed({
      eventId: 'evt_1',
      userId: 'u1',
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      payloadHash: 'hash',
      processedAt: nowIso
    });
    expect(await repo.hasProcessedBillingWebhookEvent('evt_1')).toBe(true);
    expect((await repo.listBillingWebhookEventsByUser('u1')).length).toBe(1);

    await repo.revokeRefreshToken('t1');
    expect((await repo.getRefreshToken('t1'))?.revokedAt).toBeTruthy();

    const pruned = await repo.pruneExpiredRefreshTokens(new Date().toISOString());
    expect(pruned).toBe(1);

    await repo.revokeRefreshTokensBySession('u1', 's1');
    await repo.revokeRefreshTokensByUser('u1');
    expect(await repo.deleteUserAccount('u1')).toBe(true);
    expect(await repo.getAuthUserById('u1')).toBeNull();
    expect(await repo.getUserProfile('u1')).toBeNull();
    expect(await repo.checkReadiness()).toBe(true);
  });

  it('updates auth passwords and rejects unknown users', async () => {
    const repo = new InMemoryUserRepository();

    await repo.createAuthUser({ userId: 'u-password', email: 'Password@Test.dev', passwordHash: 'old-hash' });
    await repo.updateAuthUserPassword('u-password', 'new-hash');

    expect((await repo.getAuthUserByEmail('password@test.dev'))?.passwordHash).toBe('new-hash');
    await expect(repo.updateAuthUserPassword('missing-user', 'hash')).rejects.toThrow('User not found');
  });

  it('manages password reset tokens across consume, delete, and prune flows', async () => {
    const repo = new InMemoryUserRepository();
    const now = new Date('2026-03-11T12:00:00.000Z');
    const nowIso = now.toISOString();

    await repo.storePasswordResetToken({
      tokenId: 'expired-reset',
      userId: 'u-reset',
      tokenHash: 'expired-hash',
      createdAt: new Date(now.getTime() - 10 * 60_000).toISOString(),
      expiresAt: new Date(now.getTime() - 60_000).toISOString()
    });
    await repo.storePasswordResetToken({
      tokenId: 'older-reset',
      userId: 'u-reset',
      tokenHash: 'match-hash',
      createdAt: new Date(now.getTime() - 5 * 60_000).toISOString(),
      expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString()
    });
    await repo.storePasswordResetToken({
      tokenId: 'latest-reset',
      userId: 'u-reset',
      tokenHash: 'match-hash',
      createdAt: nowIso,
      expiresAt: new Date(now.getTime() + 15 * 60_000).toISOString()
    });

    expect(await repo.consumePasswordResetToken({
      userId: 'u-reset',
      tokenHash: 'no-match',
      nowIso
    })).toBeNull();

    const consumed = await repo.consumePasswordResetToken({
      userId: 'u-reset',
      tokenHash: 'match-hash',
      nowIso
    });
    expect(consumed?.tokenId).toBe('latest-reset');

    const fallbackConsumed = await repo.consumePasswordResetToken({
      userId: 'u-reset',
      tokenHash: 'match-hash',
      nowIso
    });
    expect(fallbackConsumed).toBeNull();

    const pruned = await repo.pruneExpiredPasswordResetTokens(nowIso);
    expect(pruned).toBe(1);

    await repo.storePasswordResetToken({
      tokenId: 'delete-me',
      userId: 'u-reset',
      tokenHash: 'delete-hash',
      createdAt: nowIso,
      expiresAt: new Date(now.getTime() + 20 * 60_000).toISOString()
    });
    await repo.storePasswordResetToken({
      tokenId: 'keep-me',
      userId: 'u-other',
      tokenHash: 'keep-hash',
      createdAt: nowIso,
      expiresAt: new Date(now.getTime() + 20 * 60_000).toISOString()
    });

    await repo.deletePasswordResetTokensByUser('u-reset');

    expect(await repo.consumePasswordResetToken({
      userId: 'u-reset',
      tokenHash: 'delete-hash',
      nowIso
    })).toBeNull();

    expect((await repo.consumePasswordResetToken({
      userId: 'u-other',
      tokenHash: 'keep-hash',
      nowIso
    }))?.tokenId).toBe('keep-me');
  });

  it('skips invalid refresh token consumption and removes related records on account deletion', async () => {
    const repo = new InMemoryUserRepository();
    const now = new Date('2026-03-11T12:00:00.000Z');
    const nowIso = now.toISOString();

    await repo.createAuthUser({ userId: 'u-cleanup', email: 'cleanup@example.com', passwordHash: 'hash' });
    await repo.upsertUserProfile({
      userId: 'u-cleanup',
      currentLevel: 'F1',
      streakDays: 2,
      skills: {},
      entitlement: createDefaultEntitlement()
    });

    await repo.storeRefreshToken({
      tokenId: 'active',
      userId: 'u-cleanup',
      sessionId: 'session-a',
      tokenHash: 'hash-a',
      createdAt: nowIso,
      expiresAt: new Date(now.getTime() + 15 * 60_000).toISOString()
    });
    await repo.storeRefreshToken({
      tokenId: 'revoked',
      userId: 'u-cleanup',
      sessionId: 'session-b',
      tokenHash: 'hash-b',
      createdAt: nowIso,
      expiresAt: new Date(now.getTime() + 15 * 60_000).toISOString(),
      revokedAt: nowIso
    });
    await repo.storePasswordResetToken({
      tokenId: 'cleanup-reset',
      userId: 'u-cleanup',
      tokenHash: 'cleanup-hash',
      createdAt: nowIso,
      expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString()
    });
    await repo.markBillingWebhookEventProcessed({
      eventId: 'evt_cleanup',
      userId: 'u-cleanup',
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      payloadHash: 'payload-hash',
      processedAt: nowIso
    });

    expect(await repo.consumeRefreshToken({
      tokenId: 'missing',
      userId: 'u-cleanup',
      sessionId: 'session-a',
      tokenHash: 'hash-a',
      nowIso
    })).toBeNull();
    expect(await repo.consumeRefreshToken({
      tokenId: 'active',
      userId: 'u-cleanup',
      sessionId: 'wrong-session',
      tokenHash: 'hash-a',
      nowIso
    })).toBeNull();
    expect(await repo.consumeRefreshToken({
      tokenId: 'revoked',
      userId: 'u-cleanup',
      sessionId: 'session-b',
      tokenHash: 'hash-b',
      nowIso
    })).toBeNull();

    await repo.revokeRefreshToken('missing');
    await repo.revokeRefreshTokensBySession('u-cleanup', 'session-a');

    expect((await repo.getRefreshToken('active'))?.revokedAt).toBeTruthy();

    expect(await repo.deleteUserAccount('u-cleanup')).toBe(true);
    expect(await repo.getAuthUserById('u-cleanup')).toBeNull();
    expect(await repo.getUserProfile('u-cleanup')).toBeNull();
    expect(await repo.listRefreshTokensByUser('u-cleanup')).toEqual([]);
    expect(await repo.listBillingWebhookEventsByUser('u-cleanup')).toEqual([]);
    expect(await repo.consumePasswordResetToken({
      userId: 'u-cleanup',
      tokenHash: 'cleanup-hash',
      nowIso
    })).toBeNull();
  });
});
