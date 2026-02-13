import type express from 'express';
import type { NextFunction } from 'express';
import { z } from 'zod';
import { authenticateJwt, type AuthenticatedRequest } from '../auth.js';
import { normalizeEntitlement, resolveFeatureAccess } from '../billing.js';
import { getLessonById, getNextLessonForLevel, getNextLessonForProgress, isLessonCompleted, listCurriculum } from '../data.js';
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

function getProgressSummary(user: UserProfile) {
  const skillStates = Object.values(user.skills);
  const masteredSkills = skillStates.filter((skill) => skill.mastery >= 0.8).length;
  const entitlement = normalizeEntitlement(user.entitlement);
  const features = resolveFeatureAccess(entitlement);
  const completedLessonCount = Object.keys(user.completedLessons ?? {}).length;
  const totalLessons = listCurriculum(true).length;

  return {
    userId: user.userId,
    currentLevel: user.currentLevel,
    streakDays: user.streakDays,
    masteredSkills,
    totalSkills: skillStates.length,
    plan: entitlement.plan,
    premiumActive: features.unlimitedReviews,
    completedLessons: completedLessonCount,
    totalLessons
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

function toLessonOutline(lesson: {
  lessonId: string;
  title: string;
  summary: string;
  level: string;
  track: string;
  premium: boolean;
  estimatedMinutes: number;
}) {
  return {
    lessonId: lesson.lessonId,
    title: lesson.title,
    summary: lesson.summary,
    level: lesson.level,
    track: lesson.track,
    premium: lesson.premium,
    estimatedMinutes: lesson.estimatedMinutes
  };
}

function toLessonDetails(lesson: {
  lessonId: string;
  title: string;
  summary: string;
  level: string;
  track: string;
  premium: boolean;
  estimatedMinutes: number;
  items: Array<{
    itemId: string;
    skillId: string;
    prompt: string;
    format?: string;
    choices?: string[];
    explanation?: string;
  }>;
}) {
  return {
    ...toLessonOutline(lesson),
    items: lesson.items.map((item) => ({
      itemId: item.itemId,
      skillId: item.skillId,
      prompt: item.prompt,
      format: item.format,
      choices: item.choices,
      explanation: item.explanation
    }))
  };
}

function ensureCompletedLessons(user: UserProfile): Record<string, NonNullable<UserProfile['completedLessons']>[string]> {
  if (!user.completedLessons) {
    user.completedLessons = {};
  }

  return user.completedLessons;
}

function syncMasteryCompletions(user: UserProfile, nowIso: string): void {
  const completedLessons = ensureCompletedLessons(user);

  for (const lesson of listCurriculum(true)) {
    if (completedLessons[lesson.lessonId]) {
      continue;
    }

    const lessonSkillIds = [...new Set(lesson.items.map((item) => item.skillId))];
    if (lessonSkillIds.length === 0) {
      continue;
    }

    const masteredCount = lessonSkillIds.filter((skillId) => (user.skills[skillId]?.mastery ?? 0) >= 0.8).length;
    if (masteredCount !== lessonSkillIds.length) {
      continue;
    }

    completedLessons[lesson.lessonId] = {
      lessonId: lesson.lessonId,
      completedAt: nowIso,
      score: 1,
      correctCount: lessonSkillIds.length,
      totalItems: lessonSkillIds.length
    };
  }
}

function evaluateLessonCompletion(
  user: UserProfile,
  lessonId: string,
  itemResults: Array<{ skillId: string; isCorrect: boolean }>,
  nowIso: string
) {
  const lesson = getLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(404, 'Lesson not found');
  }

  const features = resolveFeatureAccess(normalizeEntitlement(user.entitlement));
  if (lesson.premium && !features.advancedTracks) {
    throw new ApiError(402, 'Pro subscription required for this lesson');
  }

  const lessonSkillIds = [...new Set(lesson.items.map((item) => item.skillId))];
  const lessonSkillSet = new Set(lessonSkillIds);
  const matchedResults = itemResults.filter((item) => lessonSkillSet.has(item.skillId));

  if (matchedResults.length === 0) {
    throw new ApiError(400, 'Session itemResults did not match lesson skills');
  }

  const coveredSkillIds = new Set(matchedResults.map((item) => item.skillId));
  const coverage = coveredSkillIds.size / lessonSkillIds.length;
  const correctCount = matchedResults.filter((item) => item.isCorrect).length;
  const score = correctCount / matchedResults.length;
  const completed = coverage >= 0.75 && score >= 0.7;

  if (completed) {
    const completedLessons = ensureCompletedLessons(user);
    completedLessons[lesson.lessonId] = {
      lessonId: lesson.lessonId,
      completedAt: nowIso,
      score: Number(score.toFixed(2)),
      correctCount,
      totalItems: lessonSkillIds.length
    };
  }

  return {
    lessonId: lesson.lessonId,
    completed,
    score: Number(score.toFixed(2)),
    correctCount,
    totalItems: lessonSkillIds.length,
    coverage: Number(coverage.toFixed(2))
  };
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

      const entitlement = normalizeEntitlement(user.entitlement);
      const features = resolveFeatureAccess(entitlement);
      const curriculum = listCurriculum(true).map((lesson) => ({
        ...toLessonOutline(lesson),
        locked: lesson.premium && !features.advancedTracks,
        completed: isLessonCompleted(user, lesson.lessonId)
      }));

      res.status(200).json({
        userId,
        entitlement,
        features,
        lessons: curriculum
      });
    }).catch(next);
  });

  app.get('/api/learn/lessons/:lessonId', authenticateJwt(deps.jwtSecret), (req: AuthenticatedRequest, res, next: NextFunction) => {
    Promise.resolve().then(async () => {
      const { lessonId } = validateLessonParams(req.params);
      const userId = String(req.auth?.sub ?? '');
      const user = await findUserOrThrow(deps, userId);
      const entitlement = normalizeEntitlement(user.entitlement);
      const features = resolveFeatureAccess(entitlement);
      const lesson = getLessonById(lessonId);

      if (!lesson) {
        throw new ApiError(404, 'Lesson not found');
      }

      if (lesson.premium && !features.advancedTracks) {
        throw new ApiError(402, 'Pro subscription required for this lesson');
      }

      res.status(200).json({
        userId,
        lesson: toLessonDetails(lesson)
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
      const nowIso = new Date().toISOString();
      syncMasteryCompletions(user, nowIso);
      const lessonProgress = parsed.data.lessonId
        ? evaluateLessonCompletion(user, parsed.data.lessonId, parsed.data.itemResults, nowIso)
        : undefined;
      const streakDays = markSessionActivity(user, {
        timeZone: resolveTimeZone(parsed.data.timeZone, req.header('x-user-timezone'))
      });
      await deps.repository.upsertUserProfile(user);

      res.status(200).json({ userId, streakDays, scheduledReviews, skills: user.skills, lessonProgress });
    }).catch(next);
  });
}
