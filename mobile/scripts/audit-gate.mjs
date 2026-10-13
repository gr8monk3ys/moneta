// Security-audit gate: fails on any high/critical advisory that is not
// explicitly allowlisted below. Replaces a bare `npm audit --audit-level=high`,
// which can never pass while an advisory has no fixed release anywhere in the
// ecosystem — lowering the level to `critical` would hide real highs instead.
import { spawnSync } from 'node:child_process';

// Each entry must say why it is acceptable and what would let us remove it.
const ALLOWLIST = {
  // image-size DoS via crafted ICNS/JXL/HEIF images. Every published version
  // (<= 2.0.2) is vulnerable; it reaches us only through metro (the React
  // Native bundler), and even metro@latest still depends on it. Build-time
  // only — it parses images already committed to this repo, never
  // attacker-supplied input. Remove when metro ships without image-size or a
  // fixed release exists.
  'GHSA-w3rx-r6r6-pgpr': 'image-size ICNS DoS — no fixed release, build-time only',
  'GHSA-5p2g-fcmc-qvqq': 'image-size JXL/HEIF DoS — no fixed release, build-time only',
  // braces stack-exhaustion DoS on deeply nested brace patterns. Every
  // published version (<= 3.0.3, the latest) is vulnerable and the advisory
  // lists no patched release as of 2026-10-12. It reaches us only through
  // micromatch in the jest/metro dev toolchain, which expands glob patterns
  // written in this repo's own config — never attacker-supplied input, and
  // never shipped in the app bundle. Remove when upstream ships a fixed
  // braces release.
  'GHSA-vfj7-8cjw-p6xm': 'braces nested-pattern DoS — no fixed release, dev toolchain only',
  // node-forge RSA PKCS#1 v1.5 signature verification accepts extra nested
  // DigestAlgorithm elements. Every published version (<= 1.4.0, the latest)
  // is vulnerable and the advisory lists no patched release as of 2026-10-12.
  // It reaches us only through @expo/cli (and its
  // @expo/code-signing-certificates), i.e. the local dev/build CLI — it is
  // not bundled into the app. Remove when upstream ships a fixed node-forge
  // release.
  'GHSA-86w9-cpqp-85rv': 'node-forge RSA signature verification — no fixed release, dev toolchain only',
};

const res = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
if (!res.stdout) {
  console.error('npm audit produced no output', res.stderr);
  process.exit(1);
}

const report = JSON.parse(res.stdout);
const failures = [];
const allowlisted = [];
for (const [pkg, vuln] of Object.entries(report.vulnerabilities ?? {})) {
  for (const via of vuln.via) {
    if (typeof via !== 'object') continue; // transitive pointer, counted at its root
    if (!['high', 'critical'].includes(via.severity)) continue;
    const id = via.url?.split('/').pop() ?? 'unknown';
    (id in ALLOWLIST ? allowlisted : failures).push(`${via.severity} ${pkg}: ${via.title} (${id})`);
  }
}

for (const line of allowlisted) console.log(`allowlisted: ${line}`);
if (failures.length > 0) {
  console.error('\nUnacceptable advisories (fix or allowlist with justification):');
  for (const line of failures) console.error(`  ${line}`);
  process.exit(1);
}
console.log(`audit gate passed — ${allowlisted.length} allowlisted, 0 unhandled high/critical`);
