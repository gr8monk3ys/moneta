# Moneta Go-Live Checklist

This checklist is organized by release criticality so the team can ship in controlled stages.

Execution companion:

- `docs/external-go-live-execution-guide.md`

## P0 — Must complete before production launch

### Security and secrets
- [ ] Rotate and securely store production secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `METRICS_TOKEN`) in a secret manager.
- [ ] Enforce secret rotation policy (time-based + incident-triggered) per `docs/security-secret-rotation-policy.md`.
- [ ] Verify secret policy requirements:
  - `JWT_SECRET` and `JWT_REFRESH_SECRET` are each at least 32 characters.
  - `JWT_SECRET` and `JWT_REFRESH_SECRET` are different values.
  - `METRICS_TOKEN` is at least 24 characters.
  - No placeholder/default-style values are used.
- [ ] Ensure no secrets are logged (request bodies, auth headers, tokens).
- [ ] Configure outbound email for password reset codes:
  - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (and `SMTP_PORT`/`SMTP_SECURE` as needed)
- [ ] Configure billing secrets and provider credentials:
  - `BILLING_WEBHOOK_SECRET`
  - `APPLE_SHARED_SECRET` (if iOS subscriptions are enabled)
  - `GOOGLE_PLAY_PACKAGE_NAME` + `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (if Android subscriptions are enabled)

### Legal and licensing
- [ ] Decide the intended software license for the repository (open-source vs proprietary).
- [ ] Ensure the declared license matches everywhere it is published (for example `/LICENSE` vs `/package.json`).
- [ ] Validate any third-party attribution/notice requirements for dependencies and bundled assets.
- [ ] Complete legal review of:
  - `docs/compliance/privacy-policy.md`
  - `docs/compliance/terms-of-service.md`
  - `docs/compliance/subscription-terms.md`
  - `docs/compliance/financial-education-disclaimer.md`
  - `docs/compliance/account-data-deletion-policy.md`
- [ ] Confirm the legal entity name, address, and support/privacy contact emails that will appear in user-facing policies.
- [ ] Fill `docs/launch-inputs-handoff-template.md` and route it to legal / ops / release owners.
- [ ] Fill `docs/launch-missing-values-checklist.md` with final launch values.
- [ ] Populate the tracked env templates with final release values:
  - `.env.production.example`
  - `mobile/.env.production.example`
- [ ] Run `./scripts/launch-doc-readiness-check.sh` and resolve all unresolved placeholders in compliance/store docs.

### Runtime configuration
- [ ] Set all required production environment variables:
  - `NODE_ENV=production`
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`
  - `METRICS_TOKEN`
- [ ] Configure `CORS_ORIGINS` to explicit production domains only.
- [ ] Set `TRUST_PROXY=true` when running behind a load balancer or reverse proxy.
- [ ] Ensure `BILLING_ALLOW_SANDBOX_PURCHASES=false` in production.
- [ ] Run `./scripts/billing-release-readiness-check.sh` with production release env vars and resolve all failures.

### Data and database safety
- [ ] Confirm all migrations apply cleanly on a production-like database snapshot.
- [ ] Validate backup/restore procedures (full restore drill).
- [ ] Validate rollback procedure for both schema and app deploy (`current`/`previous` release symlink swap).

### API reliability
- [ ] Enforce readiness/liveness probes in deployment platform (`/ready`, `/health`).
- [ ] Ensure graceful shutdown is honored by orchestration (SIGTERM drain window).
- [ ] Configure shared rate limit store (`RATE_LIMIT_REDIS_URL`) for multi-instance production.

### Observability and on-call readiness
- [ ] Restrict `/metrics` access to internal network and/or `METRICS_TOKEN` auth.
- [ ] Deploy runtime alerting thresholds for 5xx spikes, auth failures, latency, and readiness failures from `ops/prometheus/moneta-alert-rules.yml`.
- [ ] Capture structured logs centrally with retention policy and correlation by `x-request-id`.

### CI/CD gates
- [ ] Require passing `lint`, `test`, and `build` jobs before merge/deploy.
- [ ] Require passing integration tests for release gate (`REQUIRE_INTEGRATION_TESTS=true`).
- [ ] Add required branch protection and prevent direct pushes to release branch (`./scripts/configure-branch-protection.sh` + `./scripts/verify-branch-protection.sh`).
- [ ] Ensure deploy pipeline includes post-deploy health verification and rollback trigger.
- [ ] Verify deploy concurrency guard is enabled (single production deployment at a time).
- [ ] Confirm release retention policy (`KEEP_RELEASES`) and cleanup behavior are configured.

### Mobile production readiness
- [ ] Validate Expo build profiles for production (`eas`/store pipeline as applicable).
- [ ] Confirm `EXPO_PUBLIC_API_BASE_URL` points to production API over HTTPS.
- [ ] Confirm store SKU env vars are set for release builds:
  - `EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS`
  - `EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS`
- [ ] Publish and verify legal URLs used by the app/store listing:
  - Privacy policy (`docs/compliance/privacy-policy.md`)
  - Terms of service (`docs/compliance/terms-of-service.md`)
  - Subscription terms (`docs/compliance/subscription-terms.md`)
  - Financial education disclaimer (`docs/compliance/financial-education-disclaimer.md`)
  - Account deletion policy (`docs/compliance/account-data-deletion-policy.md`)
- [ ] Finalize App Store / Play listing copy and reviewer notes using:
  - `docs/store-submission/app-store-connect-metadata-template.md`
  - `docs/store-submission/google-play-listing-template.md`
  - `docs/store-submission/store-assets-checklist.md`
- [ ] Produce final store screenshots that show real release content and no dev-only or sandbox text.
- [ ] Verify secure auth persistence and logout flows on cold app restart.
- [ ] Verify in-app account export/deletion flows meet App Store and Play policy requirements.
- [ ] Complete store billing lifecycle validation using `docs/store-billing-qa-matrix-template.md`.
- [ ] Run manual smoke QA checklist: `docs/qa/mobile-manual-qa-checklist.md`
- [ ] Run a final finance SME spot-check on higher-risk content areas before public launch:
  - tax basics
  - insurance basics
  - retirement / investing lessons

## P1 — Should complete in first post-launch sprint

### Testing depth
- [ ] Add end-to-end tests covering register/login/refresh/logout-all across backend + mobile client.
- [ ] Add regression tests for concurrent token refresh behavior at higher request concurrency.
- [ ] Add contract tests for error responses and auth failure semantics.

### Security hardening
- [ ] Add dependency audit to CI and fail on high/critical vulnerabilities unless explicitly approved.
- [ ] Add periodic penetration test or automated DAST scan on staging.
- [ ] Add brute-force and abuse detection dashboards for auth endpoints.

### Operational excellence
- [ ] Define SLOs/SLIs (availability, p95 latency, auth success rate).
- [ ] Create runbooks for top incidents: DB outage, Redis outage, token refresh failures.
  - Existing runbooks: `docs/runbooks/database-outage.md`, `docs/runbooks/redis-rate-limit-outage.md`, `docs/runbooks/auth-failure-spike.md`.
- [ ] Document maintenance windows and incident escalation path.

### Product quality
- [ ] Remove or hard-hide any dev-only actions, debug affordances, or sandbox-only copy from release builds.
- [ ] Add analytics instrumentation for onboarding funnel and daily learning loop.
- [ ] Validate app behavior under poor network conditions and intermittent connectivity.

## P2 — Scale and maturity improvements

### Platform and resilience
- [ ] Introduce canary or blue/green deploy strategy.
- [ ] Add chaos testing for dependency failures (DB/Redis partial outages).
- [ ] Add autoscaling rules tied to CPU/memory/request queue metrics.

### Compliance and governance
- [ ] Define data retention/deletion policy and user data export/deletion workflow.
- [ ] Add privacy review and consent flows for analytics and telemetry.
- [ ] Establish release sign-off checklist with engineering + product + operations owners.
  - Draft compliance docs: `docs/compliance/privacy-policy.md`, `docs/compliance/subscription-terms.md`, `docs/compliance/account-data-deletion-policy.md`.

## Release go/no-go template

- **Release candidate:** `<version / commit>`
- **Date/time window:** `<UTC>`
- **Owner on point:** `<name>`
- **P0 status:** `<all complete / blockers>`
- **Known risks accepted:** `<list>`
- **Rollback plan validated:** `<yes/no>`
- **Final go/no-go decision:** `<go / no-go>`
