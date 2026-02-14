# Google Play “Data Safety” Worksheet (Draft)

Use this worksheet to prepare Google Play Console “Data safety” disclosures.

This worksheet must be reviewed by legal counsel before store submission.

## Data inventory (based on current codebase)

Moneta currently supports:

- Account registration/login with email + password
- Learning progress tracking (level, streak, skill mastery, completed lessons)
- Subscription entitlement state (plan, source, timestamps)
- Operational telemetry (request metadata, error logs, diagnostics)

## Data collected

Potentially collected by Moneta:

- Personal info:
  - Email address (account login)
- App activity:
  - Lesson/review activity and progress history
- Financial info:
  - Subscription entitlement status (plan/source/product id)
  - Purchase tokens/receipts may be transmitted for verification (store policy dependent)
- Device or other identifiers:
  - User ID / session ID for auth
- Diagnostics:
  - Error logs and request metadata

## Data shared

Confirm if any data is shared with third parties (for example, crash reporting, analytics, hosting).

Current repo includes no explicit third-party analytics SDKs in the mobile app. Hosting/monitoring services used in production must be documented.

## Security practices (recommended to disclose where applicable)

- Data encrypted in transit (HTTPS)
- Sensitive tokens stored in secure storage on device (Expo SecureStore)
- Account deletion/export available in-app

## Action items before store submission

- Finalize your production vendor list (hosting, monitoring, billing verification).
- Decide whether crash reporting/analytics SDKs will be used and update disclosures accordingly.
- Ensure published Privacy Policy URL matches store listing and in-app links.

