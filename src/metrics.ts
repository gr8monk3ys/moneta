import type { NextFunction, Request, Response } from 'express';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

const registry = new Registry();
collectDefaultMetrics({ register: registry });

const httpRequestDuration = new Histogram({
  name: 'moneta_http_request_duration_ms',
  help: 'HTTP request duration in ms',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [10, 25, 50, 100, 200, 500, 1000, 2500],
  registers: [registry]
});

const httpRequestsTotal = new Counter({
  name: 'moneta_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [registry]
});

export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      // Avoid high-cardinality labels: fall back to a stable value for unmatched requests.
      const route = req.route?.path ? String(req.route.path) : 'unmatched';
      const statusCode = String(res.statusCode);

      httpRequestDuration
        .labels(req.method, route, statusCode)
        .observe(elapsedMs);

      httpRequestsTotal
        .labels(req.method, route, statusCode)
        .inc();
    });

    next();
  };
}

export async function metricsSnapshot(): Promise<string> {
  return registry.metrics();
}

export function metricsContentType(): string {
  return registry.contentType;
}
