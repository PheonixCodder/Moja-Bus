# Phase 7 — Monitoring, Observability & Alerting

> **Priority**: 🟠 HIGH — Execute within 2 weeks  
> **Findings addressed**: DB-38, DB-39, DB-40  
> **Goal**: Make the database layer visible — slow queries, connection saturation, and failures must surface before they become incidents  
> **Estimated effort**: 4–6 hours  
> **Risk**: Low — adding monitoring is non-destructive and additive

---

## Current State

- Signoz (distributed tracing + metrics) is deployed and running on the server
- The application sends OTEL traces to Signoz via `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`
- **No PostgreSQL metrics** are being exported to Signoz
- **No slow query logging** — `log_min_duration_statement` is unset
- **No alerts** on disk, connection saturation, migration failures, or backup failures

---

## Task 7.1 — Export PostgreSQL Metrics to Signoz

> **Addresses**: DB-38

### Add `postgres_exporter` to the Docker Compose stack

[`postgres_exporter`](https://github.com/prometheus-community/postgres_exporter) exposes PostgreSQL internals as Prometheus metrics, which Signoz's OTEL collector can scrape.

**Add to `compose.yml`**:

```yaml
postgres-exporter:
  image: prometheuscommunity/postgres-exporter:v0.15.0
  logging: *default-logging
  environment:
    DATA_SOURCE_NAME: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?sslmode=disable
    PG_EXPORTER_DISABLE_DEFAULT_METRICS: "false"
    PG_EXPORTER_DISABLE_SETTINGS_METRICS: "false"
  depends_on:
    db:
      condition: service_healthy
  restart: unless-stopped
  networks: [app]
  expose:
    - "9187"
```

### Configure Signoz OTEL Collector to scrape postgres_exporter

Update the Signoz OTEL collector config to add a Prometheus scrape target for `postgres-exporter:9187`.

This makes the following metrics visible in Signoz:
- `pg_up` — database availability
- `pg_stat_activity_count` — active connections by state
- `pg_stat_database_tup_fetched` — rows fetched (query volume)
- `pg_stat_database_deadlocks` — deadlock count
- `pg_locks_count` — lock contention
- `pg_stat_bgwriter_*` — checkpoint and buffer metrics
- `pg_stat_statements_*` — query performance (requires Phase 4's `pg_stat_statements`)

---

## Task 7.2 — Enable Slow Query Logging

> **Addresses**: DB-39

Already included in Phase 4 (Task 4.1) via:
```
-c log_min_duration_statement=1000
```

This logs any query taking > 1000ms. After Phase 4 is implemented, verify it's working:

```bash
# Generate a slow query (this will take ~1s)
docker exec moja-buss-db-1 psql -U moja -d moja -c "SELECT pg_sleep(1.5);"

# Check logs
docker logs moja-buss-db-1 2>&1 | tail -20 | grep "duration"
```

Expected output:
```
LOG:  duration: 1501.234 ms  statement: SELECT pg_sleep(1.5);
```

### Ship slow query logs to Signoz

The Signoz OTEL collector already running on the server can collect Docker container logs. Configure it to parse PostgreSQL log lines:

Add a file log receiver in the Signoz collector config pointing to the PostgreSQL container's log output:
```yaml
receivers:
  filelog:
    include: ["/var/lib/docker/containers/*/json.log"]
    operators:
      - type: json_parser
        timestamp:
          parse_from: attributes.time
          layout: "%Y-%m-%dT%H:%M:%S.%LZ"
```

---

## Task 7.3 — Set Up Critical Alerts

> **Addresses**: DB-40

### Alert 1 — Disk Usage > 80%

**Using a host cron job** (simplest, no additional tooling):

```bash
# Add to root crontab on 167.99.192.191
# Check every 30 minutes — send to a Slack webhook or log prominently
*/30 * * * * \
  USED=$(df / | awk 'NR==2 { gsub("%",""); print $5 }'); \
  if [ "$USED" -gt 80 ]; then \
    curl -s -X POST "${SLACK_WEBHOOK_URL}" \
      -H 'Content-type: application/json' \
      --data "{\"text\":\"⚠️ DISK ALERT: ${USED}% used on moja-prod (167.99.192.191)\"}"; \
  fi
```

**Or using Uptime Kuma** (which is already deployed as `moja-buss-status-1`) — add a custom Docker host monitor.

### Alert 2 — Connection Count Near `max_connections`

Via `postgres_exporter` + Signoz (after Task 7.1):
```
ALERT if pg_stat_activity_count{state="active"} > 70
  (70% of max_connections=80, allowing headroom before saturation)
```

### Alert 3 — Migration Failure in CI

GitHub Actions already sends email notifications for failed workflows. Ensure the team email is in the repository notification settings:
- Settings → Notifications → Email → Add team addresses

For Slack: add a step at the end of `deploy.yml`:
```yaml
- name: Notify Slack on deploy failure
  if: failure()
  run: |
    curl -s -X POST "${{ secrets.SLACK_WEBHOOK_URL }}" \
      -H 'Content-type: application/json' \
      --data '{"text":"🚨 Deploy failed on `master` — check GitHub Actions: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"}'
```

### Alert 4 — Backup Failure

Update `deploy/backup/entrypoint.sh` to notify on backup failure:

```bash
#!/bin/sh
set -eu

if ! sh /usr/local/bin/dump.sh; then
  echo "BACKUP FAILED at $(date)" >> /var/log/backup.log
  # If Slack webhook is set, notify
  if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    curl -s -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-type: application/json' \
      --data '{"text":"🚨 BACKUP FAILED on moja-prod — immediate attention required!"}'
  fi
  exit 1
fi
```

### Alert 5 — Replication Lag (future — when replica is added)

Defer until Phase 8 when a read replica is considered.

---

## Task 7.4 — Add a `/api/health?full=1` Database Health Check

The existing `/api/health` endpoint confirms the app is alive. It should also expose database health for monitoring:

```typescript
// Example response structure
{
  "status": "ok",
  "db": {
    "connected": true,
    "latencyMs": 2,
    "migrationCount": 34,
    "activeConnections": 5
  }
}
```

Add `?full=1` support to `apps/web/src/app/api/health/route.ts` that queries:
```sql
SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;
SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();
```

This lets Uptime Kuma (already deployed) and external monitors detect DB failures even when the app process is alive.

---

## Completion Checklist

- [ ] `postgres_exporter` added to `compose.yml`
- [ ] Signoz OTEL collector configured to scrape `postgres_exporter:9187`
- [ ] PostgreSQL metrics visible in Signoz dashboard
- [ ] `log_min_duration_statement=1000` verified working (Phase 4 dependency)
- [ ] Slow query logs visible in Signoz
- [ ] Disk usage > 80% alert configured (cron + Slack or Uptime Kuma)
- [ ] Connection count alert configured in Signoz
- [ ] Slack notification added to `deploy.yml` for deploy failures
- [ ] Backup failure notification added to `deploy/backup/entrypoint.sh`
- [ ] `/api/health?full=1` endpoint returns DB connection status and migration count
