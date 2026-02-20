import { normalizeEntitlement, resolveFeatureAccess } from '../billing.js';
import { getLessonById, isLessonCompleted, listCurriculum } from '../data.js';
import { applyItemResult, isValidTimeZone, markSessionActivity, placeUser } from '../engine.js';
import { ApiError } from '../errors.js';
import type { FinanceLevel, Lesson, ReviewItem, UserProfile } from '../types.js';

export interface SessionItemResult {
  skillId: string;
  isCorrect: boolean;
}

interface LessonOutline {
  lessonId: string;
  title: string;
  summary: string;
  level: string;
  track: string;
  premium: boolean;
  estimatedMinutes: number;
}

function ensureCompletedLessons(user: UserProfile): Record<string, NonNullable<UserProfile['completedLessons']>[string]> {
  if (!user.completedLessons) {
    user.completedLessons = {};
  }

  return user.completedLessons;
}

export function getProgressSummary(user: UserProfile) {
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

export function resolveDueReviews(user: UserProfile): {
  dueReviews: ReviewItem[];
  entitlement: UserProfile['entitlement'];
  features: ReturnType<typeof resolveFeatureAccess>;
} {
  const nowMs = Date.now();
  const entitlement = normalizeEntitlement(user.entitlement);
  const features = resolveFeatureAccess(entitlement);

  const dueReviews = Object.values(user.skills)
    .filter((skill) => skill.nextReviewAt && new Date(skill.nextReviewAt).getTime() <= nowMs)
    .sort((a, b) => new Date(String(a.nextReviewAt)).getTime() - new Date(String(b.nextReviewAt)).getTime())
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

export function resolveTimeZoneOrDefault(...candidates: Array<string | undefined>): string {
  for (const candidate of candidates) {
    if (candidate && isValidTimeZone(candidate)) {
      return candidate;
    }
  }

  return 'UTC';
}

export function toLessonOutline(lesson: LessonOutline): LessonOutline {
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

export function toLessonDetails(lesson: {
  lessonId: string;
  title: string;
  summary: string;
  level: string;
  track: string;
  premium: boolean;
  estimatedMinutes: number;
  items: Array<{ itemId: string; skillId: string; prompt: string; format?: string; choices?: string[]; explanation?: string }>;
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

export function syncMasteryCompletions(user: UserProfile, nowIso: string): void {
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

export function evaluateLessonCompletion(user: UserProfile, lessonId: string, itemResults: SessionItemResult[], nowIso: string) {
  const lesson = getLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(404, 'Lesson not found');
  }

  const features = resolveFeatureAccess(normalizeEntitlement(user.entitlement));
  if (lesson.premium && !features.advancedTracks) {
    throw new ApiError(402, 'Pro subscription required for this lesson');
  }

  const lessonSkillIds = [...new Set(lesson.items.map((item) => item.skillId))];
  const matchedResults = itemResults.filter((item) => lessonSkillIds.includes(item.skillId));
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

export function resolvePlacementLevel(correctAnswers: number, totalQuestions: number): FinanceLevel {
  return placeUser(correctAnswers, totalQuestions);
}

export function buildPathLessons(user: UserProfile) {
  const entitlement = normalizeEntitlement(user.entitlement);
  const features = resolveFeatureAccess(entitlement);
  const lessons = listCurriculum(true).map((lesson) => ({
    ...toLessonOutline(lesson),
    locked: lesson.premium && !features.advancedTracks,
    completed: isLessonCompleted(user, lesson.lessonId)
  }));

  return { entitlement, features, lessons };
}

export function applySessionResults(user: UserProfile, itemResults: SessionItemResult[]) {
  return itemResults.map((item) => applyItemResult(user, item.skillId, item.isCorrect));
}

export function canAccessLesson(user: UserProfile, lessonId: string): { lesson: Lesson; userId: string } {
  const lesson = getLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(404, 'Lesson not found');
  }

  const entitlement = normalizeEntitlement(user.entitlement);
  const features = resolveFeatureAccess(entitlement);
  if (lesson.premium && !features.advancedTracks) {
    throw new ApiError(402, 'Pro subscription required for this lesson');
  }

  return { lesson, userId: user.userId };
}

export function markSessionStreak(user: UserProfile, timeZone?: string, fallbackTimeZone?: string): number {
  return markSessionActivity(user, {
    timeZone: resolveTimeZoneOrDefault(timeZone, fallbackTimeZone)
  });
}
