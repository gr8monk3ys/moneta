// Static, hand-authored curriculum seed lessons.
import type { Lesson } from '../types.js';

export const seedLessons: Lesson[] = [
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
