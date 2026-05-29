import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createDefaultEntitlement } from '../src/billing.js';
import { createBillingVerifier, createWebhookSignature } from '../src/billing.verification.js';
import { createApp } from '../src/app.js';
import { listCurriculum } from '../src/data.js';
import type { EmailService } from '../src/email.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { InMemoryUserRepository } from '../src/repository.memory.js';

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function buildApp(accessTtlSeconds = 3600, refreshTtlSeconds = 604800, emailService?: EmailService) {
  const repository = new InMemoryUserRepository();
  const billingVerifier = createBillingVerifier({
    nodeEnv: 'development',
    allowSandboxTokens: true,
    webhookSecret: 'test-billing-webhook-secret'
  });
  const app = createApp({
    repository,
    billingVerifier,
    emailService,
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
    email: 'demo@example.com',
    password: 'password123'
  });

  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'demo@example.com',
    password: 'password123'
  });

  return {
    app,
    userId: loginResponse.body.userId as string,
    accessToken: loginResponse.body.accessToken as string,
    refreshToken: loginResponse.body.refreshToken as string
  };
}

describe('Moneta API auth + learning flow', () => {
  it('registers and logs in user with refresh token', async () => {
    const { app } = buildApp();

    const registerResponse = await request(app).post('/api/auth/register').send({
      email: 'auth@example.com',
      password: 'password123'
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.userId).toBeTruthy();

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'auth@example.com',
      password: 'password123'
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.accessToken).toBeTruthy();
    expect(loginResponse.body.refreshToken).toBeTruthy();
    expect(loginResponse.body.userId).toBeTruthy();
    expect(loginResponse.body.sessionId).toBeTruthy();
  });

  it('supports password reset flow via emailed code', async () => {
    const sent: Array<{ to: string; code: string; expiresAt: string }> = [];
    const emailService: EmailService = {
      sendPasswordResetCode: async (input) => {
        sent.push(input);
      }
    };
    const { app } = buildApp(3600, 604800, emailService);

    await request(app).post('/api/auth/register').send({
      email: 'reset@example.com',
      password: 'password123'
    });

    const requested = await request(app).post('/api/auth/password/reset/request').send({
      email: 'reset@example.com'
    });
    expect(requested.status).toBe(200);
    expect(sent).toHaveLength(1);

    const confirm = await request(app).post('/api/auth/password/reset/confirm').send({
      email: 'reset@example.com',
      code: sent[0].code,
      newPassword: 'newpassword123'
    });
    expect(confirm.status).toBe(200);

    const oldLogin = await request(app).post('/api/auth/login').send({
      email: 'reset@example.com',
      password: 'password123'
    });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post('/api/auth/login').send({
      email: 'reset@example.com',
      password: 'newpassword123'
    });
    expect(newLogin.status).toBe(200);
  });

  it('handles password reset edge cases without leaking account existence', async () => {
    const sent: Array<{ to: string; code: string; expiresAt: string }> = [];
    const emailService: EmailService = {
      sendPasswordResetCode: async (input) => {
        sent.push(input);
      }
    };
    const { app } = buildApp(3600, 604800, emailService);

    await request(app).post('/api/auth/register').send({
      email: 'reset-edge@example.com',
      password: 'password123'
    });

    const invalidRequest = await request(app).post('/api/auth/password/reset/request').send({
      email: 'not-an-email'
    });
    expect(invalidRequest.status).toBe(400);

    const unknownEmail = await request(app).post('/api/auth/password/reset/request').send({
      email: 'missing@example.com'
    });
    expect(unknownEmail.status).toBe(200);
    expect(sent).toHaveLength(0);

    const knownEmail = await request(app).post('/api/auth/password/reset/request').send({
      email: 'reset-edge@example.com'
    });
    expect(knownEmail.status).toBe(200);
    expect(sent).toHaveLength(1);

    const invalidConfirmPayload = await request(app).post('/api/auth/password/reset/confirm').send({
      email: 'reset-edge@example.com',
      code: '123',
      newPassword: 'short'
    });
    expect(invalidConfirmPayload.status).toBe(400);

    const missingUserConfirm = await request(app).post('/api/auth/password/reset/confirm').send({
      email: 'ghost@example.com',
      code: '12345678',
      newPassword: 'newpassword123'
    });
    expect(missingUserConfirm.status).toBe(401);

    const wrongCode = await request(app).post('/api/auth/password/reset/confirm').send({
      email: 'reset-edge@example.com',
      code: '87654321',
      newPassword: 'newpassword123'
    });
    expect(wrongCode.status).toBe(401);
  });

  it('returns validation and conflict errors for register', async () => {
    const { app } = buildApp();

    const invalid = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'short'
    });
    expect(invalid.status).toBe(400);

    await request(app).post('/api/auth/register').send({
      email: 'dup@example.com',
      password: 'password123'
    });

    const duplicate = await request(app).post('/api/auth/register').send({
      email: 'dup@example.com',
      password: 'password123'
    });
    expect(duplicate.status).toBe(409);
  });

  it('rejects invalid login credentials and missing bearer token', async () => {
    const { app } = buildApp();

    const register = await request(app).post('/api/auth/register').send({
      email: 'auth@example.com',
      password: 'password123'
    });
    const userId = register.body.userId as string;

    const badLogin = await request(app).post('/api/auth/login').send({
      email: 'auth@example.com',
      password: 'wrong-password'
    });
    expect(badLogin.status).toBe(401);

    const missingToken = await request(app).get(`/api/progress/${userId}`);
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

  it('supports logout and rejects invalid logout requests', async () => {
    const { app, refreshToken } = await buildAuthedApp();

    const invalidPayload = await request(app).post('/api/auth/logout').send({});
    expect(invalidPayload.status).toBe(400);

    const invalidToken = await request(app).post('/api/auth/logout').send({
      refreshToken: 'x'.repeat(24)
    });
    expect(invalidToken.status).toBe(401);

    const loggedOut = await request(app).post('/api/auth/logout').send({ refreshToken });
    expect(loggedOut.status).toBe(200);

    const refreshAfterLogout = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(refreshAfterLogout.status).toBe(401);
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
    const { app, accessToken, userId } = await buildAuthedApp(1, 604800);
    await sleep(1100);

    const response = await request(app)
      .get(`/api/progress/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
  });

  it('protects user resources from other user token', async () => {
    const { app } = buildApp();

    const registerA = await request(app).post('/api/auth/register').send({
      email: 'a@example.com',
      password: 'password123'
    });
    expect(registerA.body.userId).toBeTruthy();

    const registerB = await request(app).post('/api/auth/register').send({
      email: 'b@example.com',
      password: 'password123'
    });
    const userBId = registerB.body.userId as string;

    const login = await request(app).post('/api/auth/login').send({
      email: 'a@example.com',
      password: 'password123'
    });

    const forbidden = await request(app)
      .get(`/api/progress/${userBId}`)
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
    const { app, accessToken, userId } = await buildAuthedApp();

    const placement = await request(app)
      .post('/api/onboarding/placement')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ correctAnswers: 8, totalQuestions: 10 });
    expect(placement.status).toBe(200);

    const today = await request(app)
      .get(`/api/learn/today/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(today.status).toBe(200);

    const session = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ itemResults: [{ skillId: 'apr-vs-apy', isCorrect: true }] });
    expect(session.status).toBe(200);

    const progress = await request(app)
      .get(`/api/progress/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(progress.status).toBe(200);
  });

  it('returns curriculum path metadata and enforces premium lesson access', async () => {
    const { app, accessToken, userId } = await buildAuthedApp();

    const pathResponse = await request(app)
      .get(`/api/learn/path/${userId}`)
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
    const { app, accessToken, userId } = await buildAuthedApp();

    const initialToday = await request(app)
      .get(`/api/learn/today/${userId}`)
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
      .get(`/api/learn/path/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(pathResponse.status).toBe(200);
    const completedLesson = pathResponse.body.lessons.find((lesson: { lessonId: string }) => lesson.lessonId === initialLessonId);
    expect(completedLesson?.completed).toBe(true);

    const nextToday = await request(app)
      .get(`/api/learn/today/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(nextToday.status).toBe(200);
    expect(nextToday.body.nextLesson?.lessonId).not.toBe(initialLessonId);
  });

  it('grades lesson answers server-side when provided', async () => {
    const { app, accessToken } = await buildAuthedApp();

    const lessonId = 'lesson-cash-flow-f1-001';
    const lessonResponse = await request(app)
      .get(`/api/learn/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(lessonResponse.status).toBe(200);
    expect(lessonResponse.body.lesson.lessonId).toBe(lessonId);

    const answerKey: Record<string, string> = {
      'apr-vs-apy': 'borrowing cost',
      'basic-budgeting': '300',
      'fixed-vs-variable-expenses': 'fixed',
      'net-cash-flow': '250',
      'cash-flow-checkin-cadence': 'weekly',
      'pay-yourself-first': 'save before discretionary spending'
    };

    const itemResults = lessonResponse.body.lesson.items.map((item: { itemId: string; skillId: string }) => ({
      itemId: item.itemId,
      skillId: item.skillId,
      answer: answerKey[item.skillId]
    }));

    expect(itemResults.every((item: { answer?: string }) => Boolean(item.answer))).toBe(true);

    const completion = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        lessonId,
        timeZone: 'UTC',
        itemResults
      });

    expect(completion.status).toBe(200);
    expect(completion.body.lessonProgress).toMatchObject({
      lessonId,
      completed: true
    });
    expect(completion.body.gradedItems).toHaveLength(itemResults.length);
    expect(completion.body.gradedItems.every((item: { isCorrect: boolean }) => item.isCorrect)).toBe(true);
  });

  it('grades review answers server-side without lessonId when itemId is provided', async () => {
    const { app, accessToken } = await buildAuthedApp();

    const lessonId = 'lesson-cash-flow-f1-001';
    const lessonResponse = await request(app)
      .get(`/api/learn/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(lessonResponse.status).toBe(200);

    const answerKey: Record<string, string> = {
      'apr-vs-apy': 'borrowing cost',
      'basic-budgeting': '300',
      'fixed-vs-variable-expenses': 'fixed',
      'net-cash-flow': '250',
      'cash-flow-checkin-cadence': 'weekly',
      'pay-yourself-first': 'save before discretionary spending'
    };

    const itemResults = lessonResponse.body.lesson.items.map((item: { itemId: string; skillId: string }) => ({
      itemId: item.itemId,
      skillId: item.skillId,
      answer: answerKey[item.skillId]
    }));

    expect(itemResults.every((item: { answer?: string }) => Boolean(item.answer))).toBe(true);

    const completion = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        timeZone: 'UTC',
        itemResults
      });

    expect(completion.status).toBe(200);
    expect(completion.body.lessonProgress).toBeUndefined();
    expect(completion.body.gradedItems).toHaveLength(itemResults.length);
    expect(completion.body.gradedItems.every((item: { isCorrect: boolean }) => item.isCorrect)).toBe(true);
  });

  it('returns only reviews that are due based on persisted schedule', async () => {
    const { app, repository } = buildApp();

    const register = await request(app).post('/api/auth/register').send({
      email: 'review-user@example.com',
      password: 'password123'
    });
    const userId = register.body.userId as string;

    const login = await request(app).post('/api/auth/login').send({
      email: 'review-user@example.com',
      password: 'password123'
    });

    const now = Date.now();
    await repository.upsertUserProfile({
      userId,
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
      .get(`/api/learn/today/${userId}`)
      .set('Authorization', `Bearer ${login.body.accessToken as string}`);

    expect(response.status).toBe(200);
    expect(response.body.dueReviews).toHaveLength(1);
    expect(response.body.dueReviews[0].skillId).toBe('due');
    expect(response.body.practiceReviews).toHaveLength(1);
    expect(response.body.practiceReviews[0].skillId).toBe('future');
  });

  it('limits free-plan reviews and preserves locked or unresolved review metadata', async () => {
    const { app, repository } = buildApp();

    const register = await request(app).post('/api/auth/register').send({
      email: 'review-limit@example.com',
      password: 'password123'
    });
    const userId = register.body.userId as string;

    const login = await request(app).post('/api/auth/login').send({
      email: 'review-limit@example.com',
      password: 'password123'
    });

    const now = Date.now();
    await repository.upsertUserProfile({
      userId,
      currentLevel: 'F4',
      streakDays: 5,
      entitlement: createDefaultEntitlement(),
      skills: {
        'withdrawal-rate': {
          skillId: 'withdrawal-rate',
          mastery: 0.4,
          nextReviewAt: new Date(now - 300_000).toISOString()
        },
        'unknown-skill': {
          skillId: 'unknown-skill',
          mastery: 0.2,
          nextReviewAt: new Date(now - 240_000).toISOString()
        },
        'apr-vs-apy': {
          skillId: 'apr-vs-apy',
          mastery: 0.5,
          nextReviewAt: new Date(now - 180_000).toISOString()
        },
        'basic-budgeting': {
          skillId: 'basic-budgeting',
          mastery: 0.5,
          nextReviewAt: new Date(now + 60_000).toISOString()
        },
        'credit-utilization': {
          skillId: 'credit-utilization',
          mastery: 0.5,
          nextReviewAt: new Date(now + 120_000).toISOString()
        },
        'payment-history': {
          skillId: 'payment-history',
          mastery: 0.5,
          nextReviewAt: new Date(now + 180_000).toISOString()
        },
        'credit-mix': {
          skillId: 'credit-mix',
          mastery: 0.5,
          nextReviewAt: new Date(now + 240_000).toISOString()
        }
      }
    });

    const response = await request(app)
      .get(`/api/learn/today/${userId}`)
      .set('Authorization', `Bearer ${login.body.accessToken as string}`);

    expect(response.status).toBe(200);
    expect(response.body.dueReviews).toHaveLength(3);
    expect(response.body.practiceReviews).toHaveLength(3);

    const lockedPremium = response.body.dueReviews.find((review: { skillId: string }) => review.skillId === 'withdrawal-rate');
    expect(lockedPremium).toMatchObject({
      skillId: 'withdrawal-rate',
      locked: true
    });
    expect(lockedPremium.contentItemId).toBeUndefined();
    expect(lockedPremium.prompt).toBeUndefined();

    const unresolved = response.body.dueReviews.find((review: { skillId: string }) => review.skillId === 'unknown-skill');
    expect(unresolved).toMatchObject({
      skillId: 'unknown-skill'
    });
    expect(unresolved.contentItemId).toBeUndefined();
    expect(unresolved.prompt).toBeUndefined();
  });

  it('supports standalone answer grading, numeric equivalence, and blank normalized answers', async () => {
    const { app, accessToken } = await buildAuthedApp();

    const numericEquivalent = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        timeZone: 'UTC',
        itemResults: [
          { itemId: 'item-credit-001', skillId: 'credit-utilization', answer: '0.2' },
          { skillId: 'payment-history', isCorrect: true }
        ]
      });

    expect(numericEquivalent.status).toBe(200);
    expect(numericEquivalent.body.gradedItems).toMatchObject([
      {
        itemId: 'item-credit-001',
        skillId: 'credit-utilization',
        isCorrect: true
      }
    ]);
    expect(numericEquivalent.body.scheduledReviews).toHaveLength(2);

    const blankAnswer = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        timeZone: 'UTC',
        itemResults: [
          { itemId: 'item-budget-001', skillId: 'basic-budgeting', answer: '   ' }
        ]
      });

    expect(blankAnswer.status).toBe(200);
    expect(blankAnswer.body.gradedItems).toMatchObject([
      {
        itemId: 'item-budget-001',
        skillId: 'basic-budgeting',
        isCorrect: false
      }
    ]);
  });

  it('rejects standalone grading mismatches and missing lessons in both grading paths', async () => {
    const { app, accessToken } = await buildAuthedApp();

    const unknownStandaloneItem = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemResults: [{ itemId: 'item-missing', skillId: 'apr-vs-apy', answer: 'borrowing cost' }]
      });
    expect(unknownStandaloneItem.status).toBe(400);

    const mismatchedStandaloneItem = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemResults: [{ itemId: 'item-apr-001', skillId: 'basic-budgeting', answer: 'borrowing cost' }]
      });
    expect(mismatchedStandaloneItem.status).toBe(400);

    const missingLessonWithAnswers = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        lessonId: 'lesson-missing',
        itemResults: [{ itemId: 'item-apr-001', skillId: 'apr-vs-apy', answer: 'borrowing cost' }]
      });
    expect(missingLessonWithAnswers.status).toBe(404);

    const missingLessonWithBooleans = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        lessonId: 'lesson-missing',
        itemResults: [{ skillId: 'apr-vs-apy', isCorrect: true }]
      });
    expect(missingLessonWithBooleans.status).toBe(404);
  });

  it('validates lesson and review grading edge cases', async () => {
    const { app, accessToken } = await buildAuthedApp();

    const unknownLesson = await request(app)
      .get('/api/learn/lessons/lesson-missing')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(unknownLesson.status).toBe(404);

    const missingOutcome = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        lessonId: 'lesson-cash-flow-f1-001',
        itemResults: [{ skillId: 'apr-vs-apy' }]
      });
    expect(missingOutcome.status).toBe(400);

    const answerWithoutItemId = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemResults: [{ skillId: 'apr-vs-apy', answer: 'borrowing cost' }]
      });
    expect(answerWithoutItemId.status).toBe(400);

    const unknownItemId = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        lessonId: 'lesson-cash-flow-f1-001',
        itemResults: [{ itemId: 'item-missing', skillId: 'apr-vs-apy', answer: 'borrowing cost' }]
      });
    expect(unknownItemId.status).toBe(400);

    const mismatchedSkill = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        lessonId: 'lesson-cash-flow-f1-001',
        itemResults: [{ itemId: 'item-apr-001', skillId: 'basic-budgeting', answer: 'borrowing cost' }]
      });
    expect(mismatchedSkill.status).toBe(400);

    const noMatchedSkills = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        lessonId: 'lesson-cash-flow-f1-001',
        itemResults: [{ skillId: 'not-in-lesson', isCorrect: true }]
      });
    expect(noMatchedSkills.status).toBe(400);

    const premiumLessonDenied = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        lessonId: 'lesson-retirement-income-f4-001',
        itemResults: [{ skillId: 'withdrawal-rate', isCorrect: true }]
      });
    expect(premiumLessonDenied.status).toBe(402);

    const premiumReviewDenied = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemResults: [{
          itemId: 'item-retire-001',
          skillId: 'withdrawal-rate',
          answer: 'sequence risk and longevity'
        }]
      });
    expect(premiumReviewDenied.status).toBe(402);
  });

  it('syncs completed lessons from already-mastered skills before persisting the session', async () => {
    const { app, repository } = buildApp();

    const register = await request(app).post('/api/auth/register').send({
      email: 'mastery-sync@example.com',
      password: 'password123'
    });
    const userId = register.body.userId as string;

    const login = await request(app).post('/api/auth/login').send({
      email: 'mastery-sync@example.com',
      password: 'password123'
    });

    await repository.upsertUserProfile({
      userId,
      currentLevel: 'F1',
      streakDays: 4,
      entitlement: createDefaultEntitlement(),
      completedLessons: undefined,
      skills: {
        'apr-vs-apy': { skillId: 'apr-vs-apy', mastery: 0.8 },
        'basic-budgeting': { skillId: 'basic-budgeting', mastery: 0.8 },
        'fixed-vs-variable-expenses': { skillId: 'fixed-vs-variable-expenses', mastery: 0.8 },
        'net-cash-flow': { skillId: 'net-cash-flow', mastery: 0.8 },
        'cash-flow-checkin-cadence': { skillId: 'cash-flow-checkin-cadence', mastery: 0.8 },
        'pay-yourself-first': { skillId: 'pay-yourself-first', mastery: 0.8 }
      }
    });

    const completion = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`)
      .send({
        itemResults: [{ skillId: 'apr-vs-apy', isCorrect: true }],
        timeZone: 'UTC'
      });

    expect(completion.status).toBe(200);

    const pathResponse = await request(app)
      .get(`/api/learn/path/${userId}`)
      .set('Authorization', `Bearer ${login.body.accessToken as string}`);

    expect(pathResponse.status).toBe(200);
    const syncedLesson = pathResponse.body.lessons.find((lesson: { lessonId: string }) => lesson.lessonId === 'lesson-cash-flow-f1-001');
    expect(syncedLesson?.completed).toBe(true);
  });

  it('exports account data and supports authenticated account deletion', async () => {
    const { app, accessToken, userId } = await buildAuthedApp();

    const exported = await request(app)
      .get('/api/auth/account/export')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(exported.status).toBe(200);
    expect(exported.body.userId).toBe(userId);
    expect(exported.body.email).toBe('demo@example.com');
    expect(exported.body.profile.userId).toBe(userId);
    expect(exported.body.sessions.total).toBeGreaterThan(0);
    expect(exported.body.sessions.refreshTokens).toHaveLength(exported.body.sessions.total);
    const sessionToken = exported.body.sessions.refreshTokens[0] as Record<string, unknown>;
    expect('tokenHash' in sessionToken).toBe(false);
    expect('userId' in sessionToken).toBe(false);

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
      .get(`/api/progress/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(progressAfterDelete.status).toBe(404);
  });

  it('returns 404 for authenticated export and deletion after the account is gone', async () => {
    const { app, accessToken } = await buildAuthedApp();

    const firstDelete = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ confirmation: 'DELETE_ACCOUNT' });

    expect(firstDelete.status).toBe(200);

    const exportAfterDelete = await request(app)
      .get('/api/auth/account/export')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(exportAfterDelete.status).toBe(404);

    const secondDelete = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ confirmation: 'DELETE_ACCOUNT' });

    expect(secondDelete.status).toBe(404);
  });

  it('returns free entitlements by default and upgrades on sync', async () => {
    const { app, accessToken, userId } = await buildAuthedApp();

    const initial = await request(app)
      .get(`/api/billing/entitlements/${userId}`)
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

    const register = await request(app).post('/api/auth/register').send({
      email: 'paywall-user@example.com',
      password: 'password123'
    });
    const userId = register.body.userId as string;

    const login = await request(app).post('/api/auth/login').send({
      email: 'paywall-user@example.com',
      password: 'password123'
    });

    const now = Date.now();
    await repository.upsertUserProfile({
      userId,
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
      .get(`/api/learn/today/${userId}`)
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
      .get(`/api/learn/today/${userId}`)
      .set('Authorization', `Bearer ${login.body.accessToken as string}`);

    expect(proToday.status).toBe(200);
    expect(proToday.body.dueReviews).toHaveLength(5);
    expect(proToday.body.features.unlimitedReviews).toBe(true);
    expect(proToday.body.features.maxDueReviews).toBeNull();
  });

  it('reconciles billing webhooks with signature validation and idempotency', async () => {
    const { app } = buildApp();

    const register = await request(app).post('/api/auth/register').send({
      email: 'webhook-user@example.com',
      password: 'password123'
    });
    const userId = register.body.userId as string;

    const eventPayload = {
      eventId: 'evt_billing_001',
      userId,
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

    const register = await request(app).post('/api/auth/register').send({
      email: 'bad-sig@example.com',
      password: 'password123'
    });
    const userId = register.body.userId as string;

    const response = await request(app)
      .post('/api/billing/webhooks/reconcile')
      .set('Content-Type', 'application/json')
      .set('x-billing-signature', '123.bad-signature')
      .set('x-billing-timestamp', '123')
      .send(JSON.stringify({
        eventId: 'evt_bad_sig',
        userId,
        platform: 'ios',
        productId: 'moneta.pro.monthly',
        isActive: true
      }));

    expect(response.status).toBe(401);
  });

  it('covers billing route validation and missing-user webhook edge cases', async () => {
    const { app } = buildApp();

    const firstRegister = await request(app).post('/api/auth/register').send({
      email: 'billing-edge-1@example.com',
      password: 'password123'
    });
    const firstUserId = firstRegister.body.userId as string;

    const firstLogin = await request(app).post('/api/auth/login').send({
      email: 'billing-edge-1@example.com',
      password: 'password123'
    });
    const firstAccessToken = firstLogin.body.accessToken as string;

    const secondRegister = await request(app).post('/api/auth/register').send({
      email: 'billing-edge-2@example.com',
      password: 'password123'
    });
    const secondUserId = secondRegister.body.userId as string;

    const forbiddenEntitlements = await request(app)
      .get(`/api/billing/entitlements/${secondUserId}`)
      .set('Authorization', `Bearer ${firstAccessToken}`);

    expect(forbiddenEntitlements.status).toBe(403);

    const invalidSync = await request(app)
      .post('/api/billing/entitlements/sync')
      .set('Authorization', `Bearer ${firstAccessToken}`)
      .send({
        platform: 'ios',
        productId: '',
        purchaseToken: 'short'
      });

    expect(invalidSync.status).toBe(400);

    const deleteAccount = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${firstAccessToken}`)
      .send({ confirmation: 'DELETE_ACCOUNT' });

    expect(deleteAccount.status).toBe(200);

    const missingEntitlements = await request(app)
      .get(`/api/billing/entitlements/${firstUserId}`)
      .set('Authorization', `Bearer ${firstAccessToken}`);

    expect(missingEntitlements.status).toBe(404);

    const invalidDatePayload = {
      eventId: 'evt_invalid_period_end',
      userId: secondUserId,
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      isActive: true,
      currentPeriodEndsAt: 'not-a-date'
    };
    const invalidDateJson = JSON.stringify(invalidDatePayload);
    const invalidDateTimestamp = String(Math.floor(Date.now() / 1000));
    const invalidDateSignature = createWebhookSignature(
      'test-billing-webhook-secret',
      Buffer.from(invalidDateJson),
      invalidDateTimestamp
    );

    const invalidDateResponse = await request(app)
      .post('/api/billing/webhooks/reconcile')
      .set('Content-Type', 'application/json')
      .set('x-billing-signature', invalidDateSignature)
      .set('x-billing-timestamp', invalidDateTimestamp)
      .send(invalidDateJson);

    expect(invalidDateResponse.status).toBe(400);

    const missingUserPayload = {
      eventId: 'evt_missing_user',
      userId: 'missing-user',
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      isActive: true
    };
    const missingUserJson = JSON.stringify(missingUserPayload);
    const missingUserTimestamp = String(Math.floor(Date.now() / 1000));
    const missingUserSignature = createWebhookSignature(
      'test-billing-webhook-secret',
      Buffer.from(missingUserJson),
      missingUserTimestamp
    );

    const missingUserResponse = await request(app)
      .post('/api/billing/webhooks/reconcile')
      .set('Content-Type', 'application/json')
      .set('x-billing-signature', missingUserSignature)
      .set('x-billing-timestamp', missingUserTimestamp)
      .send(missingUserJson);

    expect(missingUserResponse.status).toBe(404);
  });

  it('covers learning validation, premium lesson gating, and mastery sync completions', async () => {
    const { app, repository } = buildApp();
    const premiumLesson = listCurriculum(true).find((lesson) => lesson.premium);
    const masteredLesson = listCurriculum(false)[0];

    expect(premiumLesson).toBeDefined();
    expect(masteredLesson).toBeDefined();
    if (!premiumLesson || !masteredLesson) {
      throw new Error('Expected curriculum fixtures to be available for coverage tests');
    }

    const register = await request(app).post('/api/auth/register').send({
      email: 'learning-edge@example.com',
      password: 'password123'
    });
    const userId = register.body.userId as string;

    const login = await request(app).post('/api/auth/login').send({
      email: 'learning-edge@example.com',
      password: 'password123'
    });
    const accessToken = login.body.accessToken as string;

    const masteredSkillIds = [...new Set(masteredLesson.items.map((item) => item.skillId))];
    await repository.upsertUserProfile({
      userId,
      currentLevel: 'F1',
      streakDays: 0,
      entitlement: createDefaultEntitlement(),
      skills: {
        ...Object.fromEntries(masteredSkillIds.map((skillId) => [
          skillId,
          { skillId, mastery: 0.9 }
        ])),
        'no-review-skill': { skillId: 'no-review-skill', mastery: 0.2 },
        'future-review-skill': {
          skillId: 'future-review-skill',
          mastery: 0.2,
          nextReviewAt: new Date(Date.now() + 86_400_000).toISOString()
        }
      }
    });

    const invalidPlacement = await request(app)
      .post('/api/onboarding/placement')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        correctAnswers: -1,
        totalQuestions: 0
      });

    expect(invalidPlacement.status).toBe(400);

    const forbiddenToday = await request(app)
      .get('/api/learn/today/someone-else')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(forbiddenToday.status).toBe(403);

    const missingLesson = await request(app)
      .get('/api/learn/lessons/missing-lesson')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(missingLesson.status).toBe(404);

    const premiumLessonResponse = await request(app)
      .get(`/api/learn/lessons/${premiumLesson.lessonId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(premiumLessonResponse.status).toBe(402);

    const invalidLessonSession = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        lessonId: masteredLesson.lessonId,
        itemResults: [{ skillId: masteredSkillIds[0] }]
      });

    expect(invalidLessonSession.status).toBe(400);

    const invalidStandaloneSession = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemResults: [{ skillId: masteredSkillIds[0] }]
      });

    expect(invalidStandaloneSession.status).toBe(400);

    const answerWithoutItemId = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemResults: [{ skillId: masteredSkillIds[0], answer: 'yes' }]
      });

    expect(answerWithoutItemId.status).toBe(400);

    const firstSession = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemResults: [{ skillId: masteredSkillIds[0], isCorrect: true }],
        timeZone: 'Invalid/Timezone'
      });

    expect(firstSession.status).toBe(200);

    const secondSession = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemResults: [{ skillId: masteredSkillIds[0], isCorrect: false }],
        timeZone: 'America/Los_Angeles'
      });

    expect(secondSession.status).toBe(200);

    const path = await request(app)
      .get(`/api/learn/path/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(path.status).toBe(200);
    expect(
      path.body.lessons.find((lesson: { lessonId: string; completed: boolean }) => lesson.lessonId === masteredLesson.lessonId)?.completed
    ).toBe(true);

    const today = await request(app)
      .get(`/api/learn/today/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(today.status).toBe(200);
    expect(today.body.dueReviews.some((review: { skillId: string }) => review.skillId === 'no-review-skill')).toBe(false);
    expect(today.body.practiceReviews.some((review: { skillId: string }) => review.skillId === 'no-review-skill')).toBe(false);

    const deleteAccount = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ confirmation: 'DELETE_ACCOUNT' });

    expect(deleteAccount.status).toBe(200);

    const missingPlacementUser = await request(app)
      .post('/api/onboarding/placement')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        correctAnswers: 2,
        totalQuestions: 5
      });

    expect(missingPlacementUser.status).toBe(404);
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

  it('blocks disallowed origins and supports deployments without CORS origins configured', async () => {
    const restrictedApp = createApp({
      repository: new InMemoryUserRepository(),
      jwtSecret: 'test-secret',
      jwtRefreshSecret: 'test-refresh-secret',
      jwtAccessTtlSeconds: 3600,
      jwtRefreshTtlSeconds: 604800,
      allowedOrigins: ['http://localhost:5173'],
      trustProxy: false
    });

    const blocked = await request(restrictedApp)
      .get('/health')
      .set('Origin', 'https://blocked.example');

    expect(blocked.status).toBe(403);
    expect(blocked.body.error).toBe('Blocked by CORS');

    const noCorsApp = createApp({
      repository: new InMemoryUserRepository(),
      jwtSecret: 'test-secret',
      jwtRefreshSecret: 'test-refresh-secret',
      jwtAccessTtlSeconds: 3600,
      jwtRefreshTtlSeconds: 604800,
      allowedOrigins: [],
      trustProxy: false
    });

    const noCors = await request(noCorsApp)
      .get('/health')
      .set('Origin', 'https://any-origin.example');

    expect(noCors.status).toBe(200);
    expect(noCors.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('returns not ready when repository readiness fails', async () => {
    const repository = new InMemoryUserRepository();
    repository.checkReadiness = async () => false;

    const app = createApp({
      repository,
      jwtSecret: 'test-secret',
      jwtRefreshSecret: 'test-refresh-secret',
      jwtAccessTtlSeconds: 3600,
      jwtRefreshTtlSeconds: 604800,
      allowedOrigins: ['http://localhost:5173'],
      trustProxy: false
    });

    const ready = await request(app).get('/ready');
    expect(ready.status).toBe(503);
    expect(ready.body.error).toBe('Service not ready');
  });

  it('returns a generic 500 response for unhandled errors', async () => {
    const app = express();

    app.use((req, _res, next) => {
      (req as typeof req & { requestId: string }).requestId = 'test-request-id';
      next();
    });

    app.get('/boom', () => {
      throw new Error('boom');
    });

    app.use(errorHandler);

    const response = await request(app).get('/boom');
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });

  it('serves the marketing landing page, robots, and sitemap', async () => {
    const { app } = buildApp();

    const page = await request(app).get('/');
    expect(page.status).toBe(200);
    expect(page.headers['content-type']).toContain('text/html');
    expect(page.text).toContain('Build money confidence in 5-minute lessons');
    expect(page.text).toContain('Explore the Learning Path');
    expect(page.text).toContain('Skip to content');

    const robots = await request(app).get('/robots.txt').set('Host', 'moneta.test');
    expect(robots.status).toBe(200);
    expect(robots.text).toContain('Sitemap: http://moneta.test/sitemap.xml');

    const sitemap = await request(app).get('/sitemap.xml').set('Host', 'moneta.test');
    expect(sitemap.status).toBe(200);
    expect(sitemap.text).toContain('<loc>http://moneta.test/</loc>');
  });

  it('injects configured launch links into the landing page', async () => {
    const originalIosUrl = process.env.MARKETING_IOS_URL;
    const originalPrivacyUrl = process.env.MARKETING_PRIVACY_URL;

    process.env.MARKETING_IOS_URL = 'https://apps.apple.com/us/app/moneta/id123456789';
    process.env.MARKETING_PRIVACY_URL = 'https://moneta.app/privacy';

    try {
      const { app } = buildApp();
      const page = await request(app).get('/');

      expect(page.text).toContain('https://apps.apple.com/us/app/moneta/id123456789');
      expect(page.text).toContain('Download for iPhone');
      expect(page.text).toContain('https://moneta.app/privacy');
    } finally {
      if (originalIosUrl) {
        process.env.MARKETING_IOS_URL = originalIosUrl;
      } else {
        delete process.env.MARKETING_IOS_URL;
      }

      if (originalPrivacyUrl) {
        process.env.MARKETING_PRIVACY_URL = originalPrivacyUrl;
      } else {
        delete process.env.MARKETING_PRIVACY_URL;
      }
    }
  });

  it('returns a server error when password reset email service is not configured', async () => {
    const { app } = buildApp();

    await request(app).post('/api/auth/register').send({
      email: 'no-email-service@example.com',
      password: 'password123'
    });

    const response = await request(app).post('/api/auth/password/reset/request').send({
      email: 'no-email-service@example.com'
    });

    expect(response.status).toBe(500);
    expect(response.body.error).toContain('Email service is not configured');
  });

  it('does not let a stale billing webhook downgrade an active subscription', async () => {
    const { app } = buildApp();
    const register = await request(app).post('/api/auth/register').send({
      email: 'stale-webhook@example.com',
      password: 'password123'
    });
    const userId = register.body.userId as string;

    const sendWebhook = async (payload: Record<string, unknown>) => {
      const payloadJson = JSON.stringify(payload);
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signature = createWebhookSignature('test-billing-webhook-secret', Buffer.from(payloadJson), timestamp);
      return request(app)
        .post('/api/billing/webhooks/reconcile')
        .set('Content-Type', 'application/json')
        .set('x-billing-signature', signature)
        .set('x-billing-timestamp', timestamp)
        .send(payloadJson);
    };

    const activate = await sendWebhook({
      eventId: 'evt_active_001',
      userId,
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      isActive: true,
      currentPeriodEndsAt: new Date(Date.now() + 30 * 86_400_000).toISOString()
    });
    expect(activate.body.entitlement.plan).toBe('pro');

    // A late/out-of-order cancellation for an already-expired period must not revoke
    // the user who is still paid through the future period end.
    const staleCancel = await sendWebhook({
      eventId: 'evt_cancel_stale',
      userId,
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      isActive: false,
      currentPeriodEndsAt: new Date(Date.now() - 86_400_000).toISOString()
    });

    expect(staleCancel.status).toBe(200);
    expect(staleCancel.body.processed).toBe(false);
    expect(staleCancel.body.stale).toBe(true);
    expect(staleCancel.body.entitlement.plan).toBe('pro');

    // A genuine renewal that extends the period still applies.
    const renew = await sendWebhook({
      eventId: 'evt_renew',
      userId,
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      isActive: true,
      currentPeriodEndsAt: new Date(Date.now() + 60 * 86_400_000).toISOString()
    });
    expect(renew.body.processed).toBe(true);
    expect(renew.body.entitlement.plan).toBe('pro');
  });

  it('revokes the whole session family when a rotated refresh token is replayed', async () => {
    const { app, refreshToken } = await buildAuthedApp();

    const rotated = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(rotated.status).toBe(200);
    const rotatedRefreshToken = rotated.body.refreshToken as string;

    // Replaying the original (now-revoked) token signals theft and must fail.
    const replay = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(replay.status).toBe(401);

    // ...and it must also invalidate the legitimately rotated token in that session.
    const afterReuse = await request(app).post('/api/auth/refresh').send({ refreshToken: rotatedRefreshToken });
    expect(afterReuse.status).toBe(401);
  });

  it('rejects session results for unknown skills and oversized payloads', async () => {
    const { app, userId, accessToken } = await buildAuthedApp();

    const unknownSkill = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ itemResults: [{ skillId: 'totally-not-a-real-skill', isCorrect: true }] });
    expect(unknownSkill.status).toBe(400);

    const oversized = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemResults: Array.from({ length: 101 }, () => ({ skillId: 'apr-vs-apy', isCorrect: true }))
      });
    expect(oversized.status).toBe(400);
    expect(userId).toBeTruthy();
  });

  it('does not auto-complete premium lessons from mastery for free users', async () => {
    const { app, userId, accessToken } = await buildAuthedApp();

    const premiumLesson = listCurriculum(true).find((lesson) => {
      const uniqueSkills = new Set(lesson.items.map((item) => item.skillId)).size;
      return lesson.premium && uniqueSkills * 6 <= 100;
    });
    expect(premiumLesson).toBeTruthy();
    const premiumSkillIds = [...new Set(premiumLesson!.items.map((item) => item.skillId))];

    // Drive every skill in the premium lesson above the 0.8 mastery threshold via
    // self-reported practice (six correct answers each: 0.2 -> 0.8).
    const masteryResults = premiumSkillIds.flatMap((skillId) =>
      Array.from({ length: 6 }, () => ({ skillId, isCorrect: true }))
    );
    const grind = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ itemResults: masteryResults });
    expect(grind.status).toBe(200);

    // A subsequent session triggers the mastery-based completion sweep.
    const freeSkillId = listCurriculum(false)[0].items[0].skillId;
    const trigger = await request(app)
      .post('/api/sessions/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ itemResults: [{ skillId: freeSkillId, isCorrect: true }] });
    expect(trigger.status).toBe(200);

    const path = await request(app)
      .get(`/api/learn/path/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    const premiumEntry = (path.body.lessons as Array<{ lessonId: string; completed: boolean; locked: boolean }>)
      .find((lesson) => lesson.lessonId === premiumLesson!.lessonId);

    expect(premiumEntry?.locked).toBe(true);
    expect(premiumEntry?.completed).toBe(false);
  });
});
