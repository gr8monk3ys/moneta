# Moneta Observability Production Setup

This guide defines the minimum production observability baseline required before launch.

## Scope

- Runtime alerts for availability, readiness, 5xx error rate, auth failure spikes, and latency.
- Centralized structured logs with request-id correlation and retention policy.
- On-call runbook linkage for incident response.

## 1) Metrics collection

Expose and scrape:

- `GET /metrics` (protected by `METRICS_TOKEN` in production)
- `GET /health`
- `GET /ready`

Example Prometheus scrape config:

```yaml
scrape_configs:
  - job_name: moneta-api
    metrics_path: /metrics
    scheme: https
    authorization:
      type: Bearer
      credentials: ${METRICS_TOKEN}
    static_configs:
      - targets: ["api.example.com"]

  - job_name: moneta-ready-probe
    metrics_path: /probe
    params:
      module: [http_2xx]
      target: [https://api.example.com/ready]
    static_configs:
      - targets: ["blackbox-exporter:9115"]
    relabel_configs:
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

## 2) Alert rules

Deploy `ops/prometheus/moneta-alert-rules.yml` into your Prometheus rule set.

Alerts included:

- `MonetaApiDown`
- `MonetaReadyProbeFailing`
- `MonetaHigh5xxRate`
- `MonetaAuthFailureSpike`
- `MonetaP95LatencyHigh`
- `MonetaReadyEndpoint5xx`

Wire alert routes to paging + chat channels in Alertmanager.

## 3) Log ingestion and retention

Application logs are structured JSON and include `requestId` (`x-request-id`) for correlation.

Required production controls:

- Ship stdout logs to a centralized sink (Datadog, CloudWatch, Loki, or equivalent).
- Parse JSON fields and index `requestId`, `level`, `statusCode`, and route path.
- Retain logs for at least 30 days in hot storage; archive as required by policy.
- Add query shortcuts:
  - by `requestId` for single-request traceability
  - by `statusCode >= 500` for error triage
  - by `/api/auth/*` for auth anomaly debugging

## 4) Verification checklist

- Alert rules loaded and active in Prometheus.
- Test alert fired and delivered to on-call channel.
- `/metrics` rejects unauthorized access in production.
- Log pipeline receives Moneta logs and supports `requestId` lookup.
- Retention policy documented and enabled in the log sink.

## 5) Incident runbooks

Link these runbooks in the alert payload routing:

- `docs/runbooks/database-outage.md`
- `docs/runbooks/redis-rate-limit-outage.md`
- `docs/runbooks/auth-failure-spike.md`
