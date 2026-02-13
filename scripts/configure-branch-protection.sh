#!/usr/bin/env bash
set -euo pipefail

PROTECTED_BRANCH="${1:-${PROTECTED_BRANCH:-main}}"
REQUIRED_CHECKS_CSV="${REQUIRED_CHECKS:-quality,mobile-quality,final-gate}"
REQUIRE_CODE_OWNER_REVIEWS="${REQUIRE_CODE_OWNER_REVIEWS:-false}"
REQUIRED_APPROVALS="${REQUIRED_APPROVALS:-1}"

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

IFS=',' read -r -a REQUIRED_CHECKS <<< "${REQUIRED_CHECKS_CSV}"
if [[ "${#REQUIRED_CHECKS[@]}" -eq 0 ]]; then
  echo "REQUIRED_CHECKS cannot be empty." >&2
  exit 1
fi

for i in "${!REQUIRED_CHECKS[@]}"; do
  REQUIRED_CHECKS[$i]="$(printf '%s' "${REQUIRED_CHECKS[$i]}" | xargs)"
  if [[ -z "${REQUIRED_CHECKS[$i]}" ]]; then
    echo "REQUIRED_CHECKS contains an empty check name." >&2
    exit 1
  fi
done

args=(
  --method PUT
  -H "Accept: application/vnd.github+json"
  "/repos/${REPO_SLUG}/branches/${PROTECTED_BRANCH}/protection"
  -f required_status_checks.strict=true
  -f enforce_admins=true
  -f required_pull_request_reviews.dismiss_stale_reviews=true
  -f required_pull_request_reviews.require_code_owner_reviews="${REQUIRE_CODE_OWNER_REVIEWS}"
  -f required_pull_request_reviews.required_approving_review_count="${REQUIRED_APPROVALS}"
  -f required_pull_request_reviews.require_last_push_approval=true
  -f required_conversation_resolution=true
  -f allow_force_pushes=false
  -f allow_deletions=false
  -f block_creations=false
  -f required_linear_history=true
  -f lock_branch=false
  -f allow_fork_syncing=true
)

for check in "${REQUIRED_CHECKS[@]}"; do
  args+=( -F "required_status_checks.contexts[]=${check}" )
done

echo "Applying branch protection to ${REPO_SLUG}:${PROTECTED_BRANCH}"
gh api "${args[@]}" >/dev/null

echo "Branch protection applied."
echo "Required checks: ${REQUIRED_CHECKS_CSV}"
echo "Next step: run ./scripts/verify-branch-protection.sh ${PROTECTED_BRANCH}"
