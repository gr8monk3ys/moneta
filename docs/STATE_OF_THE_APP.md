# State of the Application — Moneta

_Analysis date: 2026-05-29 · Base: `main` @ `b9d3e8a` (post security-hardening merge)_

A structured, honest assessment of the codebase as it stands today: what it is, how it's built, where it's solid, where the risk lives, and what to do next.

---

## 1. Snapshot

| | |
|---|---|
| **Product** | iOS / Android finance-learning app (lessons, spaced-repetition reviews, streaks, Pro subscription) |
| **Backend** | TypeScript + Express 5, ~6.5k LOC (`src/`) |
| **Mobile** | Expo / React Native, ~3.6k LOC (`mobile/src/`) |
| **Tests** | ~8.3k LOC; **115 backend** + **83 mobile** passing; ~98% backend statement coverage |
| **Persistence** | PostgreSQL (prod) + in-memory repo (tests/dev), 7 SQL migrations |
| **Stage** | Pre-launch, single primary owner. Backend feature-complete for the core loop; not yet shipped |

**One-line verdict:** the engineering is genuinely competent for a pre-launch product; the historical risk was *judgment about where effort went* (heavy launch/CI/process apparatus over an unshipped app that had exploitable auth/billing holes). Those holes are now closed. The next gains are product-facing, not process.

---

## 2. Architecture

**Backend is cleanly layered**, which is the codebase's biggest structural strength:

```
server.ts            → process bootstrap, env validation, graceful shutdown
  app.ts             → Express wiring (helmet, CORS, rate limits, raw-body capture)
    routes/          → HTTP surface (auth, learning, billing, system)
      services? *    → (folded back into routes; see §9)
    engine.ts        → pure domain logic (mastery, streaks, spaced repetition, placement)
    billing*.ts      → entitlement model + Apple/Google/HMAC verification
    repository.ts    → interface; memory + postgres implementations behind it
    data.ts          → curriculum content + generator + queries + seed state
```

- **Dependency injection** via a `RouteDeps` bag — repositories, verifiers, secrets, and the email service are all injected, which is what makes the ~98% test coverage achievable without a live DB.
- **Repository abstraction** (`UserRepository`) with parallel in-memory and Postgres implementations. Parity between the two is now aligned (a prior gap was fixed in the hardening pass).
- **Mobile** is a conventional Expo app: `lib/api.ts` (typed client with single-flight token refresh), `providers/AuthProvider`, React Navigation stack/tabs, React Query for server state, SecureStore for credentials.

**Data flow (core loop):** register → `onboarding/placement` sets level → `learn/today` serves due reviews + next lesson → `sessions/complete` grades answers server-side, updates skill mastery, schedules next review, advances streak → `progress` summarizes.

---

## 3. Domain model & learning engine

**Entities** (`migrations/`): `auth_users`, `user_profiles` (level, streak, `last_active_date`, `skills_json`, `entitlement_json`, `completed_lessons_json`), `refresh_tokens` (rotation + lifecycle), `password_reset_tokens`, `billing_webhook_events` (idempotency ledger).

**Engine (`engine.ts`) is small, pure, and testable:**
- **Mastery:** per-skill score, `+0.10` correct / `−0.07` incorrect, clamped `[0,1]`.
- **Spaced repetition:** next-review interval keyed off mastery (24h / 48h / 72h tiers).
- **Streaks:** day-key computed in the user's timezone; advances on consecutive days, resets on a gap.
- **Placement:** score→level mapping (F1–F6); re-runs can no longer demote a user.

**Billing/entitlements (`billing.ts` + `billing.verification.ts`):** a normalized `SubscriptionEntitlement`, Apple receipt + Google Play + HMAC-webhook verification paths, sandbox tokens (hard-disabled in production), and a Pro/free feature gate (`advancedTracks`, review caps, etc.).

**Observations:**
- The engine constants (mastery deltas, intervals, 0.8 mastery threshold) are reasonable but **un-tuned and undocumented** — fine for MVP, worth revisiting with real learner data.
- Numeric-answer grading uses a unitless tolerance and a percent-normalization heuristic that can accept contradictory answers (e.g. `0.5` and `50` both grade as `50%`). Low impact, but a real correctness wart.

---

## 4. API surface

24 routes, all under a clean REST shape:

- **Auth:** register, login, refresh, logout, logout-all, password reset (request/confirm), account export + deletion (GDPR-style).
- **Learning:** placement, `learn/today/:userId`, `learn/path/:userId`, `learn/lessons/:lessonId`, `sessions/complete`, `progress/:userId`.
- **Billing:** `entitlements/:userId`, `entitlements/sync`, `webhooks/reconcile`.
- **System/marketing:** `/health`, `/ready`, `/metrics` (token-gated), `/`, `/robots.txt`, `/sitemap.xml`.

Authorization is consistent: user-scoped routes enforce `req.auth.sub === :userId`, and all derive identity from the JWT rather than trusting path/body. No IDOR found.

---

## 5. Security posture

**Now solid on the paths that matter** (hardened in the most recent merge):

- **Billing:** webhook idempotency is atomic (claim-before-apply); stale/out-of-order webhooks can't downgrade a paying user; HMAC verified over the raw body; sandbox tokens disabled in prod.
- **Auth:** JWT pinned to HS256; bcrypt with a production cost floor; refresh-token rotation **with reuse detection** (a replayed token revokes the whole session family); strong production secret validation; anti-enumeration on login/reset.
- **Progress:** session payloads bounded and validated against the curriculum; mastery-based lesson completion gated on entitlement (no free unlock of premium content).
- **Transport/infra:** Helmet, configurable CORS allowlist, distributed rate limiting (Redis-backed in prod), constant-time `/metrics` token compare.

**Residual / deferred (not blockers, tracked in §10):**
- Billing webhook trusts a valid HMAC rather than re-verifying each event against Apple/Google (the documented MVP trade-off).
- No per-account login/reset throttling (only IP-based) — distributed guessing isn't fully mitigated.
- Web build stores tokens in `localStorage` (standard Expo-web XSS exposure); native uses SecureStore correctly.

---

## 6. Testing & quality

- **Backend:** 115 tests, ~98% statements / ~88% branches, enforced by a coverage gate. Tests are behavioral (HTTP-level via supertest + focused units), not coverage-padding. Postgres integration tests run against a real container in CI.
- **Mobile:** 83 tests across screens, navigation, auth, store-billing, and the API client.
- **Tooling:** strict TypeScript, ESLint, e2e smoke suite, `npm audit` gates. **Backend dependency CVEs are at 0.**

This is a real strength — the test suite is good enough to refactor against with confidence.

---

## 7. Infrastructure, CI & ops

- **Ops scaffolding is real and sensible:** systemd unit with hardening flags, Prometheus alert rules (5xx SLO, readiness, API-down), atomic symlink deploy + rollback scripts with path allowlists and host-key pinning.
- **CI is currently dormant by choice:** GitHub Actions is disabled at the account/billing level, so workflows don't run. The PR-gating suite was rationalized to `ci.yml` (lint/typecheck/test/build/e2e/audit for backend + mobile); the redundant external scanners now run only on `main` + weekly schedule, and the no-op `security-baseline` job was retired. **Net:** when billing is ever re-enabled, the green path is the focused `ci.yml`, not 8 overlapping scanners.
- **Caveat:** because Actions can't run, nothing auto-deploys and `main` will show red/again-skipped checks until billing changes. This is cosmetic; the merged code is verified locally.

---

## 8. Documentation

`docs/` holds **42 markdown files**, the majority of which are launch-process artifacts (go/no-go matrices, dated sign-offs, multi-agent closeout reports, release-evidence templates). For a pre-launch solo project this is **disproportionate and partly misleading** — some docs are superseded dated snapshots, and at least one dated file is load-bearing in a docs-readiness check. Recommendation: collapse to a small living set (`README`, `OPERATIONS`, `RELEASE`, compliance drafts) and archive/delete the rest.

---

## 9. Key liabilities (ranked)

1. **`data.ts` (2,192 lines)** — hand-authored lessons + a procedural content generator + query functions + live in-memory seed state in one module. It's the single biggest maintainability risk and obscures content review. Split into `curriculum.data.json` + `generator.ts` + `queries.ts`.
2. **Content depth/validation** — the curriculum is largely templated/generated; for a *finance-education* product the actual lesson quality and correctness is the product, and it needs editorial validation independent of the code.
3. **Mobile dependency CVEs** — ~15 *moderate* advisories gated behind an overdue **Expo 54 → 56** upgrade.
4. **Documentation sprawl** (see §8).
5. **Single external dependency for CI security** — the reusable workflows point at a separate `gr8monk3ys/github` repo, a fragility/single-point-of-trust if CI is revived.

---

## 10. Prioritized roadmap

**Now (small, high-value, low-risk):**
- Split `data.ts` into data + generator + queries (unlocks content review; the test suite makes this safe).
- Right-size `docs/` to a living set; remove superseded snapshots.
- Tune/document the engine constants and fix the numeric-grading tolerance.

**Next (product & depth):**
- Editorial validation pass on curriculum content (accuracy, leveling, coverage).
- Expo 54 → 56 upgrade (clears the remaining moderate CVEs).
- Per-account auth throttling.

**Later (when scaling / shipping):**
- Billing webhook re-verification against Apple/Google.
- Re-enable a lean CI once Actions billing is sorted (`ci.yml` only to start).
- Real load/perf validation against Postgres (the curriculum is re-scanned per request on some hot paths — memoize once split).

---

## Bottom line

Moneta is a **well-built skeleton with a now-secure core loop and a genuinely good test suite**. It is not held back by code quality. To move from "solid prototype" to "shippable product," the work is product-facing — content quality, the `data.ts` refactor, and trimming the process/CI/docs apparatus down to what a product at this stage actually needs.
