import type express from 'express';
import type { NextFunction } from 'express';
import { z } from 'zod';
import { authenticateJwt, type AuthenticatedRequest } from '../auth.js';
import { getNextLessonForLevel, getNextLessonForProgress } from '../data.js';
import { ApiError } from '../errors.js';
import {
  applySessionResults,
  buildPathLessons,
  canAccessLesson,
  evaluateLessonCompletion,
  getProgressSummary,
  markSessionStreak,
  resolveDueReviews,
  resolvePlacementLevel,
  syncMasteryCompletions,
  toLessonDetails,
  toLessonOutline
} from '../services/learningService.js';
import type { UserProfile } from '../types.js';
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
  lessonId: z.string().min(1).optional(),
  timeZone: z.string().min(1).optional()
});

const paramsSchema = z.object({ userId: z.string().min(1) });
const lessonParamsSchema = z.object({ lessonId: z.string().min(1) });

function validateParams(rawParams: unknown): z.infer<typeof paramsSchema> {
  const parsed = paramsSchema.safeParse(rawParams);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid route parameters', parsed.error.flatten());
  }

  return parsed.data;
}

function validateLessonParams(rawParams: unknown): z.infer<typeof lessonParamsSchema> {
  const parsed = lessonParamsSchema.safeParse(rawParams);
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

export function registerLearningRoutes(app: express.Express, deps: RouteDeps): void {
  app.post('/api/onboarding/placement', authenticateJwt(deps.jwtSecret), (req: AuthenticatedRequest, res, next: NextFunction) => {
    Promise.resolve().then(async () => {
      const parsed = placementSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'Invalid placement payload', parsed.error.flatten());
      }

      const userId = String(req.auth?.sub ?? '');
      const user = await findUserOrThrow(deps, userId);
      user.currentLevel = resolvePlacementLevel(parsed.data.correctAnswers, parsed.data.totalQuestions);
      await deps.repository.upsertUserProfile(user);

      res.status(200).json({ userId, level: user.currentLevel });
    }).catch(next);
  });

  app.get('/api/learn/today/:userId', authenticateJwt(deps.jwtSecret), (req: AuthenticatedRequest, res, next: NextFunction) => {
    Promise.resolve().then(async () => {
      const { userId } = validateParams(req.params);
      ensureSelfAccess(req, userId);

      const user = await findUserOrThrow(deps, userId);
      const today = resolveDueReviews(user);
      const nextLesson = getNextLessonForProgress(user, today.features.advancedTracks)
        ?? getNextLessonForLevel(user.currentLevel, today.features.advancedTracks);

      res.status(200).json({
        userId,
        dueReviews: today.dueReviews,
        nextLesson: nextLesson ? toLessonOutline(nextLesson) : undefined,
        entitlement: today.entitlement,
        features: today.features
      });
    }).catch(next);
  });

  app.get('/api/learn/path/:userId', authenticateJwt(deps.jwtSecret), (req: AuthenticatedRequest, res, next: NextFunction) => {
    Promise.resolve().then(async () => {
      const { userId } = validateParams(req.params);
      ensureSelfAccess(req, userId);

      const user = await findUserOrThrow(deps, userId);
      const path = buildPathLessons(user);

      res.status(200).json({
        userId,
        entitlement: path.entitlement,
        features: path.features,
        lessons: path.lessons
      });
    }).catch(next);
  });

  app.get('/api/learn/lessons/:lessonId', authenticateJwt(deps.jwtSecret), (req: AuthenticatedRequest, res, next: NextFunction) => {
    Promise.resolve().then(async () => {
      const { lessonId } = validateLessonParams(req.params);
      const userId = String(req.auth?.sub ?? '');
      const user = await findUserOrThrow(deps, userId);
      const access = canAccessLesson(user, lessonId);

      res.status(200).json({
        userId: access.userId,
        lesson: toLessonDetails(access.lesson)
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
      const scheduledReviews = applySessionResults(user, parsed.data.itemResults);
      const nowIso = new Date().toISOString();

      syncMasteryCompletions(user, nowIso);
      const lessonProgress = parsed.data.lessonId
        ? evaluateLessonCompletion(user, parsed.data.lessonId, parsed.data.itemResults, nowIso)
        : undefined;

      const streakDays = markSessionStreak(user, parsed.data.timeZone, req.header('x-user-timezone'));
      await deps.repository.upsertUserProfile(user);

      res.status(200).json({ userId, streakDays, scheduledReviews, skills: user.skills, lessonProgress });
    }).catch(next);
  });
}
