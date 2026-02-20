#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${LOAD_BASELINE_URL:-${BASE_URL:-http://127.0.0.1:3000}}"
REQUESTS="${LOAD_BASELINE_REQUESTS:-60}"
WARMUP_REQUESTS="${LOAD_BASELINE_WARMUP_REQUESTS:-10}"
P95_LIMIT_MS="${LOAD_BASELINE_P95_LIMIT_MS:-800}"
P99_LIMIT_MS="${LOAD_BASELINE_P99_LIMIT_MS:-1200}"
METRICS_TOKEN="${LOAD_BASELINE_METRICS_TOKEN:-${METRICS_TOKEN:-}}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

run_check() {
  local name="$1"
  local path="$2"
  local auth_header="${3:-}"
  local sample_file="${TMP_DIR}/${name}.samples"
  : >"${sample_file}"

  echo "Warming ${name} (${WARMUP_REQUESTS} requests)"
  for _ in $(seq 1 "${WARMUP_REQUESTS}"); do
    if [[ -n "${auth_header}" ]]; then
      curl -sS -o /dev/null -H "${auth_header}" "${BASE_URL}${path}"
    else
      curl -sS -o /dev/null "${BASE_URL}${path}"
    fi
  done

  echo "Sampling ${name} (${REQUESTS} requests)"
  for _ in $(seq 1 "${REQUESTS}"); do
    local t
    if [[ -n "${auth_header}" ]]; then
      t="$(curl -sS -o /dev/null -w '%{time_total}' -H "${auth_header}" "${BASE_URL}${path}")"
    else
      t="$(curl -sS -o /dev/null -w '%{time_total}' "${BASE_URL}${path}")"
    fi
    awk -v v="${t}" 'BEGIN { printf("%.3f\n", v * 1000) }' >>"${sample_file}"
  done

  local p95_index p99_index p95 p99
  p95_index="$(( (REQUESTS * 95 + 99) / 100 ))"
  p99_index="$(( (REQUESTS * 99 + 99) / 100 ))"

  p95="$(sort -n "${sample_file}" | awk -v idx="${p95_index}" 'NR==idx {print $1}')"
  p99="$(sort -n "${sample_file}" | awk -v idx="${p99_index}" 'NR==idx {print $1}')"

  echo "${name}: p95=${p95}ms p99=${p99}ms"

  awk -v p95="${p95}" -v p99="${p99}" -v p95_limit="${P95_LIMIT_MS}" -v p99_limit="${P99_LIMIT_MS}" '
    BEGIN {
      if (p95 > p95_limit || p99 > p99_limit) {
        exit 1;
      }
    }
  ' || {
    echo "${name} failed latency gate (p95<=${P95_LIMIT_MS}ms, p99<=${P99_LIMIT_MS}ms)" >&2
    exit 1
  }
}

echo "Running load baseline checks against ${BASE_URL}"
echo "Thresholds: p95<=${P95_LIMIT_MS}ms p99<=${P99_LIMIT_MS}ms"

run_check "health" "/health"
run_check "ready" "/ready"

if [[ -n "${METRICS_TOKEN}" ]]; then
  run_check "metrics" "/metrics" "Authorization: Bearer ${METRICS_TOKEN}"
else
  echo "Skipping metrics load baseline (LOAD_BASELINE_METRICS_TOKEN/METRICS_TOKEN not set)"
fi

echo "Load baseline checks passed"
