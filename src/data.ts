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

function formatOrdinal(value: number): string {
  return String(value).padStart(3, '0');
}

function buildLessonId(slug: string, level: Lesson['level'], ordinal: number): string {
  return `lesson-${slug}-${level.toLowerCase()}-${formatOrdinal(ordinal)}`;
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
  const prompts = [
    {
      suffix: 'concept',
      prompt: `In "${seed.title}", the primary concept to master is:`,
      answer: seed.keyConcept
    },
    {
      suffix: 'benchmark',
      prompt: 'A practical benchmark for this topic is:',
      answer: seed.benchmark
    },
    {
      suffix: 'formula',
      prompt: 'A useful planning equation here is:',
      answer: seed.formula
    },
    {
      suffix: 'action',
      prompt: 'A high-impact next action is to:',
      answer: seed.action
    },
    {
      suffix: 'risk',
      prompt: 'A key risk to monitor is:',
      answer: seed.risk
    },
    {
      suffix: 'cadence',
      prompt: 'The minimum review cadence should be:',
      answer: seed.checkIn
    },
    {
      suffix: 'mistake',
      prompt: 'A common mistake to avoid is:',
      answer: seed.mistake
    },
    {
      suffix: 'review-loop',
      prompt: 'After each check-in, the best habit is to:',
      answer: `document one change and repeat on a ${seed.checkIn} cycle`
    }
  ];

  return prompts.map((entry, index) => ({
    itemId: `item-${seed.skillBase}-${formatOrdinal(index + 1)}`,
    skillId: `${seed.skillBase}-${entry.suffix}`,
    prompt: entry.prompt,
    correctAnswer: entry.answer
  }));
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
    items: buildGeneratedItems(seed)
  };
}

const f1ExpansionTopics: ExpansionTopic[] = [
  {
    slug: 'paycheck-decoder',
    title: 'Paycheck Decoder',
    summary: 'Read gross pay, deductions, and net pay without guesswork.',
    keyConcept: 'net pay',
    benchmark: 'save at least 10% of net pay before discretionary spending',
    formula: 'gross pay - taxes - payroll deductions = net pay',
    action: 'tag fixed bills before assigning discretionary spending',
    risk: 'planning from gross pay instead of take-home pay',
    checkIn: 'every paycheck',
    mistake: 'ignoring payroll deductions when setting spending limits'
  },
  {
    slug: 'bank-account-basics',
    title: 'Bank Account Basics',
    summary: 'Choose account setup that reduces fees and payment friction.',
    keyConcept: 'fee-aware account setup',
    benchmark: 'keep one month of bills in checking to avoid overdrafts',
    formula: 'monthly fees + overdraft risk - waived fee options',
    action: 'enable low-balance alerts and automatic transfers',
    risk: 'overdraft cascades from delayed deposits',
    checkIn: 'weekly',
    mistake: 'forgetting to map bill due dates to cash arrival'
  },
  {
    slug: 'needs-vs-wants',
    title: 'Needs vs Wants',
    summary: 'Separate essentials from lifestyle spending with clear rules.',
    keyConcept: 'essential vs discretionary classification',
    benchmark: 'essentials stay near 50% of take-home when possible',
    formula: 'needs total / take-home pay',
    action: 'label every transaction as need, want, or goal',
    risk: 'misclassifying recurring wants as essentials',
    checkIn: 'weekly',
    mistake: 'tracking categories without adjusting actual behavior'
  },
  {
    slug: 'bill-calendar-routines',
    title: 'Bill Calendar Routines',
    summary: 'Use due-date systems to prevent late fees and missed payments.',
    keyConcept: 'due-date visibility',
    benchmark: 'no bill paid after due date',
    formula: 'bill due date - reminder buffer days',
    action: 'set two reminders for each fixed bill',
    risk: 'late fees from scattered billing dates',
    checkIn: 'weekly',
    mistake: 'keeping reminders only in email inboxes'
  },
  {
    slug: 'first-budget-iteration',
    title: 'First Budget Iteration',
    summary: 'Build a version-one budget and improve it with real data.',
    keyConcept: 'iterate with actual spending',
    benchmark: 'weekly variance review by top three categories',
    formula: 'planned category spend - actual category spend',
    action: 'adjust one overspending category each week',
    risk: 'all-or-nothing budget abandonment',
    checkIn: 'weekly',
    mistake: 'treating first budget as final'
  },
  {
    slug: 'savings-automation-basics',
    title: 'Savings Automation Basics',
    summary: 'Automate transfers so goals happen without daily willpower.',
    keyConcept: 'pay yourself first',
    benchmark: 'automatic transfer executes within 24 hours of income',
    formula: 'target savings amount / pay periods',
    action: 'create separate savings buckets for short-term goals',
    risk: 'manual transfers skipped during busy weeks',
    checkIn: 'every paycheck',
    mistake: 'leaving goal savings in spending account'
  },
  {
    slug: 'emergency-cash-ramp',
    title: 'Emergency Cash Ramp',
    summary: 'Build starter emergency reserves before pursuing optional goals.',
    keyConcept: 'starter emergency buffer',
    benchmark: 'first milestone reached before nonessential upgrades',
    formula: 'buffer target / monthly contribution',
    action: 'auto-transfer to emergency fund before discretionary spend',
    risk: 'using high-interest debt for routine surprises',
    checkIn: 'monthly',
    mistake: 'treating predictable annual expenses as emergencies'
  },
  {
    slug: 'scam-red-flag-basics',
    title: 'Scam Red-Flag Basics',
    summary: 'Recognize urgency, impersonation, and payment red flags.',
    keyConcept: 'verification before action',
    benchmark: 'zero money movement on unverified urgent messages',
    formula: 'claim source + independent verification + delay buffer',
    action: 'pause, verify, and call back through trusted numbers',
    risk: 'social-engineering pressure to act immediately',
    checkIn: 'monthly',
    mistake: 'sharing codes or passwords during inbound calls'
  }
];

const f2ExpansionTopics: ExpansionTopic[] = [
  {
    slug: 'credit-report-reading',
    title: 'Credit Report Reading',
    summary: 'Interpret tradelines, inquiries, and dispute-ready details.',
    keyConcept: 'credit report hygiene',
    benchmark: 'review each bureau report at least annually',
    formula: 'open accounts + inquiry timeline + error checks',
    action: 'dispute incorrect entries with dated documentation',
    risk: 'unnoticed reporting errors increasing borrowing costs',
    checkIn: 'quarterly',
    mistake: 'checking score only and skipping report line items'
  },
  {
    slug: 'utilization-guardrails',
    title: 'Utilization Guardrails',
    summary: 'Manage revolving balances to reduce score drag and interest.',
    keyConcept: 'credit utilization control',
    benchmark: 'keep aggregate utilization below a predefined threshold',
    formula: 'reported balance / total credit limit',
    action: 'make pre-statement payments when balances spike',
    risk: 'statement-date balances distorting score profile',
    checkIn: 'monthly',
    mistake: 'paying by due date but ignoring statement reporting dates'
  },
  {
    slug: 'interest-cost-planning',
    title: 'Interest Cost Planning',
    summary: 'Translate APR into annual dollar cost for better decisions.',
    keyConcept: 'interest as cash outflow',
    benchmark: 'track annualized interest cost by debt account',
    formula: 'average balance * APR',
    action: 'rank debts by interest burden, not just minimum payment',
    risk: 'slow amortization from minimum-only repayment',
    checkIn: 'monthly',
    mistake: 'choosing debts by emotion without cost analysis'
  },
  {
    slug: 'debt-priority-methods',
    title: 'Debt Priority Methods',
    summary: 'Choose and stick to a debt strategy matched to behavior.',
    keyConcept: 'consistent debt strategy',
    benchmark: 'extra payment applied to one priority debt each cycle',
    formula: 'total debt payment - minimum obligations',
    action: 'automate minimums and schedule targeted extra payment',
    risk: 'strategy switching every month and losing momentum',
    checkIn: 'every paycheck',
    mistake: 'adding new debt while running payoff plan'
  },
  {
    slug: 'sinking-fund-design',
    title: 'Sinking Fund Design',
    summary: 'Fund known future expenses before they become emergencies.',
    keyConcept: 'planned irregular expense funding',
    benchmark: 'top three annual bills are fully pre-funded',
    formula: 'expected cost / months until due date',
    action: 'create category-specific sinking funds',
    risk: 'predictable expenses hitting credit cards',
    checkIn: 'monthly',
    mistake: 'mixing sinking funds with daily spending cash'
  },
  {
    slug: 'insurance-baseline-coverage',
    title: 'Insurance Baseline Coverage',
    summary: 'Align coverage choices with downside risk you cannot absorb.',
    keyConcept: 'catastrophic risk transfer',
    benchmark: 'coverage limits exceed realistic worst-case liabilities',
    formula: 'out-of-pocket maximum + deductible + income risk',
    action: 'review deductibles against emergency fund capacity',
    risk: 'underinsurance on high-impact events',
    checkIn: 'annually',
    mistake: 'choosing policy only by lowest premium'
  },
  {
    slug: 'cash-flow-forecasting',
    title: 'Cash-Flow Forecasting',
    summary: 'Project inflows and outflows to avoid avoidable shortfalls.',
    keyConcept: 'forward-looking cash map',
    benchmark: '13-week cash plan updated on a fixed cadence',
    formula: 'starting cash + inflows - outflows',
    action: 'flag negative weeks and pre-plan corrective moves',
    risk: 'timing mismatches between pay and bills',
    checkIn: 'weekly',
    mistake: 'forecasting totals without week-by-week timing'
  },
  {
    slug: 'subscription-cost-audit',
    title: 'Subscription Cost Audit',
    summary: 'Audit recurring charges and keep only high-value subscriptions.',
    keyConcept: 'recurring spend accountability',
    benchmark: 'every subscription reviewed at least once per quarter',
    formula: 'annual subscription total = monthly fee * 12',
    action: 'cancel one low-value recurring charge each review',
    risk: 'silent price creep in recurring expenses',
    checkIn: 'quarterly',
    mistake: 'tracking only monthly cost, not annual impact'
  }
];

const f3ExpansionTopics: ExpansionTopic[] = [
  {
    slug: 'retirement-contribution-order',
    title: 'Retirement Contribution Order',
    summary: 'Sequence retirement contributions to capture highest value.',
    keyConcept: 'contribution waterfall',
    benchmark: 'employer match captured before optional investing',
    formula: 'match threshold + tax-advantaged capacity',
    action: 'document annual contribution order in one page',
    risk: 'missing match dollars from poor sequencing',
    checkIn: 'every paycheck',
    mistake: 'maxing taxable account before available match'
  },
  {
    slug: 'workplace-benefits-integration',
    title: 'Workplace Benefits Integration',
    summary: 'Combine retirement, HSA, and insurance choices coherently.',
    keyConcept: 'benefit stack optimization',
    benchmark: 'benefits election supports annual goals and cash flow',
    formula: 'benefit value - premium cost - tax effect',
    action: 're-run elections before open enrollment deadline',
    risk: 'paying taxes and premiums without strategic coordination',
    checkIn: 'annually',
    mistake: 'copying last year elections without updated assumptions'
  },
  {
    slug: 'index-fund-selection',
    title: 'Index Fund Selection',
    summary: 'Compare costs, tracking, and diversification across fund options.',
    keyConcept: 'low-cost diversified exposure',
    benchmark: 'expense ratio kept within policy limits',
    formula: 'net return = gross return - fees - taxes',
    action: 'document why each fund belongs in your policy mix',
    risk: 'fee drag compounding over long horizons',
    checkIn: 'quarterly',
    mistake: 'choosing funds by recent performance only'
  },
  {
    slug: 'tax-bracket-planning',
    title: 'Tax Bracket Planning',
    summary: 'Use bracket awareness for contribution and withdrawal decisions.',
    keyConcept: 'marginal tax rate decisioning',
    benchmark: 'major moves modeled with current marginal bracket',
    formula: 'income shift * marginal tax rate',
    action: 'pre-calculate tax impact before year-end transactions',
    risk: 'surprise tax bills from unplanned income timing',
    checkIn: 'quarterly',
    mistake: 'confusing marginal rate with effective rate'
  },
  {
    slug: 'deductible-tradeoff-modeling',
    title: 'Deductible Tradeoff Modeling',
    summary: 'Model premium vs deductible tradeoffs with expected usage.',
    keyConcept: 'expected value tradeoff',
    benchmark: 'deductible aligns with emergency cash capacity',
    formula: 'annual premium difference vs deductible difference',
    action: 'model best case, expected case, and worst case scenarios',
    risk: 'choosing high deductible without cash buffer',
    checkIn: 'annually',
    mistake: 'optimizing premium while ignoring claims volatility'
  },
  {
    slug: 'major-goal-funding-plan',
    title: 'Major Goal Funding Plan',
    summary: 'Build separate funding tracks for home, education, or sabbaticals.',
    keyConcept: 'goal-based capital allocation',
    benchmark: 'each goal has amount, timeline, and funding source',
    formula: 'goal target / months to goal',
    action: 'assign account type by time horizon and risk tolerance',
    risk: 'mixing near-term goals with long-term risk assets',
    checkIn: 'monthly',
    mistake: 'setting goal amount without inflation adjustment'
  },
  {
    slug: 'inflation-adjusted-planning',
    title: 'Inflation-Adjusted Planning',
    summary: 'Plan in real purchasing power, not nominal balances alone.',
    keyConcept: 'real return perspective',
    benchmark: 'long-term goals modeled with real return assumptions',
    formula: 'real return = nominal return - inflation',
    action: 'update projections when inflation regime changes materially',
    risk: 'under-saving due to nominal return illusions',
    checkIn: 'quarterly',
    mistake: 'assuming historical inflation always repeats'
  },
  {
    slug: 'behavior-bias-defense',
    title: 'Behavior Bias Defense',
    summary: 'Use checklists to reduce emotion-driven money decisions.',
    keyConcept: 'decision process discipline',
    benchmark: 'major decisions pass a written checklist first',
    formula: 'decision quality = process consistency + evidence',
    action: 'implement 24-hour delay for non-urgent financial moves',
    risk: 'recency bias and panic-driven switching',
    checkIn: 'monthly',
    mistake: 'changing long-term plan after short-term noise'
  }
];

const f4ExpansionTopics: ExpansionTopic[] = [
  {
    slug: 'withdrawal-sequence-planning',
    title: 'Withdrawal Sequence Planning',
    summary: 'Coordinate account withdrawals to sustain long-term spending.',
    keyConcept: 'tax-aware withdrawal sequencing',
    benchmark: 'multi-year withdrawal order documented before retirement',
    formula: 'spending need - guaranteed income = portfolio draw',
    action: 'define account draw hierarchy by tax impact',
    risk: 'forcing taxable sales during market drawdowns',
    checkIn: 'annually',
    mistake: 'withdrawing evenly from all accounts by default'
  },
  {
    slug: 'bond-ladder-construction',
    title: 'Bond Ladder Construction',
    summary: 'Use laddering to align fixed-income cash flows with liabilities.',
    keyConcept: 'maturity matching',
    benchmark: 'near-term spending covered by predictable maturities',
    formula: 'liability year matched to bond maturity year',
    action: 'stagger maturities across planned expense windows',
    risk: 'reinvestment concentration at one interest-rate point',
    checkIn: 'annually',
    mistake: 'chasing yield while ignoring duration risk'
  },
  {
    slug: 'asset-location-strategy',
    title: 'Asset Location Strategy',
    summary: 'Place assets across account types for after-tax efficiency.',
    keyConcept: 'account-type tax efficiency',
    benchmark: 'tax-inefficient assets concentrated in sheltered accounts',
    formula: 'after-tax return by account location',
    action: 'map each asset class to preferred account wrapper',
    risk: 'tax drag from poor asset location choices',
    checkIn: 'annually',
    mistake: 'focusing on allocation only and ignoring location'
  },
  {
    slug: 'social-security-claiming-education',
    title: 'Social Security Claiming Education',
    summary: 'Understand timing tradeoffs and survivor implications.',
    keyConcept: 'claiming-age tradeoff analysis',
    benchmark: 'claiming strategy documented with longevity assumptions',
    formula: 'monthly benefit * expected payment duration',
    action: 'model early, full, and delayed claiming scenarios',
    risk: 'locking in lower lifetime benefits from rushed claiming',
    checkIn: 'annually',
    mistake: 'deciding based only on break-even headline age'
  },
  {
    slug: 'rebalancing-band-policy',
    title: 'Rebalancing Band Policy',
    summary: 'Use drift bands to rebalance consistently and reduce impulse.',
    keyConcept: 'policy-based rebalancing',
    benchmark: 'rebalance only when allocation breaches preset bands',
    formula: 'actual weight - target weight',
    action: 'codify drift thresholds and trade rules',
    risk: 'risk profile drift from unattended allocations',
    checkIn: 'quarterly',
    mistake: 'rebalancing emotionally instead of by policy'
  },
  {
    slug: 'tax-aware-withdrawals',
    title: 'Tax-Aware Withdrawals',
    summary: 'Minimize lifetime taxes while funding annual spending needs.',
    keyConcept: 'lifetime tax smoothing',
    benchmark: 'planned taxable income stays within target brackets',
    formula: 'planned withdrawals + other income - deductions',
    action: 'coordinate withdrawals with bracket headroom each year',
    risk: 'large one-year tax spikes from unplanned withdrawals',
    checkIn: 'annually',
    mistake: 'deferring all tax decisions until filing season'
  },
  {
    slug: 'concentrated-position-management',
    title: 'Concentrated Position Management',
    summary: 'Reduce concentration risk without destabilizing tax outcomes.',
    keyConcept: 'concentration risk budgeting',
    benchmark: 'single position weight capped by written policy',
    formula: 'position value / total portfolio value',
    action: 'use staged exits and diversification schedule',
    risk: 'single-issuer shocks dominating portfolio outcomes',
    checkIn: 'monthly',
    mistake: 'letting tax concerns block all diversification'
  },
  {
    slug: 'sequence-risk-buffering',
    title: 'Sequence Risk Buffering',
    summary: 'Build liquidity buffers to reduce forced selling in downturns.',
    keyConcept: 'drawdown resilience buffer',
    benchmark: 'multi-year spending reserve defined before draw phase',
    formula: 'planned annual spend * reserve years',
    action: 'separate short-term spending assets from growth sleeve',
    risk: 'selling volatile assets at depressed prices',
    checkIn: 'annually',
    mistake: 'assuming average returns remove path risk'
  }
];

const f5ExpansionTopics: ExpansionTopic[] = [
  {
    slug: 'business-runway-controls',
    title: 'Business Runway Controls',
    summary: 'Track runway and contingency triggers for owner-led businesses.',
    keyConcept: 'runway trigger management',
    benchmark: 'trigger actions pre-defined for declining cash runway',
    formula: 'cash on hand / net monthly burn',
    action: 'set operating trigger points at multiple runway levels',
    risk: 'delayed cost actions during revenue downturn',
    checkIn: 'weekly',
    mistake: 'tracking cash balance without burn trend context'
  },
  {
    slug: 'margin-vs-growth-tradeoffs',
    title: 'Margin vs Growth Tradeoffs',
    summary: 'Evaluate growth initiatives through unit economics discipline.',
    keyConcept: 'unit economics thresholding',
    benchmark: 'new initiatives meet minimum contribution margin hurdle',
    formula: 'unit revenue - unit variable cost',
    action: 'score projects by payback and margin durability',
    risk: 'revenue growth that weakens cash sustainability',
    checkIn: 'monthly',
    mistake: 'optimizing top-line growth without margin guardrails'
  },
  {
    slug: 'real-estate-underwriting-basics',
    title: 'Real Estate Underwriting Basics',
    summary: 'Model cash flow durability before leverage decisions.',
    keyConcept: 'underwriting with conservative assumptions',
    benchmark: 'vacancy and maintenance stress assumptions documented',
    formula: 'net operating income - debt service',
    action: 'run downside case before offer decisions',
    risk: 'overestimating rent and underestimating maintenance',
    checkIn: 'per acquisition decision',
    mistake: 'underwriting only base-case assumptions'
  },
  {
    slug: 'refinance-break-even-analysis',
    title: 'Refinance Break-Even Analysis',
    summary: 'Compare closing costs and savings horizon before refinancing.',
    keyConcept: 'break-even time horizon',
    benchmark: 'refinance chosen only when break-even fits hold period',
    formula: 'closing costs / monthly payment savings',
    action: 'include expected move timeline in refinance analysis',
    risk: 'paying costs that never get recovered',
    checkIn: 'per refinance quote',
    mistake: 'focusing on rate drop and ignoring total fees'
  },
  {
    slug: 'umbrella-coverage-planning',
    title: 'Umbrella Coverage Planning',
    summary: 'Calibrate liability layers for higher net-worth exposure.',
    keyConcept: 'liability layer stacking',
    benchmark: 'umbrella limits align with realistic legal exposure',
    formula: 'estimated liability exposure - base policy limit',
    action: 'review liability layers after major life changes',
    risk: 'asset exposure beyond base policy coverage',
    checkIn: 'annually',
    mistake: 'assuming base auto/home policies are sufficient'
  },
  {
    slug: 'multi-goal-allocation-framework',
    title: 'Multi-Goal Allocation Framework',
    summary: 'Allocate capital across conflicting goals with explicit rules.',
    keyConcept: 'goal-priority capital routing',
    benchmark: 'capital allocation percentages tied to ranked goals',
    formula: 'available surplus * goal allocation weights',
    action: 'rebalance contributions when priorities change',
    risk: 'underfunding high-priority goals through ad hoc decisions',
    checkIn: 'quarterly',
    mistake: 'using one portfolio bucket for all time horizons'
  },
  {
    slug: 'annual-tax-playbook',
    title: 'Annual Tax Playbook',
    summary: 'Run a repeatable annual cycle for proactive tax decisions.',
    keyConcept: 'calendarized tax planning',
    benchmark: 'major tax moves completed before year-end windows close',
    formula: 'projected taxable income - bracket threshold headroom',
    action: 'schedule tax checkpoints in Q2, Q3, and Q4',
    risk: 'missed windows for deductions and deferrals',
    checkIn: 'quarterly',
    mistake: 'starting tax planning after the year is closed'
  },
  {
    slug: 'equity-comp-optimization',
    title: 'Equity Comp Optimization',
    summary: 'Integrate equity compensation into cash, tax, and risk plans.',
    keyConcept: 'equity comp diversification discipline',
    benchmark: 'equity comp exposure capped by concentration policy',
    formula: 'equity comp value / total investable assets',
    action: 'align vesting events with tax and liquidity plan',
    risk: 'double concentration in employer income and equity',
    checkIn: 'per vest cycle',
    mistake: 'holding every grant without risk-budget context'
  }
];

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
  }
];

const generatedLessonSeeds: GeneratedLessonSeed[] = [
  ...createLevelSeeds('F1', 'core', false, 3, f1ExpansionTopics),
  ...createLevelSeeds('F2', 'core', false, 3, f2ExpansionTopics),
  ...createLevelSeeds('F3', 'core', false, 3, f3ExpansionTopics),
  ...createLevelSeeds('F4', 'advanced', true, 3, f4ExpansionTopics),
  ...createLevelSeeds('F5', 'advanced', true, 3, f5ExpansionTopics),
  ...createLevelSeeds('F6', 'advanced', true, 3, f6ExpansionTopics)
];

lessons.push(...generatedLessonSeeds.map(buildGeneratedLesson));

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
