#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REQUIRE_INTEGRATION_TESTS="${REQUIRE_INTEGRATION_TESTS:-true}"
REQUIRE_BILLING_RELEASE_CONFIG="${REQUIRE_BILLING_RELEASE_CONFIG:-false}"
REQUIRE_LAUNCH_DOCS_READY="${REQUIRE_LAUNCH_DOCS_READY:-false}"
MOBILE_AUDIT_LEVEL="${MOBILE_AUDIT_LEVEL:-high}"
REQUIRE_HIGH_RELEASE_POLICY="${REQUIRE_HIGH_RELEASE_POLICY:-true}"

run_step() {
  local label="$1"
  shift
  echo
  echo "== ${label} =="
  "$@"
}

echo "Running Moneta final verification gate from: ${ROOT_DIR}"
echo "REQUIRE_INTEGRATION_TESTS=${REQUIRE_INTEGRATION_TESTS}"
echo "REQUIRE_BILLING_RELEASE_CONFIG=${REQUIRE_BILLING_RELEASE_CONFIG}"
echo "REQUIRE_LAUNCH_DOCS_READY=${REQUIRE_LAUNCH_DOCS_READY}"
echo "MOBILE_AUDIT_LEVEL=${MOBILE_AUDIT_LEVEL}"
echo "REQUIRE_HIGH_RELEASE_POLICY=${REQUIRE_HIGH_RELEASE_POLICY}"
echo "REQUIRE_LAUNCH_DOCS_READY=${REQUIRE_LAUNCH_DOCS_READY}"

cd "${ROOT_DIR}"

if [[ "${REQUIRE_HIGH_RELEASE_POLICY}" == "true" && "${MOBILE_AUDIT_LEVEL}" != "high" ]]; then
  echo "MOBILE_AUDIT_LEVEL must be set to high when REQUIRE_HIGH_RELEASE_POLICY=true" >&2
  exit 1
fi

run_step "Documentation readiness" npm run check:docs
if [[ -z "${DATABASE_URL:-}" && "${REQUIRE_INTEGRATION_TESTS}" == "true" ]]; then
  echo "DATABASE_URL is required when REQUIRE_INTEGRATION_TESTS=true" >&2
  exit 1
fi
# Lint, unit (coverage gate), integration (skips itself without DATABASE_URL),
# build, e2e smoke, audit: the same stage the CI `quality` job runs.
run_step "Backend (npm run verify:backend)" npm run verify:backend

if [[ "${REQUIRE_BILLING_RELEASE_CONFIG}" == "true" ]]; then
  run_step "Billing release readiness config" ./scripts/billing-release-readiness-check.sh
else
  echo
  echo "== Billing release readiness config =="
  echo "Skipping: set REQUIRE_BILLING_RELEASE_CONFIG=true to enforce production billing env checks."
fi

if [[ "${REQUIRE_LAUNCH_DOCS_READY}" == "true" ]]; then
  run_step "Launch docs readiness" ./scripts/launch-doc-readiness-check.sh
else
  echo
  echo "== Launch docs readiness =="
  echo "Skipping: set REQUIRE_LAUNCH_DOCS_READY=true to enforce launch-document placeholder checks."
fi

if [[ "${MOBILE_AUDIT_LEVEL}" == "off" ]]; then
  pushd "${ROOT_DIR}/mobile" >/dev/null
  run_step "Mobile lint" npm run lint
  run_step "Mobile typecheck" npm run typecheck
  run_step "Mobile tests with coverage gate" npm run test:ci
  echo
  echo "== Mobile security audit =="
  echo "Skipping: MOBILE_AUDIT_LEVEL=off"
  popd >/dev/null
else
  # The same stage the CI `mobile-quality` job runs, including the
  # allowlist-aware audit gate (a bare `npm audit` fails on advisories with no
  # fixed release anywhere, e.g. image-size via metro).
  run_step "Mobile (npm run verify:mobile)" npm run verify:mobile
fi

echo
echo "All final verification gates passed."
