# Parallel Agent Closeout Plan (2026-02-13)

This plan closes all current P0 blockers from `docs/release-signoff-2026-02-13-updated.md`.

## In-repo baseline now prepared

- Branch protection automation scripts:
  - `scripts/configure-branch-protection.sh`
  - `scripts/verify-branch-protection.sh`
- Runtime alert baseline: `ops/prometheus/moneta-alert-rules.yml`
- Secret policy + compliance docs:
  - `docs/security-secret-rotation-policy.md`
  - `docs/compliance/privacy-policy.md`
  - `docs/compliance/subscription-terms.md`
  - `docs/compliance/account-data-deletion-policy.md`
- Redacted env evidence generator:
  - `scripts/generate-redacted-env-report.sh`

## Agent 1: Secrets and Runtime Config

- Scope:
  - Populate production secrets in secret manager
  - Configure `NODE_ENV`, `DATABASE_URL`, JWT secrets, metrics token, billing provider secrets
  - Confirm `CORS_ORIGINS`, `TRUST_PROXY`, `BILLING_ALLOW_SANDBOX_PURCHASES=false`
- Exit criteria:
  - Production environment variables are set and versioned in ops docs
  - `NODE_ENV=production ./scripts/production-readiness-check.sh` passes on target env
  - `NODE_ENV=production ./scripts/billing-release-readiness-check.sh` passes on target env
- Deliverables:
  - Redacted env verification artifact
  - Secret rotation policy document link

## Agent 2: Data Safety and Rollback Drills

- Scope:
  - Run migrations against production-like snapshot
  - Execute backup/restore full drill
  - Execute deploy rollback drill (`current`/`previous` swap)
- Exit criteria:
  - Successful migration report on snapshot
  - Restore drill with timing and RTO/RPO notes
  - Rollback drill log with validated release IDs
- Deliverables:
  - Drill evidence attached to release record

## Agent 3: Platform Reliability and Observability

- Scope:
  - Enforce `/health` and `/ready` probes in platform config
  - Configure shared Redis limiter (`RATE_LIMIT_REDIS_URL`)
  - Configure centralized logs with retention and request-id correlation
  - Add runtime alerts for 5xx/auth failures/latency/readiness
- Exit criteria:
  - Probe config exported and verified in deployment platform
  - Redis limiter enabled in production
  - Alert rules active and test-fired
  - Log sink searchable by `x-request-id`
- Deliverables:
  - Alert dashboard/screenshots
  - Observability config summary

## Agent 4: Mobile Store Validation

- Scope:
  - Validate production EAS profiles and store pipeline
  - Verify iOS/Android SKU envs in release builds
  - Execute purchase lifecycle QA: buy, restore, renew, cancel, expire
- Exit criteria:
  - TestFlight and Play Internal Testing runs pass
  - Billing lifecycle QA matrix complete with pass/fail evidence
- Deliverables:
  - Build IDs and tester evidence
  - Billing lifecycle test report

## Agent 5: Governance and Compliance

- Scope:
  - Branch protection and direct-push controls in GitHub
  - Release retention config confirmation (`KEEP_RELEASES`)
  - Privacy, subscription, and data deletion compliance package
- Exit criteria:
  - Branch rules active on protected branch
  - Release settings documented and verified
  - App Store and Play listing/legal assets ready
- Deliverables:
  - Branch protection screenshot/export
  - Compliance pack links

## Final Integration Step

- Run and attach:
  - `REQUIRE_INTEGRATION_TESTS=true REQUIRE_BILLING_RELEASE_CONFIG=true ./scripts/final-verification-gate.sh`
- Populate:
  - `docs/release-evidence-template.md`
- Decision rule:
  - Launch only when all five agent streams are complete and no P0 blocker remains.
