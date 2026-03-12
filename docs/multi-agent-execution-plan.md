# Multi-Agent Execution Plan

This plan is the integration contract for parallel work across production readiness streams.

## Objective

Ship a production-ready finance learning app with:
- secure/auth-hardened backend
- mobile dependency/security hygiene
- real subscription monetization
- reliable adaptive learning behavior
- stronger release/rollback operations

## Workstreams

1. Auth/Security Agent
- Branch: `gr8monk3ys/auth-security-hardening`
- Scope:
  - enforce strong secret requirements in runtime/preflight
  - make refresh token rotation atomic and race-safe
  - add concurrent refresh regression tests
- Exit criteria:
  - no token replay race under concurrent refresh
  - secret checks fail on weak/default placeholders

2. Mobile Platform Agent
- Branch: `gr8monk3ys/mobile-platform-upgrade`
- Scope:
  - upgrade Expo stack to remove high-severity dependency vulnerabilities
  - fix build/runtime/test breakages from upgrades
- Exit criteria:
  - `mobile` lint/tests pass
  - `npm audit --audit-level=high` passes in `mobile`

3. Billing Agent
- Branch: `gr8monk3ys/billing-entitlements`
- Scope:
  - implement iOS/Android purchase flow
  - implement restore purchases
  - implement entitlement gating in app and API
- Exit criteria:
  - premium feature access is blocked/enabled by entitlement state
  - billing flows covered by tests and QA scenarios

4. Learning Engine Agent
- Branch: `gr8monk3ys/learning-engine-persistence`
- Scope:
  - persist review scheduling fields in storage
  - compute due reviews from persisted timestamps
  - make streak logic timezone-aware
- Exit criteria:
  - due review queue reflects persisted schedule
  - streak tests cover timezone boundaries and day transitions

5. Content/Product Agent
- Branch: `gr8monk3ys/content-depth-expansion`
- Scope:
  - expand lesson/item depth beyond placeholder content
  - replace hardcoded demo pathways with API-driven curriculum
- Exit criteria:
  - curriculum breadth aligns with MVP targets in PRD
  - app surfaces real next lesson/review content

6. DevOps/Release Agent
- Branch: `gr8monk3ys/devops-release-hardening`
- Scope:
  - harden deployment and rollback strategy
  - add runbooks, release checks, and operational guardrails
- Exit criteria:
  - rollback procedure validated and documented
  - deploy process supports deterministic release versioning

7. QA/Verification Agent
- Branch: `gr8monk3ys/qa-e2e-readiness`
- Scope:
  - create end-to-end verification coverage for core user and payment flows
  - execute release gate and publish go/no-go report
- Exit criteria:
  - end-to-end scenarios pass in staging
  - release checklist is complete and signed off

## Merge Order

1. `auth-security-hardening`
2. `learning-engine-persistence`
3. `mobile-platform-upgrade`
4. `billing-entitlements`
5. `content-depth-expansion`
6. `devops-release-hardening`
7. `qa-e2e-readiness`

## PR Requirements (All Streams)

- One workstream per PR; avoid mixed concerns.
- Include tests for each behavior change.
- Include rollback note in PR description.
- Include migration safety notes for schema changes.
- Keep CI green before merge.

## Integration Cadence

- Daily integration branch sync from `main`.
- Rebase or merge `main` before requesting final review.
- If conflicts touch auth, migrations, or API contracts, require cross-agent review.

## Final Gate

Run `./scripts/final-verification-gate.sh` from the repo root and attach results to release sign-off.
