import { createDefaultEntitlement } from './billing.js';
import type { Lesson, UserProfile } from './types.js';

export const lessons: Lesson[] = [
  {
    lessonId: 'lesson-cash-flow-f1-001',
    title: 'Cash Flow Basics',
    estimatedMinutes: 5,
    level: 'F1',
    items: [
      {
        itemId: 'item-apr-001',
        skillId: 'apr-vs-apy',
        prompt: 'APR is most commonly used to describe:',
        correctAnswer: 'borrowing cost'
      },
      {
        itemId: 'item-budget-001',
        skillId: 'basic-budgeting',
        prompt: 'Income $3,000 and expenses $2,700 leaves how much?',
        correctAnswer: '300'
      }
    ]
  }
];

export const users: Record<string, UserProfile> = {
  demo: {
    userId: 'demo',
    currentLevel: 'F1',
    streakDays: 0,
    entitlement: createDefaultEntitlement(),
    skills: {
      'apr-vs-apy': { skillId: 'apr-vs-apy', mastery: 0.2 },
      'basic-budgeting': { skillId: 'basic-budgeting', mastery: 0.2 }
    }
  }
};
