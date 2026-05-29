// Procedural curriculum generator: expands per-level topic tables into lessons.
import type { Lesson } from '../types.js';

interface ExpansionTopic {
  slug: string;
  title: string;
  summary: string;
  keyConcept: string;
  benchmark?: string;
  formula?: string;
  action?: string;
  risk?: string;
  checkIn?: string;
  mistake?: string;
}

interface GeneratedLessonSeed {
  lessonId: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  level: Lesson['level'];
  track: Lesson['track'];
  premium: boolean;
  skillBase: string;
  keyConcept: string;
  benchmark: string;
  formula: string;
  action: string;
  risk: string;
  checkIn: string;
  mistake: string;
}

const EDITORIAL_REVIEW_DATE = '2026-02-14T00:00:00.000Z';

function formatOrdinal(value: number): string {
  return String(value).padStart(3, '0');
}

function buildLessonId(slug: string, level: Lesson['level'], ordinal: number): string {
  return `lesson-${slug}-${level.toLowerCase()}-${formatOrdinal(ordinal)}`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function shuffleDeterministic<T>(items: T[], seed: string): T[] {
  const result = [...items];
  let state = hashString(seed) || 1;

  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const pick = state % (index + 1);
    const tmp = result[index];
    result[index] = result[pick] as T;
    result[pick] = tmp as T;
  }

  return result;
}

function createLevelSeeds(
  level: Lesson['level'],
  track: Lesson['track'],
  premium: boolean,
  firstOrdinal: number,
  topics: ExpansionTopic[]
): GeneratedLessonSeed[] {
  return topics.map((topic, index) => {
    const ordinal = firstOrdinal + index;
    const lowerConcept = topic.keyConcept.toLowerCase();

    return {
      lessonId: buildLessonId(topic.slug, level, ordinal),
      title: topic.title,
      summary: topic.summary,
      estimatedMinutes: premium ? 9 : 7,
      level,
      track,
      premium,
      skillBase: `${topic.slug}-${level.toLowerCase()}`,
      keyConcept: topic.keyConcept,
      benchmark: topic.benchmark ?? `set a measurable target for ${lowerConcept}`,
      formula: topic.formula ?? `${topic.keyConcept} baseline minus planned costs`,
      action: topic.action ?? `review ${lowerConcept} and automate one improvement`,
      risk: topic.risk ?? `ignoring assumptions and one-time expenses`,
      checkIn: topic.checkIn ?? 'monthly',
      mistake: topic.mistake ?? `treating ${lowerConcept} decisions as one-time events`
    };
  });
}

function buildGeneratedItems(seed: GeneratedLessonSeed): Lesson['items'] {
  const monthlyDelta = 15 + (hashString(seed.lessonId) % 46);
  const annualDelta = monthlyDelta * 12;

  const prompts = [
    {
      suffix: 'concept',
      prompt: `In "${seed.title}", the primary concept to master is:`,
      answer: seed.keyConcept,
      format: 'mcq' as const,
      explanation: `This lesson is anchored on ${seed.keyConcept.toLowerCase()} as the core decision concept.`
    },
    {
      suffix: 'benchmark',
      prompt: 'A practical benchmark for this topic is:',
      answer: seed.benchmark,
      format: 'mcq' as const,
      explanation: 'Benchmarks make abstract concepts actionable and trackable over time.'
    },
    {
      suffix: 'formula',
      prompt: 'A useful planning equation here is:',
      answer: seed.formula,
      format: 'mcq' as const,
      explanation: 'Formulas force precise assumptions and make tradeoffs easier to compare.'
    },
    {
      suffix: 'action',
      prompt: 'A high-impact next action is to:',
      answer: seed.action,
      format: 'mcq' as const,
      explanation: 'Execution habits drive outcomes more than one-time planning.'
    },
    {
      suffix: 'risk',
      prompt: 'A key risk to monitor is:',
      answer: seed.risk,
      format: 'mcq' as const,
      explanation: 'Good financial plans identify failure modes before they happen.'
    },
    {
      suffix: 'cadence',
      prompt: 'The minimum review cadence should be:',
      answer: seed.checkIn,
      format: 'mcq' as const,
      explanation: 'Regular review cadence keeps plan drift under control.'
    },
    {
      suffix: 'mistake',
      prompt: 'A common mistake to avoid is:',
      answer: seed.mistake,
      format: 'mcq' as const,
      explanation: 'Explicit anti-patterns reduce repeat errors in real decisions.'
    },
    {
      suffix: 'annualize',
      prompt: `If a change saves $${monthlyDelta} per month, about how much is that per year?`,
      answer: String(annualDelta),
      format: 'numeric' as const,
      explanation: 'Annualizing converts monthly impact into yearly impact. Multiply by 12.'
    }
  ];

  const distractorPool = [
    seed.benchmark,
    seed.formula,
    seed.action,
    seed.risk,
    seed.checkIn,
    seed.mistake,
    `skip ${seed.checkIn} review cadence`,
    'optimize for short-term appearance over plan durability',
    'delay planning until forced by urgency',
    'do nothing and hope outcomes improve',
    'focus only on short-term comfort over long-term durability'
  ];

  return prompts.map((entry, index) => {
    const itemId = `item-${seed.skillBase}-${formatOrdinal(index + 1)}`;
    const skillId = `${seed.skillBase}-${entry.suffix}`;

    let choices: string[] | undefined;
    if (entry.format === 'mcq') {
      const unique = new Set<string>();
      const pickChoices: string[] = [];

      const addChoice = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) {
          return;
        }

        if (unique.has(trimmed)) {
          return;
        }

        unique.add(trimmed);
        pickChoices.push(trimmed);
      };

      addChoice(entry.answer);
      for (const candidate of distractorPool) {
        addChoice(candidate);
        if (pickChoices.length >= 4) {
          break;
        }
      }

      while (pickChoices.length < 4) {
        addChoice(`option ${pickChoices.length + 1}`);
      }

      choices = shuffleDeterministic(pickChoices.slice(0, 4), itemId);
    }

    return {
      itemId,
      skillId,
      prompt: entry.prompt,
      correctAnswer: entry.answer,
      acceptableAnswers: [entry.answer],
      format: entry.format,
      choices,
      explanation: entry.explanation
    };
  });
}

function buildGeneratedLesson(seed: GeneratedLessonSeed): Lesson {
  return {
    lessonId: seed.lessonId,
    title: seed.title,
    summary: seed.summary,
    estimatedMinutes: seed.estimatedMinutes,
    level: seed.level,
    track: seed.track,
    premium: seed.premium,
    items: buildGeneratedItems(seed),
    editorial: {
      status: 'approved',
      reviewer: 'Moneta Curriculum Team',
      reviewedAt: EDITORIAL_REVIEW_DATE,
      notes: 'Structured editorial pass completed for clarity, non-advisory framing, and consistency.'
    }
  };
}

const f6ExpansionTopics: ExpansionTopic[] = [
  {
    slug: 'factor-exposure-audits',
    title: 'Factor Exposure Audits',
    summary: 'Map unintended style and factor tilts across holdings.',
    keyConcept: 'factor risk attribution',
    benchmark: 'portfolio factor report reviewed against policy bands',
    formula: 'portfolio return decomposition by factor contribution',
    action: 'trim positions that breach factor exposure limits',
    risk: 'hidden concentration in one rewarded factor',
    checkIn: 'quarterly',
    mistake: 'assuming broad-fund labels eliminate factor tilts'
  },
  {
    slug: 'scenario-stress-testing',
    title: 'Scenario Stress Testing',
    summary: 'Stress test portfolio and cash plans against adverse regimes.',
    keyConcept: 'scenario-based resilience',
    benchmark: 'stress scenarios documented with response actions',
    formula: 'portfolio drawdown + cash need under scenario',
    action: 'pre-commit responses for top three adverse scenarios',
    risk: 'reactionary decisions during volatility spikes',
    checkIn: 'quarterly',
    mistake: 'running scenarios without predefined action thresholds'
  },
  {
    slug: 'policy-based-withdrawal-governance',
    title: 'Policy-Based Withdrawal Governance',
    summary: 'Use guardrails to adapt withdrawals without panic reactions.',
    keyConcept: 'guardrail withdrawal policy',
    benchmark: 'withdrawal adjustments tied to policy triggers',
    formula: 'withdrawal rate = annual withdrawal / portfolio value',
    action: 'define raise/hold/cut bands before retirement years',
    risk: 'overspending after strong years and forced cuts later',
    checkIn: 'annually',
    mistake: 'using fixed withdrawals regardless of market regime'
  },
  {
    slug: 'estate-liquidity-planning',
    title: 'Estate Liquidity Planning',
    summary: 'Plan liquidity for taxes, obligations, and transfer timelines.',
    keyConcept: 'estate liquidity matching',
    benchmark: 'liquidity sources mapped to expected estate obligations',
    formula: 'expected obligations - immediately liquid assets',
    action: 'review beneficiary and account titling consistency',
    risk: 'forced asset sales from poor liquidity planning',
    checkIn: 'annually',
    mistake: 'updating documents without updating account designations'
  },
  {
    slug: 'cross-account-tax-orchestration',
    title: 'Cross-Account Tax Orchestration',
    summary: 'Coordinate taxable, tax-deferred, and tax-free accounts together.',
    keyConcept: 'multi-account tax orchestration',
    benchmark: 'annual decisions optimized across all account types',
    formula: 'after-tax cash flow = withdrawals - tax drag',
    action: 'model conversion, withdrawal, and harvesting interactions',
    risk: 'suboptimal choices when accounts are managed in isolation',
    checkIn: 'annually',
    mistake: 'making account decisions without integrated tax model'
  },
  {
    slug: 'advanced-cash-reserve-design',
    title: 'Advanced Cash Reserve Design',
    summary: 'Segment reserves by horizon, purpose, and liquidity quality.',
    keyConcept: 'tiered liquidity architecture',
    benchmark: 'reserves mapped to 0-12, 12-36, and 36+ month horizons',
    formula: 'required reserve = fixed obligations * reserve months',
    action: 'separate operating, contingency, and opportunity reserves',
    risk: 'liquidity mismatch during simultaneous market and income stress',
    checkIn: 'quarterly',
    mistake: 'holding all reserves in a single risk bucket'
  },
  {
    slug: 'decision-journal-discipline',
    title: 'Decision Journal Discipline',
    summary: 'Capture assumptions and outcomes to improve future decisions.',
    keyConcept: 'decision quality feedback loop',
    benchmark: 'major portfolio decisions logged with expected outcomes',
    formula: 'decision quality = process adherence + post-mortem learning',
    action: 'review journal entries before changing policy',
    risk: 'repeating mistakes without process memory',
    checkIn: 'monthly',
    mistake: 'tracking outcomes without recording initial assumptions'
  },
  {
    slug: 'macro-regime-sensitivity',
    title: 'Macro Regime Sensitivity',
    summary: 'Understand how regime shifts alter risk and return expectations.',
    keyConcept: 'regime-aware planning',
    benchmark: 'allocation assumptions stress tested across regime ranges',
    formula: 'expected return range by inflation and rate regime',
    action: 'predefine portfolio responses to regime transition signals',
    risk: 'anchoring to one macro environment for all forecasts',
    checkIn: 'quarterly',
    mistake: 'chasing headlines without policy framework'
  },
  {
    slug: 'portfolio-fee-audit',
    title: 'Portfolio Fee Audit',
    summary: 'Identify all-in fees and reduce avoidable fee drag over time.',
    keyConcept: 'fee drag control',
    benchmark: 'all-in fees documented and compared to policy thresholds',
    formula: 'all-in fee = fund fees + advisory fees (if any)',
    action: 'calculate weighted average expense ratio and review advisory/management costs',
    risk: 'quiet compounding drag from small percentage fees',
    checkIn: 'annually',
    mistake: 'ignoring small percentages because they look harmless'
  },
  {
    slug: 'liquidity-risk-budget',
    title: 'Liquidity Risk Budget',
    summary: 'Cap illiquid exposure so cash needs do not force bad decisions.',
    keyConcept: 'illiquidity budgeting',
    benchmark: 'illiquid assets capped within written policy limits',
    formula: 'illiquid % = illiquid assets / total investable assets',
    action: 'tag each holding as liquid or illiquid and set a cap with triggers',
    risk: 'needing cash when assets cannot be sold',
    checkIn: 'quarterly',
    mistake: 'assuming all assets are sellable on demand'
  },
  {
    slug: 'tax-gain-harvesting',
    title: 'Tax Gain Harvesting',
    summary: 'Use bracket awareness when realizing gains in taxable accounts.',
    keyConcept: 'bracket-aware gain harvesting',
    benchmark: 'gain realizations modeled against bracket headroom',
    formula: 'harvested gain ≤ remaining bracket headroom',
    action: 'track bracket headroom and document a harvesting window',
    risk: 'pushing into higher brackets unintentionally',
    checkIn: 'annually',
    mistake: 'realizing gains without checking bracket impact'
  },
  {
    slug: 'charitable-giving-vehicles',
    title: 'Charitable Giving Vehicles',
    summary: 'Choose a giving approach that fits cash flow, goals, and documentation.',
    keyConcept: 'tax-efficient giving basics',
    benchmark: 'giving plan documented with annual budget and receipts',
    formula: 'monthly giving = annual giving budget / 12',
    action: 'choose a vehicle and document a simple annual giving plan',
    risk: 'overcommitting cash flow or losing documentation',
    checkIn: 'annually',
    mistake: 'donating without a plan or receipts'
  }
];

const generatedLessonSeeds: GeneratedLessonSeed[] = [
  ...createLevelSeeds('F6', 'advanced', true, 3, f6ExpansionTopics)
];

function normalizeMcqChoices(correctAnswer: string, rawChoices: string[], seed: string): string[] {
  const seen = new Set<string>();
  const uniqueChoices: string[] = [];

  for (const choice of rawChoices) {
    const trimmed = choice.trim();
    if (!trimmed) {
      continue;
    }

    if (seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    uniqueChoices.push(trimmed);
  }

  if (!seen.has(correctAnswer)) {
    uniqueChoices.push(correctAnswer);
  }

  return shuffleDeterministic(uniqueChoices, seed);
}

function withFallbackChoices(correctAnswer: string, seed: string): string[] {
  const raw = [
    correctAnswer,
    'ignore this concept until later',
    'choose based on urgency alone',
    'follow social media consensus without verification'
  ];

  return normalizeMcqChoices(correctAnswer, raw, seed);
}

export function normalizeLessonContent(allLessons: Lesson[]): void {
  for (const lesson of allLessons) {
    normalizeLesson(lesson);
  }
}

function normalizeLesson(lesson: Lesson): void {
  lesson.items = lesson.items.map((item, index) => {
    const inferredFormat = item.format
      ?? (/[0-9]/.test(item.correctAnswer) || item.correctAnswer.includes('%') ? 'numeric' : (index % 2 === 0 ? 'mcq' : 'scenario'));

    const rawChoices = inferredFormat === 'mcq'
      ? (item.choices ?? withFallbackChoices(item.correctAnswer, item.itemId))
      : undefined;

    const choices = inferredFormat === 'mcq' && rawChoices
      ? normalizeMcqChoices(item.correctAnswer, rawChoices, item.itemId)
      : undefined;

    return {
      ...item,
      format: inferredFormat,
      acceptableAnswers: item.acceptableAnswers ?? [item.correctAnswer],
      choices,
      explanation: item.explanation ?? `Review the ${item.skillId.replace(/-/g, ' ')} concept and connect it to real-world tradeoffs.`
    };
  });

  lesson.editorial ??= {
    status: 'provisional',
    reviewer: 'Moneta Curriculum Team',
    reviewedAt: EDITORIAL_REVIEW_DATE,
    notes: 'Legacy lesson normalized to current editorial standard; pending external SME spot-check.'
  };
}

export function generateLessons(): Lesson[] {
  return generatedLessonSeeds.map(buildGeneratedLesson);
}

export { createLevelSeeds, buildGeneratedItems, normalizeMcqChoices, withFallbackChoices };
