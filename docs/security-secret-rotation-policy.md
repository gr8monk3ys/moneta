# Moneta Secret Rotation Policy

This policy governs production secret handling for Moneta.

## Owners

- Primary owner: Platform/Infrastructure lead
- Secondary owner: Security owner on-call
- Approver: Engineering manager or delegate

## In-scope secrets

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `METRICS_TOKEN`
- `BILLING_WEBHOOK_SECRET`
- `APPLE_SHARED_SECRET`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
- Any database and deploy credentials (`DATABASE_URL`, SSH keys, API tokens)

## Rotation cadence

- JWT and API/billing secrets: every 90 days
- Deploy/infrastructure credentials: every 90 days
- Database credentials: every 180 days or per platform policy
- Immediate rotation on incident, credential leak suspicion, or staff offboarding

## Baseline controls

- Secrets must live only in approved secret manager / CI environment secrets.
- Secrets must never be committed to source control.
- Secrets must meet minimum length and non-placeholder checks enforced by:
  - `scripts/production-readiness-check.sh`
  - `scripts/billing-release-readiness-check.sh`
- Production deployments must fail closed if required secrets are missing or weak.

## Rotation procedure

1. Generate new secret values with cryptographically secure randomness.
2. Store new values in secret manager under versioned key names.
3. Update deployment environment to reference new versions.
4. Deploy to production during approved window.
5. Validate:
   - auth login/refresh/logout flows
   - billing sync/webhook verification
   - metrics endpoint access token behavior
6. Revoke old secret values immediately after successful validation.
7. Record evidence in the release record (timestamp, owner, impacted systems).

## Incident-triggered emergency rotation

Trigger emergency rotation when:

- secret appears in logs, ticket, commit, chat, or third-party paste
- credential theft is suspected
- CI or deployment secrets exposure is reported

Emergency process:

1. Page on-call security + platform.
2. Rotate affected secrets immediately.
3. Invalidate all active refresh tokens if auth secrets are affected.
4. Reconcile billing webhook/auth secrets and revalidate entitlement sync.
5. Publish incident summary and recovery timeline.

## Evidence requirements

Each rotation must include:

- Secret class rotated
- Rotation timestamp (UTC)
- Operator + approver
- Validation outcome
- Revocation confirmation for prior value

Store evidence in `docs/release-evidence-template.md` records and incident notes.
