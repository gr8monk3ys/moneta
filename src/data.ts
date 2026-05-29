import { createDefaultEntitlement } from './billing.js';
import type { UserProfile } from './types.js';
import {
  buildGeneratedItems,
  createLevelSeeds,
  normalizeMcqChoices,
  withFallbackChoices
} from './content/curriculum.generator.js';
import {
  getNextLessonForLevelFromCurriculum,
  getNextLessonForProgressFromCurriculum,
  lessonOrdinal,
  sortLessons
} from './content/curriculum.js';

export {
  lessons,
  listCurriculum,
  getLessonById,
  getKnownSkillIds,
  getNextLessonForLevel,
  isLessonCompleted,
  getNextLessonForProgress
} from './content/curriculum.js';

// Exposed for focused coverage of normalization and sorting branches that are hard to reach through public APIs.
export const __testables = {
  createLevelSeeds,
  buildGeneratedItems,
  normalizeMcqChoices,
  withFallbackChoices,
  lessonOrdinal,
  sortLessons,
  getNextLessonForLevelFromCurriculum,
  getNextLessonForProgressFromCurriculum
} as const;

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
