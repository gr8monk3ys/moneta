import { describe, expect, it } from 'vitest';
import type { SubscriptionEntitlement, UserProfile } from '../src/types.js';
import { createDefaultEntitlement } from '../src/billing.js';
import { getLessonById } from '../src/data.js';
import { __testables as learningTestables } from '../src/routes/learningRoutes.js';

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    userId: overrides.userId ?? 'user-1',
    currentLevel: overrides.currentLevel ?? 'F1',
    streakDays: overrides.streakDays ?? 0,
    entitlement: overrides.entitlement ?? createDefaultEntitlement(),
    completedLessons: overrides.completedLessons,
    skills: overrides.skills ?? {}
  };
}

function makeProEntitlement(): SubscriptionEntitlement {
  return {
    ...createDefaultEntitlement(),
    plan: 'pro',
    isActive: true,
    source: 'web'
  };
}

describe('learning route helpers', () => {
  it('validates params and summarizes user progress', () => {
    expect(() => learningTestables.validateParams({ userId: '' })).toThrowError(/Invalid route parameters/);
    expect(() => learningTestables.validateLessonParams({ lessonId: '' })).toThrowError(/Invalid route parameters/);

    const summary = learningTestables.getProgressSummary(makeUser({
      streakDays: 12,
      skills: {
        mastered: { skillId: 'mastered', mastery: 0.9 },
        developing: { skillId: 'developing', mastery: 0.4 }
      }
    }));

    expect(summary.streakDays).toBe(12);
    expect(summary.masteredSkills).toBe(1);
    expect(summary.completedLessons).toBe(0);
    expect(summary.totalLessons).toBeGreaterThan(0);
  });

  it('builds review queues and resolves time zones safely', () => {
    const queues = learningTestables.toReviewQueues(makeUser({
      skills: {
        'withdrawal-rate': {
          skillId: 'withdrawal-rate',
          mastery: 0.3,
          nextReviewAt: '2025-01-01T00:00:00.000Z'
        },
        'basic-budgeting': {
          skillId: 'basic-budgeting',
          mastery: 0.8,
          nextReviewAt: '2099-01-01T00:00:00.000Z'
        },
        'missing-skill': {
          skillId: 'missing-skill',
          mastery: 0.1,
          nextReviewAt: '2099-02-01T00:00:00.000Z'
        },
        'no-schedule': {
          skillId: 'no-schedule',
          mastery: 0.1
        }
      }
    }));

    expect(queues.dueReviews).toHaveLength(1);
    expect(queues.dueReviews[0]?.locked).toBe(true);
    expect(queues.practiceReviews.some((item) => item.skillId === 'basic-budgeting' && item.contentItemId)).toBe(true);
    expect(queues.practiceReviews.some((item) => item.skillId === 'missing-skill' && !item.prompt)).toBe(true);
    expect(learningTestables.resolveTimeZone('Nope/Zone', 'UTC')).toBe('UTC');
    expect(learningTestables.resolveTimeZone(undefined, 'Nope/Zone')).toBe('UTC');
  });

  it('creates completed lesson records from mastered lesson skills', () => {
    const lesson = getLessonById('lesson-cash-flow-f1-001');
    expect(lesson).toBeDefined();

    const skills = Object.fromEntries(
      [...new Set(lesson!.items.map((item) => item.skillId))]
        .map((skillId) => [skillId, { skillId, mastery: 1 }])
    );

    const user = makeUser({ skills });
    expect(learningTestables.ensureCompletedLessons(user)).toEqual({});

    learningTestables.syncMasteryCompletions(user, '2026-03-01T00:00:00.000Z');

    expect(user.completedLessons?.[lesson!.lessonId]).toBeDefined();
    expect(user.completedLessons?.[lesson!.lessonId]?.score).toBe(1);
  });

  it('parses numeric answers and matches equivalent finance answers', () => {
    expect(learningTestables.parseNumericCandidate('not a number')).toBeUndefined();
    expect(learningTestables.parseNumericCandidate('20%')).toEqual({ value: 20, isPercent: true });
    expect(learningTestables.numericEquivalent(
      { value: 0.2, isPercent: false },
      { value: 20, isPercent: true }
    )).toBe(true);
    expect(learningTestables.numericEquivalent(
      { value: 20, isPercent: true },
      { value: 0.2, isPercent: false }
    )).toBe(true);
    expect(learningTestables.isAnswerCorrect('', ['20%'])).toBe(false);
    expect(learningTestables.isAnswerCorrect('letters only', ['20%'])).toBe(false);
    expect(learningTestables.isAnswerCorrect('0.2', ['20%'])).toBe(true);
    expect(learningTestables.isAnswerCorrect('19', ['letters only'])).toBe(false);

    // Magnitude-scaled tolerance: trivial rounding on a large answer passes, but a
    // clearly wrong integer (off by 1 on 1200) still fails.
    expect(learningTestables.isAnswerCorrect('1200.05', ['1200'])).toBe(true);
    expect(learningTestables.isAnswerCorrect('1199', ['1200'])).toBe(false);
    // Small/integer answers remain near-exact.
    expect(learningTestables.isAnswerCorrect('301', ['300'])).toBe(false);
  });

  it('grades lesson answers across validation and mismatch branches', () => {
    const lessonOnlyBooleans = learningTestables.gradeLessonAnswers('lesson-cash-flow-f1-001', [{
      skillId: 'basic-budgeting',
      isCorrect: true
    }]);

    expect(lessonOnlyBooleans.gradedItems).toBeUndefined();
    expect(lessonOnlyBooleans.computedResults).toEqual([{ skillId: 'basic-budgeting', isCorrect: true }]);

    expect(() => learningTestables.gradeLessonAnswers('lesson-cash-flow-f1-001', [{
      skillId: 'basic-budgeting',
      answer: '300'
    }])).toThrowError(/requires itemId/);

    expect(() => learningTestables.gradeLessonAnswers('lesson-cash-flow-f1-001', [{
      skillId: 'basic-budgeting',
      itemId: 'missing-item',
      answer: '300'
    }])).toThrowError(/unknown itemId/);

    expect(() => learningTestables.gradeLessonAnswers('lesson-cash-flow-f1-001', [{
      skillId: 'wrong-skill',
      itemId: 'item-budget-001',
      answer: '300'
    }])).toThrowError(/mismatch/);

    const graded = learningTestables.gradeLessonAnswers('lesson-cash-flow-f1-001', [{
      skillId: 'basic-budgeting',
      itemId: 'item-budget-001',
      answer: '300'
    }]);

    expect(graded.gradedItems?.[0]?.isCorrect).toBe(true);
  });

  it('grades standalone answers and evaluates lesson completion rules', () => {
    const freeUser = makeUser();
    const proUser = makeUser({ entitlement: makeProEntitlement() });

    expect(() => learningTestables.gradeStandaloneAnswers(freeUser, [{
      skillId: 'withdrawal-rate',
      answer: 'sequence risk and longevity'
    }])).toThrowError(/requires itemId/);

    expect(() => learningTestables.gradeStandaloneAnswers(freeUser, [{
      skillId: 'withdrawal-rate',
      itemId: 'missing-item',
      answer: 'sequence risk and longevity'
    }])).toThrowError(/unknown itemId/);

    expect(() => learningTestables.gradeStandaloneAnswers(freeUser, [{
      skillId: 'withdrawal-rate',
      itemId: 'item-retire-001',
      answer: 'sequence risk and longevity'
    }])).toThrowError(/Pro subscription required/);

    expect(() => learningTestables.gradeStandaloneAnswers(proUser, [{
      skillId: 'wrong-skill',
      itemId: 'item-budget-001',
      answer: '300'
    }])).toThrowError(/mismatch/);

    const graded = learningTestables.gradeStandaloneAnswers(proUser, [{
      skillId: 'basic-budgeting',
      itemId: 'item-budget-001',
      answer: '300'
    }]);

    expect(graded.gradedItems?.[0]?.isCorrect).toBe(true);

    expect(() => learningTestables.evaluateLessonCompletion(
      freeUser,
      'lesson-cash-flow-f1-001',
      [{ skillId: 'not-in-lesson', isCorrect: true }],
      '2026-03-01T00:00:00.000Z'
    )).toThrowError(/did not match lesson skills/);

    const completedUser = makeUser();
    const lesson = getLessonById('lesson-cash-flow-f1-001');
    expect(lesson).toBeDefined();

    const completion = learningTestables.evaluateLessonCompletion(
      completedUser,
      lesson!.lessonId,
      lesson!.items.slice(0, 5).map((item) => ({ skillId: item.skillId, isCorrect: true })),
      '2026-03-01T00:00:00.000Z'
    );

    expect(completion.completed).toBe(true);
    expect(completedUser.completedLessons?.[lesson!.lessonId]).toBeDefined();
  });
});
