# Production Readiness Checklist v2

This checklist defines the minimum controls required before promoting Moneta to production traffic.

## P0 (must pass before launch)

- [ ] CI backend quality job passes (lint, coverage tests, DB integration tests, build, audit).
- [ ] CI mobile quality job passes (lint, coverage tests, audit).
- [ ] CI backend E2E smoke job step passes (`npm run test:e2e`).
- [ ] `./scripts/final-verification-gate.sh` passes in a release-like environment with `REQUIRE_HIGH_RELEASE_POLICY=true` and `MOBILE_AUDIT_LEVEL=high`.
- [ ] `NODE_ENV=production ./scripts/production-readiness-check.sh` passes with real environment configuration.
- [ ] Secrets are provisioned via environment variables (no hardcoded values in code or manifests).
- [ ] Metrics auth token and CORS allowlist are configured for production.
- [ ] At least one billing provider integration is configured for production (Apple or Google).

## P1 (first 1-2 sprints after launch)

- [x] Raise backend global coverage thresholds to at least 85/85/85/75 (lines/statements/functions/branches).

- [x] Raise mobile global coverage thresholds to at least 65/65/65/50 (lines/statements/functions/branches).
- [x] Add E2E smoke for billing webhook reconciliation path.
- [x] Add E2E smoke for refresh-token rotation path over live HTTP server.
- [x] Add Postgres integration tests for replay/idempotency edge-cases.
- [x] Add synthetic uptime checks for `/health`, `/ready`, and protected `/metrics`.

## P2 (stability hardening)

- [x] Raise mobile global coverage thresholds to at least 75/75/75/60.
- [ ] Add load/performance baseline testing for auth and learning endpoints.
- [ ] Add disaster-recovery game day for DB outage and Redis outage runbooks.
- [ ] Add deployment canary and automated rollback criteria.

## Release sign-off evidence

Attach the following artifacts to each release sign-off:

1. CI run links for backend + mobile + final gate.
2. Output of `./scripts/collect-release-evidence.sh`.
3. Output of `./scripts/generate-redacted-env-report.sh`.
4. Confirmation of `production-readiness-check.sh` pass in target environment.
5. Final gate configuration artifact confirming `REQUIRE_HIGH_RELEASE_POLICY=true` and `MOBILE_AUDIT_LEVEL=high`.
