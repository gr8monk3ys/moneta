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
  },
  {
    slug: 'debit-vs-credit',
    title: 'Debit vs Credit',
    summary: 'Pick the right payment method and avoid interest traps.',
    keyConcept: 'payment method tradeoffs',
    benchmark: 'credit card statement paid in full every cycle',
    formula: 'interest cost ≈ balance * APR',
    action: 'enable autopay for the full statement balance where possible',
    risk: 'carrying balances and paying interest',
    checkIn: 'monthly',
    mistake: 'using credit without a payoff plan'
  },
  {
    slug: 'paycheck-withholding-check',
    title: 'Paycheck Withholding Check',
    summary: 'Sanity-check withholding so taxes are not a surprise.',
    keyConcept: 'withholding alignment',
    benchmark: 'no large surprise tax bill from avoidable underwithholding',
    formula: 'estimated annual tax - expected withholding',
    action: 'review your pay stub and update withholding after income changes',
    risk: 'underwithholding after raises, side income, or life changes',
    checkIn: 'quarterly',
    mistake: 'ignoring withholding when your income changes'
  },
  {
    slug: 'spending-friction-tools',
    title: 'Spending Friction Tools',
    summary: 'Use small friction to prevent overspending in your top leak category.',
    keyConcept: 'intentional spending friction',
    benchmark: 'top overspend category has a fixed weekly limit',
    formula: 'weekly category limit = monthly cap / 4',
    action: 'use a separate card/account or a cash-style limit for one category',
    risk: 'friction removed by subscriptions and autopay',
    checkIn: 'weekly',
    mistake: 'tracking spending without adding constraints'
  },
  {
    slug: 'goal-setting-ladder',
    title: 'Goal-Setting Ladder',
    summary: 'Define goals with amounts, dates, and a simple funding ladder.',
    keyConcept: 'goal hierarchy',
    benchmark: 'one short-term and one long-term goal written with dates',
    formula: 'monthly contribution = goal amount / months to goal',
    action: 'automate the next smallest contribution step',
    risk: 'too many goals diluting progress',
    checkIn: 'monthly',
    mistake: 'setting goals without assigning money to them'
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
  },
  {
    slug: 'student-loan-basics',
    title: 'Student Loan Basics',
    summary: 'Map rates, repayment plans, and payoff timeline without guesswork.',
    keyConcept: 'repayment plan awareness',
    benchmark: 'each loan has balance, rate, and minimum payment recorded',
    formula: 'interest cost ≈ principal * rate',
    action: 'list each loan with balance, rate, servicer, and due date',
    risk: 'capitalized interest and missed plan requirements',
    checkIn: 'monthly',
    mistake: 'making payments without understanding plan terms'
  },
  {
    slug: 'debt-to-income-guardrails',
    title: 'Debt-to-Income Guardrails',
    summary: 'Use DTI to avoid stacking fixed payments that crush flexibility.',
    keyConcept: 'debt-to-income guardrails',
    benchmark: 'DTI reviewed before adding new recurring payments',
    formula: 'DTI = monthly debt payments / gross monthly income',
    action: 'calculate DTI before financing cars, homes, or big purchases',
    risk: 'fixed payments consuming cash needed for essentials and savings',
    checkIn: 'quarterly',
    mistake: 'approving debt based on payment alone'
  },
  {
    slug: 'balance-transfer-promo-traps',
    title: 'Balance Transfer Promo Traps',
    summary: 'Use promo APR offers only with a calendarized payoff plan.',
    keyConcept: 'promo APR payoff plan',
    benchmark: 'promo balance paid off before the promo window ends',
    formula: 'monthly payoff = balance / promo months',
    action: 'set autopay so the balance hits zero before the promo expires',
    risk: 'fees and rate resets after promo periods',
    checkIn: 'monthly',
    mistake: 'transferring balances without a schedule'
  },
  {
    slug: 'negotiating-bills-playbook',
    title: 'Negotiating Bills Playbook',
    summary: 'Lower recurring bills by asking for discounts and retention offers.',
    keyConcept: 'rate renegotiation',
    benchmark: 'top recurring bills reviewed at least annually',
    formula: 'annual savings = (old price - new price) * 12',
    action: 'call providers with a competitor quote and ask for a better rate',
    risk: 'silent price increases over time',
    checkIn: 'annually',
    mistake: 'assuming the posted rate is non-negotiable'
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
  },
  {
    slug: 'asset-allocation-basics',
    title: 'Asset Allocation Basics',
    summary: 'Choose a stock/bond/cash mix that matches time horizon and risk tolerance.',
    keyConcept: 'asset allocation',
    benchmark: 'target allocation written and reviewed at least annually',
    formula: 'allocation = stock % + bond % + cash %',
    action: 'write a target allocation and a simple rebalancing rule',
    risk: 'concentration in one asset type',
    checkIn: 'annually',
    mistake: 'changing allocation based on recent performance'
  },
  {
    slug: 'etf-vs-mutual-fund',
    title: 'ETF vs Mutual Fund',
    summary: 'Understand the differences in trading, costs, and taxes.',
    keyConcept: 'fund vehicle selection',
    benchmark: 'fund choices meet cost and diversification targets',
    formula: 'net return = gross return - fees - taxes',
    action: 'compare expense ratios, liquidity, and tax efficiency before buying',
    risk: 'fee drag and unnecessary complexity',
    checkIn: 'annually',
    mistake: 'choosing funds based on ticker popularity'
  },
  {
    slug: 'capital-gains-basics',
    title: 'Capital Gains Basics',
    summary: 'Know what triggers gains and why holding period matters.',
    keyConcept: 'capital gain tax awareness',
    benchmark: 'holding period checked before selling taxable investments',
    formula: 'capital gain = sale price - cost basis',
    action: 'estimate tax impact before selling and record cost basis accurately',
    risk: 'surprise taxes from short-term gains',
    checkIn: 'per sale',
    mistake: 'selling without a tax estimate'
  },
  {
    slug: 'hsa-playbook',
    title: 'HSA Playbook',
    summary: 'Use health savings accounts thoughtfully within your benefits stack.',
    keyConcept: 'HSA strategy basics',
    benchmark: 'HSA contributions aligned with annual goals and eligibility',
    formula: 'annual contribution / pay periods',
    action: 'confirm eligibility and automate contributions through payroll when possible',
    risk: 'contributing when ineligible or losing documentation',
    checkIn: 'annually',
    mistake: 'treating HSA as a regular spending account without recordkeeping'
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
  },
  {
    slug: 'roth-conversion-education',
    title: 'Roth Conversion Education',
    summary: 'Understand when conversions can help and how to model bracket impact.',
    keyConcept: 'Roth conversion modeling',
    benchmark: 'conversion decisions modeled against marginal tax brackets',
    formula: 'tax cost = conversion amount * marginal rate',
    action: 'model multi-year conversions rather than one-time moves',
    risk: 'triggering higher taxes from unplanned conversions',
    checkIn: 'annually',
    mistake: 'converting without a multi-year plan'
  },
  {
    slug: 'required-minimum-distributions',
    title: 'Required Minimum Distributions',
    summary: 'Plan for mandatory withdrawals and avoid avoidable penalties.',
    keyConcept: 'RMD compliance planning',
    benchmark: 'RMD calendar created before the first required year',
    formula: 'RMD ≈ account balance / distribution period',
    action: 'set reminders and coordinate withdrawals with overall tax plan',
    risk: 'penalties from missed required distributions',
    checkIn: 'annually',
    mistake: 'forgetting RMDs while optimizing other moves'
  },
  {
    slug: 'healthcare-cost-planning',
    title: 'Healthcare Cost Planning',
    summary: 'Estimate premiums and out-of-pocket costs as part of retirement spending.',
    keyConcept: 'healthcare cost forecasting',
    benchmark: 'healthcare line item included in retirement budget',
    formula: 'annual cost = premiums + expected out-of-pocket',
    action: 'list premiums, deductibles, and max out-of-pocket assumptions',
    risk: 'underestimating healthcare costs in retirement',
    checkIn: 'annually',
    mistake: 'planning retirement spending without healthcare'
  },
  {
    slug: 'long-term-care-planning',
    title: 'Long-Term Care Planning',
    summary: 'Understand the risk and plan liquidity for care scenarios.',
    keyConcept: 'long-term care risk planning',
    benchmark: 'care scenario discussed and documented with decision-makers',
    formula: 'care cost = monthly cost * months of care',
    action: 'evaluate options: self-fund, insurance, or hybrid approaches',
    risk: 'care costs forcing portfolio disruption',
    checkIn: 'annually',
    mistake: 'assuming long-term care risk will not happen'
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
  },
  {
    slug: 'quarterly-estimated-taxes',
    title: 'Quarterly Estimated Taxes',
    summary: 'Plan quarterly payments so taxes do not create a cash crisis.',
    keyConcept: 'estimated tax cadence',
    benchmark: 'quarterly tax set-aside funded before discretionary spend',
    formula: 'estimated annual tax due / 4',
    action: 'schedule quarterly reminders and transfer set-aside to a tax reserve',
    risk: 'underpayment penalties and cash crunch at filing time',
    checkIn: 'quarterly',
    mistake: 'waiting until April to find cash'
  },
  {
    slug: 'rental-capex-reserves',
    title: 'Rental CAPEX Reserves',
    summary: 'Budget for big repairs and replacements before they surprise you.',
    keyConcept: 'capex reserve discipline',
    benchmark: 'capex reserve funded based on property age and systems',
    formula: 'annual capex reserve = expected replacements / years',
    action: 'separate capex reserve from operating cash flow',
    risk: 'forced debt from surprise replacements',
    checkIn: 'monthly',
    mistake: 'using all cash flow and ignoring replacement cycles'
  },
  {
    slug: 'business-exit-readiness',
    title: 'Business Exit Readiness',
    summary: 'Build optionality for sale, succession, or wind-down.',
    keyConcept: 'exit option planning',
    benchmark: 'exit options documented with timeline and triggers',
    formula: 'business value ≈ cash flow * valuation multiple (simplified)',
    action: 'define what exit-ready means and track leading indicators',
    risk: 'being forced into an exit during a downturn',
    checkIn: 'quarterly',
    mistake: 'treating exit planning as a last-minute event'
  },
  {
    slug: 'leverage-risk-budget',
    title: 'Leverage Risk Budget',
    summary: 'Set leverage limits so one scenario cannot wipe out your plan.',
    keyConcept: 'leverage risk budgeting',
    benchmark: 'leverage ratio stays within written policy range',
    formula: 'leverage ratio = debt / asset value',
    action: 'stress test cash flow at higher rates and lower income',
    risk: 'fixed payments becoming unmanageable',
    checkIn: 'quarterly',
    mistake: 'using optimistic assumptions for debt service'
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
  ...createLevelSeeds('F1', 'core', false, 3, f1ExpansionTopics),
  ...createLevelSeeds('F2', 'core', false, 3, f2ExpansionTopics),
  ...createLevelSeeds('F3', 'core', false, 3, f3ExpansionTopics),
  ...createLevelSeeds('F4', 'advanced', true, 3, f4ExpansionTopics),
  ...createLevelSeeds('F5', 'advanced', true, 3, f5ExpansionTopics),
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
