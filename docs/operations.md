# Moneta Operations

## CI
- `.github/workflows/ci.yml` runs lint, unit tests, Postgres integration tests, and build.
- Postgres integration tests run against a workflow service container.

## Deploy and rollback
- `.github/workflows/deploy.yml` runs production preflight checks, performs deployment, and validates health checks.
- If deploy fails health checks, rollback job runs automatically.
- Deployment logic is defined in `scripts/deploy.sh`.
- Rollback logic is defined in `scripts/rollback.sh`.
- Configure `DEPLOY_KNOWN_HOSTS` as a repository secret to enforce SSH host-key verification during deploy and rollback.
- Deployments are versioned under `<DEPLOY_PATH>/releases/<RELEASE_ID>` and switched atomically with symlinks:
  - `<DEPLOY_PATH>/current` points to the live release.
  - `<DEPLOY_PATH>/previous` points to the prior release for rollback.
- `scripts/deploy.sh` builds the new release, updates symlinks, restarts service, and prunes old releases while preserving `current` and `previous`.
- `scripts/rollback.sh` swaps `current` back to `previous` and restarts the same service.

### Deploy-time variables
- Required: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_KNOWN_HOSTS`
- Optional:
  - `DEPLOY_SERVICE_NAME` (defaults to `moneta`)
  - `RELEASE_ID` (auto-generated if omitted)
  - `KEEP_RELEASES` (defaults to `5`; must be >= 2)

## Alerting
- `.github/workflows/alerts.yml` posts webhook notifications on CI/deploy failures.
- Configure `ALERT_WEBHOOK_URL` as a repository secret.
- Runtime alert rules for production are defined in `ops/prometheus/moneta-alert-rules.yml`.
- Production observability setup (metrics, probes, log retention/correlation) is documented in `docs/observability-production-setup.md`.

## Runtime observability
- Structured logs include request IDs (`x-request-id`).
- Prometheus metrics are available at `GET /metrics`.
- Runbooks for critical incidents:
  - `docs/runbooks/database-outage.md`
  - `docs/runbooks/redis-rate-limit-outage.md`
  - `docs/runbooks/auth-failure-spike.md`

## Branch protection
- Apply baseline branch protection controls with `./scripts/configure-branch-protection.sh`.
- Verify settings with `./scripts/verify-branch-protection.sh`.
- Required checks default to: `quality`, `mobile-quality`, `final-gate`.


## Go-live checklist
- Use `docs/go-live-checklist.md` as the release gate before enabling production traffic.
- Record final verification and release sign-off evidence using `docs/release-evidence-template.md`.
- Use `docs/security-secret-rotation-policy.md` and `docs/compliance/` docs for security/compliance artifacts required by store submission.
- Follow `docs/external-go-live-execution-guide.md` for command-by-command external execution.

## Production readiness verification
- Run `./scripts/production-readiness-check.sh` before deployment to validate required production environment variables and reject insecure defaults.
- This script is intended as a preflight guardrail and should be wired into your deploy pipeline.
- Generate a redacted environment evidence artifact with `./scripts/generate-redacted-env-report.sh` for release records.
- Use `./scripts/collect-release-evidence.sh` to capture consolidated pass/fail logs and artifacts in one run.

## Final release verification gate
- Run `./scripts/final-verification-gate.sh` before release go/no-go.
- Integration tests are required by default; set `REQUIRE_INTEGRATION_TESTS=false` only for explicit local-only runs.
- The gate validates backend/mobile lint, unit tests, integration tests, backend build, and security audits at high/critical thresholds.
- Set `REQUIRE_BILLING_RELEASE_CONFIG=true` to enforce production billing/mobile environment validation during release candidate checks.

## Billing verification and reconciliation
- `POST /api/billing/entitlements/sync` verifies purchase tokens server-side against configured store providers before entitlement changes.
- `POST /api/billing/webhooks/reconcile` accepts signed HMAC webhook events and applies idempotent entitlement reconciliation.
- Configure billing environment variables for production:
  - `BILLING_WEBHOOK_SECRET`
  - `APPLE_SHARED_SECRET` for iOS verification
  - `GOOGLE_PLAY_PACKAGE_NAME` + `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` for Android verification
  - `BILLING_ALLOW_SANDBOX_PURCHASES=false`
- Run `./scripts/billing-release-readiness-check.sh` in release CI/CD with production env vars to validate:
  - backend billing secrets and provider credentials
  - mobile billing SKU variables
  - `EXPO_PUBLIC_API_BASE_URL` HTTPS requirement
  - sandbox billing disabled in production
