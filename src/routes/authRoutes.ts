import type express from 'express';
import type { Request, Response } from 'express';
import type { RateLimitRequestHandler } from 'express-rate-limit';
import { z } from 'zod';
import { createDefaultEntitlement } from '../billing.js';
import {
  authenticateJwt,
  comparePassword,
  createAccessToken,
  createRefreshToken,
  createSessionId,
  hashPassword,
  hashToken,
  verifyRefreshToken,
  type AuthenticatedRequest
} from '../auth.js';
import { ApiError } from '../errors.js';
import type { RefreshTokenRecord } from '../types.js';
import type { RouteDeps } from './types.js';

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  userId: z.string().min(1)
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  sessionId: z.string().uuid().optional()
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE_ACCOUNT')
});

async function issueTokenPair(deps: RouteDeps, userId: string, email: string, sessionId: string) {
  const accessToken = createAccessToken(userId, email, deps.jwtSecret, deps.jwtAccessTtlSeconds);
  const refresh = createRefreshToken(userId, email, sessionId, deps.jwtRefreshSecret, deps.jwtRefreshTtlSeconds);

  const tokenRecord: RefreshTokenRecord = {
    tokenId: refresh.tokenId,
    userId,
    sessionId,
    tokenHash: hashToken(refresh.token),
    createdAt: refresh.createdAt,
    expiresAt: refresh.expiresAt
  };

  await deps.repository.storeRefreshToken(tokenRecord);
  return { accessToken, refreshToken: refresh.token, sessionId };
}

async function registerHandler(req: Request, res: Response, deps: RouteDeps): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid register payload', parsed.error.flatten());
  }

  const { email, password, userId } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const existing = await deps.repository.getAuthUserByEmail(normalizedEmail);
  if (existing) {
    throw new ApiError(409, 'Email already registered');
  }

  const passwordHash = await hashPassword(password);
  await deps.repository.createAuthUser({ userId, email: normalizedEmail, passwordHash });
  await deps.repository.upsertUserProfile({
    userId,
    currentLevel: 'F1',
    streakDays: 0,
    skills: {},
    entitlement: createDefaultEntitlement()
  });

  res.status(201).json({ userId, email: normalizedEmail });
}

async function loginHandler(req: Request, res: Response, deps: RouteDeps): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid login payload', parsed.error.flatten());
  }

  const { email, password, sessionId } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const user = await deps.repository.getAuthUserByEmail(normalizedEmail);
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  await deps.repository.pruneExpiredRefreshTokens(new Date().toISOString());
  const tokens = await issueTokenPair(deps, user.userId, user.email, sessionId ?? createSessionId());

  res.status(200).json({ ...tokens, userId: user.userId });
}

async function refreshHandler(req: Request, res: Response, deps: RouteDeps): Promise<void> {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid refresh payload', parsed.error.flatten());
  }

  let claims;
  try {
    claims = verifyRefreshToken(parsed.data.refreshToken, deps.jwtRefreshSecret);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const providedHash = hashToken(parsed.data.refreshToken);
  const consumedToken = await deps.repository.consumeRefreshToken({
    tokenId: claims.jti,
    userId: claims.sub,
    sessionId: claims.sid,
    tokenHash: providedHash,
    nowIso: new Date().toISOString()
  });

  if (!consumedToken) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const tokens = await issueTokenPair(deps, claims.sub, claims.email, consumedToken.sessionId);

  res.status(200).json(tokens);
}

async function logoutHandler(req: Request, res: Response, deps: RouteDeps): Promise<void> {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid logout payload', parsed.error.flatten());
  }

  let claims;
  try {
    claims = verifyRefreshToken(parsed.data.refreshToken, deps.jwtRefreshSecret);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  await deps.repository.revokeRefreshTokensBySession(claims.sub, claims.sid);
  res.status(200).json({ success: true });
}

async function logoutAllHandler(req: AuthenticatedRequest, res: Response, deps: RouteDeps): Promise<void> {
  const userId = String(req.auth?.sub ?? '');
  await deps.repository.revokeRefreshTokensByUser(userId);
  res.status(200).json({ success: true });
}

async function exportAccountHandler(req: AuthenticatedRequest, res: Response, deps: RouteDeps): Promise<void> {
  const userId = String(req.auth?.sub ?? '');
  const email = String(req.auth?.email ?? '');

  const [profile, refreshTokens, billingEvents] = await Promise.all([
    deps.repository.getUserProfile(userId),
    deps.repository.listRefreshTokensByUser(userId),
    deps.repository.listBillingWebhookEventsByUser(userId)
  ]);

  if (!profile) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    userId,
    email,
    generatedAt: new Date().toISOString(),
    profile,
    sessions: {
      total: refreshTokens.length,
      active: refreshTokens.filter((token) => !token.revokedAt && new Date(token.expiresAt).getTime() > Date.now()).length,
      refreshTokens
    },
    billing: {
      webhookEventsProcessed: billingEvents.length,
      events: billingEvents
    }
  });
}

async function deleteAccountHandler(req: AuthenticatedRequest, res: Response, deps: RouteDeps): Promise<void> {
  const parsed = deleteAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid delete account payload', parsed.error.flatten());
  }

  const userId = String(req.auth?.sub ?? '');
  const deleted = await deps.repository.deleteUserAccount(userId);

  if (!deleted) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    userId,
    deleted: true,
    deletedAt: new Date().toISOString()
  });
}

export function registerAuthRoutes(app: express.Express, deps: RouteDeps, authLimiter: RateLimitRequestHandler): void {
  app.post('/api/auth/register', authLimiter, (req, res, next) => {
    registerHandler(req, res, deps).catch(next);
  });

  app.post('/api/auth/login', authLimiter, (req, res, next) => {
    loginHandler(req, res, deps).catch(next);
  });

  app.post('/api/auth/refresh', authLimiter, (req, res, next) => {
    refreshHandler(req, res, deps).catch(next);
  });

  app.post('/api/auth/logout', authLimiter, (req, res, next) => {
    logoutHandler(req, res, deps).catch(next);
  });

  app.post('/api/auth/logout-all', authenticateJwt(deps.jwtSecret), (req: AuthenticatedRequest, res, next) => {
    logoutAllHandler(req, res, deps).catch(next);
  });

  app.get('/api/auth/account/export', authenticateJwt(deps.jwtSecret), (req: AuthenticatedRequest, res, next) => {
    exportAccountHandler(req, res, deps).catch(next);
  });

  app.delete('/api/auth/account', authenticateJwt(deps.jwtSecret), (req: AuthenticatedRequest, res, next) => {
    deleteAccountHandler(req, res, deps).catch(next);
  });
}
