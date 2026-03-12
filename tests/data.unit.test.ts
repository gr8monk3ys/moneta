import { describe, expect, it } from 'vitest';
import type { Lesson, UserProfile } from '../src/types.js';
import { createDefaultEntitlement } from '../src/billing.js';
import { __testables as dataTestables } from '../src/data.js';

function makeLesson(partial: Partial<Lesson> & Pick<Lesson, 'lessonId' | 'level'>): Lesson {
  return {
    lessonId: partial.lessonId,
    title: partial.title ?? partial.lessonId,
    summary: partial.summary ?? 'summary',
    estimatedMinutes: partial.estimatedMinutes ?? 5,
    level: partial.level,
    track: partial.track ?? 'core',
    premium: partial.premium ?? false,
    items: partial.items ?? []
  };
}

function makeUser(completedLessons?: UserProfile['completedLessons']): UserProfile {
  return {
    userId: 'user-1',
    currentLevel: 'F1',
    streakDays: 0,
    entitlement: createDefaultEntitlement(),
    completedLessons,
    skills: {}
  };
}

describe('data test helpers', () => {
  it('fills generated seed defaults when optional topic copy is missing', () => {
    const [seed] = dataTestables.createLevelSeeds('F2', 'core', false, 7, [{
      slug: 'cash-rules',
      title: 'Cash Rules',
      summary: 'A short summary.',
      keyConcept: 'Liquidity Buffer'
    }]);

    expect(seed.lessonId).toBe('lesson-cash-rules-f2-007');
    expect(seed.benchmark).toContain('liquidity buffer');
    expect(seed.formula).toContain('Liquidity Buffer baseline');
    expect(seed.action).toContain('review liquidity buffer');
    expect(seed.risk).toContain('ignoring assumptions');
    expect(seed.checkIn).toBe('monthly');
    expect(seed.mistake).toContain('liquidity buffer decisions');
  });

  it('normalizes MCQ choices and provides fallback options', () => {
    const normalized = dataTestables.normalizeMcqChoices('Keep the cash buffer', [
      '',
      'Keep the cash buffer',
      'Keep the cash buffer',
      'Review the plan monthly'
    ], 'seed-1');

    expect(normalized).toContain('Keep the cash buffer');
    expect(normalized).toContain('Review the plan monthly');
    expect(normalized).toHaveLength(2);

    const fallback = dataTestables.withFallbackChoices('Keep the cash buffer', 'seed-2');
    expect(fallback).toContain('Keep the cash buffer');
    expect(new Set(fallback).size).toBe(4);
  });

  it('builds generated items even when blank answers need to be skipped', () => {
    const generated = dataTestables.buildGeneratedItems({
      lessonId: 'lesson-skip-blanks-f2-008',
      title: 'Blank Resistant Lesson',
      summary: 'Exercises choice normalization.',
      estimatedMinutes: 7,
      level: 'F2',
      track: 'core',
      premium: false,
      skillBase: 'skip-blanks-f2',
      keyConcept: '',
      benchmark: '',
      formula: '',
      action: '',
      risk: '',
      checkIn: '',
      mistake: ''
    });

    expect(generated).toHaveLength(8);
    expect(generated[0]?.choices).toHaveLength(4);
    expect(generated[0]?.choices?.every((choice) => choice.trim().length > 0)).toBe(true);
  });

  it('sorts lessons through track, premium, ordinal, and id tie-breakers', () => {
    const byTrack = dataTestables.sortLessons(
      makeLesson({ lessonId: 'lesson-track-f1-010', level: 'F1', track: 'core' }),
      makeLesson({ lessonId: 'lesson-track-f1-010', level: 'F1', track: 'advanced' })
    );
    expect(byTrack).toBeLessThan(0);

    const byPremium = dataTestables.sortLessons(
      makeLesson({ lessonId: 'lesson-premium-f2-010', level: 'F2', premium: false }),
      makeLesson({ lessonId: 'lesson-premium-f2-010', level: 'F2', premium: true })
    );
    expect(byPremium).toBeLessThan(0);

    const byOrdinal = dataTestables.sortLessons(
      makeLesson({ lessonId: 'lesson-ordinal-f3-001', level: 'F3' }),
      makeLesson({ lessonId: 'lesson-ordinal-f3-010', level: 'F3' })
    );
    expect(byOrdinal).toBeLessThan(0);

    expect(dataTestables.lessonOrdinal('lesson-without-ordinal')).toBe(9999);
    expect(dataTestables.sortLessons(
      makeLesson({ lessonId: 'lesson-alpha', level: 'F4' }),
      makeLesson({ lessonId: 'lesson-beta', level: 'F4' })
    )).toBeLessThan(0);
  });

  it('finds the next lesson by exact level, fallback level, and user progress', () => {
    const curriculum = [
      makeLesson({ lessonId: 'lesson-f1-001', level: 'F1' }),
      makeLesson({ lessonId: 'lesson-f3-001', level: 'F3' }),
      makeLesson({ lessonId: 'lesson-f4-001', level: 'F4', premium: true, track: 'advanced' })
    ];

    expect(dataTestables.getNextLessonForLevelFromCurriculum(curriculum, 'F1')?.lessonId).toBe('lesson-f1-001');
    expect(dataTestables.getNextLessonForLevelFromCurriculum(curriculum, 'F2')?.lessonId).toBe('lesson-f3-001');

    const user = makeUser({
      'lesson-f1-001': {
        lessonId: 'lesson-f1-001',
        completedAt: '2026-01-01T00:00:00.000Z',
        score: 1,
        correctCount: 1,
        totalItems: 1
      }
    });

    expect(dataTestables.getNextLessonForProgressFromCurriculum(user, curriculum)?.lessonId).toBe('lesson-f3-001');
  });
});
