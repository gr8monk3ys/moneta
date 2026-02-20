#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REQUIRE_INTEGRATION_TESTS="${REQUIRE_INTEGRATION_TESTS:-true}"
REQUIRE_BILLING_RELEASE_CONFIG="${REQUIRE_BILLING_RELEASE_CONFIG:-false}"
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
echo "MOBILE_AUDIT_LEVEL=${MOBILE_AUDIT_LEVEL}"
echo "REQUIRE_HIGH_RELEASE_POLICY=${REQUIRE_HIGH_RELEASE_POLICY}"

cd "${ROOT_DIR}"

if [[ "${REQUIRE_HIGH_RELEASE_POLICY}" == "true" && "${MOBILE_AUDIT_LEVEL}" != "high" ]]; then
  echo "MOBILE_AUDIT_LEVEL must be set to high when REQUIRE_HIGH_RELEASE_POLICY=true" >&2
  exit 1
fi

run_step "Backend lint" npm run lint
run_step "Backend tests with coverage gate" npm run test:ci

if [[ -n "${DATABASE_URL:-}" ]]; then
  run_step "Backend integration tests" npm run test:integration
else
  if [[ "${REQUIRE_INTEGRATION_TESTS}" == "true" ]]; then
    echo "DATABASE_URL is required when REQUIRE_INTEGRATION_TESTS=true" >&2
    exit 1
  fi
  echo
  echo "== Backend integration tests =="
  echo "Skipping: DATABASE_URL is not set."
  echo "Set DATABASE_URL or REQUIRE_INTEGRATION_TESTS=true to enforce this gate."
fi

run_step "Backend build" npm run build
run_step "Backend end-to-end smoke tests" npm run test:e2e
run_step "Backend security audit (high/critical)" npm audit --audit-level=high

if [[ "${REQUIRE_BILLING_RELEASE_CONFIG}" == "true" ]]; then
  run_step "Billing release readiness config" ./scripts/billing-release-readiness-check.sh
else
  echo
  echo "== Billing release readiness config =="
  echo "Skipping: set REQUIRE_BILLING_RELEASE_CONFIG=true to enforce production billing env checks."
fi

pushd "${ROOT_DIR}/mobile" >/dev/null
run_step "Mobile lint" npm run lint
run_step "Mobile tests with coverage gate" npm run test:ci
if [[ "${MOBILE_AUDIT_LEVEL}" == "off" ]]; then
  echo
  echo "== Mobile security audit =="
  echo "Skipping: MOBILE_AUDIT_LEVEL=off"
else
  run_step "Mobile security audit (${MOBILE_AUDIT_LEVEL})" npm audit --audit-level="${MOBILE_AUDIT_LEVEL}"
fi
popd >/dev/null

echo
echo "All final verification gates passed."
