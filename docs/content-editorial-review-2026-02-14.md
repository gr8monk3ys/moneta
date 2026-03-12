# Content Editorial Review Report (2026-02-14)

This report records the editorial/SME-style pass executed for the expanded curriculum dataset.

## Scope reviewed

- Lesson corpus in `src/data.ts`
- Base lesson depth and internal consistency (prompt/choices/explanations)
- Generated lesson item format integrity (avoid ungradeable free-text prompts)
- Lesson ordering logic used to determine the next lesson in the path

## Decisions applied

- Expanded core “base” lessons from 2 items each to 6 items each and added explicit:
  - `format` (`mcq` / `numeric`)
  - `choices` for MCQ prompts
  - item-level `explanation`
- Extended each level’s expansion topic list by 4 additional topics (24 new lessons total).
- Updated generated lesson prompts to remove long free-text exact-match items:
  - Converted benchmark/action/mistake/formula prompts to MCQ.
  - Replaced the prior “formula” numeric prompt (which required typing text on numeric keyboards) with a reliably gradeable numeric annualization item.
- Shuffled MCQ choices deterministically so correct answers are not always option #1.
- Updated lesson ordering so progression follows ordinal suffix ordering within each level/track.

## Outcome summary

- Curriculum now includes 84 lessons and 648 items with even distribution across `F1` to `F6`.
- Generated lessons no longer rely on exact-match multi-sentence typing, improving answerability and grading reliability.
- Both free and premium pathways remain represented across all finance levels.

## Remaining recommendations

- Run an external domain SME spot-check (tax, insurance, retirement) prior to public launch.
- Add per-lesson “sources” links (CFPB/IRS/SEC/SSA/etc.) and keep a documented update cadence for time-sensitive topics.
- Consider adding additional distractor quality rules (avoid obviously-wrong generic distractors) for premium-grade experience.

