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
        correctAnswer: 'borrowing cost',
        acceptableAnswers: ['borrowing cost'],
        format: 'mcq',
        choices: ['borrowing cost', 'investment return', 'tax bracket', 'inflation rate'],
        explanation: 'APR (annual percentage rate) describes the annualized cost of borrowing. APY is typically used for interest earned and includes compounding.'
      },
      {
        itemId: 'item-budget-001',
        skillId: 'basic-budgeting',
        prompt: 'Income $3,000 and expenses $2,700 leaves how much?',
        correctAnswer: '300',
        acceptableAnswers: ['300'],
        format: 'numeric',
        explanation: 'Net cash flow is income minus expenses. 3000 - 2700 = 300.'
      },
      {
        itemId: 'item-cashflow-003',
        skillId: 'fixed-vs-variable-expenses',
        prompt: 'Rent is typically a ______ expense.',
        correctAnswer: 'fixed',
        acceptableAnswers: ['fixed'],
        format: 'mcq',
        choices: ['fixed', 'variable', 'sunk', 'discretionary'],
        explanation: 'Fixed expenses are stable month to month; variable expenses change with usage and choices.'
      },
      {
        itemId: 'item-cashflow-004',
        skillId: 'net-cash-flow',
        prompt: 'If you bring home $2,400 and spend $2,150, your net cash flow is:',
        correctAnswer: '250',
        acceptableAnswers: ['250'],
        format: 'numeric',
        explanation: 'Net cash flow = inflows - outflows. 2400 - 2150 = 250.'
      },
      {
        itemId: 'item-cashflow-005',
        skillId: 'cash-flow-checkin-cadence',
        prompt: 'A simple cash-flow check-in cadence for beginners is:',
        correctAnswer: 'weekly',
        acceptableAnswers: ['weekly'],
        format: 'mcq',
        choices: ['weekly', 'once a year', 'only when you overdraft', 'never'],
        explanation: 'Frequent check-ins catch drift early, before small leaks become large problems.'
      },
      {
        itemId: 'item-cashflow-006',
        skillId: 'pay-yourself-first',
        prompt: '“Pay yourself first” means you:',
        correctAnswer: 'save before discretionary spending',
        acceptableAnswers: ['save before discretionary spending'],
        format: 'mcq',
        choices: ['save before discretionary spending', 'spend first and save what is left', 'only save windfalls', 'avoid tracking spending entirely'],
        explanation: 'Automating savings right after income makes goals more reliable than relying on leftover cash.'
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
        correctAnswer: '20%',
        acceptableAnswers: ['20%'],
        format: 'mcq',
        choices: ['20%', '2%', '200%', '0.2%'],
        explanation: 'Utilization is balance divided by limit. 200/1000 = 0.2 = 20%.'
      },
      {
        itemId: 'item-credit-002',
        skillId: 'payment-history',
        prompt: 'The largest factor in most credit score models is:',
        correctAnswer: 'payment history',
        acceptableAnswers: ['payment history'],
        format: 'mcq',
        choices: ['payment history', 'income level', 'homeownership status', 'number of credit cards'],
        explanation: 'Consistently paying on time is typically the biggest driver in common credit score models.'
      },
      {
        itemId: 'item-credit-003',
        skillId: 'credit-mix',
        prompt: 'Credit mix refers to:',
        correctAnswer: 'the variety of credit account types',
        acceptableAnswers: ['the variety of credit account types'],
        format: 'mcq',
        choices: ['the variety of credit account types', 'your interest rate', 'your credit limit', 'how often you check your score'],
        explanation: 'Mix describes the types of accounts you have (for example cards, loans, mortgage), not the dollar amounts.'
      },
      {
        itemId: 'item-credit-004',
        skillId: 'hard-inquiry',
        prompt: 'A hard inquiry is typically created when you:',
        correctAnswer: 'apply for new credit',
        acceptableAnswers: ['apply for new credit'],
        format: 'mcq',
        choices: ['apply for new credit', 'pay your bill early', 'set up autopay', 'check your own credit report'],
        explanation: 'Hard inquiries often occur when you apply for a new loan or credit card; checking your own report is usually a soft inquiry.'
      },
      {
        itemId: 'item-credit-005',
        skillId: 'statement-balance',
        prompt: 'Paying the statement balance in full each month helps you avoid:',
        correctAnswer: 'interest charges',
        acceptableAnswers: ['interest charges'],
        format: 'mcq',
        choices: ['interest charges', 'annual fees', 'tax withholding', 'credit limits'],
        explanation: 'Credit card interest typically accrues when you carry balances; paying the statement balance in full avoids interest in most cases.'
      },
      {
        itemId: 'item-credit-006',
        skillId: 'utilization-target',
        prompt: 'A commonly cited credit utilization target is to keep it below:',
        correctAnswer: '30%',
        acceptableAnswers: ['30%'],
        format: 'mcq',
        choices: ['30%', '70%', '0%', '100%'],
        explanation: 'Lower utilization generally looks better. The exact cutoff varies by model, but keeping it low reduces score drag.'
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
        correctAnswer: '3-6 months',
        acceptableAnswers: ['3-6 months', '3 to 6 months'],
        format: 'mcq',
        choices: ['3-6 months', '3-6 days', '3-6 years', '0 months'],
        explanation: 'Many guidelines suggest building roughly 3 to 6 months of essential expenses, adjusted to job stability and risk.'
      },
      {
        itemId: 'item-emergency-002',
        skillId: 'sinking-funds',
        prompt: 'A sinking fund is best described as:',
        correctAnswer: 'saving ahead for known expenses',
        acceptableAnswers: ['saving ahead for known expenses'],
        format: 'mcq',
        choices: ['saving ahead for known expenses', 'investing for retirement', 'paying minimums on debt', 'a credit score'],
        explanation: 'Sinking funds prepare for predictable but irregular costs (for example car repairs, annual insurance, holidays).'
      },
      {
        itemId: 'item-emergency-003',
        skillId: 'emergency-fund-where',
        prompt: 'Emergency funds are typically kept in:',
        correctAnswer: 'a liquid, low-risk account',
        acceptableAnswers: ['a liquid, low-risk account'],
        format: 'mcq',
        choices: ['a liquid, low-risk account', 'a highly volatile stock', 'a long-term lockup investment', 'a collectible asset'],
        explanation: 'Emergency money is for short-notice needs, so it should prioritize liquidity and stability over maximum return.'
      },
      {
        itemId: 'item-emergency-004',
        skillId: 'emergency-expense-example',
        prompt: 'Which is the best example of an emergency expense?',
        correctAnswer: 'job loss',
        acceptableAnswers: ['job loss'],
        format: 'mcq',
        choices: ['job loss', 'a planned vacation', 'upgrading a phone', 'a predictable annual subscription'],
        explanation: 'Emergencies are high-impact and time-sensitive. Predictable annual costs belong in sinking funds, not emergency funds.'
      },
      {
        itemId: 'item-emergency-005',
        skillId: 'starter-buffer-timeline',
        prompt: 'If your starter buffer goal is $1,000 and you save $100/month, months to reach goal:',
        correctAnswer: '10',
        acceptableAnswers: ['10'],
        format: 'numeric',
        explanation: 'Time to goal = goal / monthly contribution. 1000 / 100 = 10 months.'
      },
      {
        itemId: 'item-emergency-006',
        skillId: 'windfall-first-step',
        prompt: 'A good first use of a windfall when you have no buffer is to:',
        correctAnswer: 'build a starter emergency fund',
        acceptableAnswers: ['build a starter emergency fund'],
        format: 'mcq',
        choices: ['build a starter emergency fund', 'increase discretionary spending', 'take on new monthly payments', 'ignore cash flow tracking'],
        explanation: 'A starter buffer reduces the chance that the next surprise forces high-interest debt.'
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
        correctAnswer: 'highest interest rate',
        acceptableAnswers: ['highest interest rate'],
        format: 'mcq',
        choices: ['highest interest rate', 'lowest balance', 'most recent debt', 'largest credit limit'],
        explanation: 'Avalanche targets the costliest debt first, which usually minimizes total interest paid.'
      },
      {
        itemId: 'item-debt-002',
        skillId: 'debt-snowball',
        prompt: 'Debt snowball prioritizes debts by:',
        correctAnswer: 'lowest balance first',
        acceptableAnswers: ['lowest balance first'],
        format: 'mcq',
        choices: ['lowest balance first', 'highest interest rate', 'largest balance first', 'random order'],
        explanation: 'Snowball targets quick wins to build momentum and stick with the plan.'
      },
      {
        itemId: 'item-debt-003',
        skillId: 'minimum-payment-automation',
        prompt: 'Automating minimum payments helps you avoid:',
        correctAnswer: 'late fees and credit damage',
        acceptableAnswers: ['late fees and credit damage'],
        format: 'mcq',
        choices: ['late fees and credit damage', 'compound interest', 'tax withholding', 'annual fees'],
        explanation: 'Minimum-payment automation reduces the risk of missed payments, which can be expensive and hurt credit history.'
      },
      {
        itemId: 'item-debt-004',
        skillId: 'apr-dollar-cost',
        prompt: 'A $1,000 balance at 20% APR costs about how much per year in interest (simple estimate)?',
        correctAnswer: '200',
        acceptableAnswers: ['200'],
        format: 'numeric',
        explanation: 'A rough annual interest estimate is balance * APR. 1000 * 0.20 = 200.'
      },
      {
        itemId: 'item-debt-005',
        skillId: 'snowball-motivation',
        prompt: 'The snowball method can help because it:',
        correctAnswer: 'builds momentum with quick wins',
        acceptableAnswers: ['builds momentum with quick wins'],
        format: 'mcq',
        choices: ['builds momentum with quick wins', 'maximizes tax deductions', 'eliminates all interest instantly', 'increases credit limits'],
        explanation: 'Behavior matters. Paying off smaller balances sooner can create motivation to keep going.'
      },
      {
        itemId: 'item-debt-006',
        skillId: 'avalanche-interest-savings',
        prompt: 'Compared to snowball, avalanche usually results in:',
        correctAnswer: 'less total interest paid',
        acceptableAnswers: ['less total interest paid'],
        format: 'mcq',
        choices: ['less total interest paid', 'more late fees', 'higher monthly minimums', 'no need for a budget'],
        explanation: 'By prioritizing higher APR balances, avalanche typically reduces total interest over the life of the payoff plan.'
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
        correctAnswer: 'single-asset risk',
        acceptableAnswers: ['single-asset risk'],
        format: 'mcq',
        choices: ['single-asset risk', 'all market risk', 'tax withholding risk', 'inflation risk'],
        explanation: 'Diversification reduces the impact of any single holding doing poorly, but it does not remove all risk.'
      },
      {
        itemId: 'item-invest-002',
        skillId: 'compound-growth',
        prompt: 'Compounding is strongest when you:',
        correctAnswer: 'start early and stay invested',
        acceptableAnswers: ['start early and stay invested'],
        format: 'mcq',
        choices: ['start early and stay invested', 'trade frequently', 'buy only what is trending', 'avoid saving until later'],
        explanation: 'Time is a major driver of compounding because returns can earn returns for many periods.'
      },
      {
        itemId: 'item-invest-003',
        skillId: 'risk-return',
        prompt: 'Generally, higher expected returns come with:',
        correctAnswer: 'higher risk',
        acceptableAnswers: ['higher risk'],
        format: 'mcq',
        choices: ['higher risk', 'guaranteed outcomes', 'lower volatility always', 'no fees'],
        explanation: 'In investing, return and risk are linked. Higher return potential usually means more uncertainty.'
      },
      {
        itemId: 'item-invest-004',
        skillId: 'time-horizon-volatility',
        prompt: 'A longer time horizon can allow you to:',
        correctAnswer: 'tolerate more volatility',
        acceptableAnswers: ['tolerate more volatility'],
        format: 'mcq',
        choices: ['tolerate more volatility', 'avoid all drawdowns', 'remove inflation risk', 'guarantee higher returns'],
        explanation: 'With more time, you can ride out market swings and avoid being forced to sell during downturns.'
      },
      {
        itemId: 'item-invest-005',
        skillId: 'fees-compound',
        prompt: 'Investment fees matter because they:',
        correctAnswer: 'compound against you over time',
        acceptableAnswers: ['compound against you over time'],
        format: 'mcq',
        choices: ['compound against you over time', 'only matter in the first year', 'do not affect long-term outcomes', 'replace taxes entirely'],
        explanation: 'Small percentage fees reduce your balance each year, which reduces future growth on that money.'
      },
      {
        itemId: 'item-invest-006',
        skillId: 'index-fund-definition',
        prompt: 'An index fund is designed to:',
        correctAnswer: 'track a market index',
        acceptableAnswers: ['track a market index'],
        format: 'mcq',
        choices: ['track a market index', 'guarantee profits', 'avoid diversification', 'replace emergency funds'],
        explanation: 'Index funds aim to match an index (like a broad stock market index), typically with low costs and diversification.'
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
        correctAnswer: 'after-tax dollars',
        acceptableAnswers: ['after-tax dollars'],
        format: 'mcq',
        choices: ['after-tax dollars', 'pre-tax dollars', 'borrowed funds', 'tax credits'],
        explanation: 'Roth contributions are typically made after taxes, with the potential for tax-free qualified withdrawals later.'
      },
      {
        itemId: 'item-tax-002',
        skillId: 'tax-advantaged-order',
        prompt: 'Employer match is often prioritized because it is:',
        correctAnswer: 'an immediate return',
        acceptableAnswers: ['an immediate return'],
        format: 'mcq',
        choices: ['an immediate return', 'a tax penalty', 'only available after retirement', 'a loan'],
        explanation: 'An employer match is often like an instant boost to your contribution, which can be hard to beat.'
      },
      {
        itemId: 'item-tax-003',
        skillId: 'traditional-tax-benefit',
        prompt: 'Traditional (pre-tax) contributions generally reduce:',
        correctAnswer: 'taxable income today',
        acceptableAnswers: ['taxable income today'],
        format: 'mcq',
        choices: ['taxable income today', 'your credit score', 'your emergency fund', 'the stock market'],
        explanation: 'Pre-tax contributions are often deducted from current taxable income, while taxes may be owed on withdrawals later.'
      },
      {
        itemId: 'item-tax-004',
        skillId: 'roth-withdrawal-benefit',
        prompt: 'A typical Roth benefit is:',
        correctAnswer: 'tax-free qualified withdrawals',
        acceptableAnswers: ['tax-free qualified withdrawals'],
        format: 'mcq',
        choices: ['tax-free qualified withdrawals', 'guaranteed returns', 'no eligibility rules', 'no account limits ever'],
        explanation: 'Roth accounts may allow tax-free qualified withdrawals, subject to rules and eligibility.'
      },
      {
        itemId: 'item-tax-005',
        skillId: 'hsa-triple-tax',
        prompt: 'An HSA is often described as triple tax-advantaged because:',
        correctAnswer: 'contributions, growth, and qualified withdrawals can be tax-free',
        acceptableAnswers: ['contributions, growth, and qualified withdrawals can be tax-free'],
        format: 'mcq',
        choices: [
          'contributions, growth, and qualified withdrawals can be tax-free',
          'it guarantees medical coverage',
          'it replaces insurance premiums automatically',
          'it eliminates all taxes in retirement'
        ],
        explanation: 'When eligible, HSAs can offer tax benefits on contributions, growth, and qualified medical withdrawals.'
      },
      {
        itemId: 'item-tax-006',
        skillId: 'match-priority',
        prompt: 'If you have high-interest debt and also an employer match, a common first priority is to:',
        correctAnswer: 'capture the match',
        acceptableAnswers: ['capture the match'],
        format: 'mcq',
        choices: ['capture the match', 'ignore the match entirely', 'borrow more to invest', 'stop budgeting'],
        explanation: 'Many people prioritize capturing the match (an immediate return), then tackle high-interest debt and other goals based on their situation.'
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
        correctAnswer: 'sequence risk and longevity',
        acceptableAnswers: ['sequence risk and longevity'],
        format: 'mcq',
        choices: ['sequence risk and longevity', 'social media trends', 'credit utilization only', 'a single year of returns'],
        explanation: 'Withdrawals must consider how long the portfolio needs to last and the risk of poor returns early in retirement.'
      },
      {
        itemId: 'item-retire-002',
        skillId: 'bucket-strategy',
        prompt: 'A retirement bucket strategy separates assets by:',
        correctAnswer: 'time horizon',
        acceptableAnswers: ['time horizon'],
        format: 'mcq',
        choices: ['time horizon', 'ticker symbol', 'account password', 'credit score'],
        explanation: 'Buckets separate near-term spending assets from longer-term growth assets to help manage drawdowns.'
      },
      {
        itemId: 'item-retire-003',
        skillId: 'sequence-risk-definition',
        prompt: 'Sequence risk refers to:',
        correctAnswer: 'poor returns early in retirement',
        acceptableAnswers: ['poor returns early in retirement'],
        format: 'mcq',
        choices: ['poor returns early in retirement', 'high returns in the first year', 'paying off a credit card', 'having too many accounts'],
        explanation: 'When withdrawals start, bad early returns can permanently reduce the portfolio, even if long-term averages look fine.'
      },
      {
        itemId: 'item-retire-004',
        skillId: 'withdrawal-guardrails',
        prompt: 'A withdrawal plan often uses guardrails to:',
        correctAnswer: 'adjust spending based on portfolio conditions',
        acceptableAnswers: ['adjust spending based on portfolio conditions'],
        format: 'mcq',
        choices: ['adjust spending based on portfolio conditions', 'guarantee returns', 'avoid budgeting', 'increase concentration risk'],
        explanation: 'Guardrails define when to raise, hold, or cut withdrawals so spending can adapt without panic decisions.'
      },
      {
        itemId: 'item-retire-005',
        skillId: 'spending-gap',
        prompt: 'If planned annual spending is $60,000 and guaranteed income is $40,000, portfolio draw needed is:',
        correctAnswer: '20000',
        acceptableAnswers: ['20000'],
        format: 'numeric',
        explanation: 'Spending gap = spending need - guaranteed income. 60000 - 40000 = 20000.'
      },
      {
        itemId: 'item-retire-006',
        skillId: 'inflation-impact',
        prompt: 'Retirement plans should account for inflation because it:',
        correctAnswer: 'reduces purchasing power over time',
        acceptableAnswers: ['reduces purchasing power over time'],
        format: 'mcq',
        choices: ['reduces purchasing power over time', 'eliminates taxes', 'increases credit limits', 'guarantees higher returns'],
        explanation: 'Inflation means the same dollar buys less later, so long-term plans should be built in real purchasing power terms.'
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
        correctAnswer: 'lower premiums',
        acceptableAnswers: ['lower premiums'],
        format: 'mcq',
        choices: ['lower premiums', 'higher premiums', 'guaranteed payouts', 'no out-of-pocket costs'],
        explanation: 'Higher deductibles often lower premiums, but you pay more out of pocket when a claim happens.'
      },
      {
        itemId: 'item-insurance-002',
        skillId: 'liability-coverage',
        prompt: 'Umbrella insurance primarily extends:',
        correctAnswer: 'liability coverage limits',
        acceptableAnswers: ['liability coverage limits'],
        format: 'mcq',
        choices: ['liability coverage limits', 'your credit score', 'your tax bracket', 'your retirement contribution limit'],
        explanation: 'Umbrella coverage typically increases liability protection above the limits of underlying policies (auto/home).'
      },
      {
        itemId: 'item-insurance-003',
        skillId: 'premium-vs-deductible',
        prompt: 'Choosing a higher deductible usually shifts costs by:',
        correctAnswer: 'lower monthly premium but higher cost when claims happen',
        acceptableAnswers: ['lower monthly premium but higher cost when claims happen'],
        format: 'mcq',
        choices: [
          'lower monthly premium but higher cost when claims happen',
          'higher monthly premium and higher cost when claims happen',
          'no change in costs',
          'guaranteed lower total cost'
        ],
        explanation: 'Deductibles trade off predictable premiums against the size of the bill when you make a claim.'
      },
      {
        itemId: 'item-insurance-004',
        skillId: 'insurance-purpose',
        prompt: 'The main purpose of insurance is to:',
        correctAnswer: 'transfer catastrophic risk',
        acceptableAnswers: ['transfer catastrophic risk'],
        format: 'mcq',
        choices: ['transfer catastrophic risk', 'increase your investment returns', 'eliminate all uncertainty', 'replace budgeting'],
        explanation: 'Insurance is primarily for low-probability, high-impact risks you cannot comfortably self-fund.'
      },
      {
        itemId: 'item-insurance-005',
        skillId: 'coverage-limits',
        prompt: 'Liability coverage limits matter because:',
        correctAnswer: 'lawsuits can exceed minimum coverage',
        acceptableAnswers: ['lawsuits can exceed minimum coverage'],
        format: 'mcq',
        choices: ['lawsuits can exceed minimum coverage', 'they increase your credit utilization', 'they change your tax bracket', 'they determine your paycheck'],
        explanation: 'If damages exceed your coverage, you may be responsible for the remainder, so limits should match realistic exposure.'
      },
      {
        itemId: 'item-insurance-006',
        skillId: 'policy-review-cadence',
        prompt: 'A reasonable cadence to review insurance coverage is:',
        correctAnswer: 'annually or after major life changes',
        acceptableAnswers: ['annually or after major life changes'],
        format: 'mcq',
        choices: ['annually or after major life changes', 'never', 'only after a claim', 'only when rates rise'],
        explanation: 'Life events (moving, marriage, new assets, kids) can change coverage needs and liability exposure.'
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
        correctAnswer: 'cash balance divided by monthly burn',
        acceptableAnswers: ['cash balance divided by monthly burn'],
        format: 'mcq',
        choices: ['cash balance divided by monthly burn', 'monthly burn divided by cash balance', 'revenue minus profit', 'taxes plus payroll'],
        explanation: 'Runway estimates how many months you can operate at the current burn rate before cash runs out.'
      },
      {
        itemId: 'item-business-002',
        skillId: 'owner-pay',
        prompt: 'Owner pay should be treated as:',
        correctAnswer: 'a planned operating expense',
        acceptableAnswers: ['a planned operating expense'],
        format: 'mcq',
        choices: ['a planned operating expense', 'an afterthought', 'a one-time bonus only', 'untracked cash'],
        explanation: 'Owner compensation should be planned like payroll so the business can operate sustainably.'
      },
      {
        itemId: 'item-business-003',
        skillId: 'gross-margin-definition',
        prompt: 'Gross margin is:',
        correctAnswer: 'revenue minus cost of goods sold',
        acceptableAnswers: ['revenue minus cost of goods sold'],
        format: 'mcq',
        choices: ['revenue minus cost of goods sold', 'cash balance divided by burn', 'tax rate times income', 'profit minus rent'],
        explanation: 'Gross margin measures how much is left after direct costs, before operating expenses.'
      },
      {
        itemId: 'item-business-004',
        skillId: 'tax-reserve',
        prompt: 'A common small business practice is to set aside a tax reserve because:',
        correctAnswer: 'taxes are not automatically withheld',
        acceptableAnswers: ['taxes are not automatically withheld'],
        format: 'mcq',
        choices: ['taxes are not automatically withheld', 'taxes are never owed', 'it increases revenue', 'it removes the need for accounting'],
        explanation: 'Many businesses owe quarterly or annual taxes and must hold back cash so a tax bill does not create a cash crunch.'
      },
      {
        itemId: 'item-business-005',
        skillId: 'runway-triggers',
        prompt: 'If runway is shrinking, a first step is to:',
        correctAnswer: 'reduce burn or increase cash inflows',
        acceptableAnswers: ['reduce burn or increase cash inflows'],
        format: 'mcq',
        choices: ['reduce burn or increase cash inflows', 'ignore the trend', 'increase fixed costs', 'delay all reporting'],
        explanation: 'Shrinking runway is an early warning. Acting quickly often provides more options than waiting until cash is low.'
      },
      {
        itemId: 'item-business-006',
        skillId: 'cash-segmentation',
        prompt: 'Separating operating cash, taxes, and profit helps because:',
        correctAnswer: 'it prevents spending money that is already committed',
        acceptableAnswers: ['it prevents spending money that is already committed'],
        format: 'mcq',
        choices: [
          'it prevents spending money that is already committed',
          'it guarantees profitability',
          'it eliminates variable costs',
          'it removes the need for forecasts'
        ],
        explanation: 'Segmentation creates clarity so you do not accidentally spend funds reserved for taxes, payroll, or critical expenses.'
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
        correctAnswer: 'property value',
        acceptableAnswers: ['property value'],
        format: 'mcq',
        choices: ['property value', 'monthly rent', 'mortgage balance', 'closing costs'],
        explanation: 'Cap rate = NOI / property value. It is a simplified yield measure before financing.'
      },
      {
        itemId: 'item-re-002',
        skillId: 'cash-on-cash',
        prompt: 'Cash-on-cash return compares annual cash flow against:',
        correctAnswer: 'cash invested',
        acceptableAnswers: ['cash invested'],
        format: 'mcq',
        choices: ['cash invested', 'property age', 'tax bracket', 'credit score'],
        explanation: 'Cash-on-cash focuses on the return on the cash you put in (down payment, closing, initial reserves).'
      },
      {
        itemId: 'item-re-003',
        skillId: 'vacancy-assumption',
        prompt: 'Including a vacancy assumption in underwriting helps account for:',
        correctAnswer: 'periods without rental income',
        acceptableAnswers: ['periods without rental income'],
        format: 'mcq',
        choices: ['periods without rental income', 'guaranteed rent increases', 'credit card rewards', 'tax withholding'],
        explanation: 'Vacancy and turnover are normal. Modeling vacancy reduces the risk of overestimating cash flow.'
      },
      {
        itemId: 'item-re-004',
        skillId: 'maintenance-reserve',
        prompt: 'A maintenance reserve is used for:',
        correctAnswer: 'repairs and capital replacements',
        acceptableAnswers: ['repairs and capital replacements'],
        format: 'mcq',
        choices: ['repairs and capital replacements', 'market speculation', 'tax filing fees only', 'credit utilization'],
        explanation: 'Properties require ongoing repairs and periodic big-ticket replacements (roof, HVAC). Reserves reduce forced debt.'
      },
      {
        itemId: 'item-re-005',
        skillId: 'leverage-risk',
        prompt: 'Leverage can increase returns but also increases:',
        correctAnswer: 'risk of loss',
        acceptableAnswers: ['risk of loss'],
        format: 'mcq',
        choices: ['risk of loss', 'insurance deductibles', 'credit score history', 'tax withholding'],
        explanation: 'Debt amplifies outcomes in both directions. Downside scenarios can become worse when payments are fixed.'
      },
      {
        itemId: 'item-re-006',
        skillId: 'net-operating-cashflow',
        prompt: 'If monthly rent is $2,000 and monthly expenses are $1,400, monthly net operating cash flow is:',
        correctAnswer: '600',
        acceptableAnswers: ['600'],
        format: 'numeric',
        explanation: 'Net operating cash flow is rent minus operating expenses (excluding financing). 2000 - 1400 = 600.'
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
        correctAnswer: 'offset taxable gains',
        acceptableAnswers: ['offset taxable gains'],
        format: 'mcq',
        choices: ['offset taxable gains', 'guarantee profits', 'avoid all taxes permanently', 'increase credit limits'],
        explanation: 'Harvesting losses can offset realized gains, potentially reducing taxes, subject to rules and limitations.'
      },
      {
        itemId: 'item-taxadv-002',
        skillId: 'asset-location',
        prompt: 'Asset location means placing assets based on:',
        correctAnswer: 'tax efficiency of each account',
        acceptableAnswers: ['tax efficiency of each account'],
        format: 'mcq',
        choices: ['tax efficiency of each account', 'which app looks best', 'social media recommendations', 'credit score'],
        explanation: 'Asset location considers which assets belong in taxable vs tax-deferred vs tax-free accounts for after-tax outcomes.'
      },
      {
        itemId: 'item-taxadv-003',
        skillId: 'marginal-vs-effective',
        prompt: 'Marginal tax rate is:',
        correctAnswer: 'the rate on your next dollar of income',
        acceptableAnswers: ['the rate on your next dollar of income'],
        format: 'mcq',
        choices: ['the rate on your next dollar of income', 'your average tax rate', 'your payroll deduction amount', 'your credit card APR'],
        explanation: 'Marginal rate applies to the next incremental income, while effective rate is total tax divided by total income.'
      },
      {
        itemId: 'item-taxadv-004',
        skillId: 'deduction-vs-credit',
        prompt: 'A tax credit generally reduces:',
        correctAnswer: 'tax owed dollar-for-dollar',
        acceptableAnswers: ['tax owed dollar-for-dollar'],
        format: 'mcq',
        choices: ['tax owed dollar-for-dollar', 'only taxable income', 'your credit score', 'your interest rate'],
        explanation: 'Deductions reduce taxable income; credits typically reduce tax liability directly, subject to eligibility.'
      },
      {
        itemId: 'item-taxadv-005',
        skillId: 'timing-income-expenses',
        prompt: 'Tax planning often involves timing income and expenses to:',
        correctAnswer: 'shift taxable income between years',
        acceptableAnswers: ['shift taxable income between years'],
        format: 'mcq',
        choices: ['shift taxable income between years', 'increase overdraft risk', 'avoid budgeting', 'remove inflation'],
        explanation: 'Timing can change which year income is taxed in and whether deductions/credits apply, depending on rules.'
      },
      {
        itemId: 'item-taxadv-006',
        skillId: 'estimated-tax-use-case',
        prompt: 'Estimated tax payments are commonly used when:',
        correctAnswer: 'income is not subject to withholding',
        acceptableAnswers: ['income is not subject to withholding'],
        format: 'mcq',
        choices: ['income is not subject to withholding', 'you have a W-2 only job', 'you want to raise credit limits', 'you have no income'],
        explanation: 'When income is not withheld (for example self-employment), estimated payments can help avoid underpayment penalties.'
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
        correctAnswer: 'portfolio risk exposure',
        acceptableAnswers: ['portfolio risk exposure'],
        format: 'mcq',
        choices: ['portfolio risk exposure', 'your credit limit', 'your tax bracket', 'your emergency fund target'],
        explanation: 'A volatility budget is a risk control tool that limits how much risk the portfolio is allowed to take.'
      },
      {
        itemId: 'item-risk-002',
        skillId: 'rebalancing-policy',
        prompt: 'Systematic rebalancing is mainly used to:',
        correctAnswer: 'maintain target allocation',
        acceptableAnswers: ['maintain target allocation'],
        format: 'mcq',
        choices: ['maintain target allocation', 'maximize short-term performance', 'avoid diversification', 'delay all decisions'],
        explanation: 'Rebalancing restores the portfolio to policy targets after drift, helping keep risk consistent.'
      },
      {
        itemId: 'item-risk-003',
        skillId: 'concentration-risk',
        prompt: 'Concentration risk is highest when:',
        correctAnswer: 'one holding dominates your portfolio',
        acceptableAnswers: ['one holding dominates your portfolio'],
        format: 'mcq',
        choices: ['one holding dominates your portfolio', 'you rebalance periodically', 'you hold many diversified funds', 'you keep a cash buffer'],
        explanation: 'When one position becomes too large, its performance can overpower the rest of the portfolio.'
      },
      {
        itemId: 'item-risk-004',
        skillId: 'correlation',
        prompt: 'Assets that move differently from each other can improve diversification because of lower:',
        correctAnswer: 'correlation',
        acceptableAnswers: ['correlation'],
        format: 'mcq',
        choices: ['correlation', 'tax bracket', 'credit score', 'overdraft fees'],
        explanation: 'Lower correlation means losses in one asset may be offset by stability or gains in another.'
      },
      {
        itemId: 'item-risk-005',
        skillId: 'risk-tolerance-basis',
        prompt: 'Risk tolerance should be based on:',
        correctAnswer: 'time horizon and ability to absorb losses',
        acceptableAnswers: ['time horizon and ability to absorb losses'],
        format: 'mcq',
        choices: ['time horizon and ability to absorb losses', 'recent headlines only', 'one hot stock tip', 'the highest possible return'],
        explanation: 'Risk tolerance depends on when you need the money and how much volatility you can financially and emotionally handle.'
      },
      {
        itemId: 'item-risk-006',
        skillId: 'investment-policy-statement',
        prompt: 'An investment policy statement helps you:',
        correctAnswer: 'stick to a plan during volatility',
        acceptableAnswers: ['stick to a plan during volatility'],
        format: 'mcq',
        choices: ['stick to a plan during volatility', 'avoid saving money', 'time markets perfectly', 'eliminate taxes'],
        explanation: 'Written rules reduce impulse decisions and keep actions aligned with long-term goals.'
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

lessons.push(...generatedLessonSeeds.map(buildGeneratedLesson));

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

for (const lesson of lessons) {
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

export function getNextLessonForLevel(level: Lesson['level'], includePremium: boolean): Lesson | undefined {
  return getNextLessonForLevelFromCurriculum(listCurriculum(includePremium), level);
}

export function isLessonCompleted(user: UserProfile, lessonId: string): boolean {
  return Boolean(user.completedLessons?.[lessonId]);
}

export function getNextLessonForProgress(user: UserProfile, includePremium: boolean): Lesson | undefined {
  return getNextLessonForProgressFromCurriculum(user, listCurriculum(includePremium));
}

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
