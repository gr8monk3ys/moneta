import { createDefaultEntitlement } from './billing.js';
import type { Lesson, UserProfile } from './types.js';

export const lessons: Lesson[] = [
  {
    lessonId: 'lesson-cash-flow-f1-001',
    title: 'Cash Flow Basics',
    summary: 'Track monthly income, fixed costs, and variable spending.',
    estimatedMinutes: 5,
    level: 'F1',
    track: 'core',
    premium: false,
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
  },
  {
    lessonId: 'lesson-credit-scores-f1-002',
    title: 'Credit Score Foundations',
    summary: 'Understand payment history, utilization, and credit mix.',
    estimatedMinutes: 6,
    level: 'F1',
    track: 'core',
    premium: false,
    items: [
      {
        itemId: 'item-credit-001',
        skillId: 'credit-utilization',
        prompt: 'Using $200 of a $1,000 credit limit gives utilization of:',
        correctAnswer: '20%'
      },
      {
        itemId: 'item-credit-002',
        skillId: 'payment-history',
        prompt: 'The largest factor in most credit score models is:',
        correctAnswer: 'payment history'
      }
    ]
  },
  {
    lessonId: 'lesson-emergency-fund-f2-001',
    title: 'Emergency Fund Strategy',
    summary: 'Build buffer targets and contribution cadence.',
    estimatedMinutes: 7,
    level: 'F2',
    track: 'core',
    premium: false,
    items: [
      {
        itemId: 'item-emergency-001',
        skillId: 'emergency-fund-target',
        prompt: 'A common emergency fund target is:',
        correctAnswer: '3-6 months'
      },
      {
        itemId: 'item-emergency-002',
        skillId: 'sinking-funds',
        prompt: 'A sinking fund is best described as:',
        correctAnswer: 'saving ahead for known expenses'
      }
    ]
  },
  {
    lessonId: 'lesson-debt-paydown-f2-002',
    title: 'Debt Paydown Systems',
    summary: 'Compare avalanche and snowball repayment methods.',
    estimatedMinutes: 8,
    level: 'F2',
    track: 'core',
    premium: false,
    items: [
      {
        itemId: 'item-debt-001',
        skillId: 'debt-avalanche',
        prompt: 'Debt avalanche prioritizes debts by:',
        correctAnswer: 'highest interest rate'
      },
      {
        itemId: 'item-debt-002',
        skillId: 'debt-snowball',
        prompt: 'Debt snowball prioritizes debts by:',
        correctAnswer: 'lowest balance first'
      }
    ]
  },
  {
    lessonId: 'lesson-investing-basics-f3-001',
    title: 'Investing Basics',
    summary: 'Learn risk, diversification, and long-term compounding.',
    estimatedMinutes: 8,
    level: 'F3',
    track: 'core',
    premium: false,
    items: [
      {
        itemId: 'item-invest-001',
        skillId: 'diversification',
        prompt: 'Diversification primarily reduces:',
        correctAnswer: 'single-asset risk'
      },
      {
        itemId: 'item-invest-002',
        skillId: 'compound-growth',
        prompt: 'Compounding is strongest when you:',
        correctAnswer: 'start early and stay invested'
      }
    ]
  },
  {
    lessonId: 'lesson-tax-advantaged-f3-002',
    title: 'Tax-Advantaged Accounts',
    summary: 'Compare account wrappers and tax treatment.',
    estimatedMinutes: 8,
    level: 'F3',
    track: 'core',
    premium: false,
    items: [
      {
        itemId: 'item-tax-001',
        skillId: 'traditional-vs-roth',
        prompt: 'Roth contributions are generally made with:',
        correctAnswer: 'after-tax dollars'
      },
      {
        itemId: 'item-tax-002',
        skillId: 'tax-advantaged-order',
        prompt: 'Employer match is often prioritized because it is:',
        correctAnswer: 'an immediate return'
      }
    ]
  },
  {
    lessonId: 'lesson-retirement-income-f4-001',
    title: 'Retirement Income Planning',
    summary: 'Estimate spending needs and withdrawal sequencing.',
    estimatedMinutes: 9,
    level: 'F4',
    track: 'advanced',
    premium: true,
    items: [
      {
        itemId: 'item-retire-001',
        skillId: 'withdrawal-rate',
        prompt: 'Withdrawal rates should account for:',
        correctAnswer: 'sequence risk and longevity'
      },
      {
        itemId: 'item-retire-002',
        skillId: 'bucket-strategy',
        prompt: 'A retirement bucket strategy separates assets by:',
        correctAnswer: 'time horizon'
      }
    ]
  },
  {
    lessonId: 'lesson-insurance-optimization-f4-002',
    title: 'Insurance Optimization',
    summary: 'Evaluate deductible tradeoffs and coverage gaps.',
    estimatedMinutes: 9,
    level: 'F4',
    track: 'advanced',
    premium: true,
    items: [
      {
        itemId: 'item-insurance-001',
        skillId: 'deductible-tradeoff',
        prompt: 'Higher deductibles usually mean:',
        correctAnswer: 'lower premiums'
      },
      {
        itemId: 'item-insurance-002',
        skillId: 'liability-coverage',
        prompt: 'Umbrella insurance primarily extends:',
        correctAnswer: 'liability coverage limits'
      }
    ]
  },
  {
    lessonId: 'lesson-small-business-f5-001',
    title: 'Small Business Cash Systems',
    summary: 'Model runway, margin, and tax reserves.',
    estimatedMinutes: 10,
    level: 'F5',
    track: 'advanced',
    premium: true,
    items: [
      {
        itemId: 'item-business-001',
        skillId: 'runway-planning',
        prompt: 'Cash runway is calculated as:',
        correctAnswer: 'cash balance divided by monthly burn'
      },
      {
        itemId: 'item-business-002',
        skillId: 'owner-pay',
        prompt: 'Owner pay should be treated as:',
        correctAnswer: 'a planned operating expense'
      }
    ]
  },
  {
    lessonId: 'lesson-real-estate-f5-002',
    title: 'Real Estate Decision Frameworks',
    summary: 'Assess cap rate, leverage, and maintenance reserve risk.',
    estimatedMinutes: 10,
    level: 'F5',
    track: 'advanced',
    premium: true,
    items: [
      {
        itemId: 'item-re-001',
        skillId: 'cap-rate',
        prompt: 'Cap rate is net operating income divided by:',
        correctAnswer: 'property value'
      },
      {
        itemId: 'item-re-002',
        skillId: 'cash-on-cash',
        prompt: 'Cash-on-cash return compares annual cash flow against:',
        correctAnswer: 'cash invested'
      }
    ]
  },
  {
    lessonId: 'lesson-tax-strategy-f6-001',
    title: 'Advanced Tax Strategy',
    summary: 'Coordinate marginal brackets, deductions, and timing.',
    estimatedMinutes: 11,
    level: 'F6',
    track: 'advanced',
    premium: true,
    items: [
      {
        itemId: 'item-taxadv-001',
        skillId: 'tax-loss-harvesting',
        prompt: 'Tax-loss harvesting can be used to:',
        correctAnswer: 'offset taxable gains'
      },
      {
        itemId: 'item-taxadv-002',
        skillId: 'asset-location',
        prompt: 'Asset location means placing assets based on:',
        correctAnswer: 'tax efficiency of each account'
      }
    ]
  },
  {
    lessonId: 'lesson-portfolio-risk-f6-002',
    title: 'Portfolio Risk Controls',
    summary: 'Stress test concentration and rebalance with policy targets.',
    estimatedMinutes: 11,
    level: 'F6',
    track: 'advanced',
    premium: true,
    items: [
      {
        itemId: 'item-risk-001',
        skillId: 'volatility-budget',
        prompt: 'A volatility budget helps constrain:',
        correctAnswer: 'portfolio risk exposure'
      },
      {
        itemId: 'item-risk-002',
        skillId: 'rebalancing-policy',
        prompt: 'Systematic rebalancing is mainly used to:',
        correctAnswer: 'maintain target allocation'
      }
    ]
  }
];

const levelRank: Record<Lesson['level'], number> = {
  F1: 1,
  F2: 2,
  F3: 3,
  F4: 4,
  F5: 5,
  F6: 6
};

function sortLessons(a: Lesson, b: Lesson): number {
  const byLevel = levelRank[a.level] - levelRank[b.level];
  if (byLevel !== 0) {
    return byLevel;
  }

  if (a.premium !== b.premium) {
    return Number(a.premium) - Number(b.premium);
  }

  return a.lessonId.localeCompare(b.lessonId);
}

export function listCurriculum(includePremium: boolean): Lesson[] {
  return lessons
    .filter((lesson) => includePremium || !lesson.premium)
    .sort(sortLessons);
}

export function getLessonById(lessonId: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.lessonId === lessonId);
}

export function getNextLessonForLevel(level: Lesson['level'], includePremium: boolean): Lesson | undefined {
  const curriculum = listCurriculum(includePremium);
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

export const users: Record<string, UserProfile> = {
  demo: {
    userId: 'demo',
    currentLevel: 'F1',
    streakDays: 0,
    entitlement: createDefaultEntitlement(),
    skills: {
      'apr-vs-apy': { skillId: 'apr-vs-apy', mastery: 0.2 },
      'basic-budgeting': { skillId: 'basic-budgeting', mastery: 0.2 },
      'credit-utilization': { skillId: 'credit-utilization', mastery: 0.2 },
      diversification: { skillId: 'diversification', mastery: 0.2 }
    }
  }
};
