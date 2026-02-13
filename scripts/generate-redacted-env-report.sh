#!/usr/bin/env bash
set -euo pipefail

now_utc="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

bool_or_unknown() {
  local value="${1:-}"
  if [[ -z "${value}" ]]; then
    printf 'unset'
    return 0
  fi
  local normalized
  normalized="$(printf '%s' "${value}" | tr '[:upper:]' '[:lower:]')"
  if [[ "${normalized}" == "true" || "${normalized}" == "false" ]]; then
    printf '%s' "${normalized}"
    return 0
  fi
  printf 'set(non-bool)'
}

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

print_secret_row() {
  local name="$1"
  local min_length="$2"
  local value="${!name:-}"

  if [[ -z "${value}" ]]; then
    printf '| `%s` | no | n/a | n/a |\n' "${name}"
    return
  fi

  local strength="ok"
  if is_weak_secret "${value}" "${min_length}"; then
    strength="weak_or_placeholder"
  fi

  printf '| `%s` | yes | %s | %s |\n' "${name}" "${#value}" "${strength}"
}

print_var_row() {
  local name="$1"
  local value="${!name:-}"

  if [[ -z "${value}" ]]; then
    printf '| `%s` | no |\n' "${name}"
  else
    printf '| `%s` | yes |\n' "${name}"
  fi
}

cat <<REPORT
# Moneta Redacted Environment Report

- Generated at (UTC): \`${now_utc}\`

## Required runtime variables (presence only)

| Variable | Set |
| --- | --- |
REPORT

print_var_row NODE_ENV
print_var_row DATABASE_URL
print_var_row CORS_ORIGINS
print_var_row TRUST_PROXY
print_var_row RATE_LIMIT_REDIS_URL
print_var_row BILLING_ALLOW_SANDBOX_PURCHASES
print_var_row EXPO_PUBLIC_API_BASE_URL
print_var_row EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS
print_var_row EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS
print_var_row ENABLE_IOS_SUBSCRIPTIONS
print_var_row ENABLE_ANDROID_SUBSCRIPTIONS
print_var_row KEEP_RELEASES

echo
echo '## Secret variables (redacted strength signals)'
echo
echo '| Secret | Set | Length | Strength check |'
echo '| --- | --- | --- | --- |'
print_secret_row JWT_SECRET 32
print_secret_row JWT_REFRESH_SECRET 32
print_secret_row METRICS_TOKEN 24
print_secret_row BILLING_WEBHOOK_SECRET 24
print_secret_row APPLE_SHARED_SECRET 16
print_secret_row GOOGLE_PLAY_SERVICE_ACCOUNT_JSON 32

echo
echo '## Derived flags'
echo
printf '| Flag | Value |\n'
printf '| --- | --- |\n'
printf '| `NODE_ENV` | `%s` |\n' "${NODE_ENV:-unset}"
printf '| `TRUST_PROXY` | `%s` |\n' "$(bool_or_unknown "${TRUST_PROXY:-}")"
printf '| `BILLING_ALLOW_SANDBOX_PURCHASES` | `%s` |\n' "$(bool_or_unknown "${BILLING_ALLOW_SANDBOX_PURCHASES:-}")"

if [[ -n "${CORS_ORIGINS:-}" && "${CORS_ORIGINS}" == *"*"* ]]; then
  printf '| `CORS_ORIGINS_has_wildcard` | `true` |\n'
else
  printf '| `CORS_ORIGINS_has_wildcard` | `false` |\n'
fi

if [[ -n "${JWT_SECRET:-}" && -n "${JWT_REFRESH_SECRET:-}" && "${JWT_SECRET}" == "${JWT_REFRESH_SECRET}" ]]; then
  printf '| `jwt_secrets_equal` | `true` |\n'
else
  printf '| `jwt_secrets_equal` | `false` |\n'
fi

echo
echo 'This report intentionally excludes secret values.'
