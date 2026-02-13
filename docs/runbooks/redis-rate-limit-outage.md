# Runbook: Redis Rate Limit Store Outage

## Trigger

- Redis error logs from API process
- sudden auth throttling anomalies in multi-instance production

## Immediate actions (0-15 minutes)

1. Confirm Redis provider/service health.
2. Determine impact:
   - single instance: fallback to process memory limiter may still function
   - multi-instance: limiter behavior may become inconsistent
3. If abuse traffic is active, add temporary edge throttling/WAF rules.

## Stabilization (15-60 minutes)

1. Restore Redis connectivity (network, auth, TLS, endpoint).
2. Validate `RATE_LIMIT_REDIS_URL` in production env.
3. Restart affected app instances if needed after Redis recovery.
4. Confirm limiter is distributed again across instances.

## Communication

- Notify on-call channel of risk (auth abuse detection may degrade while Redis is unavailable).

## Exit criteria

- Redis connectivity stable.
- No sustained auth-failure spike from abusive traffic.
- Post-incident action items captured (capacity, failover, alert thresholds).
