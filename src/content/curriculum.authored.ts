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
  }
];
