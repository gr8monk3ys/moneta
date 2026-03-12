import { spawn, type ChildProcessByStdio } from 'node:child_process';
import type { Readable } from 'node:stream';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createWebhookSignature } from '../src/billing.verification.js';

const baseUrl = 'http://127.0.0.1:3310';
const webhookSecret = 'test-e2e-webhook-secret';
let serverProcess: ChildProcessByStdio<null, Readable, Readable> | undefined;
let startupError = '';

async function waitForServerReady(timeoutMs: number): Promise<void> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // continue polling until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error('Timed out waiting for server to become ready');
}

async function stopServer(): Promise<void> {
  if (!serverProcess || serverProcess.killed || serverProcess.exitCode !== null) {
    return;
  }

  await new Promise<void>((resolve) => {
    serverProcess?.once('exit', () => resolve());
    serverProcess?.kill('SIGTERM');

    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }, 5000);
  });
}

async function postJson<T>(path: string, payload: unknown, token?: string): Promise<{ status: number; body: T }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });

  return {
    status: response.status,
    body: await response.json() as T
  };
}

describe('API end-to-end smoke', () => {
  beforeAll(async () => {
    serverProcess = spawn('node', ['dist/src/server.js'], {
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PORT: '3310',
        BILLING_WEBHOOK_SECRET: webhookSecret
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stderrBuffer = '';
    serverProcess?.stderr.on('data', (chunk: Buffer) => {
      stderrBuffer += chunk.toString();
    });

    serverProcess?.once('exit', (code) => {
      if (code !== 0) {
        startupError = `E2E server exited unexpectedly with code ${String(code)}: ${stderrBuffer}`;
      }
    });

    await waitForServerReady(15000).catch((error: unknown) => {
      const base = error instanceof Error ? error.message : 'unknown error';
      throw new Error(startupError ? `${base}; ${startupError}` : base);
    });
  }, 20000);

  afterAll(async () => {
    await stopServer();
  }, 20000);

  it('completes auth, learning, and readiness smoke flow over HTTP', async () => {
    const register = await postJson<{ userId: string }>('/api/auth/register', {
      email: 'e2e@example.com',
      password: 'password123'
    });
    expect(register.status).toBe(201);
    const userId = register.body.userId;

    const login = await postJson<{ accessToken: string; refreshToken: string }>('/api/auth/login', {
      email: 'e2e@example.com',
      password: 'password123'
    });

    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeTruthy();
    expect(login.body.refreshToken).toBeTruthy();

    const today = await fetch(`${baseUrl}/api/learn/today/${userId}`, {
      headers: { Authorization: `Bearer ${login.body.accessToken}` }
    });
    expect(today.status).toBe(200);

    const progress = await fetch(`${baseUrl}/api/progress/${userId}`, {
      headers: { Authorization: `Bearer ${login.body.accessToken}` }
    });
    expect(progress.status).toBe(200);

    const ready = await fetch(`${baseUrl}/ready`);
    expect(ready.status).toBe(200);
  });

  it('enforces refresh token rotation in live HTTP flow', async () => {
    await postJson('/api/auth/register', {
      email: 'e2e-refresh@example.com',
      password: 'password123'
    });

    const login = await postJson<{ refreshToken: string }>('/api/auth/login', {
      email: 'e2e-refresh@example.com',
      password: 'password123'
    });

    const refreshOne = await postJson<{ refreshToken: string }>('/api/auth/refresh', {
      refreshToken: login.body.refreshToken
    });

    expect(refreshOne.status).toBe(200);
    expect(refreshOne.body.refreshToken).toBeTruthy();

    const refreshReuse = await postJson<{ error: string }>('/api/auth/refresh', {
      refreshToken: login.body.refreshToken
    });

    expect(refreshReuse.status).toBe(401);
    expect(refreshReuse.body.error).toContain('refresh token');
  });

  it('processes billing webhook reconciliation with signature and idempotency', async () => {
    const register = await postJson<{ userId: string }>('/api/auth/register', {
      email: 'e2e-billing@example.com',
      password: 'password123'
    });
    expect(register.status).toBe(201);
    const userId = register.body.userId;

    const payload = {
      eventId: 'e2e-webhook-event-1',
      userId,
      platform: 'ios',
      productId: 'moneta.pro.monthly',
      isActive: true,
      currentPeriodEndsAt: new Date(Date.now() + 86_400_000).toISOString()
    };

    const rawBody = Buffer.from(JSON.stringify(payload));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createWebhookSignature(webhookSecret, rawBody, timestamp);

    const first = await fetch(`${baseUrl}/api/billing/webhooks/reconcile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-billing-signature': signature,
        'x-billing-timestamp': timestamp
      },
      body: rawBody
    });

    expect(first.status).toBe(200);
    const firstBody = await first.json() as { processed: boolean; duplicate: boolean };
    expect(firstBody.processed).toBe(true);
    expect(firstBody.duplicate).toBe(false);

    const duplicate = await fetch(`${baseUrl}/api/billing/webhooks/reconcile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-billing-signature': signature,
        'x-billing-timestamp': timestamp
      },
      body: rawBody
    });

    expect(duplicate.status).toBe(200);
    const duplicateBody = await duplicate.json() as { processed: boolean; duplicate: boolean };
    expect(duplicateBody.processed).toBe(false);
    expect(duplicateBody.duplicate).toBe(true);
  });
});
