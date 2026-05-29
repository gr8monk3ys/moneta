# Curriculum Content Quality Assessment

_Assessment date: 2026-05-29 · Reviewer: engineering (not a finance SME — accuracy of authored content still needs domain sign-off)_

Evaluates the **learning material itself** — lessons, exercises, explanations — separate
from the (solid) code. Based on reading `src/content/curriculum.seed.ts` and
`src/content/curriculum.generator.ts` in full, plus a live end-to-end run of the
learning loop.

> **Status update (2026-05-29) — RESOLVED.** The gap below has since been closed.
> All 84 lessons across F1–F6 are now hand-authored to the seed-quality bar (PRs
> #30–#35); the formulaic generated lessons and the procedural generator's lesson
> output were retired. The analysis below is preserved as the rationale and the
> authoring template. Remaining open item: the advanced/premium **F4–F6** lessons
> carry `provisional` editorial status and still warrant **finance-SME sign-off**
> before being marketed as financial education/advice.

## TL;DR

The catalog shows **84 lessons**, but they're two very different tiers:

- **~12 hand-authored seed lessons — genuinely good.** Accurate, well-leveled F1→F6,
  real questions, plausible distractors, teaching explanations. Ship-quality.
- **~72 generated lessons — formulaic scaffolding.** The underlying topic data is
  accurate, but the *exercises* test framing-recall (not comprehension), use strawman
  distractors, repeat one identical numeric question, and fragment the skill graph.

**Commercial risk:** 36 of the 72 weak lessons sit in the **paid Pro tier** (F4–F6).
Charging for gameable recall quizzes is a trust/refund risk. The engine and the seed
lessons prove the product *can* be excellent; the generated bulk is where "is this
legit?" gets shaky.

## What's good (seed lessons)

The 12 hand-authored lessons (`curriculum.seed.ts`) are real finance education:

- **Accurate, appropriately hedged** ("typically", "subject to rules") — avoids the
  overclaiming that plagues finance content.
- **Real comprehension questions** with worked explanations — e.g. utilization
  `200/1000 = 20%`, debt avalanche vs snowball tradeoffs, HSA triple-tax, sequence
  risk, cap rate `= NOI / value`.
- **Coherent progression** — F1 cash flow/credit → F2 emergency fund/debt → F3
  investing/tax-advantaged → F4 retirement/insurance → F5 business/real estate → F6
  advanced tax/portfolio risk.

This is the quality bar the rest of the catalog should meet.

## What's weak (generated lessons)

`curriculum.generator.ts` expands per-level topic tables into lessons. The topic data
(`keyConcept`, `benchmark`, `formula`, `action`, `risk`, `mistake`) is genuinely useful
micro-content — but every generated lesson becomes the **same 8 templated items**:

1. "In '{title}', the primary concept to master is:" → `keyConcept`
2. "A practical benchmark for this topic is:" → `benchmark`
3. "A useful planning equation here is:" → `formula`
4. "A high-impact next action is to:" → `action`
5. "A key risk to monitor is:" → `risk`
6. "The minimum review cadence should be:" → `checkIn`
7. "A common mistake to avoid is:" → `mistake`
8. "If a change saves $X per month, about how much per year?" → `× 12`

### Three concrete problems

**1. Meta-prompts, not comprehension.** Questions ask which option *is the concept /
benchmark / formula*, i.e. matching the lesson's own framing — not demonstrating
finance understanding.

**2. Strawman distractors (the critical flaw).** The MCQ distractor pool is the
lesson's *own other fields* plus generic filler ("do nothing and hope outcomes
improve", "follow social media consensus without verification"). Example, "Paycheck
Decoder":

> **"In 'Paycheck Decoder', the primary concept to master is:"**
> ◦ **net pay** ✓ ◦ save at least 10% of net pay before discretionary spending ◦ gross pay − taxes − deductions = net pay ◦ tag fixed bills before assigning spending

The learner picks the right answer by format/length, with **zero finance knowledge**.
Every generated question is gameable.

**3. Identical numeric item.** All 72 generated lessons ask the same "annualize: × 12"
question (only the dollar amount, derived from a hash of the lesson id, varies). It
tests multiplication, not the topic.

### Side effect: skill-graph pollution

Each generated item mints a synthetic skill (`{slug}-{level}-concept`,
`…-benchmark`, `…-cadence`, …) — roughly **8 skills × 72 lessons ≈ 575 throwaway
skills** feeding mastery and spaced repetition. Reviews resurface
"the primary concept to master is:"-style recall cards, diluting the meaningful skills
from the seed lessons.

## Remediation roadmap (prioritized)

1. **Product decision first:** don't present the 72 generated lessons as finished,
   paywalled lessons in their current form. Either gate Pro to authored lessons, or
   reclassify generated content as clearly-labeled "practice drills."
2. **Treat the topic tables as an authoring backlog.** Each topic's
   `keyConcept/benchmark/formula/action/risk/mistake` is a strong *outline*. Hand-author
   4–6 real items per topic to the seed bar (this is the SME editorial pass). Good
   assessment items are hard to auto-generate; human authoring is the right tool.
3. **If generation stays short-term:** give each topic a curated **distractor bank**
   (real wrong answers, not the lesson's own fields), vary question stems per topic,
   drop the identical ×12 numeric, and map items to a small set of **real shared skill
   IDs** instead of per-slot synthetic skills.
4. **Get domain sign-off.** Even the seed lessons (and any new authored content) should
   be spot-checked by a finance SME before being marketed as educational material.

## Worked example — authoring template

Converting the generated **"Paycheck Decoder"** topic into seed-quality items shows the
target bar (real distractors, comprehension over framing-recall, varied formats):

```ts
{
  lessonId: 'lesson-paycheck-decoder-f1-003',
  title: 'Paycheck Decoder',
  summary: 'Read gross pay, deductions, and take-home pay without guesswork.',
  estimatedMinutes: 6, level: 'F1', track: 'core', premium: false,
  items: [
    { skillId: 'net-pay', format: 'mcq',
      prompt: 'Net pay is:',
      correctAnswer: 'take-home pay after taxes and payroll deductions',
      choices: [
        'take-home pay after taxes and payroll deductions',
        'total pay before any deductions',
        'only the amount withheld for taxes',
        'gross pay plus reimbursements' ],
      explanation: 'Net (take-home) pay is what lands in your account after taxes and payroll deductions are removed from gross pay.' },

    { skillId: 'net-pay', format: 'numeric',
      prompt: 'Gross pay is $4,000 and taxes + deductions are $900. Net pay is:',
      correctAnswer: '3100',
      explanation: 'Net pay = gross − (taxes + deductions). 4000 − 900 = 3100.' },

    { skillId: 'budget-from-net', format: 'mcq',
      prompt: 'Budgeting from gross pay instead of net pay usually causes you to:',
      correctAnswer: 'plan to spend money you never actually receive',
      choices: [
        'plan to spend money you never actually receive',
        'pay less in taxes',
        'increase your take-home pay',
        'raise your credit score' ],
      explanation: 'Spending plans should start from take-home pay; gross overstates what you can actually spend.' },

    { skillId: 'payroll-deductions', format: 'mcq',
      prompt: 'Which reduces gross pay to net pay?',
      correctAnswer: 'tax withholding and 401(k) contributions',
      choices: [
        'tax withholding and 401(k) contributions',
        'your monthly rent',
        'a credit card payment',
        'grocery spending' ],
      explanation: 'Deductions are taken on the paycheck itself (taxes, retirement, benefits) — not bills you pay later from net pay.' },

    { skillId: 'savings-rate', format: 'numeric',
      prompt: 'If net pay is $3,100 and you save 10% first, you save:',
      correctAnswer: '310',
      explanation: '10% of take-home: 3100 × 0.10 = 310, moved before discretionary spending.' },

    { skillId: 'paycheck-review-cadence', format: 'mcq',
      prompt: 'When should you re-check your paycheck math?',
      correctAnswer: 'after any raise, benefits change, or tax update',
      choices: [
        'after any raise, benefits change, or tax update',
        'never — it is fixed for life',
        'only if a payment bounces',
        'once every few years' ],
      explanation: 'Deductions and withholding change with raises, benefits enrollment, and tax updates, which shifts take-home pay.' }
  ]
}
```

### Authoring checklist (per item)

- Tests **understanding or computation**, not "which option is the concept."
- Distractors are **plausible and finance-specific** (common misconceptions), never
  the lesson's other fields or strawmen.
- Numeric items use **topic-relevant** arithmetic, not a generic ×12.
- Explanation **teaches the why**, with hedging where reality is nuanced.
- Reuses a **small, meaningful `skillId`** so mastery/spaced-repetition stay coherent.

## Bottom line

This is an **editorial/content problem, not an engineering one**. The platform, the
grading engine, and the 12 seed lessons are ready; the path to a credible product is
authoring the remaining topics to the seed bar (with SME review) rather than shipping
generated recall quizzes as paid lessons.
