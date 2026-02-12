import path from 'node:path';
import { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { MigrationRunner } from '../src/migrations.js';
import { PostgresUserRepository } from '../src/repository.postgres.js';

const databaseUrl = process.env.DATABASE_URL;
const runIntegration = Boolean(databaseUrl);

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
    await pool.query('DELETE FROM refresh_tokens');
    await pool.query('DELETE FROM user_profiles');
    await pool.query('DELETE FROM auth_users');
    await pool.end();
  });

  it('persists auth and profile flows in postgres', async () => {
    const register = await request(app).post('/api/auth/register').send({
      userId: 'pg-user',
      email: 'pg-user@example.com',
      password: 'password123'
    });

    expect(register.status).toBe(201);

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
      .get('/api/progress/pg-user')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`);

    expect(progress.status).toBe(200);
    expect(progress.body.currentLevel).toBe('F4');
  });
});
