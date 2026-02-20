import { createDefaultEntitlement } from './billing.js';
import curriculumData from './content/curriculum.generated.json' with { type: 'json' };
import type { Lesson, UserProfile } from './types.js';

const lessons = curriculumData as Lesson[];

const levelRank: Record<Lesson['level'], number> = {
  F1: 1,
  F2: 2,
  F3: 3,
  F4: 4,
  F5: 5,
  F6: 6
};

function sortLessons(a: Lesson, b: Lesson): number {
  const byLevel = levelRank[a.level] - levelRank[b.level];
  if (byLevel !== 0) {
    return byLevel;
  }

  if (a.premium !== b.premium) {
    return Number(a.premium) - Number(b.premium);
  }

  return a.lessonId.localeCompare(b.lessonId);
}

export function listCurriculum(includePremium: boolean): Lesson[] {
  return lessons
    .filter((lesson) => includePremium || !lesson.premium)
    .sort(sortLessons);
}

export function getLessonById(lessonId: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.lessonId === lessonId);
}

export function getNextLessonForLevel(level: Lesson['level'], includePremium: boolean): Lesson | undefined {
  const curriculum = listCurriculum(includePremium);
  const preferred = curriculum.find((lesson) => lesson.level === level);
  if (preferred) {
    return preferred;
  }

  const fallback = curriculum.find((lesson) => levelRank[lesson.level] >= levelRank[level]);
  if (fallback) {
    return fallback;
  }

  return curriculum[0];
}

export function isLessonCompleted(user: UserProfile, lessonId: string): boolean {
  return Boolean(user.completedLessons?.[lessonId]);
}

export function getNextLessonForProgress(user: UserProfile, includePremium: boolean): Lesson | undefined {
  const curriculum = listCurriculum(includePremium);
  return curriculum.find((lesson) => !isLessonCompleted(user, lesson.lessonId));
}

export const users: Record<string, UserProfile> = {
  demo: {
    userId: 'demo',
    currentLevel: 'F1',
    streakDays: 0,
    entitlement: createDefaultEntitlement(),
    completedLessons: {},
    skills: {
      'apr-vs-apy': { skillId: 'apr-vs-apy', mastery: 0.2 },
      'basic-budgeting': { skillId: 'basic-budgeting', mastery: 0.2 },
      'credit-utilization': { skillId: 'credit-utilization', mastery: 0.2 },
      diversification: { skillId: 'diversification', mastery: 0.2 }
    }
  }
};
