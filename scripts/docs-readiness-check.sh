#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

required_files=(
  "README.md"
  "mobile/README.md"
  "docs/README.md"
  "docs/api.md"
  "docs/operations.md"
  "docs/brand/identity.md"
  "docs/content-readiness.md"
  "docs/content-inventory-2026-02-14.md"
  "docs/content-editorial-review-2026-02-14.md"
  "docs/go-live-checklist.md"
  "docs/launch-inputs-handoff-template.md"
  "docs/launch-missing-values-checklist.md"
  ".env.production.example"
  "mobile/.env.production.example"
)

missing_files=()
for relative_path in "${required_files[@]}"; do
  if [[ ! -f "${ROOT_DIR}/${relative_path}" ]]; then
    missing_files+=("${relative_path}")
  fi
done

if [[ "${#missing_files[@]}" -gt 0 ]]; then
  echo "Missing required documentation files:" >&2
  for relative_path in "${missing_files[@]}"; do
    echo "- ${relative_path}" >&2
  done
  exit 1
fi

echo "Checking docs for non-portable local filesystem references..."
non_portable_matches="$(
  cd "${ROOT_DIR}" && rg -n '/Users/|file://|vscode://' README.md mobile/README.md docs || true
)"

if [[ -n "${non_portable_matches}" ]]; then
  echo "${non_portable_matches}" >&2
  echo >&2
  echo "Replace local-only paths with repo-relative paths or portable commands." >&2
  exit 1
fi

echo "Checking markdown links..."
ROOT_DIR="${ROOT_DIR}" node --input-type=module <<'EOF'
import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.env.ROOT_DIR;
if (!rootDir) {
  console.error('ROOT_DIR is required');
  process.exit(1);
}

const entryPaths = [
  path.join(rootDir, 'README.md'),
  path.join(rootDir, 'mobile', 'README.md'),
  path.join(rootDir, 'docs')
];

const markdownFiles = [];

async function walk(targetPath) {
  const stats = await fs.stat(targetPath);
  if (stats.isDirectory()) {
    const entries = await fs.readdir(targetPath, { withFileTypes: true });
    for (const entry of entries) {
      await walk(path.join(targetPath, entry.name));
    }
    return;
  }

  if (targetPath.endsWith('.md')) {
    markdownFiles.push(targetPath);
  }
}

for (const entryPath of entryPaths) {
  await walk(entryPath);
}

markdownFiles.sort();

const errors = [];
const markdownLinkPattern = /(?<!!)\[[^\]]+\]\(([^)]+)\)/g;

for (const absoluteFilePath of markdownFiles) {
  const fileContents = await fs.readFile(absoluteFilePath, 'utf8');
  const relativeFilePath = path.relative(rootDir, absoluteFilePath);

  for (const match of fileContents.matchAll(markdownLinkPattern)) {
    let target = match[1].trim();
    target = target.replace(/^<|>$/g, '');

    const cleanTarget = target.split('#')[0]?.split('?')[0] ?? '';
    if (!cleanTarget) {
      continue;
    }

    if (/^(https?:|mailto:|tel:|#)/.test(cleanTarget)) {
      continue;
    }

    if (cleanTarget.startsWith('/Users/') || cleanTarget.startsWith('file://') || cleanTarget.startsWith('vscode://')) {
      errors.push(`${relativeFilePath}: non-portable link target: ${target}`);
      continue;
    }

    if (cleanTarget.startsWith('/')) {
      errors.push(`${relativeFilePath}: root-relative markdown link target is not allowed: ${target}`);
      continue;
    }

    const resolvedTargetPath = path.resolve(path.dirname(absoluteFilePath), cleanTarget);
    try {
      await fs.access(resolvedTargetPath);
    } catch {
      errors.push(`${relativeFilePath}: missing link target: ${target}`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated ${markdownFiles.length} markdown files.`);
EOF

echo "Documentation readiness checks passed."
