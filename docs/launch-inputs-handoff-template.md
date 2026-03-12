# Moneta Launch Inputs Handoff Template

Use this document to collect the real-world values that still need to be supplied by legal, operations, or release management before Moneta can be called production-ready.

After this template is filled:

1. Copy the values into the referenced docs / env vars.
2. Fill the tracked env templates:
   - `.env.production.example`
   - `mobile/.env.production.example`
3. Run `./scripts/launch-doc-readiness-check.sh`.
4. Run the production-like release gate with real env values.

Related docs:

- `docs/launch-missing-values-checklist.md`
- `docs/go-live-checklist.md`
- `docs/external-go-live-execution-guide.md`

## Release metadata

- Release target:
  - `<fill here>`
- Release owner:
  - `<fill here>`
- Engineering owner:
  - `<fill here>`
- Legal owner:
  - `<fill here>`
- Ops / infra owner:
  - `<fill here>`
- Planned launch date:
  - `<fill here>`

## Legal and policy values

### Identity

- Legal entity name:
  - `<fill here>`
- Legal mailing address:
  - `<fill here>`
- Support email:
  - `<fill here>`
- Privacy email:
  - `<fill here>`
- Policy effective date:
  - `<fill here>`

### Values to update after legal review

- `docs/compliance/privacy-policy.md`
- `docs/compliance/terms-of-service.md`
- `docs/compliance/subscription-terms.md`
- `docs/compliance/financial-education-disclaimer.md`
- `docs/compliance/account-data-deletion-policy.md`

### Legal approval

- Legal reviewer:
  - `<fill here>`
- Legal review completed on:
  - `<fill here>`
- Notes / required edits:
  - `<fill here>`

## Public URLs

- Support URL:
  - `<fill here>`
- Marketing URL:
  - `<fill here>`
- Privacy Policy URL:
  - `<fill here>`
- Terms of Service URL:
  - `<fill here>`
- Subscription Terms URL:
  - `<fill here>`
- Financial Education Disclaimer URL:
  - `<fill here>`
- Account Deletion Policy URL:
  - `<fill here>`

### Values used by

- `docs/store-submission/app-store-connect-metadata-template.md`
- `mobile/app.config.js`
- `mobile/src/lib/legal.ts`

## Store submission values

### App Store

- Bundle ID:
  - `com.moneta.app`
- SKU:
  - `<fill here>`
- Review backend base URL:
  - `<fill here>`
- Review test account email:
  - `<fill here>`
- Review test account password:
  - `<fill here>`

### Google Play

- Application ID / package:
  - `com.moneta.app`
- Play listing owner:
  - `<fill here>`

### Listing and assets

- Final App Store subtitle:
  - `<fill here>`
- Final App Store promo text:
  - `<fill here>`
- Final Google Play short description:
  - `<fill here>`
- Final Google Play full description approved:
  - `<yes/no>`
- Release screenshots exported:
  - `<yes/no>`
- Release screenshots location:
  - `<fill here>`
- Preview video / feature graphic location:
  - `<fill here or n/a>`

### Docs to update

- `docs/store-submission/app-store-connect-metadata-template.md`
- `docs/store-submission/google-play-listing-template.md`
- `docs/store-submission/store-assets-checklist.md`

## Backend production environment

Fill with the final production values or the secret-manager references where the values are stored.

- `NODE_ENV`
  - `production`
- `DATABASE_URL`
  - `<fill here>`
- `JWT_SECRET`
  - `<fill here or secret reference>`
- `JWT_REFRESH_SECRET`
  - `<fill here or secret reference>`
- `METRICS_TOKEN`
  - `<fill here or secret reference>`
- `CORS_ORIGINS`
  - `<fill here>`
- `TRUST_PROXY`
  - `<fill here>`
- `BILLING_WEBHOOK_SECRET`
  - `<fill here or secret reference>`
- `SMTP_HOST`
  - `<fill here>`
- `SMTP_USER`
  - `<fill here>`
- `SMTP_PASS`
  - `<fill here or secret reference>`
- `SMTP_FROM`
  - `<fill here>`

### Validation commands

- `NODE_ENV=production ./scripts/production-readiness-check.sh`
- `REQUIRE_INTEGRATION_TESTS=true REQUIRE_BILLING_RELEASE_CONFIG=true REQUIRE_LAUNCH_DOCS_READY=true ./scripts/final-verification-gate.sh`

### Env templates to populate

- `.env.production.example`
- `mobile/.env.production.example`

## Billing provider inputs

### iOS subscriptions

- iOS subscriptions enabled:
  - `<yes/no>`
- `APPLE_SHARED_SECRET`
  - `<fill here or secret reference>`
- `EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS`
  - `<fill here>`

### Android subscriptions

- Android subscriptions enabled:
  - `<yes/no>`
- `GOOGLE_PLAY_PACKAGE_NAME`
  - `<fill here>`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
  - `<fill here or secret reference>`
- `EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS`
  - `<fill here>`

### Billing release validation

- Billing owner:
  - `<fill here>`
- Billing readiness check completed:
  - `<yes/no>`
- Store billing QA evidence location:
  - `<fill here>`

## Mobile release build inputs

- `EXPO_PUBLIC_API_BASE_URL`
  - `<fill here>`
- `EXPO_PUBLIC_PRIVACY_POLICY_URL`
  - `<fill here>`
- `EXPO_PUBLIC_TERMS_OF_SERVICE_URL`
  - `<fill here>`
- `EXPO_PUBLIC_SUBSCRIPTION_TERMS_URL`
  - `<fill here>`
- `EXPO_PUBLIC_FINANCIAL_DISCLAIMER_URL`
  - `<fill here>`
- `EXPO_PUBLIC_ACCOUNT_DELETION_POLICY_URL`
  - `<fill here>`
- `EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS`
  - `<fill here>`
- `EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS`
  - `<fill here>`
- `EXPO_PUBLIC_BILLING_SANDBOX_MODE`
  - `false`

## Human signoffs and evidence

- Production-like integration test run completed:
  - `<yes/no>`
- Production-like database migration check completed:
  - `<yes/no>`
- Backup / restore drill completed:
  - `<yes/no>`
- Real App Store billing lifecycle QA completed:
  - `<yes/no>`
- Real Play billing lifecycle QA completed:
  - `<yes/no>`
- Finance SME review completed:
  - `<yes/no>`
- Observability / alerting signoff completed:
  - `<yes/no>`
- Release evidence bundle path:
  - `<fill here>`

## Final go / no-go block

- P0 checklist complete:
  - `<yes/no>`
- Known accepted risks:
  - `<fill here>`
- Final go / no-go decision:
  - `<fill here>`
- Decision maker:
  - `<fill here>`
- Decision timestamp:
  - `<fill here>`
