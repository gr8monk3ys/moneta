#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<USAGE
Usage: ./scripts/collect-release-evidence.sh

Environment flags:
  RUN_FINAL_GATE=true|false
  RUN_PRODUCTION_CHECK=true|false
  RUN_BILLING_CHECK=true|false
  RUN_BRANCH_PROTECTION_CHECK=true|false
  REQUIRE_INTEGRATION_TESTS=true|false
  REQUIRE_BILLING_RELEASE_CONFIG=true|false
  PROTECTED_BRANCH=main
  EVIDENCE_TIMESTAMP=<optional label>
  EVIDENCE_DIR=<optional absolute path>
USAGE
  exit 0
fi

TIMESTAMP="${EVIDENCE_TIMESTAMP:-$(date -u +"%Y%m%dT%H%M%SZ")-${RANDOM}}"
OUT_DIR="${EVIDENCE_DIR:-${ROOT_DIR}/artifacts/release-evidence/${TIMESTAMP}}"

RUN_FINAL_GATE="${RUN_FINAL_GATE:-true}"
RUN_PRODUCTION_CHECK="${RUN_PRODUCTION_CHECK:-true}"
RUN_BILLING_CHECK="${RUN_BILLING_CHECK:-true}"
RUN_BRANCH_PROTECTION_CHECK="${RUN_BRANCH_PROTECTION_CHECK:-true}"

REQUIRE_INTEGRATION_TESTS="${REQUIRE_INTEGRATION_TESTS:-true}"
REQUIRE_BILLING_RELEASE_CONFIG="${REQUIRE_BILLING_RELEASE_CONFIG:-true}"
PROTECTED_BRANCH="${PROTECTED_BRANCH:-main}"

if [[ -d "${OUT_DIR}" ]]; then
  if [[ -n "${EVIDENCE_DIR:-}" ]]; then
    echo "EVIDENCE_DIR already exists: ${OUT_DIR}" >&2
    exit 1
  fi
  OUT_DIR="${OUT_DIR}-${RANDOM}"
fi

mkdir -p "${OUT_DIR}"

declare -a STEP_NAMES=()
declare -a STEP_RESULTS=()
declare -a STEP_LOGS=()

run_step() {
  local name="$1"
  shift

  local log_slug
  log_slug="$(printf '%s' "${name}" | tr '[:upper:]' '[:lower:]' | tr ' /' '__')"
  local log_file="${OUT_DIR}/${log_slug}.log"

  STEP_NAMES+=("${name}")
  STEP_LOGS+=("$(basename "${log_file}")")

  echo "== ${name} =="

  local status="pass"
  if "$@" >"${log_file}" 2>&1; then
    echo "PASS: ${name}"
  else
    status="fail"
    echo "FAIL: ${name} (see ${log_file})"
  fi

  STEP_RESULTS+=("${status}")
}

if [[ "${RUN_PRODUCTION_CHECK}" == "true" ]]; then
  run_step "production_readiness_check" "${ROOT_DIR}/scripts/production-readiness-check.sh"
fi

if [[ "${RUN_BILLING_CHECK}" == "true" ]]; then
  run_step "billing_release_readiness_check" "${ROOT_DIR}/scripts/billing-release-readiness-check.sh"
fi

if [[ "${RUN_FINAL_GATE}" == "true" ]]; then
  run_step "final_verification_gate" env \
    REQUIRE_INTEGRATION_TESTS="${REQUIRE_INTEGRATION_TESTS}" \
    REQUIRE_BILLING_RELEASE_CONFIG="${REQUIRE_BILLING_RELEASE_CONFIG}" \
    "${ROOT_DIR}/scripts/final-verification-gate.sh"
fi

if [[ "${RUN_BRANCH_PROTECTION_CHECK}" == "true" ]]; then
  run_step "branch_protection_check" "${ROOT_DIR}/scripts/verify-branch-protection.sh" "${PROTECTED_BRANCH}"
fi

run_step "redacted_env_report" bash -lc "${ROOT_DIR}/scripts/generate-redacted-env-report.sh > '${OUT_DIR}/redacted-env-report.md'"

summary_file="${OUT_DIR}/release-evidence-summary.md"
{
  echo "# Moneta Release Evidence Summary"
  echo
  echo "- Generated at (UTC): \`$(date -u +"%Y-%m-%dT%H:%M:%SZ")\`"
  echo "- Workspace: \`${ROOT_DIR}\`"
  echo "- Branch: \`$(git -C "${ROOT_DIR}" branch --show-current 2>/dev/null || echo unknown)\`"
  echo "- Commit: \`$(git -C "${ROOT_DIR}" rev-parse --short HEAD 2>/dev/null || echo unknown)\`"
  echo "- Evidence directory: \`${OUT_DIR}\`"
  echo
  echo "## Step results"
  echo
  echo "| Step | Result | Log |"
  echo "| --- | --- | --- |"

  failed=0
  for i in "${!STEP_NAMES[@]}"; do
    step_name="${STEP_NAMES[$i]}"
    step_result="${STEP_RESULTS[$i]}"
    step_log="${STEP_LOGS[$i]}"
    echo "| \`${step_name}\` | \`${step_result}\` | \`${step_log}\` |"
    if [[ "${step_result}" == "fail" ]]; then
      failed=1
    fi
  done

  echo
  echo "## Additional artifacts"
  echo
  echo "- \`redacted-env-report.md\`"
} >"${summary_file}"

cat "${summary_file}"

echo
echo "Evidence bundle ready: ${OUT_DIR}"

if grep -q '| `fail` |' "${summary_file}"; then
  exit 1
fi

exit 0
