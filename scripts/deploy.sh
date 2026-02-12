#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${DEPLOY_KNOWN_HOSTS:?DEPLOY_KNOWN_HOSTS is required}"

known_hosts_file="$(mktemp)"
trap 'rm -f "$known_hosts_file"' EXIT
printf '%s\n' "$DEPLOY_KNOWN_HOSTS" > "$known_hosts_file"
ssh_args=(
  -o UserKnownHostsFile="$known_hosts_file"
  -o StrictHostKeyChecking=yes
)

echo "Deploying moneta to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"
ssh "${ssh_args[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p ${DEPLOY_PATH}"
rsync -az --delete --exclude node_modules --exclude dist \
  -e "ssh ${ssh_args[*]}" \
  . "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"
ssh "${ssh_args[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "cd ${DEPLOY_PATH} && npm ci && npm run build && sudo systemctl restart moneta"
