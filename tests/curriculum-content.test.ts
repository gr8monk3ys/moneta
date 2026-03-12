import { describe, expect, it } from 'vitest';
import { createDefaultEntitlement } from '../src/billing.js';
import { getLessonById, getNextLessonForLevel, getNextLessonForProgress, isLessonCompleted, listCurriculum } from '../src/data.js';

describe('curriculum content depth', () => {
  it('meets MVP target ranges for lesson and item volume', () => {
    const curriculum = listCurriculum(true);
    const itemCount = curriculum.reduce((sum, lesson) => sum + lesson.items.length, 0);

    expect(curriculum.length).toBeGreaterThanOrEqual(60);
    expect(curriculum.length).toBeLessThanOrEqual(100);
    expect(itemCount).toBeGreaterThanOrEqual(400);
    expect(itemCount).toBeLessThanOrEqual(700);
  });

  it('covers all finance levels with both free and premium pathways', () => {
    const curriculum = listCurriculum(true);
    const levels = new Set(curriculum.map((lesson) => lesson.level));

    expect(levels).toEqual(new Set(['F1', 'F2', 'F3', 'F4', 'F5', 'F6']));
    expect(curriculum.some((lesson) => lesson.premium)).toBe(true);
    expect(curriculum.some((lesson) => !lesson.premium)).toBe(true);
  });

  it('includes editorial review metadata and rich item formats', () => {
    const curriculum = listCurriculum(true);

    for (const lesson of curriculum) {
      expect(lesson.editorial).toBeDefined();
      expect(lesson.editorial?.reviewer.length).toBeGreaterThan(0);
      expect(lesson.items.length).toBeGreaterThanOrEqual(2);
      expect(lesson.items.some((item) => item.explanation)).toBe(true);
      expect(lesson.items.some((item) => item.format === 'mcq' || item.format === 'scenario' || item.format === 'numeric')).toBe(true);
    }

    const mixedFormatLessons = curriculum.filter((lesson) => {
      const formats = new Set(lesson.items.map((item) => item.format));
      return formats.size >= 2;
    });

    expect(mixedFormatLessons.length).toBeGreaterThanOrEqual(30);
  });

  it('supports curriculum lookup and next-lesson helpers', () => {
    const freeCurriculum = listCurriculum(false);
    expect(freeCurriculum.every((lesson) => !lesson.premium)).toBe(true);

    const lesson = getLessonById('lesson-cash-flow-f1-001');
    expect(lesson?.title).toBe('Cash Flow Basics');
    expect(getLessonById('missing-lesson')).toBeUndefined();

    const fallbackLesson = getNextLessonForLevel('F6', false);
    expect(fallbackLesson).toBeDefined();
    expect(fallbackLesson?.premium).toBe(false);

    const user = {
      userId: 'u1',
      currentLevel: 'F1' as const,
      streakDays: 0,
      entitlement: createDefaultEntitlement(),
      completedLessons: {
        'lesson-cash-flow-f1-001': {
          lessonId: 'lesson-cash-flow-f1-001',
          completedAt: '2026-01-01T00:00:00.000Z',
          score: 1,
          correctCount: 6,
          totalItems: 6
        }
      },
      skills: {}
    };

    expect(isLessonCompleted(user, 'lesson-cash-flow-f1-001')).toBe(true);
    expect(isLessonCompleted(user, 'lesson-credit-scores-f1-002')).toBe(false);
    expect(getNextLessonForProgress(user, false)?.lessonId).not.toBe('lesson-cash-flow-f1-001');
  });
});
