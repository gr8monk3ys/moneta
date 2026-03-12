# Mobile Manual QA Checklist (Draft)

This is a pragmatic checklist to validate Moneta’s core user flows before store submission.

## Build + environment

- [ ] Using a non-dev build (EAS preview/production).
- [ ] `EXPO_PUBLIC_API_BASE_URL` is HTTPS and points to the intended backend.
- [ ] Subscription SKU env vars configured for the platform build.
- [ ] No dev-only buttons exposed in release build.

## Install + cold start

- [ ] Fresh install launches successfully.
- [ ] App shows login screen when unauthenticated.
- [ ] After login, app persists session across app restart.
- [ ] Logout clears local tokens and returns to login.

## Authentication flows

- [ ] Register new account via backend (or create demo user) and login works.
- [ ] Invalid credentials show clear error message.
- [ ] Token refresh path works (simulate expired access token by forcing refresh on protected call).
- [ ] “Sign out this device” works.
- [ ] “Sign out all devices” works.

## Home flow

- [ ] Home loads progress, next lesson, and today’s reviews.
- [ ] “Start Next Lesson” opens lesson player for the expected lesson.
- [ ] “Start Reviews” opens review player and displays due reviews when available.

## Learn flow

- [ ] Learning Path renders in deterministic order and shows locked Pro items.
- [ ] Locked Pro lesson tap shows an upgrade-required message.
- [ ] Completed lessons display as completed after completion.

## Lesson player flow

- [ ] Lesson loads and renders items.
- [ ] MCQ selections are selectable and navigate next/previous.
- [ ] Numeric input accepts expected values.
- [ ] Submitting a completed lesson returns a result summary.
- [ ] Exiting after completion updates Home/Progress/Learn screens (progress and next lesson change).

## Reviews flow

- [ ] Due reviews show prompts and choices (when enriched).
- [ ] Practice reviews appear when no due reviews are playable.
- [ ] Submitting reviews updates streak and schedules next review.
- [ ] Locked reviews are counted and excluded from playable queue.

## Subscription flow (TestFlight / Play Internal Testing)

Use `docs/store-billing-qa-matrix-template.md` as the evidence matrix.

- [ ] Purchase subscription unlocks Pro content (advanced tracks, unlimited reviews).
- [ ] Restore purchases restores entitlement.
- [ ] After entitlement changes, path and gating refresh correctly.

## Account export + deletion (store policy)

- [ ] Export account data succeeds and shows a confirmation message.
- [ ] Delete account requires explicit confirmation and completes successfully.
- [ ] After deletion, user is logged out and cannot access protected endpoints.

## Legal and policy access

- [ ] Privacy Policy link is present and opens correctly.
- [ ] Terms of Service link is present and opens correctly.
- [ ] Subscription Terms link is present and opens correctly.
- [ ] Financial education disclaimer is accessible in-app.

