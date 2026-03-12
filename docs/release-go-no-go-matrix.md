# Release Go/No-Go Matrix

Use this matrix for every production promotion decision.
A release is **Go** only when all P0 gates are Pass.

## Decision rules

- **Go**: every P0 gate is `Pass` and signed by owner.
- **Conditional Go**: one P0 gate is `At risk` with approved mitigation + rollback plan.
- **No-Go**: any P0 gate is `Fail`.

## P0 release gates

| Gate | Pass criteria | Evidence artifact | Owner | Status |
| --- | --- | --- | --- | --- |
| Backend quality | CI `quality` job passes (lint, coverage tests, DB integration, build, audit). | CI link + logs | Backend owner | ☐ |
| Mobile quality | CI `mobile-quality` job passes (lint, coverage tests, audit). | CI link + logs | Mobile owner | ☐ |
| Backend E2E smoke | CI E2E smoke step passes (`npm run test:e2e`). | CI link + test output | QA owner | ☐ |
| Final verification gate | `./scripts/final-verification-gate.sh` passes in release-like env with `REQUIRE_HIGH_RELEASE_POLICY=true` and `MOBILE_AUDIT_LEVEL=high`. | Gate output artifact | Release manager | ☐ |
| High release policy | Final gate logs confirm high policy enforcement is enabled and not overridden. | Final gate env + logs | Release manager | ☐ |
| Production env readiness | `NODE_ENV=production ./scripts/production-readiness-check.sh` passes in target env. | Redacted env report + command output | SRE owner | ☐ |
| Synthetic uptime | `npm run check:synthetic-uptime` passes against target deployment URL with metrics token. | Synthetic check output | SRE owner | ☐ |
| Security posture | No high/critical unresolved audit findings for release commit. | Audit output + exception list (if any) | Security owner | ☐ |
| Rollback readiness | Rollback command/path tested and documented for release candidate. | Rollback dry-run notes | Release manager | ☐ |

## P1 risk-reduction gates (recommended before full rollout)

| Gate | Pass criteria | Owner | Status |
| --- | --- | --- | --- |
| Mobile coverage stability | Coverage remains above enforced thresholds for 5 consecutive main-branch runs. | Mobile owner | ☐ |
| Billing replay safety | Postgres webhook replay/idempotency integration tests pass in CI. | Backend owner | ☐ |
| Metrics protection checks | Unauthorized `/metrics` access blocked and authorized access succeeds in synthetic checks. | SRE owner | ☐ |

## Sign-off section

- Release ID:
- Commit SHA:
- Environment:
- Decision: `Go` / `Conditional Go` / `No-Go`
- Approved by (name/role/date):
- Risk notes:
- Rollback trigger conditions:
