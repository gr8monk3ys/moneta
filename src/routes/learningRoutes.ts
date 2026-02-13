import type express from 'express';
import type { NextFunction } from 'express';
import { z } from 'zod';
import { authenticateJwt, type AuthenticatedRequest } from '../auth.js';
import { normalizeEntitlement, resolveFeatureAccess } from '../billing.js';
import { lessons } from '../data.js';
import { applyItemResult, isValidTimeZone, markSessionActivity, placeUser } from '../engine.js';
import { ApiError } from '../errors.js';
import type { ReviewItem, UserProfile } from '../types.js';
import type { RouteDeps } from './types.js';

const placementSchema = z.object({
  correctAnswers: z.number().int().min(0),
  totalQuestions: z.number().int().min(1)
});

const sessionSchema = z.object({
  itemResults: z.array(
    z.object({
      skillId: z.string().min(1),
      isCorrect: z.boolean()
    })
  ),
  timeZone: z.string().min(1).optional()
});

const paramsSchema = z.object({ userId: z.string().min(1) });

function validateParams(rawParams: unknown): z.infer<typeof paramsSchema> {
  const parsed = paramsSchema.safeParse(rawParams);
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

function getProgressSummary(user: UserProfile) {
  const skillStates = Object.values(user.skills);
  const masteredSkills = skillStates.filter((skill) => skill.mastery >= 0.8).length;
  const entitlement = normalizeEntitlement(user.entitlement);
  const features = resolveFeatureAccess(entitlement);

  return {
    userId: user.userId,
    currentLevel: user.currentLevel,
    streakDays: user.streakDays,
    masteredSkills,
    totalSkills: skillStates.length,
    plan: entitlement.plan,
    premiumActive: features.unlimitedReviews
  };
}

function toDueReviews(user: UserProfile): { dueReviews: ReviewItem[]; entitlement: UserProfile['entitlement']; features: ReturnType<typeof resolveFeatureAccess> } {
  const nowMs = Date.now();
  const entitlement = normalizeEntitlement(user.entitlement);
  const features = resolveFeatureAccess(entitlement);

  const dueReviews = Object.values(user.skills)
    .filter((skill) => {
      if (!skill.nextReviewAt) {
        return false;
      }

      return new Date(skill.nextReviewAt).getTime() <= nowMs;
    })
    .sort((a, b) => {
      const aMs = new Date(String(a.nextReviewAt)).getTime();
      const bMs = new Date(String(b.nextReviewAt)).getTime();
      return aMs - bMs;
    })
    .map((skill) => ({
      itemId: `${skill.skillId}-due`,
      skillId: skill.skillId,
      dueDate: String(skill.nextReviewAt)
    }));

  const limitedReviews = typeof features.maxDueReviews === 'number'
    ? dueReviews.slice(0, features.maxDueReviews)
    : dueReviews;

  return { dueReviews: limitedReviews, entitlement, features };
}

function resolveTimeZone(...candidates: Array<string | undefined>): string {
  for (const candidate of candidates) {
    if (candidate && isValidTimeZone(candidate)) {
      return candidate;
    }
  }

  return 'UTC';
}

export function registerLearningRoutes(app: express.Express, deps: RouteDeps): void {
  app.post('/api/onboarding/placement', authenticateJwt(deps.jwtSecret), (req: AuthenticatedRequest, res, next: NextFunction) => {
    Promise.resolve().then(async () => {
      const parsed = placementSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'Invalid placement payload', parsed.error.flatten());
      }

      const userId = String(req.auth?.sub ?? '');
      const user = await findUserOrThrow(deps, userId);
      user.currentLevel = placeUser(parsed.data.correctAnswers, parsed.data.totalQuestions);
      await deps.repository.upsertUserProfile(user);
      res.status(200).json({ userId, level: user.currentLevel });
    }).catch(next);
  });

  app.get('/api/learn/today/:userId', authenticateJwt(deps.jwtSecret), (req: AuthenticatedRequest, res, next: NextFunction) => {
    Promise.resolve().then(async () => {
      const { userId } = validateParams(req.params);
      ensureSelfAccess(req, userId);
      const user = await findUserOrThrow(deps, userId);
      const today = toDueReviews(user);
      const nextLesson = lessons.find((lesson) => lesson.level === user.currentLevel) ?? lessons[0];
      res.status(200).json({
        userId,
        dueReviews: today.dueReviews,
        nextLesson,
        entitlement: today.entitlement,
        features: today.features
      });
    }).catch(next);
  });

  app.get('/api/progress/:userId', authenticateJwt(deps.jwtSecret), (req: AuthenticatedRequest, res, next: NextFunction) => {
    Promise.resolve().then(async () => {
      const { userId } = validateParams(req.params);
      ensureSelfAccess(req, userId);
      const user = await findUserOrThrow(deps, userId);
      res.status(200).json(getProgressSummary(user));
    }).catch(next);
  });

  app.post('/api/sessions/complete', authenticateJwt(deps.jwtSecret), (req: AuthenticatedRequest, res, next: NextFunction) => {
    Promise.resolve().then(async () => {
      const parsed = sessionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'Invalid session payload', parsed.error.flatten());
      }

      const userId = String(req.auth?.sub ?? '');
      const user = await findUserOrThrow(deps, userId);
      const scheduledReviews = parsed.data.itemResults.map((item) => applyItemResult(user, item.skillId, item.isCorrect));
      const streakDays = markSessionActivity(user, {
        timeZone: resolveTimeZone(parsed.data.timeZone, req.header('x-user-timezone'))
      });
      await deps.repository.upsertUserProfile(user);

      res.status(200).json({ userId, streakDays, scheduledReviews, skills: user.skills });
    }).catch(next);
  });
}
