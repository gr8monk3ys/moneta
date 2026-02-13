#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${DEPLOY_KNOWN_HOSTS:?DEPLOY_KNOWN_HOSTS is required}"

DEPLOY_SERVICE_NAME="${DEPLOY_SERVICE_NAME:-moneta}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
release_stamp="$(date -u +'%Y%m%d%H%M%S')"
release_sha="${GITHUB_SHA:-local}"
RELEASE_ID="${RELEASE_ID:-${release_stamp}-${release_sha:0:12}}"

if [[ ! "$KEEP_RELEASES" =~ ^[0-9]+$ ]] || [[ "$KEEP_RELEASES" -lt 2 ]]; then
  echo "KEEP_RELEASES must be an integer greater than or equal to 2." >&2
  exit 1
fi

if [[ ! "$RELEASE_ID" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "RELEASE_ID must contain only letters, numbers, dot, underscore, and dash." >&2
  exit 1
fi

case "$DEPLOY_PATH" in
  ""|"/"|"/root"|"/home"|"/usr"|"/var"|"/etc")
    echo "DEPLOY_PATH is unsafe: ${DEPLOY_PATH}" >&2
    exit 1
    ;;
esac

release_path="${DEPLOY_PATH}/releases/${RELEASE_ID}"

known_hosts_file="$(mktemp)"
trap 'rm -f "$known_hosts_file"' EXIT
printf '%s\n' "$DEPLOY_KNOWN_HOSTS" > "$known_hosts_file"
ssh_args=(
  -o UserKnownHostsFile="$known_hosts_file"
  -o StrictHostKeyChecking=yes
)

echo "Preparing release ${RELEASE_ID} on ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"
ssh "${ssh_args[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s -- "$DEPLOY_PATH" "$release_path" <<'REMOTE_PREP'
set -euo pipefail

deploy_path="$1"
release_path="$2"

mkdir -p "${deploy_path}/releases" "${deploy_path}/shared"
rm -rf "$release_path"
mkdir -p "$release_path"
REMOTE_PREP

echo "Syncing release artifacts to ${release_path}"
rsync -az --delete \
  --exclude .git \
  --exclude .github \
  --exclude node_modules \
  --exclude dist \
  --exclude coverage \
  --exclude mobile/node_modules \
  --exclude mobile/coverage \
  -e "ssh ${ssh_args[*]}" \
  . "${DEPLOY_USER}@${DEPLOY_HOST}:${release_path}/"

echo "Building and activating release ${RELEASE_ID}"
ssh "${ssh_args[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s -- \
  "$DEPLOY_PATH" "$release_path" "$DEPLOY_SERVICE_NAME" "$KEEP_RELEASES" <<'REMOTE_ACTIVATE'
set -euo pipefail

deploy_path="$1"
release_path="$2"
service_name="$3"
keep_releases="$4"

cd "$release_path"
npm ci
npm run build

if [[ -f "${deploy_path}/shared/.env" ]]; then
  ln -sfn "${deploy_path}/shared/.env" "${release_path}/.env"
fi

previous_target=""
if [[ -L "${deploy_path}/current" ]]; then
  previous_target="$(readlink "${deploy_path}/current")"
  if [[ -n "$previous_target" ]]; then
    ln -sfn "$previous_target" "${deploy_path}/previous"
  fi
fi

ln -sfn "$release_path" "${deploy_path}/current"
sudo systemctl restart "$service_name"
sudo systemctl is-active --quiet "$service_name"

current_target="$(readlink "${deploy_path}/current" || true)"
previous_target="$(readlink "${deploy_path}/previous" || true)"

mapfile -t releases < <(ls -1dt "${deploy_path}/releases"/* 2>/dev/null || true)
if (( ${#releases[@]} > keep_releases )); then
  for old_release in "${releases[@]:keep_releases}"; do
    if [[ "$old_release" == "$current_target" || "$old_release" == "$previous_target" ]]; then
      continue
    fi
    rm -rf "$old_release"
  done
fi

echo "release_id=${release_path##*/}"
REMOTE_ACTIVATE
