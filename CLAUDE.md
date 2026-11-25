# moneta

## How we work

`.claude/settings.json` loads four plugins from the `lorenzos-claude-code`
marketplace (gr8monk3ys/skills), in every clone and every cloud session. Use
them every time, not only when one happens to trigger:

- **Matt Pocock's skills** (`mattpocock-skills`) for the engineering process:
  `grilling` before building something new, `tdd` for any behaviour change,
  `diagnosing-bugs` for bugs, `code-review` before calling work done and `pr`
  for the PR body. Prefer them over overlapping skills from other plugins.
- **Impeccable** for any UI, layout, styling or on-screen copy: run
  `/impeccable critique` or `/impeccable audit` on it before you're done.
- **Ponytail** is always on: the simplest code that works, no unrequested
  abstractions or dependencies. Run `ponytail-review` on the diff before
  opening a PR and cut what the task didn't need.
- **Tests:** `./scripts/verify` is the fast gate (docs readiness, lint,
  depcruise, unit tests with coverage, `tsc`, then mobile lint, types and
  jest; no Postgres, e2e, Playwright or audit). A hook runs it before a
  session can finish and won't let it end while it fails. Still run
  `npm run verify` before a PR, as "Checks" says. Never skip, weaken or
  delete a test to get it green.

## Checks

Run `npm run verify` (the final verification gate, `scripts/final-verification-gate.sh`) before opening a PR; it needs a Postgres `DATABASE_URL` unless `REQUIRE_INTEGRATION_TESTS=false`. CI runs the same stages: `npm run verify:backend` (job `quality`), `npm run verify:mobile` (job `mobile-quality`) and `npm run verify` (job `final-gate`). Get the evidence lines with `python3 scripts/verify_summary.py <stage> reports/<stage>.json` for `unit`, `integration`, `e2e` and `mobile`, and paste the `VERIFY stage=...` lines into the PR body under "Evidence". CI writes the same lines to its job summaries.

## Agent skills

### Issue tracker

GitHub Issues on `gr8monk3ys/moneta`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, label string equal to role name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
