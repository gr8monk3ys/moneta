# Moneta Go-Live Checklist

This checklist is organized by release criticality so the team can ship in controlled stages.

## P0 — Must complete before production launch

### Security and secrets
- [ ] Rotate and securely store production secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `METRICS_TOKEN`) in a secret manager.
- [ ] Enforce secret rotation policy (time-based + incident-triggered).
- [ ] Verify secret policy requirements:
  - `JWT_SECRET` and `JWT_REFRESH_SECRET` are each at least 32 characters.
  - `JWT_SECRET` and `JWT_REFRESH_SECRET` are different values.
  - `METRICS_TOKEN` is at least 24 characters.
  - No placeholder/default-style values are used.
- [ ] Ensure no secrets are logged (request bodies, auth headers, tokens).
- [ ] Configure billing secrets and provider credentials:
  - `BILLING_WEBHOOK_SECRET`
  - `APPLE_SHARED_SECRET` (if iOS subscriptions are enabled)
  - `GOOGLE_PLAY_PACKAGE_NAME` + `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (if Android subscriptions are enabled)

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
- [ ] Add alerting thresholds for 5xx spikes, auth failures, latency, and readiness failures.
- [ ] Capture structured logs centrally with retention policy and correlation by `x-request-id`.

### CI/CD gates
- [ ] Require passing `lint`, `test`, and `build` jobs before merge/deploy.
- [ ] Require passing integration tests for release gate (`REQUIRE_INTEGRATION_TESTS=true`).
- [ ] Add required branch protection and prevent direct pushes to release branch.
- [ ] Ensure deploy pipeline includes post-deploy health verification and rollback trigger.
- [ ] Verify deploy concurrency guard is enabled (single production deployment at a time).
- [ ] Confirm release retention policy (`KEEP_RELEASES`) and cleanup behavior are configured.

### Mobile production readiness
- [ ] Validate Expo build profiles for production (`eas`/store pipeline as applicable).
- [ ] Confirm `EXPO_PUBLIC_API_BASE_URL` points to production API over HTTPS.
- [ ] Confirm store SKU env vars are set for release builds:
  - `EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS`
  - `EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS`
- [ ] Verify secure auth persistence and logout flows on cold app restart.
- [ ] Verify in-app account export/deletion flows meet App Store and Play policy requirements.

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
- [ ] Document maintenance windows and incident escalation path.

### Product quality
- [ ] Replace placeholder/static mobile screens with backend-driven data where intended.
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

## Release go/no-go template

- **Release candidate:** `<version / commit>`
- **Date/time window:** `<UTC>`
- **Owner on point:** `<name>`
- **P0 status:** `<all complete / blockers>`
- **Known risks accepted:** `<list>`
- **Rollback plan validated:** `<yes/no>`
- **Final go/no-go decision:** `<go / no-go>`
