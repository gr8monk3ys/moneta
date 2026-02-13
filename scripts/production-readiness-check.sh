#!/usr/bin/env bash
set -euo pipefail

required_vars=(
  NODE_ENV
  DATABASE_URL
  JWT_SECRET
  JWT_REFRESH_SECRET
  METRICS_TOKEN
  CORS_ORIGINS
  BILLING_WEBHOOK_SECRET
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
  echo "CORS_ORIGINS must be an explicit allowlist in production." >&2
  exit 1
fi

has_apple_config=false
has_google_config=false

if [[ -n "${APPLE_SHARED_SECRET:-}" ]]; then
  has_apple_config=true
  if is_weak_secret "$APPLE_SHARED_SECRET" 16; then
    echo "APPLE_SHARED_SECRET must be at least 16 characters and not use placeholder/default values." >&2
    exit 1
  fi
fi

if [[ -n "${GOOGLE_PLAY_SERVICE_ACCOUNT_JSON:-}" || -n "${GOOGLE_PLAY_PACKAGE_NAME:-}" ]]; then
  if [[ -z "${GOOGLE_PLAY_SERVICE_ACCOUNT_JSON:-}" || -z "${GOOGLE_PLAY_PACKAGE_NAME:-}" ]]; then
    echo "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON and GOOGLE_PLAY_PACKAGE_NAME must be provided together." >&2
    exit 1
  fi

  has_google_config=true
  if [[ "$GOOGLE_PLAY_SERVICE_ACCOUNT_JSON" != *"client_email"* || "$GOOGLE_PLAY_SERVICE_ACCOUNT_JSON" != *"private_key"* ]]; then
    echo "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON must include client_email and private_key." >&2
    exit 1
  fi
fi

if [[ "$has_apple_config" != "true" && "$has_google_config" != "true" ]]; then
  echo "At least one billing provider must be configured in production (Apple or Google Play)." >&2
  exit 1
fi

if [[ "${BILLING_ALLOW_SANDBOX_PURCHASES:-false}" == "true" ]]; then
  echo "BILLING_ALLOW_SANDBOX_PURCHASES must be disabled in production." >&2
  exit 1
fi

echo "Production readiness environment checks passed."
