# moneta

An iOS / Android finance-learning platform.

## Product documentation

- [Product Requirements Document](docs/product-requirements-document.md)
- [MVP API Documentation](docs/api.md)
- [Operations Guide](docs/operations.md)
- [Go-Live Checklist](docs/go-live-checklist.md)
- [Release Evidence Template](docs/release-evidence-template.md)
- [Release Evidence Summary (2026-02-13)](docs/release-evidence-2026-02-13.md)
- [Content Inventory (2026-02-13)](docs/content-inventory-2026-02-13.md)
- [Content Editorial Review Report (2026-02-13)](docs/content-editorial-review-2026-02-13.md)
- [Observability Production Setup](docs/observability-production-setup.md)
- [Secret Rotation Policy](docs/security-secret-rotation-policy.md)
- [External Go-Live Execution Guide](docs/external-go-live-execution-guide.md)
- [Store Billing QA Matrix Template](docs/store-billing-qa-matrix-template.md)
- [Compliance: Privacy Policy (Draft)](docs/compliance/privacy-policy.md)
- [Compliance: Subscription Terms (Draft)](docs/compliance/subscription-terms.md)
- [Compliance: Account/Data Deletion Policy (Draft)](docs/compliance/account-data-deletion-policy.md)
- [Runbook: Database Outage](docs/runbooks/database-outage.md)
- [Runbook: Redis Rate Limit Outage](docs/runbooks/redis-rate-limit-outage.md)
- [Runbook: Auth Failure Spike](docs/runbooks/auth-failure-spike.md)
- [Release Sign-Off Report (2026-02-13)](docs/release-signoff-2026-02-13.md)
- [Release Sign-Off Report (2026-02-13, Updated)](docs/release-signoff-2026-02-13-updated.md)
- [Parallel Agent Closeout Plan (2026-02-13)](docs/parallel-agent-closeout-2026-02-13.md)
- [Multi-Agent Execution Plan](docs/multi-agent-execution-plan.md)
- [PR Acceptance Checklist](docs/pr-acceptance-checklist.md)
- [Production Readiness Checklist v2](docs/production-readiness-checklist-v2.md)
- [Release Go/No-Go Matrix](docs/release-go-no-go-matrix.md)

## Repository layout

- `src/` - backend API
- `src/content/curriculum.generated.json` - externalized curriculum content source
- `mobile/` - Expo mobile app (iOS/Android/Web)

## Mobile app quick start (Expo)

```bash
cd mobile
npm install
cp .env.example .env
npm run start
```

> The mobile app warns at runtime if `EXPO_PUBLIC_API_BASE_URL` is `localhost` on a physical device.

Then run on target:

- `npm run ios` (iOS simulator)
- `npm run android` (Android emulator)
- `npm run web` (browser preview)

For physical iPhone testing, point `EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP address.

## Backend API (implemented)

This repository includes a TypeScript backend for the core loop with authentication:

- auth register/login (`POST /api/auth/register`, `POST /api/auth/login`)
- refresh/logout (`POST /api/auth/refresh`, `POST /api/auth/logout`, `POST /api/auth/logout-all`)
- account export/deletion (`GET /api/auth/account/export`, `DELETE /api/auth/account`)
- onboarding placement (`POST /api/onboarding/placement`)
- daily learning feed (`GET /api/learn/today/:userId`)
- curriculum path and lesson detail (`GET /api/learn/path/:userId`, `GET /api/learn/lessons/:lessonId`)
- session completion with mastery/streak updates (`POST /api/sessions/complete`)
- progress summary (`GET /api/progress/:userId`)
- billing entitlement read/sync (`GET /api/billing/entitlements/:userId`, `POST /api/billing/entitlements/sync`)
- health/readiness/metrics (`GET /health`, `GET /ready`, `GET /metrics`)

## Configuration

Backend:

- `PORT` (default: `3000`)
- `NODE_ENV` (`development` or `production`)
- `JWT_SECRET` (required in production, minimum 32 chars, must not be placeholder/default)
- `JWT_REFRESH_SECRET` (required in production, minimum 32 chars, must not be placeholder/default, and must differ from `JWT_SECRET`)
- `JWT_ACCESS_TTL_SECONDS` (default: `3600`)
- `JWT_REFRESH_TTL_SECONDS` (default: `604800`)
- `REFRESH_TOKEN_PRUNE_INTERVAL_SECONDS` (default: `300`)
- `CORS_ORIGINS` (comma-separated allowlist)
- `DATABASE_URL` (required in production; app exits if missing)
- `METRICS_TOKEN` (required in production, minimum 24 chars, to access `GET /metrics` with `Authorization: Bearer <token>`)
- `RATE_LIMIT_REDIS_URL` (optional Redis store for distributed rate limiting; recommended in production)
- `TRUST_PROXY` (`true`/`false`; defaults to `true` in production)
- `BILLING_WEBHOOK_SECRET` (required in production; HMAC secret for billing reconciliation webhooks)
- `APPLE_SHARED_SECRET` (required if iOS subscriptions are supported)
- `GOOGLE_PLAY_PACKAGE_NAME` and `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (required together if Android subscriptions are supported)
- `BILLING_ALLOW_SANDBOX_PURCHASES` (`false` in production; defaults to enabled only outside production)
- `BILLING_PROVIDER_TIMEOUT_MS` (optional, defaults to `8000`)

Production readiness helper:

- Run `./scripts/production-readiness-check.sh` in your deployment environment to verify required env vars and secure defaults before promoting traffic.
- Run `./scripts/final-verification-gate.sh` before release sign-off to validate backend/mobile lint, tests, build, integration tests, coverage thresholds, and high/critical security audit gates.
- If you intentionally need to skip integration tests locally, set `REQUIRE_INTEGRATION_TESTS=false` explicitly.
- Run `NODE_ENV=production ./scripts/billing-release-readiness-check.sh` to validate billing provider/mobile SKU configuration before submitting store builds.
- Run `./scripts/generate-redacted-env-report.sh` to create a shareable, non-secret environment evidence snapshot for release review.
- Run `./scripts/collect-release-evidence.sh` in the target environment to bundle check outputs into `artifacts/release-evidence/<timestamp>/`.

Mobile:

- `EXPO_PUBLIC_API_BASE_URL`

Deploy/rollback scripts:

- `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_KNOWN_HOSTS` (required)
- `DEPLOY_SERVICE_NAME` (optional, defaults to `moneta`)
- `RELEASE_ID` (optional, auto-generated by workflow)
- `KEEP_RELEASES` (optional, defaults to `5`)

Branch protection scripts:

- `./scripts/configure-branch-protection.sh [branch]`
- `./scripts/verify-branch-protection.sh [branch]`
- `./scripts/collect-release-evidence.sh`


## CI test commands

- Backend coverage gate: `npm run test:ci`
- Backend E2E smoke: `npm run build && npm run test:e2e`
- Synthetic uptime checks: `SYNTHETIC_BASE_URL=<url> SYNTHETIC_METRICS_TOKEN=<token> npm run check:synthetic-uptime`
- Mobile coverage gate: `cd mobile && npm run test:ci`


### Final verification gate knobs

- `MOBILE_AUDIT_LEVEL` controls the strictness of mobile audit checks in `./scripts/final-verification-gate.sh`.
  - `high` (default): fail on high/critical vulnerabilities.
  - `moderate`: fail on moderate/high/critical vulnerabilities.
  - `off`: skip mobile audit (non-release troubleshooting only).
- `REQUIRE_HIGH_RELEASE_POLICY` defaults to `true` and blocks the gate unless `MOBILE_AUDIT_LEVEL=high`.
  - Keep this `true` for ship/release candidates.
  - Set to `false` only for temporary non-release diagnostics.
