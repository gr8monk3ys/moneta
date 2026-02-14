import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from './errors.js';

interface JwtClaims {
  sub: string;
  email: string;
}

export interface RefreshClaims {
  sub: string;
  email: string;
  jti: string;
  sid: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: JwtClaims;
}

function resolveBcryptRounds(): number {
  const fallback = 10;
  const configured = process.env.BCRYPT_SALT_ROUNDS;
  const parsed = configured ? Number(configured) : Number.NaN;
  const rounds = Number.isFinite(parsed) ? Math.floor(parsed) : fallback;

  if (process.env.NODE_ENV === 'production' && rounds < fallback) {
    throw new Error(`BCRYPT_SALT_ROUNDS must be >= ${fallback} in production`);
  }

  if (rounds < 4) {
    return 4;
  }

  return rounds;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, resolveBcryptRounds());
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createAccessToken(
  userId: string,
  email: string,
  secret: string,
  expiresInSeconds: number
): string {
  return jwt.sign({ email }, secret, { subject: userId, expiresIn: expiresInSeconds });
}

export function createRefreshToken(
  userId: string,
  email: string,
  sessionId: string,
  secret: string,
  expiresInSeconds: number
): { token: string; tokenId: string; createdAt: string; expiresAt: string } {
  const tokenId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const token = jwt.sign({ email, sid: sessionId }, secret, {
    subject: userId,
    jwtid: tokenId,
    expiresIn: expiresInSeconds
  });

  return {
    token,
    tokenId,
    createdAt,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString()
  };
}

export function verifyRefreshToken(token: string, secret: string): RefreshClaims {
  const payload = jwt.verify(token, secret) as jwt.JwtPayload;
  return {
    sub: String(payload.sub ?? ''),
    email: String(payload.email ?? ''),
    jti: String(payload.jti ?? ''),
    sid: String(payload.sid ?? '')
  };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createSessionId(): string {
  return crypto.randomUUID();
}

export function authenticateJwt(secret: string) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      next(new ApiError(401, 'Missing bearer token'));
      return;
    }

    const token = header.slice('Bearer '.length);
    try {
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;
      req.auth = {
        sub: String(payload.sub ?? ''),
        email: String(payload.email ?? '')
      };
      next();
    } catch {
      next(new ApiError(401, 'Invalid token'));
    }
  };
}
