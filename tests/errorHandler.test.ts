import type { NextFunction, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/errors.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import type { RequestLoggerRequest } from '../src/logger.js';

const { logErrorSpy } = vi.hoisted(() => {
  return { logErrorSpy: vi.fn() };
});

vi.mock('../src/logger.js', async () => {
  const actual = await vi.importActual('../src/logger.js');
  return {
    ...actual,
    logError: logErrorSpy
  };
});

describe('errorHandler middleware', () => {
  beforeEach(() => {
    logErrorSpy.mockReset();
  });

  it('returns ApiError details and status code', () => {
    const req = {
      requestId: 'req-1',
      path: '/api/test',
      method: 'GET'
    } as unknown as RequestLoggerRequest;

    const json = vi.fn();
    const res = {
      status: vi.fn().mockReturnValue({ json })
    } as unknown as Response;

    const err = new ApiError(409, 'Conflict', { reason: 'duplicate' });

    errorHandler(err, req, res, vi.fn() as NextFunction);

    expect(logErrorSpy).toHaveBeenCalledWith({
      message: 'Conflict',
      requestId: 'req-1',
      path: '/api/test',
      method: 'GET',
      statusCode: 409
    });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({ error: 'Conflict', details: { reason: 'duplicate' } });
  });

  it('returns generic 500 response for unknown errors', () => {
    const req = {
      requestId: 'req-2',
      path: '/api/test',
      method: 'POST'
    } as unknown as RequestLoggerRequest;

    const json = vi.fn();
    const res = {
      status: vi.fn().mockReturnValue({ json })
    } as unknown as Response;

    errorHandler(new Error('boom'), req, res, vi.fn() as NextFunction);

    expect(logErrorSpy).toHaveBeenCalledWith({
      message: 'Unhandled error',
      requestId: 'req-2',
      path: '/api/test',
      method: 'POST',
      statusCode: 500,
      error: 'boom'
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('logs unknown primitive errors safely', () => {
    const req = {
      requestId: 'req-3',
      path: '/api/test',
      method: 'PATCH'
    } as unknown as RequestLoggerRequest;

    const json = vi.fn();
    const res = {
      status: vi.fn().mockReturnValue({ json })
    } as unknown as Response;

    errorHandler('primitive-error', req, res, vi.fn() as NextFunction);

    expect(logErrorSpy).toHaveBeenCalledWith(expect.objectContaining({ error: 'unknown' }));
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
