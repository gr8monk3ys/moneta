# Moneta Content Inventory (2026-02-14)

This snapshot documents curriculum depth after the 2026-02-14 content expansion pass.

## Curriculum totals

- Total lessons: `84`
- Total items: `648`
- Levels covered: `F1` to `F6`
- Free lessons: `42`
- Premium lessons: `42`

## Level distribution

- `F1`: 14 lessons
- `F2`: 14 lessons
- `F3`: 14 lessons
- `F4`: 14 lessons
- `F5`: 14 lessons
- `F6`: 14 lessons

## Validation command

```bash
cd /Users/natalyscaturchio/code/moneta
npx tsx -e "import { listCurriculum } from './src/data.ts'; const all=listCurriculum(true); const items=all.reduce((s,l)=>s+l.items.length,0); const levelCounts=all.reduce((acc,l)=>{acc[l.level]=(acc[l.level]||0)+1; return acc;}, {} as Record<string,number>); const free=all.filter(l=>!l.premium).length; const premium=all.filter(l=>l.premium).length; console.log(JSON.stringify({lessons:all.length,items,levelCounts,free,premium}, null, 2));"
```

## Notes

- Expanded MVP curriculum from `60` lessons / `408` items to `84` lessons / `648` items.
- Base lessons were expanded and enriched with MCQ choices and explanations to reduce free-text grading ambiguity.
- Generated lessons were updated to avoid exact-match long-form text prompts and to ensure every generated lesson contains at least one numeric item that can be graded reliably.
- Lesson ordering is deterministic by finance level, track, premium flag, and ordinal suffix.

