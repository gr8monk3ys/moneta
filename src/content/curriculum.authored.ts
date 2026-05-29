// Hand-authored lessons converted from the generator's topic backlog to the
// seed-quality bar (real distractors, comprehension over framing-recall, mixed
// formats, meaningful skill IDs). Editorial status is provisional pending SME review.
import type { Lesson } from '../types.js';

const EDITORIAL = {
  status: 'provisional' as const,
  reviewer: 'Moneta Curriculum Team',
  reviewedAt: '2026-05-29T00:00:00.000Z',
  notes: 'Authored to seed standard; pending external SME review.'
};

export const authoredLessons: Lesson[] = [
  {
    lessonId: 'lesson-paycheck-decoder-f1-003',
    title: 'Paycheck Decoder',
    summary: 'Read gross pay, deductions, and take-home pay without guesswork.',
    estimatedMinutes: 6,
    level: 'F1',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      {
        itemId: 'item-paycheck-decoder-1', skillId: 'net-pay', format: 'mcq',
        prompt: 'Net pay is:',
        correctAnswer: 'take-home pay after taxes and payroll deductions',
        acceptableAnswers: ['take-home pay after taxes and payroll deductions'],
        choices: ['take-home pay after taxes and payroll deductions', 'total pay before any deductions', 'only the amount withheld for taxes', 'gross pay plus reimbursements'],
        explanation: 'Net (take-home) pay is what lands in your account after taxes and payroll deductions are removed from gross pay.'
      },
      {
        itemId: 'item-paycheck-decoder-2', skillId: 'net-pay', format: 'numeric',
        prompt: 'Gross pay is $4,000 and taxes plus deductions are $900. Net pay is:',
        correctAnswer: '3100', acceptableAnswers: ['3100'],
        explanation: 'Net pay = gross minus (taxes + deductions). 4000 - 900 = 3100.'
      },
      {
        itemId: 'item-paycheck-decoder-3', skillId: 'payroll-deductions', format: 'mcq',
        prompt: 'Which item reduces gross pay to net pay?',
        correctAnswer: 'tax withholding and retirement contributions',
        acceptableAnswers: ['tax withholding and retirement contributions'],
        choices: ['tax withholding and retirement contributions', 'your monthly rent', 'a credit card payment', 'grocery spending'],
        explanation: 'Deductions are taken on the paycheck itself (taxes, retirement, benefits). Bills like rent are paid later out of net pay.'
      },
      {
        itemId: 'item-paycheck-decoder-4', skillId: 'budget-from-net', format: 'mcq',
        prompt: 'Budgeting from gross pay instead of net pay usually causes you to:',
        correctAnswer: 'plan to spend money you never actually receive',
        acceptableAnswers: ['plan to spend money you never actually receive'],
        choices: ['plan to spend money you never actually receive', 'pay less in taxes', 'increase your take-home pay', 'raise your credit score'],
        explanation: 'Spending plans should start from take-home pay. Gross overstates what you can actually spend.'
      },
      {
        itemId: 'item-paycheck-decoder-5', skillId: 'savings-rate', format: 'numeric',
        prompt: 'If net pay is $3,100 and you save 10% first, how much do you save?',
        correctAnswer: '310', acceptableAnswers: ['310'],
        explanation: '10% of take-home: 3100 x 0.10 = 310, moved before discretionary spending.'
      },
      {
        itemId: 'item-paycheck-decoder-6', skillId: 'paycheck-review-cadence', format: 'mcq',
        prompt: 'When should you re-check your paycheck math?',
        correctAnswer: 'after any raise, benefits change, or tax update',
        acceptableAnswers: ['after any raise, benefits change, or tax update'],
        choices: ['after any raise, benefits change, or tax update', 'never, it is fixed for life', 'only if a payment bounces', 'once every few years'],
        explanation: 'Deductions and withholding change with raises, benefits enrollment, and tax updates, which shifts take-home pay.'
      }
    ]
  },
  {
    lessonId: 'lesson-bank-account-basics-f1-004',
    title: 'Bank Account Basics',
    summary: 'Choose an account setup that reduces fees and payment friction.',
    estimatedMinutes: 6,
    level: 'F1',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      {
        itemId: 'item-bank-account-basics-1', skillId: 'account-fees', format: 'mcq',
        prompt: 'A monthly checking maintenance fee is usually best avoided by:',
        correctAnswer: 'meeting the waiver requirements (direct deposit or minimum balance)',
        acceptableAnswers: ['meeting the waiver requirements (direct deposit or minimum balance)'],
        choices: ['meeting the waiver requirements (direct deposit or minimum balance)', 'closing the account every month', 'paying the fee with a credit card', 'ignoring your statements'],
        explanation: 'Many banks waive maintenance fees when you meet conditions like a direct deposit or minimum balance. Compare options that waive fees.'
      },
      {
        itemId: 'item-bank-account-basics-2', skillId: 'overdraft', format: 'mcq',
        prompt: 'An overdraft fee is typically charged when you:',
        correctAnswer: 'spend more than your available balance',
        acceptableAnswers: ['spend more than your available balance'],
        choices: ['spend more than your available balance', 'deposit a check', 'check your balance', 'set up autopay'],
        explanation: 'Overdrafts happen when a payment exceeds available funds. A small buffer and low-balance alerts help avoid them.'
      },
      {
        itemId: 'item-bank-account-basics-3', skillId: 'checking-buffer', format: 'numeric',
        prompt: 'If your monthly bills total $1,200, keeping one month of bills in checking means holding at least:',
        correctAnswer: '1200', acceptableAnswers: ['1200'],
        explanation: 'A one-month buffer equals your monthly bills. Here that is 1200, which cushions timing gaps between deposits and payments.'
      },
      {
        itemId: 'item-bank-account-basics-4', skillId: 'account-separation', format: 'mcq',
        prompt: 'Keeping savings in a separate account mainly helps by:',
        correctAnswer: 'reducing the temptation to spend it',
        acceptableAnswers: ['reducing the temptation to spend it'],
        choices: ['reducing the temptation to spend it', 'guaranteeing investment returns', 'raising your credit score', 'avoiding all taxes'],
        explanation: 'Separating goal money from spending money adds a small, useful barrier between you and impulse spending.'
      },
      {
        itemId: 'item-bank-account-basics-5', skillId: 'low-balance-alerts', format: 'mcq',
        prompt: 'Low-balance alerts are useful because they let you:',
        correctAnswer: 'act before an overdraft happens',
        acceptableAnswers: ['act before an overdraft happens'],
        choices: ['act before an overdraft happens', 'increase your credit limit', 'earn rewards points', 'skip filing taxes'],
        explanation: 'An early warning gives you time to move money or delay a payment before fees hit.'
      },
      {
        itemId: 'item-bank-account-basics-6', skillId: 'high-yield-savings', format: 'mcq',
        prompt: 'Compared with leaving cash in checking, a high-yield savings account usually offers:',
        correctAnswer: 'more interest while keeping the money accessible',
        acceptableAnswers: ['more interest while keeping the money accessible'],
        choices: ['more interest while keeping the money accessible', 'guaranteed stock returns', 'no access to your money', 'a higher credit score'],
        explanation: 'High-yield savings typically pays more interest than checking while staying liquid, which suits short-term reserves.'
      }
    ]
  },
  {
    lessonId: 'lesson-needs-vs-wants-f1-005',
    title: 'Needs vs Wants',
    summary: 'Separate essentials from lifestyle spending with clear rules.',
    estimatedMinutes: 6,
    level: 'F1',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      {
        itemId: 'item-needs-vs-wants-1', skillId: 'expense-classification', format: 'mcq',
        prompt: 'Which is typically a need rather than a want?',
        correctAnswer: 'housing',
        acceptableAnswers: ['housing'],
        choices: ['housing', 'streaming subscriptions', 'dining out', 'a vacation'],
        explanation: 'Needs are essentials required to live and work (housing, basic food, utilities). The others are discretionary.'
      },
      {
        itemId: 'item-needs-vs-wants-2', skillId: 'discretionary-spending', format: 'mcq',
        prompt: 'A discretionary (want) expense is one you:',
        correctAnswer: 'could reduce or pause without losing essentials',
        acceptableAnswers: ['could reduce or pause without losing essentials'],
        choices: ['could reduce or pause without losing essentials', 'must pay to keep housing', 'owe by law', 'cannot control at all'],
        explanation: 'Discretionary spending is flexible. Identifying it shows where you have room to adjust when needed.'
      },
      {
        itemId: 'item-needs-vs-wants-3', skillId: 'essentials-ratio', format: 'numeric',
        prompt: 'If take-home pay is $3,000, a roughly 50% essentials target is about:',
        correctAnswer: '1500', acceptableAnswers: ['1500'],
        explanation: 'A common guideline keeps essentials near 50% of take-home. 3000 x 0.50 = 1500. It is a starting point, not a hard rule.'
      },
      {
        itemId: 'item-needs-vs-wants-4', skillId: 'lifestyle-creep', format: 'mcq',
        prompt: 'When recurring wants gradually get treated as needs, it is called:',
        correctAnswer: 'lifestyle creep',
        acceptableAnswers: ['lifestyle creep'],
        choices: ['lifestyle creep', 'diversification', 'compounding', 'underwriting'],
        explanation: 'Lifestyle creep is when rising spending quietly absorbs raises, leaving little extra for goals.'
      },
      {
        itemId: 'item-needs-vs-wants-5', skillId: 'essentials-too-high', format: 'mcq',
        prompt: 'If essentials are far above half of take-home, a reasonable response is to:',
        correctAnswer: 'work to reduce fixed costs or grow income over time',
        acceptableAnswers: ['work to reduce fixed costs or grow income over time'],
        choices: ['work to reduce fixed costs or grow income over time', 'stop tracking spending', 'take a payday loan', 'ignore the ratio'],
        explanation: 'High fixed costs limit flexibility. Lowering them or raising income creates breathing room for savings and goals.'
      },
      {
        itemId: 'item-needs-vs-wants-6', skillId: 'tracking-to-behavior', format: 'mcq',
        prompt: 'Labeling spending as needs or wants only helps if you also:',
        correctAnswer: 'change behavior based on what you see',
        acceptableAnswers: ['change behavior based on what you see'],
        choices: ['change behavior based on what you see', 'delete the data', 'spend more on wants', 'stop budgeting'],
        explanation: 'Categorizing is diagnostic. The benefit comes from acting on the pattern, not just recording it.'
      }
    ]
  },
  {
    lessonId: 'lesson-bill-calendar-routines-f1-006',
    title: 'Bill Calendar Routines',
    summary: 'Use due-date systems to prevent late fees and missed payments.',
    estimatedMinutes: 5,
    level: 'F1',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      {
        itemId: 'item-bill-calendar-routines-1', skillId: 'late-payment-risk', format: 'mcq',
        prompt: 'Missing a bill due date most directly risks:',
        correctAnswer: 'late fees and possible credit damage',
        acceptableAnswers: ['late fees and possible credit damage'],
        choices: ['late fees and possible credit damage', 'a larger tax refund', 'lower rent', 'a higher savings rate'],
        explanation: 'Late payments can trigger fees and, if reported, hurt your credit history. Payment history is a major credit factor.'
      },
      {
        itemId: 'item-bill-calendar-routines-2', skillId: 'due-date-system', format: 'mcq',
        prompt: 'A reliable way to avoid missed payments is to:',
        correctAnswer: 'set reminders and autopay for fixed bills',
        acceptableAnswers: ['set reminders and autopay for fixed bills'],
        choices: ['set reminders and autopay for fixed bills', 'rely on memory', 'pay only when contacted', 'check email occasionally'],
        explanation: 'Systems beat memory. Reminders plus autopay for stable bills reduce the chance of a missed due date.'
      },
      {
        itemId: 'item-bill-calendar-routines-3', skillId: 'autopay-caution', format: 'mcq',
        prompt: 'A key caution when using autopay is to:',
        correctAnswer: 'keep enough balance so autopay does not overdraft',
        acceptableAnswers: ['keep enough balance so autopay does not overdraft'],
        choices: ['keep enough balance so autopay does not overdraft', 'never check statements again', 'disable all alerts', 'stop budgeting'],
        explanation: 'Autopay prevents late fees but can cause overdrafts if the balance is short. Keep a buffer and still review statements.'
      },
      {
        itemId: 'item-bill-calendar-routines-4', skillId: 'reminder-buffer', format: 'numeric',
        prompt: 'If a bill is due on the 20th and you want a 3-day reminder buffer, set the reminder on day:',
        correctAnswer: '17', acceptableAnswers: ['17'],
        explanation: 'A buffer gives time to fix problems. 20 - 3 = the 17th.'
      },
      {
        itemId: 'item-bill-calendar-routines-5', skillId: 'statement-balance', format: 'mcq',
        prompt: 'For a credit card, paying by the due date in full avoids:',
        correctAnswer: 'interest charges',
        acceptableAnswers: ['interest charges'],
        choices: ['interest charges', 'the statement closing date', 'your credit limit', 'payroll taxes'],
        explanation: 'Paying the full statement balance by the due date typically avoids interest on purchases.'
      },
      {
        itemId: 'item-bill-calendar-routines-6', skillId: 'align-due-dates', format: 'mcq',
        prompt: 'Aligning bill due dates near payday helps by:',
        correctAnswer: 'matching outflows to when cash arrives',
        acceptableAnswers: ['matching outflows to when cash arrives'],
        choices: ['matching outflows to when cash arrives', 'raising your credit score instantly', 'eliminating the bills', 'increasing your APR'],
        explanation: 'When bills land close to income, you are less likely to be short on the due date. Many billers let you change the date.'
      }
    ]
  },
  {
    lessonId: 'lesson-first-budget-iteration-f1-007',
    title: 'First Budget Iteration',
    summary: 'Build a version-one budget and improve it with real data.',
    estimatedMinutes: 6,
    level: 'F1',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      {
        itemId: 'item-first-budget-iteration-1', skillId: 'budget-iteration', format: 'mcq',
        prompt: 'A first budget is best treated as:',
        correctAnswer: 'a draft you refine with real spending data',
        acceptableAnswers: ['a draft you refine with real spending data'],
        choices: ['a draft you refine with real spending data', 'a permanent fixed rule', 'irrelevant once written', 'only for emergencies'],
        explanation: 'Your first numbers are estimates. Comparing them to actual spending is how a budget becomes accurate.'
      },
      {
        itemId: 'item-first-budget-iteration-2', skillId: 'budget-variance', format: 'mcq',
        prompt: 'Budget variance is:',
        correctAnswer: 'the gap between planned and actual spending',
        acceptableAnswers: ['the gap between planned and actual spending'],
        choices: ['the gap between planned and actual spending', 'your credit utilization', 'your net worth', 'your tax rate'],
        explanation: 'Variance shows where reality differs from the plan, pointing to what to adjust next.'
      },
      {
        itemId: 'item-first-budget-iteration-3', skillId: 'budget-variance', format: 'numeric',
        prompt: 'You planned $400 for groceries but spent $520. The overage is:',
        correctAnswer: '120', acceptableAnswers: ['120'],
        explanation: 'Overage = actual minus planned. 520 - 400 = 120.'
      },
      {
        itemId: 'item-first-budget-iteration-4', skillId: 'budget-abandonment', format: 'mcq',
        prompt: 'A common reason budgets fail is:',
        correctAnswer: 'all-or-nothing abandonment after one bad week',
        acceptableAnswers: ['all-or-nothing abandonment after one bad week'],
        choices: ['all-or-nothing abandonment after one bad week', 'reviewing too often', 'saving too much', 'tracking categories'],
        explanation: 'One overspend is normal. Treating a single slip as failure is what usually ends a budget.'
      },
      {
        itemId: 'item-first-budget-iteration-5', skillId: 'budget-focus', format: 'mcq',
        prompt: 'When you go over budget, a practical step is to:',
        correctAnswer: 'adjust the one or two categories driving the overage',
        acceptableAnswers: ['adjust the one or two categories driving the overage'],
        choices: ['adjust the one or two categories driving the overage', 'cut every category to zero', 'stop the budget', 'ignore it'],
        explanation: 'Most overspending concentrates in a few categories. Fixing those is more effective than slashing everything.'
      },
      {
        itemId: 'item-first-budget-iteration-6', skillId: 'budget-cadence', format: 'mcq',
        prompt: 'A useful review cadence for a new budget is:',
        correctAnswer: 'weekly at first',
        acceptableAnswers: ['weekly at first'],
        choices: ['weekly at first', 'once a year', 'never', 'only after overdrafting'],
        explanation: 'Frequent early reviews catch drift quickly while you are still calibrating the plan.'
      }
    ]
  },
  {
    lessonId: 'lesson-savings-automation-basics-f1-008',
    title: 'Savings Automation Basics',
    summary: 'Automate transfers so goals happen without daily willpower.',
    estimatedMinutes: 6,
    level: 'F1',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      {
        itemId: 'item-savings-automation-basics-1', skillId: 'pay-yourself-first', format: 'mcq',
        prompt: 'Pay yourself first means:',
        correctAnswer: 'automating savings before discretionary spending',
        acceptableAnswers: ['automating savings before discretionary spending'],
        choices: ['automating savings before discretionary spending', 'paying every bill before saving', 'saving only what is left over', 'spending first and saving later'],
        explanation: 'Moving savings right after income makes goals reliable instead of dependent on leftover cash.'
      },
      {
        itemId: 'item-savings-automation-basics-2', skillId: 'savings-automation', format: 'mcq',
        prompt: 'Automating a transfer at payday mainly helps by:',
        correctAnswer: 'removing reliance on willpower each month',
        acceptableAnswers: ['removing reliance on willpower each month'],
        choices: ['removing reliance on willpower each month', 'guaranteeing investment returns', 'raising your credit limit', 'avoiding taxes'],
        explanation: 'Automation makes the good choice the default, so saving does not depend on remembering or feeling motivated.'
      },
      {
        itemId: 'item-savings-automation-basics-3', skillId: 'contribution-sizing', format: 'numeric',
        prompt: 'To save $1,200 over 12 monthly paychecks, save per paycheck:',
        correctAnswer: '100', acceptableAnswers: ['100'],
        explanation: 'Per-period amount = goal divided by periods. 1200 / 12 = 100.'
      },
      {
        itemId: 'item-savings-automation-basics-4', skillId: 'savings-buckets', format: 'mcq',
        prompt: 'Separate savings buckets help by:',
        correctAnswer: 'keeping goal money distinct from spending money',
        acceptableAnswers: ['keeping goal money distinct from spending money'],
        choices: ['keeping goal money distinct from spending money', 'increasing your APR', 'removing the need to budget', 'guaranteeing returns'],
        explanation: 'Named buckets make progress visible and reduce accidental spending of money already assigned to a goal.'
      },
      {
        itemId: 'item-savings-automation-basics-5', skillId: 'transfer-timing', format: 'mcq',
        prompt: 'The most reliable time to move savings is:',
        correctAnswer: 'right after income arrives',
        acceptableAnswers: ['right after income arrives'],
        choices: ['right after income arrives', 'at month-end if anything is left', 'only when you get a bonus', 'at random times'],
        explanation: 'Saving first protects the contribution before spending competes for the same dollars.'
      },
      {
        itemId: 'item-savings-automation-basics-6', skillId: 'manual-transfer-risk', format: 'mcq',
        prompt: 'Manual (non-automated) transfers tend to:',
        correctAnswer: 'get skipped during busy or tight weeks',
        acceptableAnswers: ['get skipped during busy or tight weeks'],
        choices: ['get skipped during busy or tight weeks', 'earn more interest', 'improve your credit mix', 'lower your taxes'],
        explanation: 'Relying on manual action introduces chances to forget or postpone, which is why automation is more dependable.'
      }
    ]
  },
  {
    lessonId: 'lesson-emergency-cash-ramp-f1-009',
    title: 'Emergency Cash Ramp',
    summary: 'Build starter emergency reserves before pursuing optional goals.',
    estimatedMinutes: 6,
    level: 'F1',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      {
        itemId: 'item-emergency-cash-ramp-1', skillId: 'starter-buffer', format: 'mcq',
        prompt: 'Before optional goals, a sensible first milestone is:',
        correctAnswer: 'a small starter emergency buffer',
        acceptableAnswers: ['a small starter emergency buffer'],
        choices: ['a small starter emergency buffer', 'a new phone', 'a vacation fund', 'a stock portfolio'],
        explanation: 'A starter buffer reduces the chance the next surprise forces you into high-interest debt.'
      },
      {
        itemId: 'item-emergency-cash-ramp-2', skillId: 'emergency-vs-sinking', format: 'mcq',
        prompt: 'A predictable annual cost like insurance belongs in:',
        correctAnswer: 'a sinking fund, not the emergency fund',
        acceptableAnswers: ['a sinking fund, not the emergency fund'],
        choices: ['a sinking fund, not the emergency fund', 'the emergency fund', 'a credit card balance', 'no plan at all'],
        explanation: 'Emergencies are unexpected. Known, recurring costs are better handled by saving ahead in a sinking fund.'
      },
      {
        itemId: 'item-emergency-cash-ramp-3', skillId: 'buffer-timeline', format: 'numeric',
        prompt: 'If your buffer target is $1,000 and you save $125 per month, months to reach it:',
        correctAnswer: '8', acceptableAnswers: ['8'],
        explanation: 'Months = target divided by monthly contribution. 1000 / 125 = 8.'
      },
      {
        itemId: 'item-emergency-cash-ramp-4', skillId: 'debt-avoidance', format: 'mcq',
        prompt: 'A starter buffer mainly reduces the chance of:',
        correctAnswer: 'using high-interest debt for routine surprises',
        acceptableAnswers: ['using high-interest debt for routine surprises'],
        choices: ['using high-interest debt for routine surprises', 'paying any taxes', 'earning interest', 'raising your rent'],
        explanation: 'Without cash on hand, surprises often go on credit cards. A buffer breaks that cycle.'
      },
      {
        itemId: 'item-emergency-cash-ramp-5', skillId: 'emergency-liquidity', format: 'mcq',
        prompt: 'Emergency money should be kept:',
        correctAnswer: 'liquid and low-risk',
        acceptableAnswers: ['liquid and low-risk'],
        choices: ['liquid and low-risk', 'in volatile stocks', 'in a long-term lockup', 'in collectibles'],
        explanation: 'Emergency funds may be needed on short notice, so accessibility and stability matter more than maximum return.'
      },
      {
        itemId: 'item-emergency-cash-ramp-6', skillId: 'funding-order', format: 'mcq',
        prompt: 'A reasonable funding order is to build the starter buffer:',
        correctAnswer: 'before nonessential upgrades',
        acceptableAnswers: ['before nonessential upgrades'],
        choices: ['before nonessential upgrades', 'after buying wants', 'only from bonuses', 'never'],
        explanation: 'Funding the buffer first protects everything else you are trying to do.'
      }
    ]
  },
  {
    lessonId: 'lesson-scam-red-flag-basics-f1-010',
    title: 'Scam Red-Flag Basics',
    summary: 'Recognize urgency, impersonation, and payment red flags.',
    estimatedMinutes: 6,
    level: 'F1',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      {
        itemId: 'item-scam-red-flag-basics-1', skillId: 'scam-urgency', format: 'mcq',
        prompt: 'A classic scam red flag is:',
        correctAnswer: 'pressure to act immediately',
        acceptableAnswers: ['pressure to act immediately'],
        choices: ['pressure to act immediately', 'a written contract', 'a cooling-off period', 'a printed receipt'],
        explanation: 'Scammers manufacture urgency to stop you from pausing and verifying. Urgency itself is a warning sign.'
      },
      {
        itemId: 'item-scam-red-flag-basics-2', skillId: 'verify-before-action', format: 'mcq',
        prompt: 'If an urgent message asks for money or codes, you should:',
        correctAnswer: 'pause and verify through a trusted, independent channel',
        acceptableAnswers: ['pause and verify through a trusted, independent channel'],
        choices: ['pause and verify through a trusted, independent channel', 'act immediately', 'share the code', 'reply to the message'],
        explanation: 'Independent verification (a number you already trust) defeats most impersonation attempts.'
      },
      {
        itemId: 'item-scam-red-flag-basics-3', skillId: 'caller-id-spoofing', format: 'mcq',
        prompt: 'Caller ID showing your bank name proves:',
        correctAnswer: 'nothing, because caller ID can be spoofed',
        acceptableAnswers: ['nothing, because caller ID can be spoofed'],
        choices: ['nothing, because caller ID can be spoofed', 'the call is genuine', 'you must comply', 'it is about taxes'],
        explanation: 'Caller ID and names can be faked. Treat inbound contact as unverified until you confirm it yourself.'
      },
      {
        itemId: 'item-scam-red-flag-basics-4', skillId: 'security-codes', format: 'mcq',
        prompt: 'A legitimate institution will generally NOT:',
        correctAnswer: 'ask you to read back a one-time security code',
        acceptableAnswers: ['ask you to read back a one-time security code'],
        choices: ['ask you to read back a one-time security code', 'send a statement', 'offer a callback number', 'mail a letter'],
        explanation: 'One-time codes are meant only for you to enter. Anyone asking you to share one is a strong red flag.'
      },
      {
        itemId: 'item-scam-red-flag-basics-5', skillId: 'safe-callback', format: 'mcq',
        prompt: 'The safest way to confirm a suspicious bank call is to:',
        correctAnswer: 'hang up and call the number on your card or statement',
        acceptableAnswers: ['hang up and call the number on your card or statement'],
        choices: ['hang up and call the number on your card or statement', 'call the number they gave you', 'text them back', 'ignore it forever'],
        explanation: 'Calling a number you independently trust ensures you reach the real institution, not the caller.'
      },
      {
        itemId: 'item-scam-red-flag-basics-6', skillId: 'delay-buffer', format: 'mcq',
        prompt: 'Adding a delay before acting on urgent money requests helps because:',
        correctAnswer: 'scams rely on removing your time to think',
        acceptableAnswers: ['scams rely on removing your time to think'],
        choices: ['scams rely on removing your time to think', 'it earns interest', 'it raises your credit', 'it files your taxes'],
        explanation: 'A short delay lets pressure fade and gives you time to verify, which is exactly what a scam tries to prevent.'
      }
    ]
  },
  {
    lessonId: 'lesson-debit-vs-credit-f1-011',
    title: 'Debit vs Credit',
    summary: 'Pick the right payment method and avoid interest traps.',
    estimatedMinutes: 6,
    level: 'F1',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      {
        itemId: 'item-debit-vs-credit-1', skillId: 'credit-interest', format: 'mcq',
        prompt: 'Carrying a credit card balance leads to:',
        correctAnswer: 'interest charges on the unpaid amount',
        acceptableAnswers: ['interest charges on the unpaid amount'],
        choices: ['interest charges on the unpaid amount', 'a tax refund', 'a higher debit limit', 'free rewards with no cost'],
        explanation: 'Unpaid balances accrue interest, often at high rates, which can quickly outweigh any rewards.'
      },
      {
        itemId: 'item-debit-vs-credit-2', skillId: 'pay-in-full', format: 'mcq',
        prompt: 'Paying the statement balance in full each cycle:',
        correctAnswer: 'avoids interest in most cases',
        acceptableAnswers: ['avoids interest in most cases'],
        choices: ['avoids interest in most cases', 'raises your APR', 'lowers your limit', 'is not possible'],
        explanation: 'Paying in full by the due date typically means no interest on purchases, letting you use credit without the cost.'
      },
      {
        itemId: 'item-debit-vs-credit-3', skillId: 'interest-dollar-cost', format: 'numeric',
        prompt: 'A $1,000 balance at 24% APR costs about how much per year in interest (simple estimate)?',
        correctAnswer: '240', acceptableAnswers: ['240'],
        explanation: 'A rough annual estimate is balance times APR. 1000 x 0.24 = 240.'
      },
      {
        itemId: 'item-debit-vs-credit-4', skillId: 'debit-mechanics', format: 'mcq',
        prompt: 'A debit card spends:',
        correctAnswer: 'money you already have',
        acceptableAnswers: ['money you already have'],
        choices: ['money you already have', 'borrowed money you repay later', 'your credit limit', 'your tax refund'],
        explanation: 'Debit draws directly from your bank balance, while credit borrows money you must repay.'
      },
      {
        itemId: 'item-debit-vs-credit-5', skillId: 'fraud-protection', format: 'mcq',
        prompt: 'Credit cards often provide stronger:',
        correctAnswer: 'fraud protection and dispute rights',
        acceptableAnswers: ['fraud protection and dispute rights'],
        choices: ['fraud protection and dispute rights', 'guaranteed interest savings', 'guaranteed rewards', 'tax benefits'],
        explanation: 'Credit purchases generally have stronger fraud and dispute protections than debit, since the money is not yet yours to lose.'
      },
      {
        itemId: 'item-debit-vs-credit-6', skillId: 'payoff-plan', format: 'mcq',
        prompt: 'Using a credit card responsibly assumes you:',
        correctAnswer: 'have a plan to pay it off',
        acceptableAnswers: ['have a plan to pay it off'],
        choices: ['have a plan to pay it off', 'carry a balance forever', 'ignore the due date', 'max out the limit'],
        explanation: 'Credit is a tool only when you can pay the balance. Without a payoff plan, interest erodes the benefit.'
      }
    ]
  },
  {
    lessonId: 'lesson-paycheck-withholding-check-f1-012',
    title: 'Paycheck Withholding Check',
    summary: 'Sanity-check withholding so taxes are not a surprise.',
    estimatedMinutes: 6,
    level: 'F1',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      {
        itemId: 'item-paycheck-withholding-check-1', skillId: 'withholding-definition', format: 'mcq',
        prompt: 'Tax withholding is:',
        correctAnswer: 'tax taken from each paycheck toward your yearly bill',
        acceptableAnswers: ['tax taken from each paycheck toward your yearly bill'],
        choices: ['tax taken from each paycheck toward your yearly bill', 'a savings account', 'a credit score factor', 'a type of loan'],
        explanation: 'Withholding prepays your income tax over the year so you do not owe it all at filing time.'
      },
      {
        itemId: 'item-paycheck-withholding-check-2', skillId: 'underwithholding', format: 'mcq',
        prompt: 'Under-withholding most likely leads to:',
        correctAnswer: 'owing taxes, and possibly penalties, at filing',
        acceptableAnswers: ['owing taxes, and possibly penalties, at filing'],
        choices: ['owing taxes, and possibly penalties, at filing', 'a guaranteed refund', 'a higher credit limit', 'lower rent'],
        explanation: 'If too little is withheld, you make up the difference at tax time and may face an underpayment penalty.'
      },
      {
        itemId: 'item-paycheck-withholding-check-3', skillId: 'withholding-triggers', format: 'mcq',
        prompt: 'Withholding is worth re-checking after:',
        correctAnswer: 'a raise, a second job, or major life changes',
        acceptableAnswers: ['a raise, a second job, or major life changes'],
        choices: ['a raise, a second job, or major life changes', 'every grocery trip', 'never', 'only at retirement'],
        explanation: 'Income and life changes shift your tax picture, so the amount withheld may need updating.'
      },
      {
        itemId: 'item-paycheck-withholding-check-4', skillId: 'refund-meaning', format: 'mcq',
        prompt: 'A very large refund effectively means you:',
        correctAnswer: 'lent the government money interest-free during the year',
        acceptableAnswers: ['lent the government money interest-free during the year'],
        choices: ['lent the government money interest-free during the year', 'earned extra income', 'paid no tax', 'beat the market'],
        explanation: 'A big refund means you overpaid through withholding. That money could have been working for you sooner.'
      },
      {
        itemId: 'item-paycheck-withholding-check-5', skillId: 'withholding-gap', format: 'numeric',
        prompt: 'Estimated annual tax is $6,000 and expected withholding is $5,200. The gap is:',
        correctAnswer: '800', acceptableAnswers: ['800'],
        explanation: 'Gap = estimated tax minus expected withholding. 6000 - 5200 = 800 you would owe.'
      },
      {
        itemId: 'item-paycheck-withholding-check-6', skillId: 'withholding-action', format: 'mcq',
        prompt: 'If withholding looks too low, a reasonable step is to:',
        correctAnswer: 'update your withholding form with payroll',
        acceptableAnswers: ['update your withholding form with payroll'],
        choices: ['update your withholding form with payroll', 'ignore it until audited', 'stop working', 'close your account'],
        explanation: 'Adjusting your withholding (for example via a W-4 update) realigns paycheck tax with what you expect to owe.'
      }
    ]
  },
  {
    lessonId: 'lesson-spending-friction-tools-f1-013',
    title: 'Spending Friction Tools',
    summary: 'Use small friction to curb overspending in your top leak category.',
    estimatedMinutes: 5,
    level: 'F1',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      {
        itemId: 'item-spending-friction-tools-1', skillId: 'spending-friction', format: 'mcq',
        prompt: 'Adding friction to a leak category means:',
        correctAnswer: 'making impulse spending slightly harder',
        acceptableAnswers: ['making impulse spending slightly harder'],
        choices: ['making impulse spending slightly harder', 'removing all limits', 'hiding your balance', 'increasing autopay'],
        explanation: 'A little friction (an extra step, a separate limit) interrupts impulse purchases without banning spending entirely.'
      },
      {
        itemId: 'item-spending-friction-tools-2', skillId: 'weekly-limit', format: 'numeric',
        prompt: 'A $200 monthly dining cap split into about 4 weeks is roughly:',
        correctAnswer: '50', acceptableAnswers: ['50'],
        explanation: 'Weekly limit is roughly the monthly cap divided by 4. 200 / 4 = 50, which is easier to manage day to day.'
      },
      {
        itemId: 'item-spending-friction-tools-3', skillId: 'separate-account-limit', format: 'mcq',
        prompt: 'Using a separate card or account for one category helps by:',
        correctAnswer: 'making the limit visible and self-enforcing',
        acceptableAnswers: ['making the limit visible and self-enforcing'],
        choices: ['making the limit visible and self-enforcing', 'raising your APR', 'earning guaranteed returns', 'removing the budget'],
        explanation: 'When a category has its own pot of money, running low is obvious and naturally slows spending.'
      },
      {
        itemId: 'item-spending-friction-tools-4', skillId: 'autopay-friction-loss', format: 'mcq',
        prompt: 'Subscriptions and autopay can quietly:',
        correctAnswer: 'remove the friction you set up',
        acceptableAnswers: ['remove the friction you set up'],
        choices: ['remove the friction you set up', 'lower your taxes', 'raise your credit score', 'pay your rent for free'],
        explanation: 'Automatic charges bypass the pause that friction creates, so review recurring charges periodically.'
      },
      {
        itemId: 'item-spending-friction-tools-5', skillId: 'cash-style-limit', format: 'mcq',
        prompt: 'A cash-style limit for a category works because:',
        correctAnswer: 'once it is gone, spending stops for the period',
        acceptableAnswers: ['once it is gone, spending stops for the period'],
        choices: ['once it is gone, spending stops for the period', 'it earns interest', 'it never runs out', 'it is tax-deductible'],
        explanation: 'A hard cap you can see creates a clear stopping point, unlike open-ended card spending.'
      },
      {
        itemId: 'item-spending-friction-tools-6', skillId: 'constraints-vs-tracking', format: 'mcq',
        prompt: 'Tracking spending without adding any constraints usually:',
        correctAnswer: 'does not change behavior much on its own',
        acceptableAnswers: ['does not change behavior much on its own'],
        choices: ['does not change behavior much on its own', 'guarantees savings', 'lowers prices', 'raises your income'],
        explanation: 'Awareness helps, but limits or friction are what actually change the spending in a stubborn category.'
      }
    ]
  },
  {
    lessonId: 'lesson-goal-setting-ladder-f1-014',
    title: 'Goal-Setting Ladder',
    summary: 'Define goals with amounts, dates, and a simple funding ladder.',
    estimatedMinutes: 6,
    level: 'F1',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      {
        itemId: 'item-goal-setting-ladder-1', skillId: 'goal-definition', format: 'mcq',
        prompt: 'A well-formed money goal includes:',
        correctAnswer: 'an amount and a target date',
        acceptableAnswers: ['an amount and a target date'],
        choices: ['an amount and a target date', 'only a vague wish', 'just a category name', 'a credit score'],
        explanation: 'A specific amount and date make a goal measurable and let you back into a monthly contribution.'
      },
      {
        itemId: 'item-goal-setting-ladder-2', skillId: 'goal-funding', format: 'mcq',
        prompt: 'A goal with no money assigned to it is:',
        correctAnswer: 'unlikely to happen on time',
        acceptableAnswers: ['unlikely to happen on time'],
        choices: ['unlikely to happen on time', 'already funded', 'tax-free', 'automatically met'],
        explanation: 'Intentions without funding rarely complete. Assigning dollars is what turns a goal into a plan.'
      },
      {
        itemId: 'item-goal-setting-ladder-3', skillId: 'contribution-math', format: 'numeric',
        prompt: 'For a $1,800 goal in 6 months, the monthly contribution needed is:',
        correctAnswer: '300', acceptableAnswers: ['300'],
        explanation: 'Monthly contribution = goal divided by months. 1800 / 6 = 300.'
      },
      {
        itemId: 'item-goal-setting-ladder-4', skillId: 'goal-focus', format: 'mcq',
        prompt: 'Pursuing too many goals at once tends to:',
        correctAnswer: 'dilute progress on each one',
        acceptableAnswers: ['dilute progress on each one'],
        choices: ['dilute progress on each one', 'speed them all up', 'lower their cost', 'raise returns'],
        explanation: 'Spreading limited money across many goals slows all of them. Sequencing usually works better.'
      },
      {
        itemId: 'item-goal-setting-ladder-5', skillId: 'goal-hierarchy', format: 'mcq',
        prompt: 'A goal ladder sequences goals by:',
        correctAnswer: 'priority and time horizon',
        acceptableAnswers: ['priority and time horizon'],
        choices: ['priority and time horizon', 'alphabetical order', 'account number', 'interest rate only'],
        explanation: 'Ordering by importance and when you need the money helps decide what to fund first.'
      },
      {
        itemId: 'item-goal-setting-ladder-6', skillId: 'automate-next-goal', format: 'mcq',
        prompt: 'A practical next step after setting a goal is to:',
        correctAnswer: 'automate the next contribution',
        acceptableAnswers: ['automate the next contribution'],
        choices: ['automate the next contribution', 'wait for a windfall', 'cancel the goal', 'stop budgeting'],
        explanation: 'Automating even a small contribution turns the goal into steady, hands-off progress.'
      }
    ]
  },
  {
    lessonId: 'lesson-credit-report-reading-f2-003',
    title: 'Credit Report Reading',
    summary: 'Interpret accounts, inquiries, and dispute-ready details.',
    estimatedMinutes: 7,
    level: 'F2',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      { itemId: 'item-credit-report-reading-1', skillId: 'credit-report-contents', format: 'mcq',
        prompt: 'A credit report mainly shows:',
        correctAnswer: 'your credit accounts, balances, and payment history',
        acceptableAnswers: ['your credit accounts, balances, and payment history'],
        choices: ['your credit accounts, balances, and payment history', 'your bank PIN and passwords', 'your full tax returns', 'your monthly grocery list'],
        explanation: 'Credit reports track your borrowing: accounts, balances, payment history, and inquiries. They do not contain passwords or tax returns.' },
      { itemId: 'item-credit-report-reading-2', skillId: 'credit-dispute', format: 'mcq',
        prompt: 'If you spot an error on your report, the right step is to:',
        correctAnswer: 'dispute it with the credit bureau',
        acceptableAnswers: ['dispute it with the credit bureau'],
        choices: ['dispute it with the credit bureau', 'ignore it', 'close all your accounts', 'stop checking your report'],
        explanation: 'You have the right to dispute inaccurate items. Correcting errors can improve your score and catch fraud.' },
      { itemId: 'item-credit-report-reading-3', skillId: 'soft-inquiry', format: 'mcq',
        prompt: 'Checking your own credit report is:',
        correctAnswer: 'a soft inquiry that does not lower your score',
        acceptableAnswers: ['a soft inquiry that does not lower your score'],
        choices: ['a soft inquiry that does not lower your score', 'a hard inquiry that lowers your score', 'reported as a missed payment', 'not allowed'],
        explanation: 'Reviewing your own report is a soft inquiry with no score impact, so you can check it regularly.' },
      { itemId: 'item-credit-report-reading-4', skillId: 'tradeline', format: 'mcq',
        prompt: 'A tradeline on your report is:',
        correctAnswer: 'an individual credit account',
        acceptableAnswers: ['an individual credit account'],
        choices: ['an individual credit account', 'a stock trade', 'a wire transfer', 'a tax form'],
        explanation: 'Each credit account (card, loan, mortgage) appears as a tradeline with its own history.' },
      { itemId: 'item-credit-report-reading-5', skillId: 'report-cadence', format: 'numeric',
        prompt: 'If you check one bureau for free every 4 months, you cover all 3 bureaus in about how many months?',
        correctAnswer: '12', acceptableAnswers: ['12'],
        explanation: 'Staggering free checks across the 3 bureaus every 4 months covers all three in 12 months.' },
      { itemId: 'item-credit-report-reading-6', skillId: 'report-monitoring-value', format: 'mcq',
        prompt: 'Reviewing your reports regularly mainly helps you:',
        correctAnswer: 'catch errors and signs of fraud early',
        acceptableAnswers: ['catch errors and signs of fraud early'],
        choices: ['catch errors and signs of fraud early', 'increase your income', 'avoid all taxes', 'raise your limit automatically'],
        explanation: 'Early detection of errors or unfamiliar accounts limits the damage from mistakes and identity theft.' }
    ]
  },
  {
    lessonId: 'lesson-utilization-guardrails-f2-004',
    title: 'Utilization Guardrails',
    summary: 'Measure and control how much of your credit you use.',
    estimatedMinutes: 7,
    level: 'F2',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      { itemId: 'item-utilization-guardrails-1', skillId: 'utilization-formula', format: 'mcq',
        prompt: 'Credit utilization is:',
        correctAnswer: 'balance divided by credit limit',
        acceptableAnswers: ['balance divided by credit limit'],
        choices: ['balance divided by credit limit', 'income divided by limit', 'balance divided by income', 'limit divided by balance'],
        explanation: 'Utilization is the share of your limit in use: balance / limit.' },
      { itemId: 'item-utilization-guardrails-2', skillId: 'utilization-calc', format: 'numeric',
        prompt: 'A $450 balance on a $1,500 limit is what utilization percent?',
        correctAnswer: '30%', acceptableAnswers: ['30%', '30'],
        explanation: '450 / 1500 = 0.30 = 30%.' },
      { itemId: 'item-utilization-guardrails-3', skillId: 'utilization-effect', format: 'mcq',
        prompt: 'Lower utilization generally:',
        correctAnswer: 'helps your credit score',
        acceptableAnswers: ['helps your credit score'],
        choices: ['helps your credit score', 'hurts your score', 'raises your APR', 'has no effect at all'],
        explanation: 'Lower utilization usually reduces score drag, though the exact effect varies by model.' },
      { itemId: 'item-utilization-guardrails-4', skillId: 'utilization-paydown-timing', format: 'mcq',
        prompt: 'To lower the utilization that gets reported, it can help to:',
        correctAnswer: 'pay down before the statement closing date',
        acceptableAnswers: ['pay down before the statement closing date'],
        choices: ['pay down before the statement closing date', 'pay only after the due date', 'close the card', 'carry a larger balance'],
        explanation: 'Reported utilization is often the statement balance, so paying before the statement closes can lower what is reported.' },
      { itemId: 'item-utilization-guardrails-5', skillId: 'utilization-scope', format: 'mcq',
        prompt: 'Utilization is commonly viewed:',
        correctAnswer: 'both per card and across all cards',
        acceptableAnswers: ['both per card and across all cards'],
        choices: ['both per card and across all cards', 'only on the oldest card', 'only on the highest-limit card', 'never'],
        explanation: 'Models often look at each card and your overall utilization, so a single maxed card can still matter.' },
      { itemId: 'item-utilization-guardrails-6', skillId: 'utilization-target-balance', format: 'numeric',
        prompt: 'To keep a $2,000-limit card at or below 30% utilization, hold the balance at or under:',
        correctAnswer: '600', acceptableAnswers: ['600'],
        explanation: '30% of 2000 = 600.' }
    ]
  },
  {
    lessonId: 'lesson-interest-cost-planning-f2-005',
    title: 'Interest Cost Planning',
    summary: 'Treat interest as a real, recurring cash outflow.',
    estimatedMinutes: 7,
    level: 'F2',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      { itemId: 'item-interest-cost-planning-1', skillId: 'interest-as-outflow', format: 'mcq',
        prompt: 'Interest on a carried balance is best understood as:',
        correctAnswer: 'a recurring cash outflow with no benefit to you',
        acceptableAnswers: ['a recurring cash outflow with no benefit to you'],
        choices: ['a recurring cash outflow with no benefit to you', 'a savings deposit', 'a tax credit', 'a rewards bonus'],
        explanation: 'Interest is money paid to the lender. Unlike a fee for a service you want, it buys you nothing.' },
      { itemId: 'item-interest-cost-planning-2', skillId: 'annual-interest-estimate', format: 'numeric',
        prompt: 'A $2,000 balance at 18% APR costs about how much per year in interest (simple estimate)?',
        correctAnswer: '360', acceptableAnswers: ['360'],
        explanation: 'Rough annual interest is balance times APR. 2000 x 0.18 = 360.' },
      { itemId: 'item-interest-cost-planning-3', skillId: 'minimum-payment-trap', format: 'mcq',
        prompt: 'Paying only the minimum on a high-APR balance usually:',
        correctAnswer: 'stretches payoff and increases total interest',
        acceptableAnswers: ['stretches payoff and increases total interest'],
        choices: ['stretches payoff and increases total interest', 'eliminates interest', 'raises your limit', 'is the fastest payoff'],
        explanation: 'Minimum payments are mostly interest at first, so payoff drags out and total interest climbs.' },
      { itemId: 'item-interest-cost-planning-4', skillId: 'monthly-rate', format: 'numeric',
        prompt: 'A 24% APR is about what percent per month (simple estimate)?',
        correctAnswer: '2%', acceptableAnswers: ['2%', '2'],
        explanation: 'A simple monthly rate is APR / 12. 24% / 12 = 2% per month.' },
      { itemId: 'item-interest-cost-planning-5', skillId: 'apr-comparison', format: 'mcq',
        prompt: 'Between two otherwise identical loans, the higher-APR one:',
        correctAnswer: 'costs more to carry',
        acceptableAnswers: ['costs more to carry'],
        choices: ['costs more to carry', 'always has lower payments', 'is always the better choice', 'has no cost difference'],
        explanation: 'All else equal, a higher APR means more interest paid over the life of the balance.' },
      { itemId: 'item-interest-cost-planning-6', skillId: 'interest-prioritization', format: 'mcq',
        prompt: 'When cash is limited, putting extra payments on the highest-APR debt:',
        correctAnswer: 'reduces total interest paid',
        acceptableAnswers: ['reduces total interest paid'],
        choices: ['reduces total interest paid', 'increases total interest', 'lowers your credit by default', 'is not allowed'],
        explanation: 'Attacking the costliest debt first (the avalanche idea) minimizes total interest.' }
    ]
  },
  {
    lessonId: 'lesson-debt-priority-methods-f2-006',
    title: 'Debt Priority Methods',
    summary: 'Choose and stick with a consistent payoff strategy.',
    estimatedMinutes: 7,
    level: 'F2',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      { itemId: 'item-debt-priority-methods-1', skillId: 'avalanche-method', format: 'mcq',
        prompt: 'The debt avalanche method targets:',
        correctAnswer: 'the highest interest rate first',
        acceptableAnswers: ['the highest interest rate first'],
        choices: ['the highest interest rate first', 'the lowest balance first', 'the newest debt', 'the largest limit'],
        explanation: 'Avalanche pays extra toward the highest-APR debt, minimizing total interest.' },
      { itemId: 'item-debt-priority-methods-2', skillId: 'snowball-method', format: 'mcq',
        prompt: 'The debt snowball method targets:',
        correctAnswer: 'the smallest balance first',
        acceptableAnswers: ['the smallest balance first'],
        choices: ['the smallest balance first', 'the highest rate first', 'a random debt', 'the largest balance first'],
        explanation: 'Snowball pays the smallest balance first for quick, motivating wins.' },
      { itemId: 'item-debt-priority-methods-3', skillId: 'avalanche-benefit', format: 'mcq',
        prompt: 'Compared with snowball, avalanche usually results in:',
        correctAnswer: 'less total interest paid',
        acceptableAnswers: ['less total interest paid'],
        choices: ['less total interest paid', 'more late fees', 'a lower credit score', 'higher minimums'],
        explanation: 'By clearing high-APR debt first, avalanche typically costs less interest overall.' },
      { itemId: 'item-debt-priority-methods-4', skillId: 'snowball-benefit', format: 'mcq',
        prompt: 'Snowball can help some people because it:',
        correctAnswer: 'builds momentum with quick wins',
        acceptableAnswers: ['builds momentum with quick wins'],
        choices: ['builds momentum with quick wins', 'maximizes tax deductions', 'removes all interest', 'raises credit limits'],
        explanation: 'Early payoffs create motivation, which helps people stick with the plan.' },
      { itemId: 'item-debt-priority-methods-5', skillId: 'debt-plan-consistency', format: 'mcq',
        prompt: 'The most important factor in either method is:',
        correctAnswer: 'sticking with one consistent plan',
        acceptableAnswers: ['sticking with one consistent plan'],
        choices: ['sticking with one consistent plan', 'switching methods often', 'paying only minimums', 'ignoring rates and balances'],
        explanation: 'Either method works if you keep at it. Consistency beats constantly changing approaches.' },
      { itemId: 'item-debt-priority-methods-6', skillId: 'maintain-minimums', format: 'numeric',
        prompt: 'You have 3 debts. While attacking one with extra payments, you still pay the minimum on how many of the others?',
        correctAnswer: '2', acceptableAnswers: ['2'],
        explanation: 'You keep paying minimums on all other debts (here, the other 2) to avoid late fees while focusing extra on one.' }
    ]
  },
  {
    lessonId: 'lesson-sinking-fund-design-f2-007',
    title: 'Sinking Fund Design',
    summary: 'Fund predictable irregular expenses before they hit.',
    estimatedMinutes: 7,
    level: 'F2',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      { itemId: 'item-sinking-fund-design-1', skillId: 'sinking-fund-definition', format: 'mcq',
        prompt: 'A sinking fund is for:',
        correctAnswer: 'saving ahead for known, irregular expenses',
        acceptableAnswers: ['saving ahead for known, irregular expenses'],
        choices: ['saving ahead for known, irregular expenses', 'emergencies you cannot predict', 'daily groceries', 'retirement only'],
        explanation: 'Sinking funds smooth predictable but lumpy costs like annual insurance or holidays.' },
      { itemId: 'item-sinking-fund-design-2', skillId: 'sinking-fund-example', format: 'mcq',
        prompt: 'Which fits a sinking fund best?',
        correctAnswer: 'an annual insurance premium',
        acceptableAnswers: ['an annual insurance premium'],
        choices: ['an annual insurance premium', 'a sudden job loss', 'a surprise medical emergency', 'an unexpected car accident'],
        explanation: 'Known, scheduled costs suit sinking funds. Unpredictable shocks belong to the emergency fund.' },
      { itemId: 'item-sinking-fund-design-3', skillId: 'sinking-fund-monthly', format: 'numeric',
        prompt: 'A $1,200 annual expense funded monthly needs you to set aside:',
        correctAnswer: '100', acceptableAnswers: ['100'],
        explanation: 'Monthly set-aside = annual cost / 12. 1200 / 12 = 100.' },
      { itemId: 'item-sinking-fund-design-4', skillId: 'sinking-vs-emergency', format: 'mcq',
        prompt: 'Sinking funds differ from emergency funds because they are for:',
        correctAnswer: 'predictable costs, not surprises',
        acceptableAnswers: ['predictable costs, not surprises'],
        choices: ['predictable costs, not surprises', 'only surprises', 'investing', 'paying minimums'],
        explanation: 'A sinking fund plans for what you know is coming; the emergency fund covers what you do not.' },
      { itemId: 'item-sinking-fund-design-5', skillId: 'sinking-fund-separation', format: 'mcq',
        prompt: 'Using separate sinking funds per goal helps by:',
        correctAnswer: 'keeping money for each goal separate',
        acceptableAnswers: ['keeping money for each goal separate'],
        choices: ['keeping money for each goal separate', 'raising your APR', 'removing the need to budget', 'guaranteeing returns'],
        explanation: 'Separate buckets make progress visible and prevent borrowing from one goal to cover another.' },
      { itemId: 'item-sinking-fund-design-6', skillId: 'sinking-fund-timing', format: 'mcq',
        prompt: 'A sinking fund works best when contributions are:',
        correctAnswer: 'automated and steady',
        acceptableAnswers: ['automated and steady'],
        choices: ['automated and steady', 'last-minute and lump-sum only', 'random', 'skipped when busy'],
        explanation: 'Steady automated contributions mean the money is ready when the expense arrives.' }
    ]
  },
  {
    lessonId: 'lesson-insurance-baseline-coverage-f2-008',
    title: 'Insurance Baseline Coverage',
    summary: 'Use insurance to transfer catastrophic, hard-to-fund risk.',
    estimatedMinutes: 7,
    level: 'F2',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      { itemId: 'item-insurance-baseline-coverage-1', skillId: 'insurance-purpose', format: 'mcq',
        prompt: 'The main purpose of insurance is to:',
        correctAnswer: 'transfer catastrophic risk you cannot self-fund',
        acceptableAnswers: ['transfer catastrophic risk you cannot self-fund'],
        choices: ['transfer catastrophic risk you cannot self-fund', 'increase investment returns', 'eliminate all uncertainty', 'replace budgeting'],
        explanation: 'Insurance is for rare, large losses that would be hard to pay out of pocket.' },
      { itemId: 'item-insurance-baseline-coverage-2', skillId: 'deductible-tradeoff', format: 'mcq',
        prompt: 'A higher deductible usually means:',
        correctAnswer: 'lower premiums but more out of pocket per claim',
        acceptableAnswers: ['lower premiums but more out of pocket per claim'],
        choices: ['lower premiums but more out of pocket per claim', 'higher premiums', 'guaranteed payouts', 'no cost when claims happen'],
        explanation: 'Deductibles trade lower ongoing premiums for a larger bill when you actually claim.' },
      { itemId: 'item-insurance-baseline-coverage-3', skillId: 'liability-coverage', format: 'mcq',
        prompt: 'Liability coverage protects you against:',
        correctAnswer: 'costs if you are responsible for harm to others',
        acceptableAnswers: ['costs if you are responsible for harm to others'],
        choices: ['costs if you are responsible for harm to others', 'your own car repairs only', 'investment losses', 'credit score drops'],
        explanation: 'Liability covers damages you owe others. Limits should reflect realistic exposure.' },
      { itemId: 'item-insurance-baseline-coverage-4', skillId: 'risk-right-sizing', format: 'mcq',
        prompt: 'Insurance is most worth buying for risks that are:',
        correctAnswer: 'low-probability but high-impact',
        acceptableAnswers: ['low-probability but high-impact'],
        choices: ['low-probability but high-impact', 'small and frequent', 'certain to happen', 'trivial'],
        explanation: 'Small frequent costs are cheaper to self-fund; insurance shines for rare, severe losses.' },
      { itemId: 'item-insurance-baseline-coverage-5', skillId: 'deductible-cost', format: 'numeric',
        prompt: 'Raising your deductible from $500 to $1,500 increases your potential per-claim cost by:',
        correctAnswer: '1000', acceptableAnswers: ['1000'],
        explanation: 'The added out-of-pocket exposure is 1500 - 500 = 1000 per claim.' },
      { itemId: 'item-insurance-baseline-coverage-6', skillId: 'coverage-review-cadence', format: 'mcq',
        prompt: 'A reasonable time to review coverage is:',
        correctAnswer: 'annually or after major life changes',
        acceptableAnswers: ['annually or after major life changes'],
        choices: ['annually or after major life changes', 'never', 'only after a claim', 'only when rates fall'],
        explanation: 'Life events change your needs and exposure, so review coverage regularly.' }
    ]
  },
  {
    lessonId: 'lesson-cash-flow-forecasting-f2-009',
    title: 'Cash-Flow Forecasting',
    summary: 'Map expected income and expenses to spot problems early.',
    estimatedMinutes: 7,
    level: 'F2',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      { itemId: 'item-cash-flow-forecasting-1', skillId: 'forecast-definition', format: 'mcq',
        prompt: 'A cash-flow forecast is:',
        correctAnswer: 'a forward-looking map of expected income and expenses',
        acceptableAnswers: ['a forward-looking map of expected income and expenses'],
        choices: ['a forward-looking map of expected income and expenses', 'a record of past spending only', 'a credit score', 'a tax return'],
        explanation: 'Forecasting looks ahead so you can plan, unlike tracking, which looks back.' },
      { itemId: 'item-cash-flow-forecasting-2', skillId: 'forecast-purpose', format: 'mcq',
        prompt: 'Forecasting cash flow mainly helps you:',
        correctAnswer: 'spot shortfalls before they happen',
        acceptableAnswers: ['spot shortfalls before they happen'],
        choices: ['spot shortfalls before they happen', 'raise your credit limit', 'avoid taxes', 'guarantee returns'],
        explanation: 'Seeing a future gap early gives you time to adjust instead of reacting in a crunch.' },
      { itemId: 'item-cash-flow-forecasting-3', skillId: 'net-projection', format: 'numeric',
        prompt: 'Expected income $3,200 and expected expenses $2,900 next month gives a projected net of:',
        correctAnswer: '300', acceptableAnswers: ['300'],
        explanation: 'Projected net = expected income - expected expenses. 3200 - 2900 = 300.' },
      { itemId: 'item-cash-flow-forecasting-4', skillId: 'forecast-irregular', format: 'mcq',
        prompt: 'A good forecast also includes:',
        correctAnswer: 'irregular costs like annual or quarterly bills',
        acceptableAnswers: ['irregular costs like annual or quarterly bills'],
        choices: ['irregular costs like annual or quarterly bills', 'only weekly groceries', 'nothing irregular', 'just rent'],
        explanation: 'Lumpy bills cause surprises if left out, so build them into the forecast.' },
      { itemId: 'item-cash-flow-forecasting-5', skillId: 'forecast-response', format: 'mcq',
        prompt: 'If a forecast shows a future shortfall, a good response is to:',
        correctAnswer: 'adjust spending or build a buffer in advance',
        acceptableAnswers: ['adjust spending or build a buffer in advance'],
        choices: ['adjust spending or build a buffer in advance', 'ignore it', 'take a payday loan immediately', 'stop forecasting'],
        explanation: 'Acting early (trimming spend or saving ahead) is cheaper than scrambling later.' },
      { itemId: 'item-cash-flow-forecasting-6', skillId: 'forecast-horizon', format: 'mcq',
        prompt: 'A practical starting horizon for a personal cash-flow forecast is:',
        correctAnswer: 'the next one to three months',
        acceptableAnswers: ['the next one to three months'],
        choices: ['the next one to three months', 'the next 30 years exactly', 'yesterday', 'no horizon at all'],
        explanation: 'A short rolling horizon is accurate enough to act on and easy to maintain.' }
    ]
  },
  {
    lessonId: 'lesson-subscription-cost-audit-f2-010',
    title: 'Subscription Cost Audit',
    summary: 'Find and cut recurring charges that quietly add up.',
    estimatedMinutes: 6,
    level: 'F2',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      { itemId: 'item-subscription-cost-audit-1', skillId: 'recurring-leak', format: 'mcq',
        prompt: 'Subscriptions are a common budget leak because they:',
        correctAnswer: 'renew automatically and are easy to forget',
        acceptableAnswers: ['renew automatically and are easy to forget'],
        choices: ['renew automatically and are easy to forget', 'always raise your credit score', 'are tax-free', 'cannot be canceled'],
        explanation: 'Auto-renewal means charges continue silently, so they escape attention.' },
      { itemId: 'item-subscription-cost-audit-2', skillId: 'subscription-annualize', format: 'numeric',
        prompt: 'A $15 per month subscription costs about how much per year?',
        correctAnswer: '180', acceptableAnswers: ['180'],
        explanation: 'Annual cost = monthly x 12. 15 x 12 = 180. Small monthly charges add up.' },
      { itemId: 'item-subscription-cost-audit-3', skillId: 'audit-step', format: 'mcq',
        prompt: 'A subscription audit means you:',
        correctAnswer: 'list recurring charges and cancel unused ones',
        acceptableAnswers: ['list recurring charges and cancel unused ones'],
        choices: ['list recurring charges and cancel unused ones', 'add more subscriptions', 'ignore your statements', 'pay them twice'],
        explanation: 'Listing every recurring charge surfaces what you no longer use or value.' },
      { itemId: 'item-subscription-cost-audit-4', skillId: 'subscription-savings', format: 'numeric',
        prompt: 'If you cancel three subscriptions costing $8, $12, and $20 per month, monthly savings is:',
        correctAnswer: '40', acceptableAnswers: ['40'],
        explanation: '8 + 12 + 20 = 40 saved each month, or 480 per year.' },
      { itemId: 'item-subscription-cost-audit-5', skillId: 'subscription-optimize', format: 'mcq',
        prompt: 'A way to cut subscription cost without losing value is to:',
        correctAnswer: 'downgrade tiers or share family plans where allowed',
        acceptableAnswers: ['downgrade tiers or share family plans where allowed'],
        choices: ['downgrade tiers or share family plans where allowed', 'never review them', 'auto-renew everything', 'pay annually for unused services'],
        explanation: 'Right-sizing a plan keeps what you use while trimming what you do not.' },
      { itemId: 'item-subscription-cost-audit-6', skillId: 'subscription-detection', format: 'mcq',
        prompt: 'The easiest place to find forgotten subscriptions is:',
        correctAnswer: 'your card and bank statements',
        acceptableAnswers: ['your card and bank statements'],
        choices: ['your card and bank statements', 'your credit score', 'your tax return', 'a guess'],
        explanation: 'Statements list every recurring charge, making them the fastest audit source.' }
    ]
  },
  {
    lessonId: 'lesson-student-loan-basics-f2-011',
    title: 'Student Loan Basics',
    summary: 'Know your repayment plan, interest, and key protections.',
    estimatedMinutes: 7,
    level: 'F2',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      { itemId: 'item-student-loan-basics-1', skillId: 'repayment-awareness', format: 'mcq',
        prompt: 'Knowing your student loan repayment plan matters because it:',
        correctAnswer: 'determines your monthly payment and total cost',
        acceptableAnswers: ['determines your monthly payment and total cost'],
        choices: ['determines your monthly payment and total cost', 'raises your credit limit', 'is purely cosmetic', 'has no effect on cost'],
        explanation: 'The plan sets your payment size and how much interest you pay over time.' },
      { itemId: 'item-student-loan-basics-2', skillId: 'federal-vs-private', format: 'mcq',
        prompt: 'Compared with private loans, federal student loans often offer:',
        correctAnswer: 'more flexible repayment and hardship options',
        acceptableAnswers: ['more flexible repayment and hardship options'],
        choices: ['more flexible repayment and hardship options', 'always lower balances', 'guaranteed forgiveness for everyone', 'no interest ever'],
        explanation: 'Federal loans commonly include income-driven plans and deferment options private loans may lack.' },
      { itemId: 'item-student-loan-basics-3', skillId: 'loan-interest-accrual', format: 'mcq',
        prompt: 'On most loans, interest:',
        correctAnswer: 'accrues on the outstanding balance over time',
        acceptableAnswers: ['accrues on the outstanding balance over time'],
        choices: ['accrues on the outstanding balance over time', 'never accrues', 'is a one-time fee only', 'is paid by the school'],
        explanation: 'Interest builds on what you still owe, so faster payoff lowers total interest.' },
      { itemId: 'item-student-loan-basics-4', skillId: 'extra-payment', format: 'numeric',
        prompt: 'If your minimum payment is $250 and you add $100 extra, your total payment is:',
        correctAnswer: '350', acceptableAnswers: ['350'],
        explanation: '250 + 100 = 350. Extra payments reduce principal and total interest.' },
      { itemId: 'item-student-loan-basics-5', skillId: 'default-risk', format: 'mcq',
        prompt: 'Missing student loan payments can lead to:',
        correctAnswer: 'credit damage and, eventually, default',
        acceptableAnswers: ['credit damage and, eventually, default'],
        choices: ['credit damage and, eventually, default', 'a higher credit score', 'automatic forgiveness', 'lower taxes'],
        explanation: 'Late and missed payments hurt credit and can escalate to default, which has serious consequences.' },
      { itemId: 'item-student-loan-basics-6', skillId: 'refinance-caution', format: 'mcq',
        prompt: 'Refinancing federal loans into a private loan can:',
        correctAnswer: 'give up federal protections and flexible options',
        acceptableAnswers: ['give up federal protections and flexible options'],
        choices: ['give up federal protections and flexible options', 'always be the best choice', 'raise your credit instantly', 'eliminate the balance'],
        explanation: 'Refinancing federal into private may lower a rate but forfeits income-driven plans and other protections.' }
    ]
  },
  {
    lessonId: 'lesson-debt-to-income-guardrails-f2-012',
    title: 'Debt-to-Income Guardrails',
    summary: 'Track the ratio lenders use to judge borrowing capacity.',
    estimatedMinutes: 7,
    level: 'F2',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      { itemId: 'item-debt-to-income-guardrails-1', skillId: 'dti-definition', format: 'mcq',
        prompt: 'Debt-to-income (DTI) compares:',
        correctAnswer: 'monthly debt payments to monthly income',
        acceptableAnswers: ['monthly debt payments to monthly income'],
        choices: ['monthly debt payments to monthly income', 'assets to liabilities', 'income to net worth', 'spending to savings'],
        explanation: 'DTI is monthly debt payments divided by monthly income, usually shown as a percent.' },
      { itemId: 'item-debt-to-income-guardrails-2', skillId: 'dti-calc', format: 'numeric',
        prompt: 'Monthly debt payments $1,000 and gross monthly income $4,000 gives a DTI of what percent?',
        correctAnswer: '25%', acceptableAnswers: ['25%', '25'],
        explanation: '1000 / 4000 = 0.25 = 25%.' },
      { itemId: 'item-debt-to-income-guardrails-3', skillId: 'dti-lender-use', format: 'mcq',
        prompt: 'Lenders use DTI to gauge:',
        correctAnswer: 'your ability to take on and repay debt',
        acceptableAnswers: ['your ability to take on and repay debt'],
        choices: ['your ability to take on and repay debt', 'your tax bracket', 'your investment returns', 'your spending personality'],
        explanation: 'A lower DTI signals more room in your budget to handle new payments.' },
      { itemId: 'item-debt-to-income-guardrails-4', skillId: 'dti-improvement', format: 'mcq',
        prompt: 'Lowering your DTI generally:',
        correctAnswer: 'improves your borrowing options',
        acceptableAnswers: ['improves your borrowing options'],
        choices: ['improves your borrowing options', 'hurts your credit automatically', 'raises your APR', 'is impossible'],
        explanation: 'Paying down debt or raising income lowers DTI and can improve loan approval and terms.' },
      { itemId: 'item-debt-to-income-guardrails-5', skillId: 'dti-guardrail', format: 'mcq',
        prompt: 'Many guidelines suggest keeping total DTI below roughly:',
        correctAnswer: 'about a third of income',
        acceptableAnswers: ['about a third of income'],
        choices: ['about a third of income', '90% of income', '100% of income', 'there is no guideline'],
        explanation: 'Common guidance keeps total debt payments well under a third of income, though limits vary by lender.' },
      { itemId: 'item-debt-to-income-guardrails-6', skillId: 'dti-payoff-effect', format: 'numeric',
        prompt: 'If income is unchanged and you pay off a loan with a $300 monthly payment, your monthly debt payments fall by:',
        correctAnswer: '300', acceptableAnswers: ['300'],
        explanation: 'Removing a 300 monthly payment lowers your debt side by 300, reducing DTI.' }
    ]
  },
  {
    lessonId: 'lesson-balance-transfer-promo-traps-f2-013',
    title: 'Balance Transfer Promo Traps',
    summary: 'Use 0% promos safely with a real payoff plan.',
    estimatedMinutes: 7,
    level: 'F2',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      { itemId: 'item-balance-transfer-promo-traps-1', skillId: 'promo-payoff-plan', format: 'mcq',
        prompt: 'A 0% balance-transfer promo is most useful when you:',
        correctAnswer: 'have a plan to pay it off before the promo ends',
        acceptableAnswers: ['have a plan to pay it off before the promo ends'],
        choices: ['have a plan to pay it off before the promo ends', 'plan to carry it forever', 'ignore the end date', 'add new spending to it'],
        explanation: 'A 0% window only helps if you clear the balance before the standard rate returns.' },
      { itemId: 'item-balance-transfer-promo-traps-2', skillId: 'transfer-fee', format: 'numeric',
        prompt: 'A 3% transfer fee on a $5,000 balance costs:',
        correctAnswer: '150', acceptableAnswers: ['150'],
        explanation: 'Transfer fee = 3% of 5000 = 150. Factor it into whether the promo saves money.' },
      { itemId: 'item-balance-transfer-promo-traps-3', skillId: 'post-promo-rate', format: 'mcq',
        prompt: 'When the promo period ends, the rate usually:',
        correctAnswer: 'jumps to a high standard APR on any remaining balance',
        acceptableAnswers: ['jumps to a high standard APR on any remaining balance'],
        choices: ['jumps to a high standard APR on any remaining balance', 'stays at 0% forever', 'disappears', 'becomes negative'],
        explanation: 'Leftover balances start accruing the regular (often high) APR once the promo ends.' },
      { itemId: 'item-balance-transfer-promo-traps-4', skillId: 'new-purchase-trap', format: 'mcq',
        prompt: 'A common trap is that new purchases on the card may:',
        correctAnswer: 'accrue interest while you focus on the transferred balance',
        acceptableAnswers: ['accrue interest while you focus on the transferred balance'],
        choices: ['accrue interest while you focus on the transferred balance', 'always be interest-free', 'reduce your balance', 'raise your limit'],
        explanation: 'Promos often apply only to the transferred balance, so new spending can quietly accrue interest.' },
      { itemId: 'item-balance-transfer-promo-traps-5', skillId: 'promo-payoff-math', format: 'numeric',
        prompt: 'To clear a $5,000 transfer within a 10-month 0% promo, pay at least how much per month?',
        correctAnswer: '500', acceptableAnswers: ['500'],
        explanation: '5000 / 10 = 500 per month to finish before the promo ends.' },
      { itemId: 'item-balance-transfer-promo-traps-6', skillId: 'transfer-discipline', format: 'mcq',
        prompt: 'Balance transfers help only if you:',
        correctAnswer: 'avoid new debt and pay it down on schedule',
        acceptableAnswers: ['avoid new debt and pay it down on schedule'],
        choices: ['avoid new debt and pay it down on schedule', 'keep spending as before', 'pay just the minimum', 'extend it repeatedly'],
        explanation: 'Without discipline, a transfer just moves debt around and can cost more after fees.' }
    ]
  },
  {
    lessonId: 'lesson-negotiating-bills-playbook-f2-014',
    title: 'Negotiating Bills Playbook',
    summary: 'Lower recurring bills with simple, repeatable tactics.',
    estimatedMinutes: 6,
    level: 'F2',
    track: 'core',
    premium: false,
    editorial: EDITORIAL,
    items: [
      { itemId: 'item-negotiating-bills-playbook-1', skillId: 'bill-negotiability', format: 'mcq',
        prompt: 'Many recurring bills (internet, phone, insurance) are:',
        correctAnswer: 'negotiable, especially at renewal',
        acceptableAnswers: ['negotiable, especially at renewal'],
        choices: ['negotiable, especially at renewal', 'fixed by law', 'never negotiable', 'set by your credit score'],
        explanation: 'Providers often have discretion on price, particularly when a contract or promo is ending.' },
      { itemId: 'item-negotiating-bills-playbook-2', skillId: 'negotiation-leverage', format: 'mcq',
        prompt: 'Useful leverage when negotiating a bill is:',
        correctAnswer: 'competitor pricing and your history as a customer',
        acceptableAnswers: ['competitor pricing and your history as a customer'],
        choices: ['competitor pricing and your history as a customer', 'threatening the agent', 'your horoscope', 'your tax bracket'],
        explanation: 'Concrete competitor offers and a good payment history give the agent reasons to discount.' },
      { itemId: 'item-negotiating-bills-playbook-3', skillId: 'bill-annual-savings', format: 'numeric',
        prompt: 'Cutting a bill by $20 per month saves how much per year?',
        correctAnswer: '240', acceptableAnswers: ['240'],
        explanation: 'Annual savings = monthly x 12. 20 x 12 = 240 from a single call.' },
      { itemId: 'item-negotiating-bills-playbook-4', skillId: 'retention-department', format: 'mcq',
        prompt: 'Asking for a retention or loyalty department can help because they:',
        correctAnswer: 'often have authority to offer discounts',
        acceptableAnswers: ['often have authority to offer discounts'],
        choices: ['often have authority to offer discounts', 'cannot change anything', 'only raise prices', 'handle taxes'],
        explanation: 'Retention teams are measured on keeping customers, so they can usually offer better pricing.' },
      { itemId: 'item-negotiating-bills-playbook-5', skillId: 'negotiation-timing', format: 'mcq',
        prompt: 'A good time to renegotiate is:',
        correctAnswer: 'before auto-renewal or when a promo expires',
        acceptableAnswers: ['before auto-renewal or when a promo expires'],
        choices: ['before auto-renewal or when a promo expires', 'never', 'only after canceling', 'at random'],
        explanation: 'Acting before a renewal or after a promo ends is when providers are most willing to deal.' },
      { itemId: 'item-negotiating-bills-playbook-6', skillId: 'negotiation-approach', format: 'mcq',
        prompt: 'An effective approach is to:',
        correctAnswer: 'be polite, specific, and ready to switch providers',
        acceptableAnswers: ['be polite, specific, and ready to switch providers'],
        choices: ['be polite, specific, and ready to switch providers', 'be rude and vague', 'accept the first price always', 'avoid comparing options'],
        explanation: 'A calm, specific ask backed by a credible willingness to leave gets the best results.' }
    ]
  }
];
