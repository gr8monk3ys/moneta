# moneta

## Checks

Run `npm run verify` (the final verification gate, `scripts/final-verification-gate.sh`) before opening a PR; it needs a Postgres `DATABASE_URL` unless `REQUIRE_INTEGRATION_TESTS=false`. CI runs the same stages: `npm run verify:backend` (job `quality`), `npm run verify:mobile` (job `mobile-quality`) and `npm run verify` (job `final-gate`). Get the evidence lines with `python3 scripts/verify_summary.py <stage> reports/<stage>.json` for `unit`, `integration`, `e2e` and `mobile`, and paste the `VERIFY stage=...` lines into the PR body under "Evidence". CI writes the same lines to its job summaries.

## Agent skills

### Issue tracker

GitHub Issues on `gr8monk3ys/moneta`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, label string equal to role name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
