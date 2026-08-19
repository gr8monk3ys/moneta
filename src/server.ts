import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { bootstrapFromEnv, parseIntOrDefault } from './bootstrap.js';
import { logError, logInfo } from './logger.js';
import type { UserRepository } from './repository.js';

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
  const port = parseIntOrDefault(process.env.PORT, 3000);
  const { app, repository, refreshTokenPruneIntervalSeconds, close } = await bootstrapFromEnv();
  const pruneInterval = startRefreshTokenPruner(repository, refreshTokenPruneIntervalSeconds);

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

    const settled = await Promise.allSettled([closeServer(server), close()]);
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
