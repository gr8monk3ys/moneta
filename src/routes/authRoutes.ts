import crypto from 'node:crypto';
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
import type { PasswordResetTokenRecord } from '../types.js';
import type { RefreshTokenRecord } from '../types.js';
import type { RouteDeps } from './types.js';

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  sessionId: z.string().uuid().optional()
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

const passwordResetRequestSchema = z.object({
  email: z.email()
});

const passwordResetConfirmSchema = z.object({
  email: z.email(),
  code: z.string().min(8).max(8),
  newPassword: z.string().min(8)
});

const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE_ACCOUNT')
});

function generateResetCode(length = 8): string {
  const max = 10 ** length;
  const value = crypto.randomInt(0, max);
  return String(value).padStart(length, '0');
}

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

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const existing = await deps.repository.getAuthUserByEmail(normalizedEmail);
  if (existing) {
    throw new ApiError(409, 'Email already registered');
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await deps.repository.createAuthUser({ userId, email: normalizedEmail, passwordHash });
  await deps.repository.upsertUserProfile({
    userId,
    currentLevel: 'F1',
    streakDays: 0,
    skills: {},
    entitlement: createDefaultEntitlement(),
    completedLessons: {}
  });

  res.status(201).json({ userId, email: normalizedEmail });
}

async function requestPasswordResetHandler(req: Request, res: Response, deps: RouteDeps): Promise<void> {
  const parsed = passwordResetRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid password reset payload', parsed.error.flatten());
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const user = await deps.repository.getAuthUserByEmail(normalizedEmail);

  // Always return success to avoid leaking which emails are registered.
  if (!user) {
    res.status(200).json({ success: true });
    return;
  }

  const nowIso = new Date().toISOString();
  await deps.repository.pruneExpiredPasswordResetTokens(nowIso);
  await deps.repository.deletePasswordResetTokensByUser(user.userId);

  const code = generateResetCode(8);
  const record: PasswordResetTokenRecord = {
    tokenId: crypto.randomUUID(),
    userId: user.userId,
    tokenHash: hashToken(code),
    createdAt: nowIso,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  };

  await deps.repository.storePasswordResetToken(record);
  await deps.emailService.sendPasswordResetCode({ to: user.email, code, expiresAt: record.expiresAt });

  res.status(200).json({ success: true });
}

async function confirmPasswordResetHandler(req: Request, res: Response, deps: RouteDeps): Promise<void> {
  const parsed = passwordResetConfirmSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid password reset payload', parsed.error.flatten());
  }

  const normalizedEmail = parsed.data.email.toLowerCase();

  // Per-account throttle: bound reset-code guessing across IPs without leaking
  // whether the account exists (keyed by email, generic responses throughout).
  const throttleKey = `reset:${normalizedEmail}`;
  const lock = deps.accountThrottle.check(throttleKey);
  if (lock.locked) {
    res.setHeader('Retry-After', String(lock.retryAfterSeconds));
    throw new ApiError(429, 'Too many failed attempts. Please try again later.');
  }

  const user = await deps.repository.getAuthUserByEmail(normalizedEmail);
  if (!user) {
    deps.accountThrottle.recordFailure(throttleKey);
    throw new ApiError(401, 'Invalid or expired password reset code');
  }

  const nowIso = new Date().toISOString();
  await deps.repository.pruneExpiredPasswordResetTokens(nowIso);

  const consumed = await deps.repository.consumePasswordResetToken({
    userId: user.userId,
    tokenHash: hashToken(parsed.data.code.trim()),
    nowIso
  });

  if (!consumed) {
    deps.accountThrottle.recordFailure(throttleKey);
    throw new ApiError(401, 'Invalid or expired password reset code');
  }

  deps.accountThrottle.reset(throttleKey);
  const passwordHash = await hashPassword(parsed.data.newPassword);
  await deps.repository.updateAuthUserPassword(user.userId, passwordHash);
  await deps.repository.revokeRefreshTokensByUser(user.userId);

  res.status(200).json({ success: true });
}

async function loginHandler(req: Request, res: Response, deps: RouteDeps): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid login payload', parsed.error.flatten());
  }

  const { email, password, sessionId } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Per-account throttle: bound credential-stuffing attempts even across many IPs.
  // Keyed regardless of whether the account exists, so it does not leak existence.
  const throttleKey = `login:${normalizedEmail}`;
  const lock = deps.accountThrottle.check(throttleKey);
  if (lock.locked) {
    res.setHeader('Retry-After', String(lock.retryAfterSeconds));
    throw new ApiError(429, 'Too many failed attempts. Please try again later.');
  }

  const user = await deps.repository.getAuthUserByEmail(normalizedEmail);
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    deps.accountThrottle.recordFailure(throttleKey);
    throw new ApiError(401, 'Invalid credentials');
  }

  deps.accountThrottle.reset(throttleKey);
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
    // The signature verified, so this is a well-formed token for a real session.
    // If the exact token exists but is already revoked, it is being replayed after
    // rotation — a strong signal of theft. Revoke the whole session family.
    const existing = await deps.repository.getRefreshToken(claims.jti);
    if (existing && existing.tokenHash === providedHash && existing.revokedAt) {
      await deps.repository.revokeRefreshTokensBySession(claims.sub, claims.sid);
    }
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

  const nowMs = Date.now();
  const sessionTokens = refreshTokens.map((token) => {
    const isActive = !token.revokedAt && new Date(token.expiresAt).getTime() > nowMs;
    return {
      tokenId: token.tokenId,
      sessionId: token.sessionId,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
      isActive
    };
  });

  res.status(200).json({
    userId,
    email,
    generatedAt: new Date().toISOString(),
    profile,
    sessions: {
      total: refreshTokens.length,
      active: sessionTokens.filter((token) => token.isActive).length,
      refreshTokens: sessionTokens
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

  app.post('/api/auth/password/reset/request', authLimiter, (req, res, next) => {
    requestPasswordResetHandler(req, res, deps).catch(next);
  });

  app.post('/api/auth/password/reset/confirm', authLimiter, (req, res, next) => {
    confirmPasswordResetHandler(req, res, deps).catch(next);
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
