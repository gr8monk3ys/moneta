import path from 'node:path';
import express from 'express';
import { Pool } from 'pg';
import type { Store } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createClient, type RedisClientType } from 'redis';
import { createApp } from './app.js';
import { createBillingVerifier } from './billing.verification.js';
import { createEmailService } from './email.js';
import { logError, logInfo } from './logger.js';
import { MigrationRunner } from './migrations.js';
import { InMemoryUserRepository } from './repository.memory.js';
import { PostgresUserRepository } from './repository.postgres.js';
import type { UserRepository } from './repository.js';
import { resolveProtectedToken, resolveRequiredSecret } from './security.js';

export interface BootstrappedApp {
  app: express.Express;
  repository: UserRepository;
  refreshTokenPruneIntervalSeconds: number;
  close: () => Promise<void>;
}

export function parseIntOrDefault(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function parseAllowedOrigins(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

interface RepositoryResources {
  repository: UserRepository;
  close: () => Promise<void>;
}

interface RateLimitResources {
  authLimiterStore?: Store;
  apiLimiterStore?: Store;
  close: () => Promise<void>;
}

async function createRepository(nodeEnv: string): Promise<RepositoryResources> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    if (nodeEnv === 'production') {
      throw new Error('DATABASE_URL must be set in production');
    }

    logInfo({ message: 'Using in-memory repository mode for local development' });
    return {
      repository: new InMemoryUserRepository(),
      close: async () => undefined
    };
  }

  // Migrations need a session-stable connection: the runner's advisory lock
  // and transactions break behind a transaction-pooling proxy (e.g. Neon's
  // -pooler host). Use the direct URL for the migration pass when the
  // platform provides one; request traffic stays on the pooled URL.
  const migrationUrl = process.env.DATABASE_URL_UNPOOLED ?? databaseUrl;
  const migrationPool = new Pool({ connectionString: migrationUrl, max: 1 });
  try {
    const migrationRunner = new MigrationRunner(migrationPool, path.resolve(process.cwd(), 'migrations'));
    await migrationRunner.run();
  } finally {
    await migrationPool.end();
  }

  const pool = new Pool({ connectionString: databaseUrl });

  return {
    repository: new PostgresUserRepository(pool),
    close: async () => {
      await pool.end();
    }
  };
}

async function createRateLimitResources(nodeEnv: string): Promise<RateLimitResources> {
  const redisUrl = process.env.RATE_LIMIT_REDIS_URL;
  if (!redisUrl) {
    if (nodeEnv === 'production') {
      logInfo({
        message: 'RATE_LIMIT_REDIS_URL is not set; falling back to process-local memory rate limiting'
      });
    }

    return {
      close: async () => undefined
    };
  }

  const client: RedisClientType = createClient({ url: redisUrl });
  client.on('error', (error: unknown) => {
    logError({
      message: 'Redis rate limiter client error',
      error: error instanceof Error ? error.message : 'unknown'
    });
  });
  await client.connect();

  const createStore = (): Store => new RedisStore({
    sendCommand: (...args: string[]) => client.sendCommand(args)
  });

  return {
    authLimiterStore: createStore(),
    apiLimiterStore: createStore(),
    close: async () => {
      await client.quit();
    }
  };
}

// Builds the fully configured app from process.env. Shared by the long-lived
// server (src/server.ts) and the serverless entrypoint (api/index.ts); the
// caller owns listening, pruning cadence, and shutdown.
export async function bootstrapFromEnv(): Promise<BootstrappedApp> {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const jwtSecret = resolveRequiredSecret({
    nodeEnv,
    configured: process.env.JWT_SECRET,
    envName: 'JWT_SECRET',
    minLength: 32,
    devFallback: 'dev-secret-change-me'
  });
  const jwtRefreshSecret = resolveRequiredSecret({
    nodeEnv,
    configured: process.env.JWT_REFRESH_SECRET,
    envName: 'JWT_REFRESH_SECRET',
    minLength: 32,
    devFallback: 'dev-secret-change-me'
  });

  if (nodeEnv === 'production' && jwtSecret === jwtRefreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different values in production');
  }

  const jwtAccessTtlSeconds = parseIntOrDefault(process.env.JWT_ACCESS_TTL_SECONDS, 3600);
  const jwtRefreshTtlSeconds = parseIntOrDefault(process.env.JWT_REFRESH_TTL_SECONDS, 604800);
  const refreshTokenPruneIntervalSeconds = parseIntOrDefault(process.env.REFRESH_TOKEN_PRUNE_INTERVAL_SECONDS, 300);
  const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGINS);
  const metricsToken = resolveProtectedToken({
    nodeEnv,
    configured: process.env.METRICS_TOKEN,
    envName: 'METRICS_TOKEN',
    minLength: 24
  });
  const trustProxy = parseBoolean(process.env.TRUST_PROXY, nodeEnv === 'production');
  const emailService = createEmailService({ nodeEnv });
  const billingVerifier = createBillingVerifier({
    nodeEnv,
    allowSandboxTokens: parseBoolean(process.env.BILLING_ALLOW_SANDBOX_PURCHASES, nodeEnv !== 'production'),
    subscriptionsDisabled: process.env.SUBSCRIPTIONS?.trim().toLowerCase() === 'disabled',
    webhookSecret: process.env.BILLING_WEBHOOK_SECRET,
    appleSharedSecret: process.env.APPLE_SHARED_SECRET,
    googlePackageName: process.env.GOOGLE_PLAY_PACKAGE_NAME,
    googleServiceAccountJson: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON,
    timeoutMs: parseIntOrDefault(process.env.BILLING_PROVIDER_TIMEOUT_MS, 8000)
  });

  const repositoryResources = await createRepository(nodeEnv);
  const rateLimitResources = await createRateLimitResources(nodeEnv);

  const app = createApp({
    repository: repositoryResources.repository,
    billingVerifier,
    emailService,
    jwtSecret,
    jwtRefreshSecret,
    jwtAccessTtlSeconds,
    jwtRefreshTtlSeconds,
    allowedOrigins,
    metricsToken,
    trustProxy,
    authLimiterStore: rateLimitResources.authLimiterStore,
    apiLimiterStore: rateLimitResources.apiLimiterStore
  });

  return {
    app,
    repository: repositoryResources.repository,
    refreshTokenPruneIntervalSeconds,
    close: async () => {
      await Promise.all([repositoryResources.close(), rateLimitResources.close()]);
    }
  };
}
