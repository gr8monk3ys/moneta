# Google Play “Data Safety” Worksheet

Use this worksheet to prepare Google Play Console “Data safety” disclosures.

This worksheet reflects the current codebase and must be reviewed by legal counsel before store submission.

## Data inventory (based on current codebase)

Moneta currently supports:

- Account registration/login with email + password
- Learning progress tracking (level, streak, skill mastery, completed lessons)
- Subscription entitlement state (plan, source, timestamps)
- Operational telemetry (request metadata, error logs, diagnostics)

## Data collected

Recommended working answers based on the current implementation:

- Personal info:
  - Email address (account login)
  - Required for account functionality
- App activity:
  - Lesson/review activity and progress history
  - Required for learning state, daily reviews, and progress
- Financial info:
  - Subscription entitlement status (plan/source/product id)
  - Purchase tokens/receipts may be transmitted for verification (store policy dependent)
  - Required for paid feature access
- Device or other identifiers:
  - User ID / session ID for auth
  - Required for account security and session management
- Diagnostics:
  - Error logs and request metadata
  - Used for service operation and debugging

## Data not currently evident in the mobile repo

- Precise location
- Contacts
- Photos / videos
- Files and docs
- Messages
- Web browsing history
- Advertising ID use for ad targeting

If production integrations add analytics, crash reporting, or attribution tooling, update this worksheet before submission.

## Data shared

Confirm if any data is shared with third parties (for example, crash reporting, analytics, hosting).

Recommended current answer:

- No explicit third-party analytics SDK is present in the mobile app repo.
- Production hosting, monitoring, and billing-verification vendors still need to be documented before submission.
- Do not answer "No data shared" unless the full production vendor list has been confirmed.

## Security practices (recommended to disclose where applicable)

- Data encrypted in transit (HTTPS)
- Sensitive tokens stored in secure storage on device (Expo SecureStore)
- Account deletion/export available in-app

## User controls

- Account deletion is available in-app from `Profile`
- Account export is available in-app from `Profile`
- Subscription management / restore flows are available in-app

## Recommended risk note

Google Play disclosures should be re-reviewed if you add:

- crash reporting
- product analytics
- attribution SDKs
- customer support chat tooling
- remote-config or experimentation vendors that collect device or behavior data

## Action items before store submission

- Finalize your production vendor list (hosting, monitoring, billing verification).
- Decide whether crash reporting/analytics SDKs will be used and update disclosures accordingly.
- Ensure published Privacy Policy URL matches store listing and in-app links.
