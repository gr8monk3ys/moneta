# PR Acceptance Checklist

Use this checklist during review before merge to `main`.

## Global Checks (All PRs)

- [ ] Scope matches exactly one workstream.
- [ ] No unrelated refactors mixed into the PR.
- [ ] Tests were added/updated for changed behavior.
- [ ] `npm run lint` passes (backend).
- [ ] `npm test` passes (backend).
- [ ] `npm run build` passes (backend).
- [ ] `mobile` lint/tests pass when mobile code changed.
- [ ] `npm audit --audit-level=high` passes in touched project(s).
- [ ] Migration notes included if schema or data model changed.
- [ ] Rollback plan is documented in PR description.

## Auth/Security PR

- [ ] Secret validation rejects weak/default placeholders.
- [ ] Refresh-token rotation is atomic and race-safe.
- [ ] Concurrent refresh test demonstrates single-use refresh behavior.
- [ ] Auth and logout flows remain backward compatible for clients.

## Mobile Platform PR

- [ ] Expo/react-native dependency updates documented with upgrade notes.
- [ ] Startup, login, learn, progress, and profile flows smoke-tested.
- [ ] Security audit clears high/critical vulnerabilities.
- [ ] No regressions in Jest suite and coverage report generation.

## Billing PR

- [ ] Purchase flow works on iOS and Android test environments.
- [ ] Restore purchases flow works and updates entitlement state.
- [ ] Entitlements are validated server-side where required.
- [ ] Premium features are correctly gated for free vs paid users.
- [ ] Cancellation/expired entitlement behavior is defined and tested.

## Learning Engine PR

- [ ] Review schedule persisted in repository/database.
- [ ] Due review queue uses persisted due timestamps.
- [ ] Streak logic accounts for user timezone day boundaries.
- [ ] Tests cover same-day, next-day, missed-day, and timezone edge cases.

## Content/Product PR

- [ ] Placeholder/static lesson content replaced with production-intent content.
- [ ] API responses drive app content where expected.
- [ ] Content coverage maps to MVP curriculum targets.
- [ ] Error/fallback states are defined for missing content.

## DevOps/Release PR

- [ ] Deploy process is deterministic and versioned.
- [ ] Rollback target is explicit and tested.
- [ ] Health/readiness checks enforced post-deploy.
- [ ] Operations docs/runbooks updated.

## QA/Verification PR

- [ ] End-to-end scenarios cover auth, learning, and subscription flows.
- [ ] Final verification gate script executed successfully.
- [ ] Staging validation report includes pass/fail evidence and known risks.
- [ ] Go/no-go decision recorded with owners and timestamp.
