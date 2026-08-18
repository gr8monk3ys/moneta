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
