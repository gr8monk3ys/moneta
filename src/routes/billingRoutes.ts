import type express from 'express';
import type { NextFunction } from 'express';
import { z } from 'zod';
import { authenticateJwt, type AuthenticatedRequest } from '../auth.js';
import { applyEntitlementSync, normalizeEntitlement, resolveFeatureAccess } from '../billing.js';
import { ApiError } from '../errors.js';
import type { UserProfile } from '../types.js';
import type { RouteDeps } from './types.js';

const paramsSchema = z.object({ userId: z.string().min(1) });

const syncSchema = z.object({
  platform: z.enum(['ios', 'android', 'web']),
  productId: z.string().min(1).max(120),
  purchaseToken: z.string().min(10),
  isActive: z.boolean(),
  currentPeriodEndsAt: z.string().min(10).optional()
});

function validateParams(raw: unknown): z.infer<typeof paramsSchema> {
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid route parameters', parsed.error.flatten());
  }
  return parsed.data;
}

function ensureSelfAccess(req: AuthenticatedRequest, userId: string): void {
  if (req.auth?.sub !== userId) {
    throw new ApiError(403, 'Forbidden');
  }
}

async function findUserOrThrow(deps: RouteDeps, userId: string): Promise<UserProfile> {
  const user = await deps.repository.getUserProfile(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
}

function buildEntitlementResponse(userId: string, profile: UserProfile) {
  const entitlement = normalizeEntitlement(profile.entitlement);
  const features = resolveFeatureAccess(entitlement);

  return { userId, entitlement, features };
}

export function registerBillingRoutes(app: express.Express, deps: RouteDeps): void {
  app.get('/api/billing/entitlements/:userId', authenticateJwt(deps.jwtSecret), (req: AuthenticatedRequest, res, next: NextFunction) => {
    Promise.resolve().then(async () => {
      const { userId } = validateParams(req.params);
      ensureSelfAccess(req, userId);
      const user = await findUserOrThrow(deps, userId);
      res.status(200).json(buildEntitlementResponse(userId, user));
    }).catch(next);
  });

  app.post('/api/billing/entitlements/sync', authenticateJwt(deps.jwtSecret), (req: AuthenticatedRequest, res, next: NextFunction) => {
    Promise.resolve().then(async () => {
      const parsed = syncSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'Invalid entitlement sync payload', parsed.error.flatten());
      }

      const userId = String(req.auth?.sub ?? '');
      const user = await findUserOrThrow(deps, userId);
      const now = new Date();
      const currentPeriodEndsAt = parsed.data.currentPeriodEndsAt
        ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      if (!Number.isFinite(new Date(currentPeriodEndsAt).getTime())) {
        throw new ApiError(400, 'Invalid currentPeriodEndsAt value');
      }

      applyEntitlementSync(user, {
        source: parsed.data.platform,
        productId: parsed.data.productId,
        isActive: parsed.data.isActive,
        currentPeriodEndsAt
      }, now);

      await deps.repository.upsertUserProfile(user);
      res.status(200).json(buildEntitlementResponse(userId, user));
    }).catch(next);
  });
}
