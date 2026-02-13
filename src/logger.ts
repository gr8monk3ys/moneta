import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export interface RequestLoggerRequest extends Request {
  requestId?: string;
  rawBody?: Buffer;
}

interface LogContext {
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  message: string;
  [key: string]: unknown;
}

export function logInfo(context: LogContext): void {
  console.log(JSON.stringify({ level: 'info', ts: new Date().toISOString(), ...context }));
}

export function logError(context: LogContext): void {
  console.error(JSON.stringify({ level: 'error', ts: new Date().toISOString(), ...context }));
}

export function requestLogger() {
  return (req: RequestLoggerRequest, res: Response, next: NextFunction): void => {
    const start = process.hrtime.bigint();
    const requestId = req.header('x-request-id') ?? crypto.randomUUID();

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      logInfo({
        message: 'request_completed',
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100
      });
    });

    next();
  };
}
