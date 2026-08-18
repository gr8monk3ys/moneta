# Moneta Brand Identity

*Last updated: July 27, 2026*

## Core idea

Moneta should feel like the finance-learning app for people who want calm, credible progress instead of hype.

The product promise is:

- short enough to keep up with
- structured enough to trust
- practical enough to change real decisions

## Positioning shorthand

- Category: finance learning app
- Analogy: Duolingo for learning finance
- Brand promise: build money confidence without being talked down to

## Voice

- Clear
- Grounded
- Encouraging
- Credible
- Modern

Use:

- money confidence
- guided path
- 5-minute lessons
- daily review
- real-life decisions

Avoid:

- get rich
- hacks
- secrets
- beat the market
- guaranteed returns

## Visual system

### Color palette

- `Ledger Ink`: `#0C1415`
- `Signal Teal`: `#173033`
- `Brass Accent`: `#D1A15C`
- `Paper`: `#F6F1E7`
- `Mint Success`: `#6ECDA6`
- `Mist`: `#9AB0AA`

### Typography

- Display/headlines: `Iowan Old Style`, `Palatino Linotype`, `Book Antiqua`, `Georgia`, serif
- Interface/body: `Avenir Next`, `Trebuchet MS`, `Segoe UI`, sans-serif

The display stack gives Moneta a more deliberate, editorial feel than a default app-marketing sans stack. The interface stack keeps UI copy clear and fast to scan.

### Shape language

- Rounded rectangles and capsules
- Coin/ring motifs
- Grids and stepped forms to suggest progression and compounding

### Logo mark

- Primary asset: [`moneta-mark.svg`](../../public/marketing/moneta-mark.svg)
- Meaning: a stepped growth form inside a coin-like frame
- App store / launcher assets: `mobile/assets/` (icon, adaptive icon, splash, favicon), regenerated from the mark geometry with [`scripts/generate-mobile-assets.cjs`](../../scripts/generate-mobile-assets.cjs)

## In-app design tokens

The mobile app implements this identity through a token system in
[`mobile/src/lib/theme.ts`](../../mobile/src/lib/theme.ts):

- `palette` — the brand colors above plus derived dark surfaces
  (`tealSurface #122123`, `tealRaised #193135`) that match the marketing
  site's card gradients, and a warm coral (`#E4726B`) for destructive states.
- `theme` — semantic roles (`bg`, `card`, `textPrimary`, `accent`,
  `onAccent`, `success`, `danger`, soft tints, hairline borders).
- `font` — the display serif / interface sans stacks; Iowan Old Style and
  Avenir Next ship with iOS, Android falls back to its system faces.
- `surface` — shared card, capsule-button, and input shapes so screens stay
  consistent.

The in-app brand mark is rebuilt from plain views in
[`mobile/src/components/BrandMark.tsx`](../../mobile/src/components/BrandMark.tsx)
(no SVG dependency), and the tab bar uses coin-dot indicators instead of
emoji, per the guidance below.

## Messaging pillars

### 1. Learnable

Finance is presented as a skill anyone can build, not a talent some people naturally have.

### 2. Habit-forming

Moneta emphasizes repetition, streaks, and daily review rather than one-time content consumption.

### 3. Trustworthy

The product is explicitly education-only and avoids advisory or hype-driven framing.

## Launch asset direction

- Landing page should lead with confidence and category clarity before talking about subscriptions.
- App Store screenshots should tell a progression story: start, path, review, progress, Pro.
- Avoid screenshots or copy that feel overly technical, legalistic, or overly “investing bro.”
- Use real product content only. No placeholder data, no debug affordances, no sandbox copy.

## In-product guidance

- Replace emoji-heavy branding with the Moneta mark or neutral interface cues where practical. *(Implemented: login lockup, tab bar, and streak display now use the mark and coin motifs.)*
- Keep subscription language direct and factual.
- Use warm contrast, not neon fintech aesthetics. *(Implemented: the app runs on the Ledger Ink / Signal Teal / Brass palette via `theme.ts`.)*
