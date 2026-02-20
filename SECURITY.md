# Security Policy

## Supported versions

Moneta is currently maintained as a single rolling release.

| Branch / Version | Security updates |
| --- | --- |
| `main` (latest) | ✅ Supported |
| Older commits / forks | ❌ Not supported |

If you are running Moneta in production, pin to a tagged release and upgrade regularly.

## Reporting a vulnerability

Please **do not open public GitHub issues** for security reports.

Instead, report privately with the following details:

- Affected component(s) and endpoint(s)
- Reproduction steps or proof of concept
- Impact assessment (confidentiality / integrity / availability)
- Suggested remediation (optional)

### Contact

- Preferred: Security disclosure via your private maintainer channel
- Fallback: Open a private advisory in GitHub Security Advisories for this repository

### Response targets

- Initial acknowledgement: **within 3 business days**
- Triage decision: **within 7 business days**
- Status updates: **at least every 7 business days** until resolved

### Disclosure process

1. We acknowledge and reproduce the issue.
2. We assign severity and remediation priority.
3. We prepare and validate a fix.
4. We coordinate disclosure timing with the reporter.
5. We publish a security note once mitigations are available.

## Scope notes

The following are generally out of scope unless chained to demonstrate real impact:

- Missing best-practice headers where equivalent mitigations already exist
- Denial-of-service requiring unrealistic traffic/resources
- Vulnerabilities only present in unsupported forks or modified deployments

## Secrets and credentials

Never commit real credentials, API keys, or private tokens to this repository.
Use environment variables and secret stores for runtime configuration.
