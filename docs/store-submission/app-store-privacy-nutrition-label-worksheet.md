# App Store “App Privacy” Worksheet (Draft)

Use this worksheet to prepare App Store Connect “App Privacy” disclosures.

This worksheet must be reviewed by legal counsel before store submission.

## Data inventory (based on current codebase)

Moneta currently supports:

- Account registration/login with email + password
- Learning progress tracking (level, streak, skill mastery, completed lessons)
- Subscription entitlement state (plan, source, timestamps)
- Operational telemetry (request metadata, error logs, diagnostics)

### Data types potentially collected

- Contact info:
  - Email (account login)
- Identifiers:
  - User ID (app identity)
  - Session ID (auth/session management)
- Purchases:
  - Subscription entitlement status (plan/source/product id)
  - Purchase tokens/receipts are handled by Apple/Google and may be transmitted to Moneta for verification
- Usage data:
  - Lesson completion, review answers, streak, skill mastery
- Diagnostics:
  - Error logs and request metadata (non-content)

## “Data linked to you” vs “not linked”

Likely linked to user account:

- Email, user ID, session ID
- Learning progress and activity
- Entitlement records

Likely not linked (aggregated/operational):

- Aggregated metrics counters (availability/error rates)

## Tracking

Confirm whether Moneta tracks users across apps and websites owned by other companies.

Current intent:

- No cross-app tracking
- No ads SDK integration in current repo

## Purpose of collection (typical)

- App functionality (login, progress, subscription gating)
- Security (fraud/abuse detection, auth/session integrity)
- Analytics/diagnostics (performance and crash/error investigation)

## Action items before store submission

- Decide what telemetry/analytics will exist in production and document it.
- Ensure privacy policy URL and in-app access paths are implemented.
- Ensure account deletion/export workflows are functional and documented.

