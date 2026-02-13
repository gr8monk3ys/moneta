import type { FinanceLevel, ReviewItem, UserProfile } from './types.js';

interface SessionActivityOptions {
  now?: Date;
  timeZone?: string;
}

function calculatePlacementLevel(correctAnswers: number, total: number): FinanceLevel {
  const score = total === 0 ? 0 : correctAnswers / total;
  if (score < 0.35) return 'F1';
  if (score < 0.55) return 'F2';
  if (score < 0.75) return 'F3';
  if (score < 0.9) return 'F4';
  if (score < 0.97) return 'F5';
  return 'F6';
}

function nextMastery(previous: number, isCorrect: boolean): number {
  const delta = isCorrect ? 0.1 : -0.07;
  const updated = previous + delta;
  return Math.min(1, Math.max(0, Number(updated.toFixed(2))));
}

function dueReviewDate(mastery: number, now: Date): string {
  const hours = mastery > 0.8 ? 72 : mastery > 0.5 ? 48 : 24;
  const dueAt = new Date(now.getTime() + hours * 60 * 60 * 1000);
  return dueAt.toISOString();
}

function dayKeyInTimeZone(now: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return formatter.format(now);
}

function dayDifference(currentDayKey: string, previousDayKey: string): number {
  const currentUtcMidnight = Date.parse(`${currentDayKey}T00:00:00.000Z`);
  const previousUtcMidnight = Date.parse(`${previousDayKey}T00:00:00.000Z`);
  const diffMs = currentUtcMidnight - previousUtcMidnight;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function updateStreak(profile: UserProfile, now: Date, timeZone: string): number {
  const today = dayKeyInTimeZone(now, timeZone);
  if (!profile.lastActiveDate) {
    profile.lastActiveDate = today;
    profile.streakDays = 1;
    return profile.streakDays;
  }

  const days = dayDifference(today, profile.lastActiveDate);

  if (days === 1) profile.streakDays += 1;
  else if (days > 1) profile.streakDays = 1;

  profile.lastActiveDate = today;
  return profile.streakDays;
}

export function placeUser(correctAnswers: number, total: number): FinanceLevel {
  return calculatePlacementLevel(correctAnswers, total);
}

export function applyItemResult(profile: UserProfile, skillId: string, isCorrect: boolean): ReviewItem {
  const now = new Date();
  const skill = profile.skills[skillId] ?? { skillId, mastery: 0.2 };
  const mastery = nextMastery(skill.mastery, isCorrect);
  const dueDate = dueReviewDate(mastery, now);

  profile.skills[skillId] = {
    skillId,
    mastery,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: dueDate
  };

  return {
    itemId: `${skillId}-review-${now.getTime()}`,
    skillId,
    dueDate
  };
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function markSessionActivity(profile: UserProfile, options: SessionActivityOptions = {}): number {
  const now = options.now ?? new Date();
  const timeZone = options.timeZone ?? 'UTC';
  return updateStreak(profile, now, timeZone);
}
