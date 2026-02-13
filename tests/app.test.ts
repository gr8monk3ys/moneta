import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createDefaultEntitlement } from '../src/billing.js';
import { createBillingVerifier, createWebhookSignature } from '../src/billing.verification.js';
import { createApp } from '../src/app.js';
import { InMemoryUserRepository } from '../src/repository.memory.js';

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function buildApp(accessTtlSeconds = 3600, refreshTtlSeconds = 604800) {
  const repository = new InMemoryUserRepository();
  const billingVerifier = createBillingVerifier({
    nodeEnv: 'development',
    allowSandboxTokens: true,
    webhookSecret: 'test-billing-webhook-secret'
  });
  const app = createApp({
    repository,
    billingVerifier,
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

  it('returns curriculum path metadata and enforces premium lesson access', async () => {
    const { app, accessToken } = await buildAuthedApp();

    const pathResponse = await request(app)
      .get('/api/learn/path/demo-user')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(pathResponse.status).toBe(200);
    expect(pathResponse.body.lessons.length).toBeGreaterThan(6);
    expect(pathResponse.body.lessons.some((lesson: { premium: boolean; locked: boolean }) => lesson.premium && lesson.locked)).toBe(true);

    const freeLesson = await request(app)
      .get('/api/learn/lessons/lesson-cash-flow-f1-001')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(freeLesson.status).toBe(200);
    expect(freeLesson.body.lesson.items[0].correctAnswer).toBeUndefined();

    const premiumDenied = await request(app)
      .get('/api/learn/lessons/lesson-retirement-income-f4-001')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(premiumDenied.status).toBe(402);

    await request(app)
      .post('/api/billing/entitlements/sync')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        platform: 'ios',
        productId: 'moneta.pro.monthly',
        purchaseToken: 'sandbox-premium-unlock-12345'
      });

    const premiumGranted = await request(app)
      .get('/api/learn/lessons/lesson-retirement-income-f4-001')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(premiumGranted.status).toBe(200);
    expect(premiumGranted.body.lesson.premium).toBe(true);
  });

  it('tracks lesson completion and advances next lesson in ordered path', async () => {
    const { app, accessToken } = await buildAuthedApp();

    const initialToday = await request(app)
      .get('/api/learn/today/demo-user')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(initialToday.status).toBe(200);
    const initialLessonId = String(initialToday.body.nextLesson.lessonId);
    expect(initialLessonId).toBeTruthy();

    const initialLessonResponse = await request(app)
      .get(`/api/learn/lessons/${initialLessonId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(initialLessonResponse.status).toBe(200);
    const lessonSkillIds = [...new Set(
      initialLessonResponse.body.lesson.items.map((item: { skillId: string }) => item.skillId)
    )];
    expect(lessonSkillIds.length).toBeGreaterThan(0);

    const completion = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        lessonId: initialLessonId,
        itemResults: lessonSkillIds.map((skillId) => ({ skillId, isCorrect: true }))
      });

    expect(completion.status).toBe(200);
    expect(completion.body.lessonProgress).toMatchObject({
      lessonId: initialLessonId,
      completed: true
    });

    const pathResponse = await request(app)
      .get('/api/learn/path/demo-user')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(pathResponse.status).toBe(200);
    const completedLesson = pathResponse.body.lessons.find((lesson: { lessonId: string }) => lesson.lessonId === initialLessonId);
    expect(completedLesson?.completed).toBe(true);

    const nextToday = await request(app)
      .get('/api/learn/today/demo-user')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(nextToday.status).toBe(200);
    expect(nextToday.body.nextLesson?.lessonId).not.toBe(initialLessonId);
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

  it('exports account data and supports authenticated account deletion', async () => {
    const { app, accessToken } = await buildAuthedApp();

    const exported = await request(app)
      .get('/api/auth/account/export')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(exported.status).toBe(200);
    expect(exported.body.userId).toBe('demo-user');
    expect(exported.body.email).toBe('demo@example.com');
    expect(exported.body.profile.userId).toBe('demo-user');

    const invalidDelete = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(invalidDelete.status).toBe(400);

    const deleted = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ confirmation: 'DELETE_ACCOUNT' });

    expect(deleted.status).toBe(200);
    expect(deleted.body.deleted).toBe(true);

    const loginAfterDelete = await request(app).post('/api/auth/login').send({
      email: 'demo@example.com',
      password: 'password123'
    });
    expect(loginAfterDelete.status).toBe(401);

    const progressAfterDelete = await request(app)
      .get('/api/progress/demo-user')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(progressAfterDelete.status).toBe(404);
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

  it('rejects purchase tokens that cannot be server-side verified', async () => {
    const { app, accessToken } = await buildAuthedApp();

    const response = await request(app)
      .post('/api/billing/entitlements/sync')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        platform: 'ios',
        productId: 'moneta.pro.monthly',
        purchaseToken: 'not-a-verified-token'
      });

    expect(response.status).toBe(400);
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

  it('reconciles billing webhooks with signature validation and idempotency', async () => {
    const { app } = buildApp();

    await request(app).post('/api/auth/register').send({
      userId: 'webhook-user',
      email: 'webhook-user@example.com',
      password: 'password123'
    });

    const eventPayload = {
      eventId: 'evt_billing_001',
      userId: 'webhook-user',
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      isActive: true,
      currentPeriodEndsAt: new Date(Date.now() + 5 * 86_400_000).toISOString()
    };
    const payloadJson = JSON.stringify(eventPayload);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createWebhookSignature(
      'test-billing-webhook-secret',
      Buffer.from(payloadJson),
      timestamp
    );

    const first = await request(app)
      .post('/api/billing/webhooks/reconcile')
      .set('Content-Type', 'application/json')
      .set('x-billing-signature', signature)
      .set('x-billing-timestamp', timestamp)
      .send(payloadJson);

    expect(first.status).toBe(200);
    expect(first.body.processed).toBe(true);
    expect(first.body.entitlement.plan).toBe('pro');

    const duplicate = await request(app)
      .post('/api/billing/webhooks/reconcile')
      .set('Content-Type', 'application/json')
      .set('x-billing-signature', signature)
      .set('x-billing-timestamp', timestamp)
      .send(payloadJson);

    expect(duplicate.status).toBe(200);
    expect(duplicate.body.duplicate).toBe(true);
    expect(duplicate.body.processed).toBe(false);
  });

  it('rejects billing webhooks with invalid signatures', async () => {
    const { app } = buildApp();

    await request(app).post('/api/auth/register').send({
      userId: 'bad-sig-user',
      email: 'bad-sig@example.com',
      password: 'password123'
    });

    const response = await request(app)
      .post('/api/billing/webhooks/reconcile')
      .set('Content-Type', 'application/json')
      .set('x-billing-signature', '123.bad-signature')
      .set('x-billing-timestamp', '123')
      .send(JSON.stringify({
        eventId: 'evt_bad_sig',
        userId: 'bad-sig-user',
        platform: 'ios',
        productId: 'moneta.pro.monthly',
        isActive: true
      }));

    expect(response.status).toBe(401);
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
