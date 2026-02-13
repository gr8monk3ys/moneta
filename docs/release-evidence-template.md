# Moneta Release Evidence Template

Use this document for each production release candidate before final go/no-go.

## Release metadata

- Release candidate: `<version / commit>`
- Build artifacts:
  - iOS: `<build id>`
  - Android: `<build id>`
- Environment: `<staging / production-like>`
- Date/time window (UTC): `<window>`
- Owner on point: `<name>`

## Verification results

### Automated evidence bundle (recommended)

- Command:
  - `RUN_FINAL_GATE=true RUN_PRODUCTION_CHECK=true RUN_BILLING_CHECK=true RUN_BRANCH_PROTECTION_CHECK=true REQUIRE_INTEGRATION_TESTS=true ./scripts/collect-release-evidence.sh`
- Result: `<pass/fail>`
- Bundle path:
  - `artifacts/release-evidence/<timestamp>/`

### Final verification gate

- Command:
  - `REQUIRE_INTEGRATION_TESTS=true ./scripts/final-verification-gate.sh`
- Result: `<pass/fail>`
- Notes: `<key output / links>`

### Billing release readiness

- Command:
  - `NODE_ENV=production REQUIRE_MOBILE_BILLING_VARS=true ./scripts/billing-release-readiness-check.sh`
- Result: `<pass/fail>`
- Notes:
  - `EXPO_PUBLIC_API_BASE_URL=<redacted https url>`
  - iOS SKUs validated: `<yes/no>`
  - Android SKUs validated: `<yes/no>`

### Deploy + rollback drill

- Deployment smoke checks:
  - `/health`: `<status>`
  - `/ready`: `<status>`
  - `/metrics` auth enforced: `<yes/no>`
- Rollback drill executed: `<yes/no>`
- Rollback target validated: `<release id>`

### Branch protection and governance

- `./scripts/verify-branch-protection.sh main`: `<pass/fail>`
- Required checks present (`quality`, `mobile-quality`, `final-gate`): `<yes/no>`
- Compliance docs reviewed by legal:
  - privacy policy: `<yes/no>`
  - subscription terms: `<yes/no>`
  - account/data deletion policy: `<yes/no>`

### Billing lifecycle checks

- Purchase sync (`/api/billing/entitlements/sync`) tested on iOS sandbox: `<pass/fail>`
- Purchase sync tested on Android sandbox: `<pass/fail>`
- Webhook reconciliation idempotency tested: `<pass/fail>`
- Entitlement expiration/cancel transitions tested: `<pass/fail>`

## Risks and decisions

- Known risks accepted:
  - `<risk>`
- Outstanding blockers:
  - `<blocker>`

## Final decision

- P0 checklist status: `<complete / blockers>`
- Rollback plan validated: `<yes/no>`
- Final go/no-go decision: `<go / no-go>`
- Decision timestamp (UTC): `<timestamp>`
