# Runbook: Database Outage

## Trigger

- `MonetaReadyProbeFailing` and/or repeated `/ready` failures
- API errors indicating database connection failures

## Immediate actions (0-15 minutes)

1. Confirm incident scope:
   - check `/ready` and `/health`
   - inspect 5xx trend in metrics/logs
2. Check database provider status page and connectivity from app hosts.
3. If deployment-related, pause new deployments.
4. If safe, execute rollback to previous known-good release.

## Stabilization (15-60 minutes)

1. Validate DB credentials and secret-manager versions.
2. Check DB saturation: max connections, CPU, storage, replication lag.
3. Restore service:
   - fail over to healthy DB instance if available
   - or restore from backup if corruption/outage persists
4. Validate app recovery:
   - `/ready` returns 200
   - auth + core learning endpoints succeed

## Communication

- Open incident channel with timestamped updates every 15 minutes.
- Notify product/support when user impact starts and ends.

## Exit criteria

- Readiness stable for at least 30 minutes.
- Error rate and latency back within SLO thresholds.
- Root cause and follow-up items recorded.
