import type { NextFunction, Response } from 'express';
import { ApiError } from '../errors.js';
import { logError, type RequestLoggerRequest } from '../logger.js';

export function errorHandler(err: unknown, req: RequestLoggerRequest, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    logError({
      message: err.message,
      requestId: req.requestId,
      path: req.path,
      method: req.method,
      statusCode: err.statusCode
    });
    res.status(err.statusCode).json({ error: err.message, details: err.details });
    return;
  }

  logError({
    message: 'Unhandled error',
    requestId: req.requestId,
    path: req.path,
    method: req.method,
    statusCode: 500,
    error: err instanceof Error ? err.message : 'unknown'
  });
  res.status(500).json({ error: 'Internal server error' });
}
