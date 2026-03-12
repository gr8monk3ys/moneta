# Moneta External Go-Live Execution Guide

This is the operator runbook for tasks that must be completed outside the repository before release.

## 1) Branch protection and merge gates

### Objective

Enforce PR-based delivery and block direct pushes to `main`.

### Commands

```bash
cd "$(git rev-parse --show-toplevel)"
./scripts/configure-branch-protection.sh main
./scripts/verify-branch-protection.sh main
```

### Expected result

- Verify command exits `0` and prints `Branch protection check passed ...`.

### Known blocker path

If you get:

- `HTTP 403` with `Upgrade to GitHub Pro or make this repository public`

Then do one of these first:

1. Upgrade the GitHub plan for private repo branch protection.
2. Make the repository public (only if acceptable).

After that, rerun the two commands above and store output logs in release evidence.

## 2) Production environment preflight

### Objective

Validate production secret/config safety before deployment.

### Commands

```bash
cd "$(git rev-parse --show-toplevel)"
NODE_ENV=production ./scripts/production-readiness-check.sh
NODE_ENV=production REQUIRE_MOBILE_BILLING_VARS=true ./scripts/billing-release-readiness-check.sh
./scripts/generate-redacted-env-report.sh > /tmp/moneta-redacted-env-report.md
```

### Expected result

- `Production readiness environment checks passed.`
- `Billing release readiness checks passed.`
- Redacted report generated with no secret values.

## 3) End-to-end release evidence bundle

### Objective

Collect all verifications and logs into a single timestamped directory.

### Commands

```bash
cd "$(git rev-parse --show-toplevel)"
RUN_FINAL_GATE=true \
RUN_PRODUCTION_CHECK=true \
RUN_BILLING_CHECK=true \
RUN_BRANCH_PROTECTION_CHECK=true \
REQUIRE_INTEGRATION_TESTS=true \
./scripts/collect-release-evidence.sh
```

### Output location

- `artifacts/release-evidence/<UTC timestamp>/`
- Key file: `release-evidence-summary.md`

## 4) Data safety drills (production-like environment)

### Objective

Prove backup/restore and rollback procedures are functional.

### Suggested execution pattern

1. Create a fresh production-like DB snapshot.
2. Run migrations on that snapshot.
3. Execute backup and restore into an isolated restore target.
4. Validate app behavior against restored data.
5. Execute one deploy + rollback drill with `scripts/deploy.sh` and `scripts/rollback.sh`.

### Evidence required

- Commands run + timestamps
- Restore duration and RTO/RPO notes
- Validation outcomes for `/health` and `/ready`
- Release IDs used in rollback drill

## 5) Observability deployment

### Objective

Enable runtime alerts and centralized logs before public launch.

### Required artifacts in repo

- Alert rules: `ops/prometheus/moneta-alert-rules.yml`
- Setup guide: `docs/observability-production-setup.md`
- Incident runbooks in `docs/runbooks/`

### Evidence required

- Alert rules loaded in Prometheus/Alertmanager
- Test alert delivered to on-call channel
- Log sink query showing searchable `requestId`

## 6) Mobile store billing validation

### Objective

Validate purchase lifecycle in real store testing tracks.

### Required matrix

Use `docs/store-billing-qa-matrix-template.md` for both iOS and Android:

- buy
- restore
- renew
- cancel
- expire
- refund/revoke (if available)

## 7) Legal and compliance publication

### Objective

Publish legal documents and wire URLs into store metadata.

### Drafts provided

- `docs/compliance/privacy-policy.md`
- `docs/compliance/terms-of-service.md`
- `docs/compliance/subscription-terms.md`
- `docs/compliance/financial-education-disclaimer.md`
- `docs/compliance/account-data-deletion-policy.md`
- `docs/store-submission/app-store-connect-metadata-template.md`
- `docs/store-submission/google-play-listing-template.md`
- `docs/store-submission/store-assets-checklist.md`

### Required finalization

1. Legal review and edits.
2. Fill `docs/launch-missing-values-checklist.md`.
3. Run `./scripts/launch-doc-readiness-check.sh` and resolve all findings.
4. Finalize App Store and Play listing copy plus screenshot captions.
5. Produce final release screenshots/assets from a release-style build.
6. Publish final docs on production website.
7. Add final URLs to App Store and Play Console listings.
8. Archive approval notes in release evidence.

## Final go/no-go gate

Ship only when every P0 item in:

- `docs/release-signoff-2026-02-13-updated.md`

is marked `DONE` with evidence attached.
