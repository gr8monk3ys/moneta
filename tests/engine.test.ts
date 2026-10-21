import { describe, expect, it } from 'vitest';
import { createDefaultEntitlement } from '../src/billing.js';
import { applyItemResult, isValidTimeZone, markSessionActivity, placeUser, repairStreak } from '../src/engine.js';
import type { UserProfile } from '../src/types.js';

function buildUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    userId: 'user-1',
    currentLevel: 'F1',
    streakDays: 0,
    skills: {},
    entitlement: createDefaultEntitlement(),
    ...overrides
  };
}

describe('engine', () => {
  it('places users across score bands', () => {
    expect(placeUser(0, 10)).toBe('F1');
    expect(placeUser(4, 10)).toBe('F2');
    expect(placeUser(6, 10)).toBe('F3');
    expect(placeUser(8, 10)).toBe('F4');
    expect(placeUser(9, 10)).toBe('F5');
    expect(placeUser(10, 10)).toBe('F6');
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

  it('clamps mastery bounds and validates timezone identifiers', () => {
    const cappedHigh = buildUser({
      skills: {
        investing: { skillId: 'investing', mastery: 0.96 }
      }
    });
    applyItemResult(cappedHigh, 'investing', true);
    expect(cappedHigh.skills.investing?.mastery).toBe(1);

    const cappedLow = buildUser({
      skills: {
        budgeting: { skillId: 'budgeting', mastery: 0.01 }
      }
    });
    applyItemResult(cappedLow, 'budgeting', false);
    expect(cappedLow.skills.budgeting?.mastery).toBe(0);

    expect(isValidTimeZone('America/Los_Angeles')).toBe(true);
    expect(isValidTimeZone('Mars/OlympusMons')).toBe(false);
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

  it('repairs a streak broken by exactly one missed day, preserving the count', () => {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const profile = buildUser({ streakDays: 6, lastActiveDate: twoDaysAgo.toISOString().slice(0, 10) });

    const result = repairStreak(profile);
    expect(result).toEqual({ repaired: true, streakDays: 6 });
    // lastActiveDate is pulled forward to "yesterday" so the next session continues
    // the streak instead of resetting it.
    expect(profile.lastActiveDate).not.toBe(twoDaysAgo.toISOString().slice(0, 10));
    expect(markSessionActivity(profile, { now: today })).toBe(7);
  });

  it('refuses to repair a streak that is not broken', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const continuing = buildUser({ streakDays: 4, lastActiveDate: yesterday.toISOString().slice(0, 10) });
    expect(repairStreak(continuing)).toEqual({ repaired: false, reason: 'not_broken' });

    const activeToday = buildUser({ streakDays: 4, lastActiveDate: today.toISOString().slice(0, 10) });
    expect(repairStreak(activeToday)).toEqual({ repaired: false, reason: 'not_broken' });
  });

  it('refuses to repair a streak with no prior activity or more than one missed day', () => {
    const today = new Date();
    const fourDaysAgo = new Date(today);
    fourDaysAgo.setDate(today.getDate() - 4);

    const neverActive = buildUser({ streakDays: 0 });
    expect(repairStreak(neverActive)).toEqual({ repaired: false, reason: 'no_activity' });

    const longLapsed = buildUser({ streakDays: 6, lastActiveDate: fourDaysAgo.toISOString().slice(0, 10) });
    expect(repairStreak(longLapsed)).toEqual({ repaired: false, reason: 'too_many_missed_days' });
  });

  it('cannot repair the same break twice', () => {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const profile = buildUser({ streakDays: 6, lastActiveDate: twoDaysAgo.toISOString().slice(0, 10) });
    expect(repairStreak(profile, { now: today }).repaired).toBe(true);
    expect(repairStreak(profile, { now: today })).toEqual({ repaired: false, reason: 'not_broken' });
  });
});
