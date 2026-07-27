# Moneta Content Readiness

*Last updated: July 27, 2026*

This document summarizes whether the current curriculum is usable for real beginner learners and what still needs to happen before broad public launch.

> **Update (2026-07-27):** the premium tier (all 42 F4–F6 lessons) went through a
> hardening pass — strawman MCQ distractors rewritten as in-domain misconceptions,
> numeric items upgraded to two-step calculations, and one scenario-framed
> short-answer item added per authored premium lesson (the scenario format was
> previously unused). Counts below reflect the live curriculum.

## Current state

- Total lessons: `84`
- Total items: `540`
- Levels covered: `F1` to `F6`
- Free lessons: `42` (all of `F1`–`F3`)
- Premium lessons: `42` (all of `F4`–`F6`)

Source snapshots:

- `docs/content-inventory-2026-02-14.md`
- `docs/content-editorial-review-2026-02-14.md`

## Ground-zero learner readiness

Current status: `yes, with caveats`

The curriculum is strong enough for a user starting from near zero financial knowledge to begin learning productively.

Why that is true:

- There is a guided path across foundational through advanced levels instead of a flat content dump.
- `F1` to `F3` cover beginner-relevant areas such as budgeting, banking, cash flow, credit, debt, savings, and everyday financial decisions.
- Lessons include explanations, which makes the app usable as a teaching product rather than only a quiz product.
- The free pathway fully covers the beginner levels (`F1`–`F3`), so a first-time user can learn productively before paying; `F4`–`F6` are the premium tier.
- Daily review and progress systems reinforce learning instead of requiring users to remember everything after a single lesson.

## What is complete

- The repo now contains a materially complete MVP curriculum volume for launch-range expectations.
- Lesson items are gradeable and no longer depend on fragile exact-match long-form text answers.
- Every lesson includes editorial metadata and richer item formats.
- Content spans both free and premium tracks across all finance levels.

Validation references:

- `tests/curriculum-content.test.ts`
- `src/data.ts`

## What is not fully complete

The remaining gaps are mostly trust and maintenance gaps, not volume gaps.

- Higher-risk topics still need an external SME spot-check:
  - tax basics
  - insurance basics
  - retirement / investing basics
- Lessons would be stronger with per-lesson source links to canonical references such as CFPB, IRS, SEC, or SSA materials.
- Time-sensitive topics still need an explicit refresh cadence so content does not silently go stale.

## Launch recommendation

Recommended status: `good enough for beta / controlled launch`

This content is credible enough for real beginner users today, especially for onboarding, habit formation, and foundational finance learning. It should not be treated as permanently complete until SME review and source-linking are finished.
