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

is_weak_secret() {
  local value="$1"
  local min_length="$2"
  local normalized
  normalized="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"

  if [[ "${#normalized}" -lt "${min_length}" ]]; then
    return 0
  fi

  case "$normalized" in
    ""|dev-secret-change-me|change-me|change-me-too|change-me-in-production|replace-with-strong-token|replace-me|secret|secrets|password|password123|default|test-secret|test-refresh-secret)
      return 0
      ;;
  esac

  if [[ "$normalized" == *"change-me"* || "$normalized" == *"changeme"* || "$normalized" == *"replace-with"* || "$normalized" == *"replace-me"* || "$normalized" == *"placeholder"* || "$normalized" == *"example"* || "$normalized" == *"dev-secret"* ]]; then
    return 0
  fi

  return 1
}

missing=()
for variable in "${required_vars[@]}"; do
  if [[ -z "${!variable:-}" ]]; then
    missing+=("$variable")
  fi
done

if [[ "${#missing[@]}" -gt 0 ]]; then
  echo "Missing required staging environment variables:" >&2
  for variable in "${missing[@]}"; do
    echo "- $variable" >&2
  done
  exit 1
fi

if [[ "$NODE_ENV" == "production" ]]; then
  echo "NODE_ENV must not be production for staging. Use NODE_ENV=staging to allow sandbox billing and avoid production-only verifier requirements." >&2
  exit 1
fi

if is_weak_secret "$JWT_SECRET" 32; then
  echo "JWT_SECRET must be at least 32 characters and not use placeholder/default values." >&2
  exit 1
fi

if is_weak_secret "$JWT_REFRESH_SECRET" 32; then
  echo "JWT_REFRESH_SECRET must be at least 32 characters and not use placeholder/default values." >&2
  exit 1
fi

if [[ "$JWT_SECRET" == "$JWT_REFRESH_SECRET" ]]; then
  echo "JWT secrets must be different values." >&2
  exit 1
fi

if is_weak_secret "$METRICS_TOKEN" 24; then
  echo "METRICS_TOKEN must be at least 24 characters and not use placeholder/default values." >&2
  exit 1
fi

if [[ "$CORS_ORIGINS" == *"*"* ]]; then
  echo "CORS_ORIGINS must be an explicit allowlist (no wildcard)." >&2
  exit 1
fi

echo "Staging readiness environment checks passed."

