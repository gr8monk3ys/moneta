#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${DEPLOY_KNOWN_HOSTS:?DEPLOY_KNOWN_HOSTS is required}"

DEPLOY_SERVICE_NAME="${DEPLOY_SERVICE_NAME:-moneta}"

known_hosts_file="$(mktemp)"
trap 'rm -f "$known_hosts_file"' EXIT
printf '%s\n' "$DEPLOY_KNOWN_HOSTS" > "$known_hosts_file"
ssh_args=(
  -o UserKnownHostsFile="$known_hosts_file"
  -o StrictHostKeyChecking=yes
)

echo "Rolling back ${DEPLOY_SERVICE_NAME} on ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"
ssh "${ssh_args[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s -- \
  "$DEPLOY_PATH" "$DEPLOY_SERVICE_NAME" <<'REMOTE_ROLLBACK'
set -euo pipefail

deploy_path="$1"
service_name="$2"

if [[ ! -L "${deploy_path}/current" ]]; then
  echo "Current release symlink is missing at ${deploy_path}/current" >&2
  exit 1
fi

if [[ ! -L "${deploy_path}/previous" ]]; then
  echo "Previous release symlink is missing at ${deploy_path}/previous" >&2
  exit 1
fi

current_target="$(readlink "${deploy_path}/current")"
previous_target="$(readlink "${deploy_path}/previous")"

if [[ ! -d "$previous_target" ]]; then
  echo "Previous release target does not exist: ${previous_target}" >&2
  exit 1
fi

ln -sfn "$previous_target" "${deploy_path}/current"
ln -sfn "$current_target" "${deploy_path}/previous"

sudo systemctl restart "$service_name"
sudo systemctl is-active --quiet "$service_name"

echo "Rolled back to ${previous_target##*/}"
REMOTE_ROLLBACK
