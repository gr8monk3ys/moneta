import crypto from 'node:crypto';
import type express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors.js';
import { metricsContentType, metricsSnapshot } from '../metrics.js';
import type { RouteDeps } from './types.js';

function timingSafeStringEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  // Length comparison is not constant-time, but the token length is not the secret;
  // guarding it keeps timingSafeEqual from throwing on unequal-length buffers.
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function registerSystemRoutes(app: express.Express, deps: RouteDeps): void {
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/ready', (_req: Request, res: Response, next: NextFunction) => {
    deps.repository.checkReadiness()
      .then((isReady) => {
        if (!isReady) {
          throw new ApiError(503, 'Service not ready');
        }
        res.status(200).json({ status: 'ready' });
      })
      .catch(next);
  });

  // Cron-driven replacement for the long-lived server's setInterval pruner:
  // serverless instances have no reliable timers, so a scheduler calls this
  // instead. Guarded by the same bearer token as /metrics.
  app.get('/internal/prune-refresh-tokens', (req: Request, res: Response, next: NextFunction) => {
    if (!deps.metricsToken) {
      next(new ApiError(404, 'Not found'));
      return;
    }

    const authorization = req.header('authorization');
    if (!authorization || !timingSafeStringEqual(authorization, `Bearer ${deps.metricsToken}`)) {
      next(new ApiError(401, 'Unauthorized'));
      return;
    }

    deps.repository.pruneExpiredRefreshTokens(new Date().toISOString())
      .then((removed) => {
        res.status(200).json({ removed });
      })
      .catch(next);
  });

  app.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
    if (deps.metricsToken) {
      const authorization = req.header('authorization');
      if (!authorization || !timingSafeStringEqual(authorization, `Bearer ${deps.metricsToken}`)) {
        next(new ApiError(401, 'Unauthorized metrics access'));
        return;
      }
    }

    res.setHeader('content-type', metricsContentType());
    res.status(200).send(await metricsSnapshot());
  });
}
