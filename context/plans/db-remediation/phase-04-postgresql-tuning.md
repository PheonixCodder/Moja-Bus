# Phase 4 — PostgreSQL Tuning & Connection Pooling

> **Priority**: 🟠 HIGH — Execute within 1–2 weeks  
> **Findings addressed**: DB-32, DB-33, DB-34, DB-35, DB-36, DB-37  
> **Goal**: Configure PostgreSQL for production workloads; add connection pooling  
> **Estimated effort**: 4–6 hours  
> **Risk**: Medium — PostgreSQL config change requires restart; PgBouncer is a new service

---

## Current State (confirmed via live `psql` queries)

```
max_connections  = 100    (default)
shared_buffers   = 128MB  (default — severely under-tuned)
work_mem         = 4MB    (default)
effective_cache_size not set
pg_stat_statements NOT enabled
statement_timeout NOT set
lock_timeout NOT set
```

---

## Task 4.1 — Tune PostgreSQL Configuration

> **Addresses**: DB-32, DB-34, DB-35

### Approach

PostgreSQL configuration for the Docker container is set via `command:` args or a mounted `postgresql.conf`. The cleanest approach for a Docker Compose stack is to pass settings as command arguments.

**Edit `compose.yml`** — add a `command:` to the `db` service:

```yaml
db:
  image: postgis/postgis:16-3.4-alpine
  command: >
    postgres
    -c shared_buffers=512MB
    -c effective_cache_size=2GB
    -c work_mem=16MB
    -c maintenance_work_mem=128MB
    -c max_connections=80
    -c wal_buffers=16MB
    -c checkpoint_completion_target=0.9
    -c random_page_cost=1.1
    -c effective_io_concurrency=200
    -c statement_timeout=60000
    -c lock_timeout=10000
    -c log_min_duration_statement=1000
    -c shared_preload_libraries=pg_stat_statements
    -c pg_stat_statements.track=all
  ...rest of service config unchanged...
```

### Rationale for each setting

| Setting | Value | Reason |
|:---|:---|:---|
| `shared_buffers` | 512MB | 25% of 2GB (conservative for DigitalOcean droplet; adjust if server has more RAM) |
| `effective_cache_size` | 2GB | Hint to planner about OS cache; doesn't allocate memory |
| `work_mem` | 16MB | Prevents sort/hash spills for ERP report queries |
| `maintenance_work_mem` | 128MB | Faster VACUUM, index builds |
| `max_connections` | 80 | Reduced from 100 to leave headroom; app + cron + backup should be well under 30 connections |
| `wal_buffers` | 16MB | WAL write performance |
| `statement_timeout` | 60000ms (60s) | Kills runaway queries before they starve other requests |
| `lock_timeout` | 10000ms (10s) | Prevents long lock waits from cascading |
| `log_min_duration_statement` | 1000ms | Logs any query taking > 1 second |
| `shared_preload_libraries` | pg_stat_statements | Enables query performance tracking |
| `pg_stat_statements.track` | all | Track all statements including nested |

> [!WARNING]
> Changing `shared_buffers` requires a PostgreSQL restart (not just `pg_reload_conf()`). This will cause a brief DB outage. Plan this for a low-traffic window. The web container and cron will reconnect automatically.

### Apply changes

```powershell
# 1. SSH into server
ssh root@167.99.192.191

# 2. Update compose.yml with the new db command (edit the file on server)
# - Pull the latest compose.yml from git (it should have the changes after you push)
cd /moja-bus && git pull origin master

# 3. Restart only the DB container (web container keeps running during DB restart,
#    Prisma will reconnect automatically)
docker compose up -d db

# 4. Verify settings applied
docker exec moja-buss-db-1 psql -U moja -d moja -c "SHOW shared_buffers; SHOW work_mem; SHOW statement_timeout;"

# 5. Verify pg_stat_statements is loaded
docker exec moja-buss-db-1 psql -U moja -d moja -c "SELECT count(*) FROM pg_stat_statements LIMIT 1;"
```

---

## Task 4.2 — Enable `pg_stat_statements`

> **Addresses**: DB-33

Once `shared_preload_libraries = pg_stat_statements` is set (Task 4.1) and PostgreSQL has restarted, create the extension in the database:

```sql
-- Run once after restart
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

Add this to `deploy/db/init/01-extensions.sql` so it's created on fresh deployments too:

```sql
-- Existing
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Add
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### Using pg_stat_statements

After enabling, you can query slow/expensive queries:

```sql
-- Top 10 slowest queries by mean execution time
SELECT
  round(mean_exec_time::numeric, 2) AS mean_ms,
  round(total_exec_time::numeric, 2) AS total_ms,
  calls,
  left(query, 80) AS query_preview
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Task 4.3 — Add PgBouncer to Production Docker Stack

> **Addresses**: DB-36

The application connects directly to PostgreSQL at `db:5432`. Without a pooler, each Prisma client instance holds open connections. With the web container + cron + backup all connecting directly, and `max_connections = 100`, this headroom will run out under load.

### Add PgBouncer as a new service in `compose.yml`

```yaml
pgbouncer:
  image: bitnami/pgbouncer:1.23.1
  logging: *default-logging
  environment:
    POSTGRESQL_HOST: db
    POSTGRESQL_PORT: 5432
    POSTGRESQL_DATABASE: ${POSTGRES_DB}
    POSTGRESQL_USERNAME: ${POSTGRES_USER}
    POSTGRESQL_PASSWORD: ${POSTGRES_PASSWORD}
    PGBOUNCER_DATABASE: ${POSTGRES_DB}
    PGBOUNCER_POOL_MODE: transaction
    PGBOUNCER_MAX_CLIENT_CONN: 200
    PGBOUNCER_DEFAULT_POOL_SIZE: 20
    PGBOUNCER_RESERVE_POOL_SIZE: 5
    PGBOUNCER_RESERVE_POOL_TIMEOUT: 3
    PGBOUNCER_SERVER_IDLE_TIMEOUT: 600
    PGBOUNCER_AUTH_TYPE: scram-sha-256
  depends_on:
    db:
      condition: service_healthy
  restart: unless-stopped
  networks: [app]
```

### Update `web` and `cron` to connect via PgBouncer

**In `compose.yml`**, change the `DATABASE_URL` for the `web` service:

```yaml
web:
  environment:
    # Route app queries through PgBouncer (transaction pooling)
    DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@pgbouncer:5432/${POSTGRES_DB}
    ...
```

> [!IMPORTANT]
> The `migrate` service must **NOT** go through PgBouncer (transaction pooling is incompatible with `prisma migrate deploy`). Keep the migrate service pointing directly at `db:5432`:
> ```yaml
> migrate:
>   environment:
>     DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
> ```

### Pool mode selection

Use `transaction` pool mode for the web app (Prisma's connection pool + PgBouncer transaction mode is the standard Prisma recommendation). Note that some Prisma features require session mode — specifically any use of `SET LOCAL`, advisory locks, or prepared statements. For the Moja Ride workload (no session-level SET, migrations go through direct connection), transaction mode is safe.

---

## Completion Checklist

- [ ] `compose.yml` updated with PostgreSQL tuning args on `db` service
- [ ] Changes pushed and DB container restarted on production server
- [ ] PostgreSQL settings verified with `SHOW` commands
- [ ] `pg_stat_statements` extension created in DB
- [ ] `deploy/db/init/01-extensions.sql` updated to include `pg_stat_statements`
- [ ] PgBouncer service added to `compose.yml`
- [ ] `web` service `DATABASE_URL` routes through PgBouncer
- [ ] `migrate` service `DATABASE_URL` remains on direct `db:5432`
- [ ] PgBouncer connection verified: `docker exec moja-buss-pgbouncer-1 psql -p 5432 -U moja -d moja -c 'SELECT 1;'`
- [ ] Application healthcheck (`/api/health`) still passes after PgBouncer is in place
