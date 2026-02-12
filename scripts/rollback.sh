#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_KNOWN_HOSTS:?DEPLOY_KNOWN_HOSTS is required}"

known_hosts_file="$(mktemp)"
trap 'rm -f "$known_hosts_file"' EXIT
printf '%s\n' "$DEPLOY_KNOWN_HOSTS" > "$known_hosts_file"
ssh_args=(
  -o UserKnownHostsFile="$known_hosts_file"
  -o StrictHostKeyChecking=yes
)

echo "Rolling back moneta service on ${DEPLOY_USER}@${DEPLOY_HOST}"
ssh "${ssh_args[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "sudo systemctl restart moneta-previous"
