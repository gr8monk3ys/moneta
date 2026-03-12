# Moneta Documentation

Use this index as the starting point for product, engineering, launch, and content docs in this repo.

## Start here

- Product and scope: `docs/product-requirements-document.md`
- API contract: `docs/api.md`
- Operations and deployment: `docs/operations.md`
- Launch checklist: `docs/go-live-checklist.md`
- External execution runbook: `docs/external-go-live-execution-guide.md`

## Development and verification

- Repo overview and local setup: `README.md`
- Mobile app setup: `mobile/README.md`
- Documentation check: `npm run check:docs`
- Launch-doc placeholder check: `./scripts/launch-doc-readiness-check.sh`
- Full verification gate: `./scripts/final-verification-gate.sh`

## Content and curriculum

- Content readiness summary: `docs/content-readiness.md`
- Curriculum inventory snapshot: `docs/content-inventory-2026-02-14.md`
- Editorial review report: `docs/content-editorial-review-2026-02-14.md`

## Brand and marketing

- Brand identity: `docs/brand/identity.md`
- App Store listing draft: `docs/store-submission/app-store-connect-metadata-template.md`
- Google Play listing draft: `docs/store-submission/google-play-listing-template.md`
- Store asset checklist: `docs/store-submission/store-assets-checklist.md`

## Launch inputs and compliance

- Launch inputs handoff: `docs/launch-inputs-handoff-template.md`
- Launch missing values checklist: `docs/launch-missing-values-checklist.md`
- Privacy policy draft: `docs/compliance/privacy-policy.md`
- Terms of service draft: `docs/compliance/terms-of-service.md`
- Subscription terms draft: `docs/compliance/subscription-terms.md`
- Financial education disclaimer draft: `docs/compliance/financial-education-disclaimer.md`
- Account and data deletion policy draft: `docs/compliance/account-data-deletion-policy.md`

## Notes

- `npm run check:docs` validates repo-local links and prevents local filesystem path leaks such as home-directory absolute paths.
- `./scripts/launch-doc-readiness-check.sh` is intentionally stricter and will keep failing until legal, ops, and release owners supply real public launch values.
