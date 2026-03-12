# App Store “App Privacy” Worksheet

Use this worksheet to prepare App Store Connect “App Privacy” disclosures.

This worksheet reflects the current codebase and must be reviewed by legal counsel before store submission.

## Data inventory (based on current codebase)

Moneta currently supports:

- Account registration/login with email + password
- Learning progress tracking (level, streak, skill mastery, completed lessons)
- Subscription entitlement state (plan, source, timestamps)
- Operational telemetry (request metadata, error logs, diagnostics)

## Recommended App Store disclosure mapping

These are the likely Apple disclosure categories for the current implementation.

### Data linked to the user

- Contact info:
  - Email
  - Purpose: app functionality, account management, security
- Identifiers:
  - User ID
  - Session ID
  - Purpose: app functionality, account security, fraud prevention
- Purchases:
  - Subscription status
  - Product ID / entitlement metadata
  - Purchase tokens or receipts may be transmitted to Moneta for verification, depending on store flow
  - Purpose: app functionality, subscription access
- Usage data:
  - Lesson completion
  - Review activity
  - Current level / mastery state
  - Streak and progress history
  - Purpose: app functionality, personalization, product improvement if analytics are enabled
- Diagnostics:
  - Error logs
  - Request metadata
  - App diagnostics
  - Purpose: app functionality, security, debugging

### Data likely not collected in the current repo

- Payment card or bank account details
- Precise location
- Contacts
- Photos or videos
- Health data
- Advertising identifiers in the mobile app

Update this list if future SDKs or integrations change the shipped build.

## Data linked to you vs. not linked

Likely linked to the user account:

- Email, user ID, session ID
- Learning progress and activity
- Entitlement records

Potentially not linked, if aggregated operational metrics are the only stored output:

- Aggregated metrics counters (availability/error rates)

If any third-party analytics or crash-reporting SDK is added, re-check whether Apple expects those diagnostics to be marked as linked to the user.

## Tracking

Confirm whether Moneta tracks users across apps and websites owned by other companies.

Recommended current answer:

- No cross-app tracking
- No ads SDK integration in current repo

## Purposes of collection

- App functionality (login, progress, subscription gating)
- Security (fraud/abuse detection, auth/session integrity)
- Analytics/diagnostics (performance and crash/error investigation)

## User-facing privacy claims that should remain true at launch

- No sale of personal data
- In-app access to legal/policy links
- In-app account export
- In-app account deletion with explicit confirmation

## Action items before store submission

- Decide what telemetry/analytics will exist in production and document it.
- Ensure privacy policy URL and in-app access paths are implemented.
- Ensure account deletion/export workflows are functional and documented.
- Confirm whether any hosted monitoring vendor changes the final disclosure categories.
