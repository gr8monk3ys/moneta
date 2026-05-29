import type { FinanceLevel, ReviewItem, UserProfile } from './types.js';

interface SessionActivityOptions {
  now?: Date;
  timeZone?: string;
}

// --- Tunable learning-engine constants ---
// Per-skill mastery is a 0..1 estimate. A correct answer nudges it up; an incorrect
// one down by slightly less, so a single correct answer does not fully erase a miss.
// These are starting heuristics and should be revisited with real learner data.
const INITIAL_SKILL_MASTERY = 0.2;
const MASTERY_CORRECT_DELTA = 0.1;
const MASTERY_INCORRECT_DELTA = -0.07;
/** Mastery at or above this counts a skill as "mastered" (used for progress + lesson completion). */
export const MASTERY_THRESHOLD = 0.8;

// Spaced-repetition review intervals (hours) by mastery tier: stronger skills resurface less often.
const REVIEW_STRONG_MASTERY = 0.8;
const REVIEW_MEDIUM_MASTERY = 0.5;
const REVIEW_INTERVAL_STRONG_HOURS = 72;
const REVIEW_INTERVAL_MEDIUM_HOURS = 48;
const REVIEW_INTERVAL_WEAK_HOURS = 24;

// Placement: score (correct/total) maps onto finance levels. Each entry is the
// exclusive upper bound for that level; scores at/above the last bound place at F6.
const PLACEMENT_THRESHOLDS: ReadonlyArray<{ readonly maxScore: number; readonly level: FinanceLevel }> = [
  { maxScore: 0.35, level: 'F1' },
  { maxScore: 0.55, level: 'F2' },
  { maxScore: 0.75, level: 'F3' },
  { maxScore: 0.9, level: 'F4' },
  { maxScore: 0.97, level: 'F5' }
];

function calculatePlacementLevel(correctAnswers: number, total: number): FinanceLevel {
  const score = total === 0 ? 0 : correctAnswers / total;
  for (const tier of PLACEMENT_THRESHOLDS) {
    if (score < tier.maxScore) {
      return tier.level;
    }
  }
  return 'F6';
}

function nextMastery(previous: number, isCorrect: boolean): number {
  const delta = isCorrect ? MASTERY_CORRECT_DELTA : MASTERY_INCORRECT_DELTA;
  const updated = previous + delta;
  return Math.min(1, Math.max(0, Number(updated.toFixed(2))));
}

function dueReviewDate(mastery: number, now: Date): string {
  const hours = mastery > REVIEW_STRONG_MASTERY
    ? REVIEW_INTERVAL_STRONG_HOURS
    : mastery > REVIEW_MEDIUM_MASTERY
      ? REVIEW_INTERVAL_MEDIUM_HOURS
      : REVIEW_INTERVAL_WEAK_HOURS;
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

const LEVEL_ORDER: FinanceLevel[] = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'];

/** Return the higher of two finance levels. Used so re-running placement never demotes a user. */
export function higherLevel(a: FinanceLevel, b: FinanceLevel): FinanceLevel {
  return LEVEL_ORDER.indexOf(b) > LEVEL_ORDER.indexOf(a) ? b : a;
}

export function applyItemResult(profile: UserProfile, skillId: string, isCorrect: boolean): ReviewItem {
  const now = new Date();
  const skill = profile.skills[skillId] ?? { skillId, mastery: INITIAL_SKILL_MASTERY };
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
