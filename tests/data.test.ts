import { describe, expect, it } from 'vitest';
import { __testables as dataTestables, getLessonById, getNextLessonForLevel, getNextLessonForProgress, isLessonCompleted, listCurriculum } from '../src/data.js';
import { createDefaultEntitlement } from '../src/billing.js';
import type { UserProfile } from '../src/types.js';

function buildUser(completedLessons?: UserProfile['completedLessons']): UserProfile {
  return {
    userId: 'test-user',
    currentLevel: 'F1',
    streakDays: 0,
    skills: {},
    entitlement: createDefaultEntitlement(),
    completedLessons
  };
}

describe('data helpers', () => {
  it('sorts curriculum by the active lesson comparator', () => {
    const curriculum = listCurriculum(true);

    for (let index = 1; index < curriculum.length; index += 1) {
      const previous = curriculum[index - 1];
      const current = curriculum[index];
      expect(dataTestables.sortLessons(previous, current)).toBeLessThanOrEqual(0);
    }
  });

  it('filters premium lessons when includePremium is false', () => {
    const freeOnly = listCurriculum(false);
    const all = listCurriculum(true);

    expect(freeOnly.every((lesson) => !lesson.premium)).toBe(true);
    expect(all.length).toBeGreaterThan(freeOnly.length);
  });

  it('finds lesson by id and returns undefined for unknown lesson', () => {
    const [firstLesson] = listCurriculum(true);
    expect(getLessonById(firstLesson.lessonId)?.lessonId).toBe(firstLesson.lessonId);
    expect(getLessonById('missing-lesson-id')).toBeUndefined();
  });

  it('resolves next lesson for level with preferred and fallback logic', () => {
    const all = listCurriculum(true);

    const firstF3 = all.find((lesson) => lesson.level === 'F3');
    expect(firstF3).toBeDefined();
    expect(getNextLessonForLevel('F3', true)?.lessonId).toBe(firstF3?.lessonId);

    const freeOnly = listCurriculum(false);
    const firstAny = freeOnly[0];
    const nextForF6Free = getNextLessonForLevel('F6', false);
    expect(nextForF6Free).toBeDefined();
    expect(freeOnly.some((lesson) => lesson.lessonId === nextForF6Free?.lessonId)).toBe(true);
    expect(firstAny).toBeDefined();
  });

  it('computes lesson completion and next lesson for user progress', () => {
    const freeCurriculum = listCurriculum(false);
    const [firstFreeLesson, secondFreeLesson] = freeCurriculum;

    const userWithNoCompletion = buildUser();
    expect(isLessonCompleted(userWithNoCompletion, firstFreeLesson.lessonId)).toBe(false);
    expect(getNextLessonForProgress(userWithNoCompletion, false)?.lessonId).toBe(firstFreeLesson.lessonId);

    const userWithFirstCompleted = buildUser({
      [firstFreeLesson.lessonId]: {
        lessonId: firstFreeLesson.lessonId,
        completedAt: new Date().toISOString(),
        score: 1,
        correctCount: 2,
        totalItems: 2
      }
    });

    expect(isLessonCompleted(userWithFirstCompleted, firstFreeLesson.lessonId)).toBe(true);
    expect(getNextLessonForProgress(userWithFirstCompleted, false)?.lessonId).toBe(secondFreeLesson.lessonId);
  });
});
