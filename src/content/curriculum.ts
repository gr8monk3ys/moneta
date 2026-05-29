// Assembled curriculum (seed + generated) and read queries.
import type { Lesson, UserProfile } from '../types.js';
import { seedLessons } from './curriculum.seed.js';
import { authoredLessons } from './curriculum.authored.js';
import { generateLessons, normalizeLessonContent } from './curriculum.generator.js';

export const lessons: Lesson[] = [...seedLessons, ...authoredLessons, ...generateLessons()];

// Normalize item formats/choices/acceptable-answers/editorial defaults across the
// full curriculum (static seed + generated), matching the original load-time pass.
normalizeLessonContent(lessons);

const levelRank: Record<Lesson['level'], number> = {
  F1: 1,
  F2: 2,
  F3: 3,
  F4: 4,
  F5: 5,
  F6: 6
};

const trackRank: Record<Lesson['track'], number> = {
  core: 0,
  advanced: 1
};

function lessonOrdinal(lessonId: string): number {
  const match = lessonId.match(/-(\d{3})$/);
  if (!match) {
    return 9999;
  }

  return Number(match[1]);
}

function sortLessons(a: Lesson, b: Lesson): number {
  const byLevel = levelRank[a.level] - levelRank[b.level];
  if (byLevel !== 0) {
    return byLevel;
  }

  const byTrack = trackRank[a.track] - trackRank[b.track];
  if (byTrack !== 0) {
    return byTrack;
  }

  if (a.premium !== b.premium) {
    return Number(a.premium) - Number(b.premium);
  }

  const byOrdinal = lessonOrdinal(a.lessonId) - lessonOrdinal(b.lessonId);
  if (byOrdinal !== 0) {
    return byOrdinal;
  }

  return a.lessonId.localeCompare(b.lessonId);
}

function getNextLessonForLevelFromCurriculum(curriculum: Lesson[], level: Lesson['level']): Lesson | undefined {
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

function getNextLessonForProgressFromCurriculum(user: UserProfile, curriculum: Lesson[]): Lesson | undefined {
  return curriculum.find((lesson) => !isLessonCompleted(user, lesson.lessonId));
}

export function listCurriculum(includePremium: boolean): Lesson[] {
  return lessons
    .filter((lesson) => includePremium || !lesson.premium)
    .sort(sortLessons);
}

export function getLessonById(lessonId: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.lessonId === lessonId);
}

let knownSkillIds: Set<string> | undefined;

/** Set of every skillId that appears in the curriculum. Used to reject results for skills that do not exist. */
export function getKnownSkillIds(): Set<string> {
  if (!knownSkillIds) {
    knownSkillIds = new Set(lessons.flatMap((lesson) => lesson.items.map((item) => item.skillId)));
  }

  return knownSkillIds;
}

export function getNextLessonForLevel(level: Lesson['level'], includePremium: boolean): Lesson | undefined {
  return getNextLessonForLevelFromCurriculum(listCurriculum(includePremium), level);
}

export function isLessonCompleted(user: UserProfile, lessonId: string): boolean {
  return Boolean(user.completedLessons?.[lessonId]);
}

export function getNextLessonForProgress(user: UserProfile, includePremium: boolean): Lesson | undefined {
  return getNextLessonForProgressFromCurriculum(user, listCurriculum(includePremium));
}

export { lessonOrdinal, sortLessons, getNextLessonForLevelFromCurriculum, getNextLessonForProgressFromCurriculum };
