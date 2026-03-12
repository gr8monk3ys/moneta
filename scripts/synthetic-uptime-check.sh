#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${SYNTHETIC_BASE_URL:-${BASE_URL:-http://127.0.0.1:3000}}"
METRICS_TOKEN="${SYNTHETIC_METRICS_TOKEN:-${METRICS_TOKEN:-}}"

check_status() {
  local name="$1"
  local expected="$2"
  local url="$3"
  local auth_header="${4:-}"
  local status

  if [[ -n "$auth_header" ]]; then
    status="$(curl -sS -o /tmp/moneta-synthetic-response.txt -w '%{http_code}' -H "$auth_header" "$url")"
  else
    status="$(curl -sS -o /tmp/moneta-synthetic-response.txt -w '%{http_code}' "$url")"
  fi

  if [[ "$status" != "$expected" ]]; then
    echo "${name} failed: expected ${expected}, got ${status}" >&2
    echo "Response body:" >&2
    cat /tmp/moneta-synthetic-response.txt >&2
    exit 1
  fi

  echo "${name} passed (${status})"
}

echo "Running Moneta synthetic uptime checks against ${BASE_URL}"

check_status "health" "200" "${BASE_URL}/health"
check_status "ready" "200" "${BASE_URL}/ready"

if [[ -z "$METRICS_TOKEN" ]]; then
  echo "Skipping authorized metrics check because SYNTHETIC_METRICS_TOKEN/METRICS_TOKEN is not set"
else
  check_status "metrics-authorized" "200" "${BASE_URL}/metrics" "Authorization: Bearer ${METRICS_TOKEN}"
fi
