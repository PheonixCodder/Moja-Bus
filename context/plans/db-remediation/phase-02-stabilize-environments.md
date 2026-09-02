# Phase 2 — Stabilize Environments (P1 Critical)

> **Priority**: 🔴 CRITICAL — Execute within 1–2 days of Phase 1  
> **Findings addressed**: DB-05, DB-06, DB-12, DB-19, DB-20, DB-26, DB-29  
> **Goal**: Prevent recurrence of Phase 1 failures; secure credentials; protect against data loss  
> **Estimated effort**: 3–4 hours  
> **Risk**: Low-Medium — env changes, docker cron, backup destination change

---

## Task 2.1 — Fix the Neon Connection URL Split (Direct vs Pooler)

> **Addresses**: DB-05, DB-37

### Problem

`apps/web/.env.local` has a single `DATABASE_URL` pointing to the Neon **pooler** endpoint. The pooler URL is correct for runtime app traffic, but **unsafe for all Prisma CLI commands** (`migrate deploy`, `migrate dev`, `migrate diff`, `db pull`).

### Solution

Add a second variable `DATABASE_URL_DIRECT` for the non-pooler Neon endpoint. Update `packages/db/prisma.config.ts` to read it for migration commands.

### Steps

**1. Add direct URL to `apps/web/.env.local`**

```env
# Pooler URL — use for runtime app queries only
DATABASE_URL="postgresql://neondb_owner:npg_bXSI34rVHAke@ep-still-shadow-at2zgkyc-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Direct (non-pooler) URL — use for prisma migrate / db / diff commands ONLY
DATABASE_URL_DIRECT="postgresql://neondb_owner:npg_bXSI34rVHAke@ep-still-shadow-at2zgkyc.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**2. Update `packages/db/prisma.config.ts`** to use the direct URL for `directUrl`:

```typescript
import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: {
    path: 'prisma/schema.prisma',
    // directUrl is used by migrate/diff/pull — bypasses the pooler
    url: process.env['DATABASE_URL']!,
  },
  migrate: {
    migrations: 'prisma/migrations',
    seed: {
      run: 'tsx prisma/seed.ts',
    },
  },
})
```

**3. Update `packages/db/prisma/schema.prisma` datasource block:**

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_DIRECT")
}
```

This tells Prisma to use `DATABASE_URL` for runtime queries (pooler is fine) and `DATABASE_URL_DIRECT` for schema commands.

**4. Update `packages/db/MIGRATIONS.md`** — add a note clarifying the two-URL setup and when each is used.

**5. Add `DATABASE_URL_DIRECT` to GitHub Actions secrets** (Settings → Secrets) so the drift check job can use the direct URL too. Update `db-drift.yml` to set it.

---

## Task 2.2 — Remove Dangerous `db:push` Script

> **Addresses**: DB-12

`packages/db/package.json` exposes `"db:push": "prisma db push"` which violates MIGRATIONS.md policy. Any developer can accidentally run it against the shared Neon DB.

**Edit `packages/db/package.json`** — remove the `db:push` script entirely:

```diff
-  "db:push": "prisma db push",
```

If you need `db push` for quick local iteration on a throwaway DB, use it via `DATABASE_URL=postgresql://localhost/... pnpm exec prisma db push` — don't expose it as a named script.

---

## Task 2.3 — Add Automatic Docker Image Pruning on Production Server

> **Addresses**: DB-19

Without pruning, the disk will refill within days of active development. Add a weekly host cron on the production server.

### Steps

```powershell
ssh root@167.99.192.191
```

Inside the server:

```bash
# 1. Open the root crontab
crontab -e

# 2. Add this line — prune dangling images every Sunday at 3am
0 3 * * 0 docker image prune -af >> /var/log/docker-prune.log 2>&1

# 3. Save and exit
# 4. Verify
crontab -l
```

Optionally also add a disk-monitoring check that emails/alerts if disk > 80%:

```bash
# Also add — check disk every 6 hours and log if > 80%
0 */6 * * * df -h / | awk 'NR==2 { gsub("%",""); if ($5 > 80) print "DISK ALERT: " $5 "% used on " "'$(hostname)'" }' >> /var/log/disk-check.log 2>&1
```

---

## Task 2.4 — Set Up Off-Site Database Backups

> **Addresses**: DB-20, DB-29

Currently all 5 daily backups are stored in the `moja-buss_backups` Docker volume on the **same physical disk** as the database. A disk failure destroys both.

### Solution — Ship backups to Cloudflare R2

The project already has Cloudflare R2 configured (S3-compatible). The `deploy/backup/dump.sh` script should be extended to upload the compressed dump to R2 after writing it locally.

**Edit `deploy/backup/dump.sh`**:

```bash
#!/bin/sh
set -eu

TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
DUMP_FILE="${BACKUP_DIR}/moja_${TIMESTAMP}.sql.gz"

# 1. Dump
pg_dump \
  -h "$POSTGRES_HOST" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-password \
  | gzip > "$DUMP_FILE"

echo "Backup written: $DUMP_FILE"

# 2. Upload to R2 (requires rclone or aws CLI + R2 env vars)
if [ -n "${S3_ENDPOINT:-}" ] && [ -n "${S3_BUCKET:-}" ]; then
  aws s3 cp "$DUMP_FILE" \
    "s3://${S3_BUCKET}/db-backups/$(basename $DUMP_FILE)" \
    --endpoint-url "$S3_ENDPOINT" \
    --region "${S3_REGION:-auto}"
  echo "Uploaded to R2: s3://${S3_BUCKET}/db-backups/$(basename $DUMP_FILE)"
fi

# 3. Prune local copies older than retention days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +${BACKUP_RETENTION_DAYS:-7} -delete
```

**Update `deploy/backup/Dockerfile`** to include the AWS CLI:

```dockerfile
RUN apk add --no-cache postgresql-client aws-cli
```

**Add R2 credentials to the backup service** in `compose.yml`:

```yaml
backup:
  environment:
    S3_ENDPOINT: ${S3_ENDPOINT:-}
    S3_REGION: ${S3_REGION:-auto}
    S3_ACCESS_KEY_ID: ${S3_ACCESS_KEY_ID:-}
    S3_SECRET_ACCESS_KEY: ${S3_SECRET_ACCESS_KEY:-}
    S3_BUCKET: ${S3_BUCKET:-}
```

These vars are already in the server `.env` file (confirmed during audit).

---

## Task 2.5 — Secrets Hygiene (Immediate Low-Effort Wins)

> **Addresses**: DB-06, DB-26

Full secrets manager migration (Doppler / 1Password) is a larger effort deferred to Phase 6. For now:

1. **Add `apps/web/.env.local` to `.gitignore`** — verify it's already excluded:
   ```bash
   git check-ignore -v apps/web/.env.local
   ```
   If it's NOT ignored, add it immediately.

2. **Remove the duplicate `DATABASE_URL` on line 40** of `.env.local` — the duplicate is masked by the second definition and creates confusion.

3. **Rotate any secrets that have been committed** — if `.env.local` was ever accidentally committed, rotate: `BANK_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `S3_SECRET_ACCESS_KEY`, Paystack keys.

4. **Document rotation procedure** in `context/code-standards.md` — who rotates what, how, and when.

---

## Completion Checklist

- [ ] `DATABASE_URL_DIRECT` added to `apps/web/.env.local`
- [ ] `schema.prisma` datasource block updated with `directUrl`
- [ ] `packages/db/MIGRATIONS.md` updated to document two-URL setup
- [ ] `DATABASE_URL_DIRECT` added as GitHub Actions secret
- [ ] `db-drift.yml` updated to use direct URL for diff command
- [ ] `db:push` script removed from `packages/db/package.json`
- [ ] Weekly `docker image prune` cron added on production server
- [ ] `deploy/backup/dump.sh` updated to upload to R2
- [ ] Backup Dockerfile includes `aws-cli`
- [ ] Backup service in `compose.yml` receives R2 env vars
- [ ] `.env.local` confirmed in `.gitignore`
- [ ] Duplicate `DATABASE_URL` on line 40 of `.env.local` removed
