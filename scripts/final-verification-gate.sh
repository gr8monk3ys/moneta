#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REQUIRE_INTEGRATION_TESTS="${REQUIRE_INTEGRATION_TESTS:-true}"

run_step() {
  local label="$1"
  shift
  echo
  echo "== ${label} =="
  "$@"
}

echo "Running Moneta final verification gate from: ${ROOT_DIR}"
echo "REQUIRE_INTEGRATION_TESTS=${REQUIRE_INTEGRATION_TESTS}"

cd "${ROOT_DIR}"

run_step "Backend lint" npm run lint
run_step "Backend unit tests" npm test

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
run_step "Backend security audit (high/critical)" npm audit --audit-level=high

pushd "${ROOT_DIR}/mobile" >/dev/null
run_step "Mobile lint" npm run lint
run_step "Mobile tests" npm test -- --runInBand
run_step "Mobile coverage" npm run test:coverage
run_step "Mobile security audit (high/critical)" npm audit --audit-level=high
popd >/dev/null

echo
echo "All final verification gates passed."
