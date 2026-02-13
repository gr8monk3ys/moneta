import { describe, expect, it } from 'vitest';
import { applyItemResult, markSessionActivity, placeUser } from '../src/engine.js';
import type { UserProfile } from '../src/types.js';

function buildUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    userId: 'user-1',
    currentLevel: 'F1',
    streakDays: 0,
    skills: {},
    ...overrides
  };
}

describe('engine', () => {
  it('places users across score bands', () => {
    expect(placeUser(0, 10)).toBe('F1');
    expect(placeUser(4, 10)).toBe('F2');
    expect(placeUser(6, 10)).toBe('F3');
    expect(placeUser(8, 10)).toBe('F4');
  });

  it('updates skill mastery and schedules review item', () => {
    const user = buildUser();

    const reviewOne = applyItemResult(user, 'budgeting', true);
    const reviewTwo = applyItemResult(user, 'budgeting', false);

    expect(reviewOne.skillId).toBe('budgeting');
    expect(reviewTwo.skillId).toBe('budgeting');
    expect(user.skills.budgeting?.mastery).toBeCloseTo(0.23);
    expect(user.skills.budgeting?.lastReviewedAt).toBeTruthy();
    expect(user.skills.budgeting?.nextReviewAt).toBeTruthy();
    expect(new Date(user.skills.budgeting?.nextReviewAt ?? '').getTime()).toBeGreaterThan(Date.now());
  });

  it('increments streak on consecutive days and resets after missed day', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const continued = buildUser({ streakDays: 4, lastActiveDate: yesterday.toISOString().slice(0, 10) });
    expect(markSessionActivity(continued)).toBe(5);

    const reset = buildUser({ streakDays: 4, lastActiveDate: threeDaysAgo.toISOString().slice(0, 10) });
    expect(markSessionActivity(reset)).toBe(1);

    const sameDay = buildUser({ streakDays: 4, lastActiveDate: today.toISOString().slice(0, 10) });
    expect(markSessionActivity(sameDay)).toBe(4);
  });

  it('calculates streak boundaries using provided timezone', () => {
    const profile = buildUser({ streakDays: 4, lastActiveDate: '2026-02-12' });

    const beforeMidnightPacific = new Date('2026-02-13T07:30:00.000Z');
    expect(markSessionActivity(profile, { now: beforeMidnightPacific, timeZone: 'America/Los_Angeles' })).toBe(4);

    const afterMidnightPacific = new Date('2026-02-13T08:30:00.000Z');
    expect(markSessionActivity(profile, { now: afterMidnightPacific, timeZone: 'America/Los_Angeles' })).toBe(5);
  });
});
