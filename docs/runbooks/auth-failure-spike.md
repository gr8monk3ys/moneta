# Runbook: Auth Failure Spike

## Trigger

- `MonetaAuthFailureSpike` alert
- elevated 401/403/429 on `/api/auth/*`

## Immediate actions (0-15 minutes)

1. Confirm spike source:
   - invalid credentials burst
   - token verification failures
   - rate limiting saturation
2. Slice by request metadata (`requestId`, route, user agent, IP where available).
3. Check for recent deploy/config changes affecting JWT secrets, TTLs, or CORS.

## Stabilization (15-60 minutes)

1. If abuse suspected:
   - tighten WAF/edge limits
   - temporarily lower auth endpoint rate limits if needed
2. If config fault suspected:
   - validate JWT and refresh secret values
   - validate clock skew, token TTL settings, and issuer logic
3. If release regression suspected:
   - rollback to previous release

## User impact mitigation

- Post in status/support channel with workaround guidance if login failures are user-visible.

## Exit criteria

- Auth failure ratio returns below alert threshold for at least 30 minutes.
- Root cause recorded with corrective actions (abuse controls or code/config fix).
