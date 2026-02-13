# Moneta Store Billing QA Matrix (Template)

Use this matrix for TestFlight and Play Internal Testing evidence.

## Build metadata

- Test window (UTC): `<start/end>`
- Backend commit: `<sha>`
- iOS build ID: `<id>`
- Android build ID: `<id>`
- API base URL: `<https url>`

## iOS (TestFlight)

| Scenario | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Purchase monthly subscription | `<pass/fail>` | `<screenshot/log>` | |
| Restore purchases | `<pass/fail>` | `<screenshot/log>` | |
| Auto-renew behavior observed | `<pass/fail>` | `<screenshot/log>` | |
| Cancel subscription and entitlement expiry | `<pass/fail>` | `<screenshot/log>` | |
| Refund/revocation handling (if available) | `<pass/fail>` | `<screenshot/log>` | |
| Account export still available with active subscription | `<pass/fail>` | `<screenshot/log>` | |
| Account deletion flow works and policy text is clear | `<pass/fail>` | `<screenshot/log>` | |

## Android (Play Internal Testing)

| Scenario | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Purchase monthly subscription | `<pass/fail>` | `<screenshot/log>` | |
| Restore purchases | `<pass/fail>` | `<screenshot/log>` | |
| Auto-renew behavior observed | `<pass/fail>` | `<screenshot/log>` | |
| Cancel subscription and entitlement expiry | `<pass/fail>` | `<screenshot/log>` | |
| Refund/revocation handling (if available) | `<pass/fail>` | `<screenshot/log>` | |
| Account export still available with active subscription | `<pass/fail>` | `<screenshot/log>` | |
| Account deletion flow works and policy text is clear | `<pass/fail>` | `<screenshot/log>` | |

## Server reconciliation checks

| Check | Status | Evidence | Notes |
| --- | --- | --- | --- |
| `/api/billing/entitlements/sync` updates entitlement correctly | `<pass/fail>` | `<request/response log>` | |
| Webhook reconciliation processed idempotently | `<pass/fail>` | `<request/response log>` | |
| Entitlement transitions reflected in gated lesson access | `<pass/fail>` | `<screenshot/log>` | |

## Sign-off

- QA owner: `<name>`
- Product sign-off: `<name>`
- Engineering sign-off: `<name>`
- Final result: `<pass/fail>`
