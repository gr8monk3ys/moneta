# Moneta Content Inventory (2026-02-13)

This snapshot documents curriculum depth after the content expansion pass.

## Curriculum totals

- Total lessons: `60`
- Total items: `408`
- Levels covered: `F1` to `F6`
- Free lessons: `30`
- Premium lessons: `30`

## Level distribution

- `F1`: 10 lessons
- `F2`: 10 lessons
- `F3`: 10 lessons
- `F4`: 10 lessons
- `F5`: 10 lessons
- `F6`: 10 lessons

## Validation command

```bash
npx tsx -e "import { listCurriculum } from './src/data.ts'; const all=listCurriculum(true); const items=all.reduce((s,l)=>s+l.items.length,0); const levelCounts=all.reduce((acc,l)=>{acc[l.level]=(acc[l.level]||0)+1; return acc;}, {} as Record<string,number>); const free=all.filter(l=>!l.premium).length; const premium=all.filter(l=>l.premium).length; console.log(JSON.stringify({lessons:all.length,items,levelCounts,free,premium}, null, 2));"
```

## Notes

- This pass satisfies the PRD MVP volume target range (`60-100` lessons and `400-700` items).
- Curriculum quality and pedagogy depth should continue improving with SME/editorial review and richer item formats.
