#!/usr/bin/env bash
set -euo pipefail

ENABLE_IOS_SUBSCRIPTIONS="${ENABLE_IOS_SUBSCRIPTIONS:-true}"
ENABLE_ANDROID_SUBSCRIPTIONS="${ENABLE_ANDROID_SUBSCRIPTIONS:-true}"
REQUIRE_MOBILE_BILLING_VARS="${REQUIRE_MOBILE_BILLING_VARS:-true}"

is_true() {
  local value="${1:-}"
  local normalized
  normalized="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"
  [[ "$normalized" == "true" ]]
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

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "${name} is required." >&2
    exit 1
  fi
}

validate_sku_csv() {
  local name="$1"
  local value="$2"

  if [[ -z "$value" ]]; then
    echo "${name} must be a comma-separated list of store product IDs." >&2
    exit 1
  fi

  local normalized="${value// /}"
  IFS=',' read -r -a sku_array <<< "$normalized"

  if [[ "${#sku_array[@]}" -eq 0 ]]; then
    echo "${name} must include at least one SKU." >&2
    exit 1
  fi

  local seen=","
  for sku in "${sku_array[@]}"; do
    if [[ -z "$sku" ]]; then
      echo "${name} contains an empty SKU value." >&2
      exit 1
    fi

    if [[ ! "$sku" =~ ^[A-Za-z0-9._-]+$ ]]; then
      echo "${name} contains invalid SKU '${sku}'." >&2
      exit 1
    fi

    if [[ "$seen" == *",$sku,"* ]]; then
      echo "${name} contains duplicate SKU '${sku}'." >&2
      exit 1
    fi

    seen+="${sku},"
  done
}

echo "Running billing release readiness checks..."

if [[ "${NODE_ENV:-}" != "production" ]]; then
  echo "NODE_ENV must be set to production for billing release checks." >&2
  exit 1
fi

require_var BILLING_WEBHOOK_SECRET
if is_weak_secret "${BILLING_WEBHOOK_SECRET}" 24; then
  echo "BILLING_WEBHOOK_SECRET must be at least 24 characters and not placeholder/default." >&2
  exit 1
fi

if [[ "${BILLING_ALLOW_SANDBOX_PURCHASES:-false}" == "true" ]]; then
  echo "BILLING_ALLOW_SANDBOX_PURCHASES must be false for production releases." >&2
  exit 1
fi

if [[ -z "${EXPO_PUBLIC_API_BASE_URL:-}" || "${EXPO_PUBLIC_API_BASE_URL}" != https://* ]]; then
  echo "EXPO_PUBLIC_API_BASE_URL must be set to an https:// URL." >&2
  exit 1
fi

if ! is_true "$ENABLE_IOS_SUBSCRIPTIONS" && ! is_true "$ENABLE_ANDROID_SUBSCRIPTIONS"; then
  echo "At least one subscription platform must be enabled." >&2
  exit 1
fi

if is_true "$ENABLE_IOS_SUBSCRIPTIONS"; then
  require_var APPLE_SHARED_SECRET
  if is_weak_secret "${APPLE_SHARED_SECRET}" 16; then
    echo "APPLE_SHARED_SECRET must be at least 16 characters and not placeholder/default." >&2
    exit 1
  fi

  if is_true "$REQUIRE_MOBILE_BILLING_VARS"; then
    require_var EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS
    validate_sku_csv EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS "${EXPO_PUBLIC_IOS_SUBSCRIPTION_PRODUCT_IDS}"
  fi
fi

if is_true "$ENABLE_ANDROID_SUBSCRIPTIONS"; then
  require_var GOOGLE_PLAY_PACKAGE_NAME
  require_var GOOGLE_PLAY_SERVICE_ACCOUNT_JSON

  if [[ "${GOOGLE_PLAY_SERVICE_ACCOUNT_JSON}" != *"client_email"* || "${GOOGLE_PLAY_SERVICE_ACCOUNT_JSON}" != *"private_key"* ]]; then
    echo "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON must include client_email and private_key." >&2
    exit 1
  fi

  if is_true "$REQUIRE_MOBILE_BILLING_VARS"; then
    require_var EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS
    validate_sku_csv EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS "${EXPO_PUBLIC_ANDROID_SUBSCRIPTION_PRODUCT_IDS}"
  fi
fi

echo "Billing release readiness checks passed."
