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

## Runtime observability
- Structured logs include request IDs (`x-request-id`).
- Prometheus metrics are available at `GET /metrics`.


## Go-live checklist
- Use `docs/go-live-checklist.md` as the release gate before enabling production traffic.

## Production readiness verification
- Run `./scripts/production-readiness-check.sh` before deployment to validate required production environment variables and reject insecure defaults.
- This script is intended as a preflight guardrail and should be wired into your deploy pipeline.

## Final release verification gate
- Run `./scripts/final-verification-gate.sh` before release go/no-go.
- Optional strict mode: set `REQUIRE_INTEGRATION_TESTS=true` to fail if `DATABASE_URL` is missing.
- The gate validates backend/mobile lint, tests, backend build, and security audits at high/critical thresholds.
