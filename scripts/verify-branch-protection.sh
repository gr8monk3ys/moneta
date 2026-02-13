#!/usr/bin/env bash
set -euo pipefail

PROTECTED_BRANCH="${1:-${PROTECTED_BRANCH:-main}}"
REQUIRED_CHECKS_CSV="${REQUIRED_CHECKS:-quality,mobile-quality,final-gate}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required." >&2
  exit 1
fi

if ! gh auth status -h github.com >/dev/null 2>&1; then
  echo "GitHub CLI is not authenticated. Run: gh auth login" >&2
  exit 1
fi

resolve_repo() {
  if [[ -n "${GITHUB_REPOSITORY:-}" ]]; then
    printf '%s' "${GITHUB_REPOSITORY}"
    return 0
  fi

  local remote
  remote="$(git config --get remote.origin.url || true)"
  if [[ -z "${remote}" ]]; then
    return 1
  fi

  remote="${remote%.git}"
  remote="${remote#git@github.com:}"
  remote="${remote#https://github.com/}"

  if [[ "${remote}" == */* ]]; then
    printf '%s' "${remote}"
    return 0
  fi

  return 1
}

REPO_SLUG="$(resolve_repo || true)"
if [[ -z "${REPO_SLUG}" ]]; then
  echo "Could not infer owner/repo slug. Set GITHUB_REPOSITORY (owner/repo)." >&2
  exit 1
fi

TMP_FILE="$(mktemp)"
cleanup() {
  rm -f "${TMP_FILE}"
}
trap cleanup EXIT

gh api \
  -H "Accept: application/vnd.github+json" \
  "/repos/${REPO_SLUG}/branches/${PROTECTED_BRANCH}/protection" > "${TMP_FILE}"

node - "${TMP_FILE}" "${REQUIRED_CHECKS_CSV}" "${REPO_SLUG}" "${PROTECTED_BRANCH}" <<'NODE'
const fs = require('node:fs');

const [, , filePath, requiredChecksCsv, repoSlug, branch] = process.argv;
const protection = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const requiredChecks = requiredChecksCsv
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const errors = [];
const contexts = new Set((protection.required_status_checks?.contexts ?? []).map(String));

for (const context of requiredChecks) {
  if (!contexts.has(context)) {
    errors.push(`Missing required status check: ${context}`);
  }
}

if (!protection.required_status_checks?.strict) {
  errors.push('required_status_checks.strict must be enabled');
}

if (!protection.enforce_admins?.enabled) {
  errors.push('enforce_admins.enabled must be true');
}

const reviews = protection.required_pull_request_reviews;
if (!reviews) {
  errors.push('required_pull_request_reviews is not configured');
} else {
  if ((reviews.required_approving_review_count ?? 0) < 1) {
    errors.push('At least 1 approving review is required');
  }
  if (!reviews.dismiss_stale_reviews) {
    errors.push('dismiss_stale_reviews must be enabled');
  }
}

if (!protection.required_conversation_resolution?.enabled) {
  errors.push('required_conversation_resolution.enabled must be true');
}

if (protection.allow_force_pushes?.enabled) {
  errors.push('allow_force_pushes.enabled must be false');
}

if (protection.allow_deletions?.enabled) {
  errors.push('allow_deletions.enabled must be false');
}

if (!protection.required_linear_history?.enabled) {
  errors.push('required_linear_history.enabled must be true');
}

if (errors.length > 0) {
  console.error(`Branch protection check failed for ${repoSlug}:${branch}`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Branch protection check passed for ${repoSlug}:${branch}`);
console.log(`Required checks present: ${requiredChecks.join(', ')}`);
NODE
