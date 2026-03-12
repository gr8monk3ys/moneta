# Moneta Launch Missing Values Checklist

Use this checklist to fill the remaining non-repo values that block a true production launch.

After completing these fields, run:

```bash
cd "$(git rev-parse --show-toplevel)"
./scripts/launch-doc-readiness-check.sh
```

The check should pass with no unresolved placeholders.

If you need a copy-pasteable document for ops/legal/release management, use:

- `docs/launch-inputs-handoff-template.md`

Tracked env templates are also available:

- `.env.production.example`
- `mobile/.env.production.example`

## Legal and policy values

- [ ] Policy effective date
  - Used in:
    - `docs/compliance/privacy-policy.md`
    - `docs/compliance/terms-of-service.md`
    - `docs/compliance/subscription-terms.md`
    - `docs/compliance/financial-education-disclaimer.md`
    - `docs/compliance/account-data-deletion-policy.md`

- [ ] Support contact email
  - Used in:
    - `docs/compliance/terms-of-service.md`
    - `docs/compliance/subscription-terms.md`
    - `docs/compliance/financial-education-disclaimer.md`
    - `docs/compliance/account-data-deletion-policy.md`

- [ ] Privacy contact email
  - Used in:
    - `docs/compliance/privacy-policy.md`

- [ ] Legal entity name and mailing address
  - Used in:
    - `docs/compliance/privacy-policy.md`
    - `docs/compliance/terms-of-service.md`

## Public URLs

- [ ] Support URL
  - Used in:
    - `docs/store-submission/app-store-connect-metadata-template.md`

- [ ] Marketing URL
  - Used in:
    - `docs/store-submission/app-store-connect-metadata-template.md`

- [ ] Published Privacy Policy URL
  - Used in:
    - `docs/store-submission/app-store-connect-metadata-template.md`
    - mobile release env vars

- [ ] Published Terms of Service URL
  - Used in:
    - `docs/store-submission/app-store-connect-metadata-template.md`
    - mobile release env vars

- [ ] Published Subscription Terms URL
  - Used in:
    - mobile release env vars

- [ ] Published Financial Education Disclaimer URL
  - Used in:
    - mobile release env vars

- [ ] Published Account Deletion Policy URL
  - Used in:
    - mobile release env vars

## Store submission values

- [ ] App Store SKU
  - Used in:
    - `docs/store-submission/app-store-connect-metadata-template.md`

- [ ] Review backend base URL
  - Used in:
    - `docs/store-submission/app-store-connect-metadata-template.md`

- [ ] App review test account email
  - Used in:
    - `docs/store-submission/app-store-connect-metadata-template.md`

- [ ] App review test account password
  - Used in:
    - `docs/store-submission/app-store-connect-metadata-template.md`

## Release environment values

- [ ] Production `DATABASE_URL`
- [ ] Production API base URL for mobile: `EXPO_PUBLIC_API_BASE_URL`
- [ ] Final iOS subscription product IDs: `EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS`
- [ ] Final Android subscription product IDs: `EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS`
- [ ] Production legal URL env vars used by mobile build:
  - `EXPO_PUBLIC_PRIVACY_POLICY_URL`
  - `EXPO_PUBLIC_TERMS_OF_SERVICE_URL`
  - `EXPO_PUBLIC_SUBSCRIPTION_TERMS_URL`
  - `EXPO_PUBLIC_FINANCIAL_DISCLAIMER_URL`
  - `EXPO_PUBLIC_ACCOUNT_DELETION_POLICY_URL`

## Release evidence still required

- [ ] Legal approval of policy language
- [ ] Production-like integration test run with real `DATABASE_URL`
- [ ] Billing release readiness run with production env vars
- [ ] Real App Store / Play billing lifecycle QA evidence
- [ ] Final store screenshots from a release-style build
- [ ] Finance SME review for tax / insurance / retirement content
