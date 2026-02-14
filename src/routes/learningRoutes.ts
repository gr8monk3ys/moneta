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

const sessionItemSchema = z.object({
  skillId: z.string().min(1),
  isCorrect: z.boolean().optional(),
  itemId: z.string().min(1).optional(),
  answer: z.string().min(1).optional()
});

const sessionSchema = z.object({
  itemResults: z.array(sessionItemSchema),
  lessonId: z.string().min(1).optional(),
  timeZone: z.string().min(1).optional()
}).superRefine((data, ctx) => {
  const missingOutcome = data.itemResults.find((item) => typeof item.isCorrect !== 'boolean' && !item.answer);
  if (missingOutcome) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: data.lessonId
        ? 'Session itemResults must include isCorrect or answer when lessonId is provided'
        : 'Session itemResults must include isCorrect or answer when lessonId is not provided',
      path: ['itemResults']
    });
  }

  const answerWithoutItemId = data.itemResults.find((item) => Boolean(item.answer) && !item.itemId);
  if (answerWithoutItemId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Session itemResults.answer requires itemId',
      path: ['itemResults']
    });
  }
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

  const curriculum = listCurriculum(true);
  const itemBySkillId = new Map<string, { lesson: (typeof curriculum)[number]; item: (typeof curriculum)[number]['items'][number] }>();
  for (const lesson of curriculum) {
    for (const item of lesson.items) {
      if (!itemBySkillId.has(item.skillId)) {
        itemBySkillId.set(item.skillId, { lesson, item });
      }
    }
  }

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
    }))
    .map((review) => {
      const resolved = itemBySkillId.get(review.skillId);
      if (!resolved) {
        return review;
      }

      const locked = Boolean(resolved.lesson?.premium) && !features.advancedTracks;
      if (locked) {
        return { ...review, locked: true };
      }

      return {
        ...review,
        contentItemId: resolved.item.itemId,
        prompt: resolved.item.prompt,
        format: resolved.item.format,
        choices: resolved.item.choices,
        explanation: resolved.item.explanation,
        locked: false
      };
    });

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

function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[$,]/g, '')
    .replace(/[^a-z0-9%.\s-]/g, '');
}

function parseNumericCandidate(value: string): { value: number; isPercent: boolean } | undefined {
  const trimmed = value.trim();
  const isPercent = trimmed.includes('%');
  const cleaned = trimmed.replace(/%/g, '').trim();

  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    return undefined;
  }

  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return { value: parsed, isPercent };
}

function numericEquivalent(
  answer: { value: number; isPercent: boolean },
  expected: { value: number; isPercent: boolean }
): boolean {
  let answerValue = answer.value;
  let expectedValue = expected.value;

  if (expected.isPercent && !answer.isPercent && answerValue <= 1) {
    answerValue *= 100;
  }

  if (answer.isPercent && !expected.isPercent && expectedValue <= 1) {
    expectedValue *= 100;
  }

  return Math.abs(answerValue - expectedValue) <= 0.01;
}

function isAnswerCorrect(answer: string, acceptableAnswers: string[]): boolean {
  const normalizedAnswer = normalizeAnswer(answer);
  if (!normalizedAnswer) {
    return false;
  }

  const normalizedAcceptable = acceptableAnswers.map((entry) => normalizeAnswer(entry)).filter(Boolean);
  if (normalizedAcceptable.includes(normalizedAnswer)) {
    return true;
  }

  const parsedAnswer = parseNumericCandidate(normalizedAnswer);
  if (!parsedAnswer) {
    return false;
  }

  for (const acceptable of normalizedAcceptable) {
    const parsedExpected = parseNumericCandidate(acceptable);
    if (!parsedExpected) {
      continue;
    }

    if (numericEquivalent(parsedAnswer, parsedExpected)) {
      return true;
    }
  }

  return false;
}

function gradeLessonAnswers(
  lessonId: string,
  itemResults: Array<{ skillId: string; itemId?: string; answer?: string; isCorrect?: boolean }>
): {
  gradedItems?: Array<{ skillId: string; itemId?: string; answer?: string; isCorrect: boolean }>;
  computedResults: Array<{ skillId: string; isCorrect: boolean }>;
} {
  const lesson = getLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(404, 'Lesson not found');
  }

  const byItemId = new Map(lesson.items.map((item) => [item.itemId, item] as const));
  const gradedItems: Array<{ skillId: string; itemId?: string; answer?: string; isCorrect: boolean }> = [];
  const computedResults: Array<{ skillId: string; isCorrect: boolean }> = [];

  for (const result of itemResults) {
    if (!result.answer) {
      if (typeof result.isCorrect === 'boolean') {
        computedResults.push({ skillId: result.skillId, isCorrect: result.isCorrect });
      }
      continue;
    }

    if (!result.itemId) {
      throw new ApiError(400, 'Session itemResults.answer requires itemId');
    }

    const item = byItemId.get(result.itemId);
    if (!item) {
      throw new ApiError(400, 'Session itemResults contained unknown itemId');
    }

    if (item.skillId !== result.skillId) {
      throw new ApiError(400, 'Session itemResults itemId/skillId mismatch');
    }

    const acceptable = item.acceptableAnswers ?? [item.correctAnswer];
    const isCorrect = isAnswerCorrect(result.answer, acceptable);
    computedResults.push({ skillId: item.skillId, isCorrect });
    gradedItems.push({ skillId: item.skillId, itemId: item.itemId, answer: result.answer, isCorrect });
  }

  return {
    gradedItems: gradedItems.length > 0 ? gradedItems : undefined,
    computedResults
  };
}

function gradeStandaloneAnswers(
  user: UserProfile,
  itemResults: Array<{ skillId: string; itemId?: string; answer?: string; isCorrect?: boolean }>
): {
  gradedItems?: Array<{ skillId: string; itemId?: string; answer?: string; isCorrect: boolean }>;
  computedResults: Array<{ skillId: string; isCorrect: boolean }>;
} {
  const features = resolveFeatureAccess(normalizeEntitlement(user.entitlement));
  const curriculum = listCurriculum(true);
  const byItemId = new Map<string, { lesson: (typeof curriculum)[number]; item: (typeof curriculum)[number]['items'][number] }>();

  for (const lesson of curriculum) {
    for (const item of lesson.items) {
      if (!byItemId.has(item.itemId)) {
        byItemId.set(item.itemId, { lesson, item });
      }
    }
  }

  const gradedItems: Array<{ skillId: string; itemId?: string; answer?: string; isCorrect: boolean }> = [];
  const computedResults: Array<{ skillId: string; isCorrect: boolean }> = [];

  for (const result of itemResults) {
    if (!result.answer) {
      if (typeof result.isCorrect === 'boolean') {
        computedResults.push({ skillId: result.skillId, isCorrect: result.isCorrect });
      }
      continue;
    }

    if (!result.itemId) {
      throw new ApiError(400, 'Session itemResults.answer requires itemId');
    }

    const resolved = byItemId.get(result.itemId);
    if (!resolved) {
      throw new ApiError(400, 'Session itemResults contained unknown itemId');
    }

    if (resolved.lesson.premium && !features.advancedTracks) {
      throw new ApiError(402, 'Pro subscription required for this content');
    }

    if (resolved.item.skillId !== result.skillId) {
      throw new ApiError(400, 'Session itemResults itemId/skillId mismatch');
    }

    const acceptable = resolved.item.acceptableAnswers ?? [resolved.item.correctAnswer];
    const isCorrect = isAnswerCorrect(result.answer, acceptable);
    computedResults.push({ skillId: resolved.item.skillId, isCorrect });
    gradedItems.push({ skillId: resolved.item.skillId, itemId: resolved.item.itemId, answer: result.answer, isCorrect });
  }

  return {
    gradedItems: gradedItems.length > 0 ? gradedItems : undefined,
    computedResults
  };
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
      const nowIso = new Date().toISOString();
      syncMasteryCompletions(user, nowIso);

      let computedResults: Array<{ skillId: string; isCorrect: boolean }> = [];
      let gradedItems: Array<{ skillId: string; itemId?: string; answer?: string; isCorrect: boolean }> | undefined;

      if (parsed.data.lessonId) {
        const usesAnswers = parsed.data.itemResults.some((item) => typeof item.answer === 'string');
        if (usesAnswers) {
          const graded = gradeLessonAnswers(parsed.data.lessonId, parsed.data.itemResults);
          computedResults = graded.computedResults;
          gradedItems = graded.gradedItems;
        } else {
          computedResults = parsed.data.itemResults.map((item) => ({
            skillId: item.skillId,
            isCorrect: Boolean(item.isCorrect)
          }));
        }
      } else {
        const usesAnswers = parsed.data.itemResults.some((item) => typeof item.answer === 'string');
        if (usesAnswers) {
          const graded = gradeStandaloneAnswers(user, parsed.data.itemResults);
          computedResults = graded.computedResults;
          gradedItems = graded.gradedItems;
        } else {
          computedResults = parsed.data.itemResults.map((item) => ({
            skillId: item.skillId,
            isCorrect: Boolean(item.isCorrect)
          }));
        }
      }

      const scheduledReviews = computedResults.map((item) => applyItemResult(user, item.skillId, item.isCorrect));
      const lessonProgress = parsed.data.lessonId
        ? evaluateLessonCompletion(user, parsed.data.lessonId, computedResults, nowIso)
        : undefined;
      const streakDays = markSessionActivity(user, {
        timeZone: resolveTimeZone(parsed.data.timeZone, req.header('x-user-timezone'))
      });
      await deps.repository.upsertUserProfile(user);

      res.status(200).json({ userId, streakDays, scheduledReviews, skills: user.skills, lessonProgress, gradedItems });
    }).catch(next);
  });
}
