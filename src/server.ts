import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { Pool } from 'pg';
import type { Store } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createClient, type RedisClientType } from 'redis';
import { createApp } from './app.js';
import { logError, logInfo } from './logger.js';
import { MigrationRunner } from './migrations.js';
import { InMemoryUserRepository } from './repository.memory.js';
import { PostgresUserRepository } from './repository.postgres.js';
import type { UserRepository } from './repository.js';
import { resolveProtectedToken, resolveRequiredSecret } from './security.js';

interface RepositoryResources {
  repository: UserRepository;
  close: () => Promise<void>;
}

interface RateLimitResources {
  authLimiterStore?: Store;
  apiLimiterStore?: Store;
  close: () => Promise<void>;
}

function parseIntOrDefault(value: string | undefined, fallback: number): number {
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

function startRefreshTokenPruner(repository: UserRepository, intervalSeconds: number): NodeJS.Timeout {
  return setInterval(() => {
    repository.pruneExpiredRefreshTokens(new Date().toISOString())
      .then((removed) => {
        if (removed > 0) {
          logInfo({ message: 'Pruned expired refresh tokens', removed });
        }
      })
      .catch((error: unknown) => {
        logError({
          message: 'Failed to prune expired refresh tokens',
          error: error instanceof Error ? error.message : 'unknown'
        });
      });
  }, intervalSeconds * 1000);
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

  const pool = new Pool({ connectionString: databaseUrl });
  const migrationRunner = new MigrationRunner(pool, path.resolve(process.cwd(), 'migrations'));
  await migrationRunner.run();

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

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function main(): Promise<void> {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const port = parseIntOrDefault(process.env.PORT, 3000);
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
  const tokenPruneIntervalSeconds = parseIntOrDefault(process.env.REFRESH_TOKEN_PRUNE_INTERVAL_SECONDS, 300);
  const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGINS);
  const metricsToken = resolveProtectedToken({
    nodeEnv,
    configured: process.env.METRICS_TOKEN,
    envName: 'METRICS_TOKEN',
    minLength: 24
  });
  const trustProxy = parseBoolean(process.env.TRUST_PROXY, nodeEnv === 'production');

  const repositoryResources = await createRepository(nodeEnv);
  const rateLimitResources = await createRateLimitResources(nodeEnv);
  const pruneInterval = startRefreshTokenPruner(repositoryResources.repository, tokenPruneIntervalSeconds);

  const app = createApp({
    repository: repositoryResources.repository,
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

  const server = app.listen(port, () => {
    const address = server.address() as AddressInfo | null;
    logInfo({ message: `Moneta API listening on port ${address?.port ?? port}` });
  });

  let isShuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    logInfo({ message: 'Received shutdown signal', signal });

    clearInterval(pruneInterval);

    const closeOperations = [
      closeServer(server),
      repositoryResources.close(),
      rateLimitResources.close()
    ];

    const settled = await Promise.allSettled(closeOperations);
    const failures = settled.filter((result): result is PromiseRejectedResult => result.status === 'rejected');

    if (failures.length > 0) {
      logError({
        message: 'Shutdown completed with errors',
        errors: failures.map((failure) => String(failure.reason))
      });
      process.exit(1);
      return;
    }

    logInfo({ message: 'Shutdown completed successfully' });
    process.exit(0);
  };

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      shutdown(signal).catch((error: unknown) => {
        logError({
          message: 'Unhandled shutdown error',
          error: error instanceof Error ? error.message : 'unknown'
        });
        process.exit(1);
      });
    });
  }
}

main().catch((error: unknown) => {
  logError({
    message: 'Failed to start Moneta API',
    error: error instanceof Error ? error.message : 'unknown'
  });
  process.exit(1);
});
