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

    const consumedAgain = await repo.consumeRefreshToken({
      tokenId: 't1',
      userId: 'u1',
      sessionId: 's1',
      tokenHash: 'h1',
      nowIso
    });
    expect(consumedAgain).toBeNull();

    await repo.revokeRefreshToken('t1');
    expect((await repo.getRefreshToken('t1'))?.revokedAt).toBeTruthy();

    const pruned = await repo.pruneExpiredRefreshTokens(new Date().toISOString());
    expect(pruned).toBe(1);

    await repo.revokeRefreshTokensBySession('u1', 's1');
    await repo.revokeRefreshTokensByUser('u1');
    expect(await repo.checkReadiness()).toBe(true);
  });
});
