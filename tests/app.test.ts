import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createDefaultEntitlement } from '../src/billing.js';
import { createApp } from '../src/app.js';
import { InMemoryUserRepository } from '../src/repository.memory.js';

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function buildApp(accessTtlSeconds = 3600, refreshTtlSeconds = 604800) {
  const repository = new InMemoryUserRepository();
  const app = createApp({
    repository,
    jwtSecret: 'test-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    jwtAccessTtlSeconds: accessTtlSeconds,
    jwtRefreshTtlSeconds: refreshTtlSeconds,
    allowedOrigins: ['http://localhost:5173'],
    trustProxy: false
  });

  return { repository, app };
}

async function buildAuthedApp(accessTtlSeconds = 3600, refreshTtlSeconds = 604800) {
  const { app } = buildApp(accessTtlSeconds, refreshTtlSeconds);

  await request(app).post('/api/auth/register').send({
    userId: 'demo-user',
    email: 'demo@example.com',
    password: 'password123'
  });

  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'demo@example.com',
    password: 'password123'
  });

  return {
    app,
    accessToken: loginResponse.body.accessToken as string,
    refreshToken: loginResponse.body.refreshToken as string
  };
}

describe('Moneta API auth + learning flow', () => {
  it('registers and logs in user with refresh token', async () => {
    const { app } = buildApp();

    const registerResponse = await request(app).post('/api/auth/register').send({
      userId: 'auth-user',
      email: 'auth@example.com',
      password: 'password123'
    });

    expect(registerResponse.status).toBe(201);

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'auth@example.com',
      password: 'password123'
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.accessToken).toBeTruthy();
    expect(loginResponse.body.refreshToken).toBeTruthy();
    expect(loginResponse.body.sessionId).toBeTruthy();
  });

  it('returns validation and conflict errors for register', async () => {
    const { app } = buildApp();

    const invalid = await request(app).post('/api/auth/register').send({
      userId: '',
      email: 'not-an-email',
      password: 'short'
    });
    expect(invalid.status).toBe(400);

    await request(app).post('/api/auth/register').send({
      userId: 'dup-user',
      email: 'dup@example.com',
      password: 'password123'
    });

    const duplicate = await request(app).post('/api/auth/register').send({
      userId: 'dup-user-2',
      email: 'dup@example.com',
      password: 'password123'
    });
    expect(duplicate.status).toBe(409);
  });

  it('rejects invalid login credentials and missing bearer token', async () => {
    const { app } = buildApp();

    await request(app).post('/api/auth/register').send({
      userId: 'auth-user',
      email: 'auth@example.com',
      password: 'password123'
    });

    const badLogin = await request(app).post('/api/auth/login').send({
      email: 'auth@example.com',
      password: 'wrong-password'
    });
    expect(badLogin.status).toBe(401);

    const missingToken = await request(app).get('/api/progress/auth-user');
    expect(missingToken.status).toBe(401);
  });

  it('rotates refresh token and invalidates previous token', async () => {
    const { app, refreshToken } = await buildAuthedApp();
    const refreshResponse = await request(app).post('/api/auth/refresh').send({ refreshToken });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.refreshToken).toBeTruthy();

    const reuseResponse = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(reuseResponse.status).toBe(401);
  });

  it('allows only one successful refresh for concurrent requests with the same token', async () => {
    const { app, refreshToken } = await buildAuthedApp();

    const [first, second] = await Promise.all([
      request(app).post('/api/auth/refresh').send({ refreshToken }),
      request(app).post('/api/auth/refresh').send({ refreshToken })
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 401]);
  });

  it('rejects malformed refresh token payload', async () => {
    const { app } = buildApp();
    const response = await request(app).post('/api/auth/refresh').send({ refreshToken: 'tiny' });
    expect(response.status).toBe(400);
  });

  it('revokes all sessions for user', async () => {
    const { app, accessToken, refreshToken } = await buildAuthedApp();
    const logoutAllResponse = await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(logoutAllResponse.status).toBe(200);

    const refreshAfterLogoutAll = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(refreshAfterLogoutAll.status).toBe(401);
  });

  it('rejects expired access token', async () => {
    const { app, accessToken } = await buildAuthedApp(1, 604800);
    await sleep(1100);

    const response = await request(app)
      .get('/api/progress/demo-user')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
  });

  it('protects user resources from other user token', async () => {
    const { app } = buildApp();

    await request(app).post('/api/auth/register').send({
      userId: 'user-a',
      email: 'a@example.com',
      password: 'password123'
    });
    await request(app).post('/api/auth/register').send({
      userId: 'user-b',
      email: 'b@example.com',
      password: 'password123'
    });

    const login = await request(app).post('/api/auth/login').send({
      email: 'a@example.com',
      password: 'password123'
    });

    const forbidden = await request(app)
      .get('/api/progress/user-b')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`);

    expect(forbidden.status).toBe(403);
  });

  it('validates placement and session payloads', async () => {
    const { app, accessToken } = await buildAuthedApp();

    const placementBad = await request(app)
      .post('/api/onboarding/placement')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ correctAnswers: -1, totalQuestions: 0 });
    expect(placementBad.status).toBe(400);

    const sessionBad = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ itemResults: [{ skillId: '', isCorrect: true }] });
    expect(sessionBad.status).toBe(400);
  });

  it('supports learn/progress/session happy path', async () => {
    const { app, accessToken } = await buildAuthedApp();

    const placement = await request(app)
      .post('/api/onboarding/placement')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ correctAnswers: 8, totalQuestions: 10 });
    expect(placement.status).toBe(200);

    const today = await request(app)
      .get('/api/learn/today/demo-user')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(today.status).toBe(200);

    const session = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ itemResults: [{ skillId: 'apr-vs-apy', isCorrect: true }] });
    expect(session.status).toBe(200);

    const progress = await request(app)
      .get('/api/progress/demo-user')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(progress.status).toBe(200);
  });

  it('returns only reviews that are due based on persisted schedule', async () => {
    const { app, repository } = buildApp();

    await request(app).post('/api/auth/register').send({
      userId: 'review-user',
      email: 'review-user@example.com',
      password: 'password123'
    });

    const login = await request(app).post('/api/auth/login').send({
      email: 'review-user@example.com',
      password: 'password123'
    });

    const now = Date.now();
    await repository.upsertUserProfile({
      userId: 'review-user',
      currentLevel: 'F2',
      streakDays: 2,
      entitlement: createDefaultEntitlement(),
      skills: {
        due: {
          skillId: 'due',
          mastery: 0.4,
          lastReviewedAt: new Date(now - 86_400_000).toISOString(),
          nextReviewAt: new Date(now - 60_000).toISOString()
        },
        future: {
          skillId: 'future',
          mastery: 0.7,
          lastReviewedAt: new Date(now).toISOString(),
          nextReviewAt: new Date(now + 86_400_000).toISOString()
        }
      }
    });

    const response = await request(app)
      .get('/api/learn/today/review-user')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`);

    expect(response.status).toBe(200);
    expect(response.body.dueReviews).toHaveLength(1);
    expect(response.body.dueReviews[0].skillId).toBe('due');
  });

  it('returns free entitlements by default and upgrades on sync', async () => {
    const { app, accessToken } = await buildAuthedApp();

    const initial = await request(app)
      .get('/api/billing/entitlements/demo-user')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(initial.status).toBe(200);
    expect(initial.body.entitlement.plan).toBe('free');
    expect(initial.body.features.unlimitedReviews).toBe(false);
    expect(initial.body.features.maxDueReviews).toBe(3);

    const upgraded = await request(app)
      .post('/api/billing/entitlements/sync')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        platform: 'ios',
        productId: 'moneta.pro.monthly',
        purchaseToken: 'sandbox-purchase-token-12345',
        isActive: true,
        currentPeriodEndsAt: new Date(Date.now() + 86_400_000).toISOString()
      });

    expect(upgraded.status).toBe(200);
    expect(upgraded.body.entitlement.plan).toBe('pro');
    expect(upgraded.body.features.unlimitedReviews).toBe(true);
    expect(upgraded.body.features.maxDueReviews).toBeNull();
  });

  it('limits due reviews for free users and unlocks full queue for pro users', async () => {
    const { app, repository } = buildApp();

    await request(app).post('/api/auth/register').send({
      userId: 'paywall-user',
      email: 'paywall-user@example.com',
      password: 'password123'
    });

    const login = await request(app).post('/api/auth/login').send({
      email: 'paywall-user@example.com',
      password: 'password123'
    });

    const now = Date.now();
    await repository.upsertUserProfile({
      userId: 'paywall-user',
      currentLevel: 'F2',
      streakDays: 2,
      entitlement: createDefaultEntitlement(),
      skills: {
        skill1: { skillId: 'skill1', mastery: 0.3, nextReviewAt: new Date(now - 5_000).toISOString() },
        skill2: { skillId: 'skill2', mastery: 0.3, nextReviewAt: new Date(now - 4_000).toISOString() },
        skill3: { skillId: 'skill3', mastery: 0.3, nextReviewAt: new Date(now - 3_000).toISOString() },
        skill4: { skillId: 'skill4', mastery: 0.3, nextReviewAt: new Date(now - 2_000).toISOString() },
        skill5: { skillId: 'skill5', mastery: 0.3, nextReviewAt: new Date(now - 1_000).toISOString() }
      }
    });

    const freeToday = await request(app)
      .get('/api/learn/today/paywall-user')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`);

    expect(freeToday.status).toBe(200);
    expect(freeToday.body.dueReviews).toHaveLength(3);
    expect(freeToday.body.features.maxDueReviews).toBe(3);

    const sync = await request(app)
      .post('/api/billing/entitlements/sync')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`)
      .send({
        platform: 'android',
        productId: 'moneta.pro.yearly',
        purchaseToken: 'sandbox-purchase-token-67890',
        isActive: true,
        currentPeriodEndsAt: new Date(now + 7 * 86_400_000).toISOString()
      });

    expect(sync.status).toBe(200);

    const proToday = await request(app)
      .get('/api/learn/today/paywall-user')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`);

    expect(proToday.status).toBe(200);
    expect(proToday.body.dueReviews).toHaveLength(5);
    expect(proToday.body.features.unlimitedReviews).toBe(true);
    expect(proToday.body.features.maxDueReviews).toBeNull();
  });

  it('requires metrics token when configured and exposes health/readiness', async () => {
    const app = createApp({
      repository: new InMemoryUserRepository(),
      jwtSecret: 'test-secret',
      jwtRefreshSecret: 'test-refresh-secret',
      jwtAccessTtlSeconds: 3600,
      jwtRefreshTtlSeconds: 604800,
      allowedOrigins: ['http://localhost:5173'],
      trustProxy: false,
      metricsToken: 'metrics-token'
    });

    const unauthorized = await request(app).get('/metrics');
    expect(unauthorized.status).toBe(401);

    const authorized = await request(app)
      .get('/metrics')
      .set('Authorization', 'Bearer metrics-token');
    expect(authorized.status).toBe(200);
    expect(authorized.text).toContain('moneta_http_requests_total');

    const health = await request(app).get('/health');
    expect(health.status).toBe(200);

    const ready = await request(app).get('/ready');
    expect(ready.status).toBe(200);
  });
});
