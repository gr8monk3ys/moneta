import type express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors.js';
import { metricsContentType, metricsSnapshot } from '../metrics.js';
import type { RouteDeps } from './types.js';

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

  app.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
    if (deps.metricsToken) {
      const authorization = req.header('authorization');
      if (authorization !== `Bearer ${deps.metricsToken}`) {
        next(new ApiError(401, 'Unauthorized metrics access'));
        return;
      }
    }

    res.setHeader('content-type', metricsContentType());
    res.status(200).send(await metricsSnapshot());
  });
}
