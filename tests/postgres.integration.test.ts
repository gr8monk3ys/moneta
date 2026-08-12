import path from 'node:path';
import { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createWebhookSignature } from '../src/billing.verification.js';
import { createApp } from '../src/app.js';
import { MigrationRunner } from '../src/migrations.js';
import { PostgresUserRepository } from '../src/repository.postgres.js';

const databaseUrl = process.env.DATABASE_URL;
const runIntegration = Boolean(databaseUrl);
const webhookSecret = 'dev-billing-webhook-secret';

describe.skipIf(!runIntegration)('Postgres integration', () => {
  const pool = new Pool({ connectionString: databaseUrl });
  const repository = new PostgresUserRepository(pool);
  const app = createApp({
    repository,
    jwtSecret: 'test-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    jwtAccessTtlSeconds: 3600,
    jwtRefreshTtlSeconds: 604800,
    allowedOrigins: ['http://localhost:5173'],
    trustProxy: false
  });

  beforeAll(async () => {
    const runner = new MigrationRunner(pool, path.resolve(process.cwd(), 'migrations'));
    await runner.run();
  });

  afterAll(async () => {
    await pool.query('DELETE FROM billing_webhook_events');
    await pool.query('DELETE FROM refresh_tokens');
    await pool.query('DELETE FROM user_profiles');
    await pool.query('DELETE FROM auth_users');
    await pool.end();
  });

  it('persists auth and profile flows in postgres', async () => {
    const register = await request(app).post('/api/auth/register').send({
      email: 'pg-user@example.com',
      password: 'password123'
    });

    expect(register.status).toBe(201);
    const userId = register.body.userId as string;
    expect(userId).toBeTruthy();

    const login = await request(app).post('/api/auth/login').send({
      email: 'pg-user@example.com',
      password: 'password123'
    });

    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeTruthy();

    const placement = await request(app)
      .post('/api/onboarding/placement')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`)
      .send({ correctAnswers: 8, totalQuestions: 10 });

    expect(placement.status).toBe(200);

    const progress = await request(app)
      .get(`/api/progress/${userId}`)
      .set('Authorization', `Bearer ${login.body.accessToken as string}`);

    expect(progress.status).toBe(200);
    expect(progress.body.currentLevel).toBe('F4');
  });

  it('deletes account lifecycle data in postgres', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'pg-delete-user@example.com',
      password: 'password123'
    });

    const login = await request(app).post('/api/auth/login').send({
      email: 'pg-delete-user@example.com',
      password: 'password123'
    });

    const exported = await request(app)
      .get('/api/auth/account/export')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`);
    expect(exported.status).toBe(200);

    const deleted = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`)
      .send({ confirmation: 'DELETE_ACCOUNT' });
    expect(deleted.status).toBe(200);

    const relogin = await request(app).post('/api/auth/login').send({
      email: 'pg-delete-user@example.com',
      password: 'password123'
    });
    expect(relogin.status).toBe(401);
  });

  it('enforces user-resource isolation in postgres mode', async () => {
    await request(app).post('/api/auth/register').send({
      userId: 'pg-user-a',
      email: 'pg-user-a@example.com',
      password: 'password123'
    });

    await request(app).post('/api/auth/register').send({
      userId: 'pg-user-b',
      email: 'pg-user-b@example.com',
      password: 'password123'
    });

    const loginA = await request(app).post('/api/auth/login').send({
      email: 'pg-user-a@example.com',
      password: 'password123'
    });

    const forbidden = await request(app)
      .get('/api/progress/pg-user-b')
      .set('Authorization', `Bearer ${loginA.body.accessToken as string}`);

    expect(forbidden.status).toBe(403);
  });

  it('persists billing entitlement sync outcomes in postgres mode', async () => {
    // The id must come from the response. /api/auth/register generates it
    // with crypto.randomUUID() and ignores any client-supplied userId — a
    // client that could choose its own id could impersonate an existing
    // account. Passing `userId: 'pg-billing-user'` here therefore did NOT
    // name the created user, so the request below carried a token whose
    // `sub` was some random UUID while the path said 'pg-billing-user', and
    // ensureSelfAccess correctly answered 403.
    const register = await request(app).post('/api/auth/register').send({
      email: 'pg-billing-user@example.com',
      password: 'password123'
    });

    expect(register.status).toBe(201);
    const userId = register.body.userId as string;
    expect(userId).toBeTruthy();

    const login = await request(app).post('/api/auth/login').send({
      email: 'pg-billing-user@example.com',
      password: 'password123'
    });

    const sync = await request(app)
      .post('/api/billing/entitlements/sync')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`)
      .send({
        platform: 'ios',
        productId: 'moneta.pro.monthly',
        purchaseToken: 'sandbox-pg-webhook-12345'
      });

    expect(sync.status).toBe(200);

    const entitlements = await request(app)
      .get(`/api/billing/entitlements/${userId}`)
      .set('Authorization', `Bearer ${login.body.accessToken as string}`);

    expect(entitlements.status).toBe(200);
    expect(entitlements.body.entitlement.plan).toBe('pro');
  });

  it('handles webhook replay idempotency and persists only one processed event', async () => {
    // Same as above: take the generated id. The webhook names its subject by
    // userId, and 'pg-webhook-user' was never a real user, so
    // findUserOrThrow answered 404 before idempotency was ever exercised.
    const register = await request(app).post('/api/auth/register').send({
      email: 'pg-webhook-user@example.com',
      password: 'password123'
    });

    expect(register.status).toBe(201);
    const userId = register.body.userId as string;
    expect(userId).toBeTruthy();

    const payload = {
      eventId: 'pg-webhook-event-1',
      userId,
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      isActive: true,
      currentPeriodEndsAt: new Date(Date.now() + 86_400_000).toISOString()
    };

    const rawBody = Buffer.from(JSON.stringify(payload));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createWebhookSignature(webhookSecret, rawBody, timestamp);

    const first = await request(app)
      .post('/api/billing/webhooks/reconcile')
      .set('Content-Type', 'application/json')
      .set('x-billing-signature', signature)
      .set('x-billing-timestamp', timestamp)
      .send(rawBody.toString());

    expect(first.status).toBe(200);
    expect(first.body.duplicate).toBe(false);
    expect(first.body.processed).toBe(true);

    const replay = await request(app)
      .post('/api/billing/webhooks/reconcile')
      .set('Content-Type', 'application/json')
      .set('x-billing-signature', signature)
      .set('x-billing-timestamp', timestamp)
      .send(rawBody.toString());

    expect(replay.status).toBe(200);
    expect(replay.body.duplicate).toBe(true);
    expect(replay.body.processed).toBe(false);

    const count = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM billing_webhook_events WHERE event_id = $1', [
      payload.eventId
    ]);
    expect(Number(count.rows[0].count)).toBe(1);
  });
});
