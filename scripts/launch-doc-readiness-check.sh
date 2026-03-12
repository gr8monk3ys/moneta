#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

required_files=(
  "docs/compliance/privacy-policy.md"
  "docs/compliance/terms-of-service.md"
  "docs/compliance/subscription-terms.md"
  "docs/compliance/financial-education-disclaimer.md"
  "docs/compliance/account-data-deletion-policy.md"
  "docs/store-submission/app-store-connect-metadata-template.md"
  "docs/store-submission/app-store-privacy-nutrition-label-worksheet.md"
  "docs/store-submission/google-play-data-safety-worksheet.md"
  "docs/store-submission/google-play-listing-template.md"
  "docs/store-submission/store-assets-checklist.md"
)

missing_files=()
for relative_path in "${required_files[@]}"; do
  if [[ ! -f "${ROOT_DIR}/${relative_path}" ]]; then
    missing_files+=("${relative_path}")
  fi
done

if [[ "${#missing_files[@]}" -gt 0 ]]; then
  echo "Missing required launch documentation files:" >&2
  for relative_path in "${missing_files[@]}"; do
    echo "- ${relative_path}" >&2
  done
  exit 1
fi

echo "Checking launch-facing docs for unresolved placeholders..."

matches="$(
  cd "${ROOT_DIR}" && rg -n --no-heading \
    -e 'To be set at publication' \
    -e '<[^>]+>' \
    -e '\bTODO\b' \
    -e '\bTBD\b' \
    docs/compliance docs/store-submission || true
)"

if [[ -n "${matches}" ]]; then
  echo "${matches}" >&2
  echo >&2
  echo "Resolve the launch-document placeholders above before public release." >&2
  exit 1
fi

echo "Launch documentation checks passed."
