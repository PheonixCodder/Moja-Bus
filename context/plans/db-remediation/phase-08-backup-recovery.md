# Phase 8 — Backup, Recovery & Resilience

> **Priority**: 🟠 HIGH — Execute within 2 weeks  
> **Findings addressed**: DB-20, DB-29, DB-30, DB-31  
> **Goal**: Off-site backups, tested restore procedure, defined RTO/RPO, backup verification  
> **Estimated effort**: 4–6 hours  
> **Risk**: Low — backup changes are additive; restore testing is done on a clone, not production

---

## Task 8.1 — Ship Backups to Cloudflare R2 (Off-Site)

> **Addresses**: DB-20, DB-29

> [!NOTE]
> The `deploy/backup/dump.sh` update is covered in Phase 2 Task 2.4. This task assumes Phase 2 is complete. The goal here is to verify the upload is working and set up a retention policy on R2.

### Verify R2 upload is working

```bash
# SSH into server
ssh root@167.99.192.191

# Trigger a manual backup (cron normally runs at 01:30 UTC)
docker exec moja-buss-backup-1 sh /usr/local/bin/dump.sh

# Check R2 bucket (requires aws CLI on your local machine with R2 credentials)
aws s3 ls s3://<your-bucket>/db-backups/ --endpoint-url https://<account-id>.r2.cloudflarestorage.com
```

Expected: a `.sql.gz` file in the `db-backups/` prefix matching today's timestamp.

### R2 Bucket Lifecycle Policy

Set a lifecycle policy on the R2 bucket to auto-delete backups older than 30 days (remote retention is longer than local 7-day retention):

In Cloudflare R2 dashboard:
- Rules → Add Rule
- Prefix: `db-backups/`
- Days until expiration: `30`

---

## Task 8.2 — Test Backup Restoration

> **Addresses**: DB-30

A backup that has never been tested is not a backup. This task documents and runs a restoration drill.

### Restoration procedure (run against a test environment, NOT production)

**Option A — Restore to the existing test Neon database** (recommended for first test):

```bash
# 1. Download the latest backup from R2
aws s3 cp s3://<bucket>/db-backups/moja_2026-09-01_013000.sql.gz ./restore-test.sql.gz \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com

# 2. Decompress
gunzip restore-test.sql.gz

# 3. Create a scratch Neon branch (free feature — creates an isolated DB copy)
# In Neon Console: Branch → Create Branch → name it "restore-test"

# 4. Restore into the scratch branch
psql "postgresql://neondb_owner:<pw>@ep-still-shadow-at2zgkyc.c-9.us-east-1.aws.neon.tech/neondb-restore?sslmode=require" \
  < restore-test.sql

# 5. Verify row counts match production
psql "postgresql://..." -c "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20;"

# 6. Delete the scratch branch when done
```

**Option B — Restore to a local PostgreSQL Docker container**:

```bash
docker run -d --name restore-test \
  -e POSTGRES_USER=moja \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=moja \
  -p 5433:5432 \
  postgis/postgis:16-3.4-alpine

# Wait for it to start
sleep 5

# Restore
gunzip -c restore-test.sql.gz | docker exec -i restore-test psql -U moja -d moja

# Verify
docker exec restore-test psql -U moja -d moja -c "SELECT count(*) FROM _prisma_migrations;"

# Clean up
docker rm -f restore-test
```

### Schedule quarterly restore drills

Add a calendar reminder to perform a restoration test every quarter. Document the results in `context/audits/backup-restore-log.md`.

---

## Task 8.3 — Define and Document RTO/RPO

> **Addresses**: DB-31

**Current backup posture**:
- **RPO** (Recovery Point Objective — max data loss): ~24 hours (once-daily backups at 01:30 UTC)
- **RTO** (Recovery Time Objective — time to restore): Unknown — no measured restore test

### Define target SLAs

For a pre-launch intercity bus marketplace, suggested targets:

| Metric | Target | Current | Gap |
|:---|:---|:---|:---|
| RPO | 1 hour | ~24 hours | ❌ Needs hourly backups or WAL shipping |
| RTO | 2 hours | Unknown | ❌ Never tested |

### Actions to hit targets

**To achieve 1-hour RPO**:
- Change backup cron to run every hour: `0 * * * *` instead of `30 1 * * *`
- Or enable WAL archiving to R2 (more complex, near-zero data loss)

**Update `compose.yml` backup service** to run hourly:
```yaml
backup:
  # crontab.template in deploy/backup/ should have:
  # 0 * * * * /usr/local/bin/dump.sh
```

**Update `BACKUP_RETENTION_DAYS`** for local storage — hourly backups need more aggressive local cleanup (keep last 48 hours locally = 48 files, purge beyond that).

**To achieve 2-hour RTO**:
- Complete Phase 8.2 (restoration test) and document the exact time it takes
- Create a runbook at `context/audits/disaster-recovery-runbook.md`

### Disaster Recovery Runbook (create this file)

```markdown
# Disaster Recovery Runbook

## Scenario: Production DB lost (disk failure, accidental drop, etc.)

### Step 1 — Provision new DB (if needed): 10–15 min
- If using DigitalOcean: create new droplet or resize existing
- Or spin up a fresh Docker Compose stack

### Step 2 — Get latest backup from R2: 5 min
aws s3 cp s3://<bucket>/db-backups/<latest>.sql.gz ./restore.sql.gz --endpoint-url ...

### Step 3 — Restore: 5–20 min (depends on DB size)
gunzip restore.sql.gz
psql "$DATABASE_URL" < restore.sql

### Step 4 — Verify migration count matches git: 2 min
psql "$DATABASE_URL" -c "SELECT count(*) FROM _prisma_migrations;"
# Must match: 34 (or current count)

### Step 5 — Run any missing migrations: 5 min
prisma migrate deploy

### Step 6 — Restart application: 5 min
docker compose up -d

### Step 7 — Smoke test: 5 min
curl https://mojaride.com/api/health
```

---

## Task 8.4 — Add a Second Data Copy: Neon as Hot Standby (Optional)

> This is an **optional enhancement** for consideration after the above tasks are complete.

The production database is self-hosted on a single DigitalOcean droplet with no replica. For true high availability, consider one of:

1. **Neon as a hot standby** — replicate production data to the existing Neon project using logical replication. Prisma can failover by pointing to the Neon URL if the primary fails.

2. **DigitalOcean Managed Database** — move from self-hosted PostGIS to DigitalOcean's managed PostgreSQL with built-in standby, automatic failover, and daily backups.

3. **Read replica on same server** — stream WAL to a second PostGIS container on the same droplet. Provides read scaling but not disk failure protection.

**Recommendation**: Defer until launch, then migrate to DigitalOcean Managed Database. The cost is ~$15/month for the Basic plan (1vCPU, 1GB RAM, 10GB storage) and eliminates the need for self-managing backups, replication, and PostgreSQL tuning.

---

## Completion Checklist

- [ ] R2 backup upload confirmed working (Phase 2 dependency)
- [ ] R2 lifecycle policy set (30-day remote retention)
- [ ] Restoration drill completed against test environment
- [ ] Restoration time recorded (contributes to RTO measurement)
- [ ] Restore results logged in `context/audits/backup-restore-log.md`
- [ ] Quarterly restore drill scheduled in team calendar
- [ ] RTO/RPO SLA targets defined and documented
- [ ] Backup cron updated to hourly (if 1-hour RPO is target)
- [ ] `context/audits/disaster-recovery-runbook.md` created
- [ ] HA strategy decision documented (self-hosted vs managed DB) for launch planning
