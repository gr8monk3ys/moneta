#!/usr/bin/env bash
set -euo pipefail

required_vars=(
  NODE_ENV
  DATABASE_URL
  JWT_SECRET
  JWT_REFRESH_SECRET
  METRICS_TOKEN
  CORS_ORIGINS
)

missing=()
for variable in "${required_vars[@]}"; do
  if [[ -z "${!variable:-}" ]]; then
    missing+=("$variable")
  fi
done

if [[ "${#missing[@]}" -gt 0 ]]; then
  echo "Missing required production environment variables:" >&2
  for variable in "${missing[@]}"; do
    echo "- $variable" >&2
  done
  exit 1
fi

if [[ "$NODE_ENV" != "production" ]]; then
  echo "NODE_ENV must be set to production." >&2
  exit 1
fi

if [[ "$JWT_SECRET" == "dev-secret-change-me" || "$JWT_REFRESH_SECRET" == "dev-secret-change-me" ]]; then
  echo "JWT secrets must not use development fallback values." >&2
  exit 1
fi

if [[ "$CORS_ORIGINS" == *"*"* ]]; then
  echo "CORS_ORIGINS must be an explicit allowlist in production." >&2
  exit 1
fi

echo "Production readiness environment checks passed."
