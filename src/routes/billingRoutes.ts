import crypto from 'node:crypto';
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
  purchaseToken: z.string().min(10)
});

const webhookSchema = z.object({
  eventId: z.string().min(1).max(120),
  userId: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
  productId: z.string().min(1).max(120),
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

function hashPayload(rawBody: Buffer): string {
  return crypto.createHash('sha256').update(rawBody).digest('hex');
}

function resolveRawBody(req: { rawBody?: Buffer; body: unknown }): Buffer {
  const rawBody = req.rawBody;
  if (rawBody && rawBody.length > 0) {
    return rawBody;
  }

  return Buffer.from(JSON.stringify(req.body ?? {}));
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
      const verifiedPurchase = await deps.billingVerifier.verifyPurchase({
        platform: parsed.data.platform,
        productId: parsed.data.productId,
        purchaseToken: parsed.data.purchaseToken,
        now
      });

      applyEntitlementSync(user, {
        source: verifiedPurchase.source,
        productId: verifiedPurchase.productId,
        isActive: verifiedPurchase.isActive,
        currentPeriodEndsAt: verifiedPurchase.currentPeriodEndsAt
      }, now);

      await deps.repository.upsertUserProfile(user);
      res.status(200).json({
        ...buildEntitlementResponse(userId, user),
        verificationReference: verifiedPurchase.verificationReference
      });
    }).catch(next);
  });

  app.post('/api/billing/webhooks/reconcile', (req: AuthenticatedRequest, res, next: NextFunction) => {
    Promise.resolve().then(async () => {
      const rawBody = resolveRawBody(req);
      const signature = req.header('x-billing-signature');
      const signatureTimestamp = req.header('x-billing-timestamp');

      if (!deps.billingVerifier.verifyWebhookSignature(rawBody, signature, signatureTimestamp)) {
        throw new ApiError(401, 'Invalid billing webhook signature');
      }

      const parsed = webhookSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'Invalid billing webhook payload', parsed.error.flatten());
      }

      if (parsed.data.currentPeriodEndsAt && Number.isNaN(Date.parse(parsed.data.currentPeriodEndsAt))) {
        throw new ApiError(400, 'Invalid currentPeriodEndsAt value');
      }

      const alreadyProcessed = await deps.repository.hasProcessedBillingWebhookEvent(parsed.data.eventId);
      if (alreadyProcessed) {
        res.status(200).json({
          eventId: parsed.data.eventId,
          userId: parsed.data.userId,
          duplicate: true,
          processed: false
        });
        return;
      }

      const user = await findUserOrThrow(deps, parsed.data.userId);
      applyEntitlementSync(user, {
        source: parsed.data.platform,
        productId: parsed.data.productId,
        isActive: parsed.data.isActive,
        currentPeriodEndsAt: parsed.data.currentPeriodEndsAt
      });

      await deps.repository.upsertUserProfile(user);
      await deps.repository.markBillingWebhookEventProcessed({
        eventId: parsed.data.eventId,
        userId: parsed.data.userId,
        platform: parsed.data.platform,
        productId: parsed.data.productId,
        payloadHash: hashPayload(rawBody),
        processedAt: new Date().toISOString()
      });

      res.status(200).json({
        eventId: parsed.data.eventId,
        duplicate: false,
        processed: true,
        ...buildEntitlementResponse(parsed.data.userId, user)
      });
    }).catch(next);
  });
}
