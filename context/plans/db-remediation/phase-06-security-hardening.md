# Phase 6 — Security Hardening

> **Priority**: 🔴 HIGH — Execute within 1 week (parallel with Phase 3/4)  
> **Findings addressed**: DB-06, DB-15, DB-26, DB-27, DB-28  
> **Goal**: Remove plaintext secrets, restrict DB user privileges, add audit logging  
> **Estimated effort**: 4–8 hours  
> **Risk**: Medium — secrets rotation causes brief auth disruption; privilege changes require careful testing

---

## Task 6.1 — Move Secrets to a Secrets Manager

> **Addresses**: DB-06, DB-26

### Current state

`apps/web/.env.local` contains in plaintext:
- `BANK_ENCRYPTION_KEY` (AES-256 key for PCI/GDPR-sensitive bank account data)
- `BETTER_AUTH_SECRET` (session invalidation risk if leaked)
- `PAYSTACK_SECRET_KEY` (live payment API)
- `S3_ACCESS_KEY_ID` + `S3_SECRET_ACCESS_KEY` (R2 bucket full access)
- `WITHDRAWAL_2FA_PEPPER` (2FA security material)
- `DATABASE_URL` with embedded Neon password
- `OPENROUTER_API_KEY`

### Recommended tool — Doppler (free tier, first-party Next.js integration)

Doppler syncs secrets to local dev, CI, and production without storing them on disk. It's the lowest-friction solution for a small team.

### Steps

**1. Create a Doppler project**
```bash
# Install Doppler CLI
# Windows: winget install Doppler.CLI
doppler login
doppler setup   # creates a project linked to this repo
```

**2. Import all current secrets to Doppler**
```bash
doppler secrets upload apps/web/.env.local
```

**3. Update local dev workflow**
```bash
# Instead of: node server.js
# Use:        doppler run -- node server.js
# Or:         doppler run -- pnpm dev
```

**4. Update GitHub Actions** — replace static secret values with Doppler-sourced values:
```yaml
- name: Load secrets from Doppler
  uses: dopplerhq/secrets-fetch-action@v1
  with:
    doppler-token: ${{ secrets.DOPPLER_TOKEN }}
    inject-env-vars: true
```

**5. Update production server** — replace `.env` file with Doppler sync:
```bash
# On the server, install Doppler CLI and configure it to write .env on each deploy
doppler secrets download --no-file --format env > /moja-bus/.env
```

### If Doppler is not viable — minimum immediate actions

At minimum, before Phase 6 is complete:

1. **Rotate the `BANK_ENCRYPTION_KEY`** — this is the highest-risk key (AES-256 for PII). Rotation requires:
   - Decrypt all existing encrypted bank records with the old key
   - Re-encrypt with the new key
   - Update both `BANK_ENCRYPTION_KEY` and `BANK_ENCRYPTION_KEY_PREVIOUS`
   - This is a planned operation, not a one-liner — schedule it

2. **Rotate `BETTER_AUTH_SECRET`** — all existing sessions are invalidated (users re-logged in). Low user impact if done during low-traffic hours.

3. **Rotate `S3_ACCESS_KEY_ID` + `S3_SECRET_ACCESS_KEY`** — create new R2 API keys with read/write scoped only to the `moja-buss` bucket, revoke old keys.

4. **Verify `.env.local` is gitignored**:
   ```bash
   git check-ignore -v apps/web/.env.local
   ```
   If it's NOT in `.gitignore`, add it NOW and check `git log --all -- apps/web/.env.local` to see if it was ever committed.

---

## Task 6.2 — Restrict Database User Privileges

> **Addresses**: DB-28

The `moja` PostgreSQL user was created via Docker Compose `POSTGRES_USER` environment variable, which creates a **superuser** by default in the official PostgreSQL image. This means the application user has `CREATEDB`, `CREATEROLE`, and `SUPERUSER` privileges — far more than needed.

### Steps

**1. Create a restricted application user** (do this as the superuser first):

```sql
-- Connect as postgres superuser
docker exec moja-buss-db-1 psql -U moja -d moja -c "
-- Create a dedicated app user with minimal privileges
CREATE USER moja_app WITH PASSWORD '<new-strong-password>';

-- Grant only what the application needs
GRANT CONNECT ON DATABASE moja TO moja_app;
GRANT USAGE ON SCHEMA public TO moja_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO moja_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO moja_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO moja_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO moja_app;
"
```

**2. Update production `.env`** — change `POSTGRES_USER` to `moja_app` and update `DATABASE_URL`.

**3. Keep `moja` as the superuser** for migration purposes only — the `migrate` service can continue using the superuser, but the `web` and `cron` services should use `moja_app`.

**4. Test thoroughly** — run the app with the restricted user before switching production.

> [!CAUTION]
> Do NOT drop the `moja` superuser until you have confirmed `moja_app` can run all application queries successfully. Test in the testing environment first.

---

## Task 6.3 — Add Statement Audit Logging

> **Addresses**: DB-27

PostgreSQL has built-in logging that can capture all write operations. For GDPR/compliance, you want at minimum a log of all `INSERT`, `UPDATE`, and `DELETE` operations on sensitive tables.

### Short-term — Enable PostgreSQL logging in `compose.yml`

Add to the `db` service `command:` (alongside tuning args from Phase 4):

```yaml
command: >
  postgres
  ...existing tuning args...
  -c log_statement=mod
  -c log_connections=on
  -c log_disconnections=on
  -c log_duration=off
  -c log_line_prefix='%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

- `log_statement=mod` logs all `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE` statements
- `log_connections/disconnections` tracks who connects and when
- `log_line_prefix` adds timestamp, PID, user, and IP to each log line

Logs are visible via:
```bash
docker logs moja-buss-db-1 2>&1 | grep "LOG:"
```

### Medium-term — `pgaudit` extension for structured audit trail

For more granular auditing (specific tables, specific operations), install the `pgaudit` extension:

```sql
-- In 01-extensions.sql
CREATE EXTENSION IF NOT EXISTS pgaudit;
```

Add to PostgreSQL config:
```
shared_preload_libraries = 'pg_stat_statements,pgaudit'
pgaudit.log = 'write,ddl'
pgaudit.log_catalog = on
```

This produces structured audit records that can be shipped to Signoz via the OTEL collector.

---

## Task 6.4 — Verify No DATABASE_URL in Docker Image Layers

> **Addresses**: DB-15 (overlaps with Phase 3 Task 3.2)

After Phase 3 Task 3.2 (migrate image no longer built from `builder`), verify the credential is gone from the pushed image:

```bash
# Pull the latest migrate image
docker pull pheonixcodder/moja-buss-migrate:latest

# Inspect all layers for DATABASE_URL
docker history pheonixcodder/moja-buss-migrate:latest --no-trunc | grep DATABASE_URL
docker inspect pheonixcodder/moja-buss-migrate:latest | grep -i database_url
```

Expected: no DATABASE_URL found in any layer or inspect output.

If it's still present, the Phase 3 Dockerfile change was not applied. Rebuild and push.

---

## Completion Checklist

- [ ] `.env.local` confirmed gitignored — never been committed (verified via `git log`)
- [ ] Doppler (or equivalent) configured for local dev, CI, and production
- [ ] `BANK_ENCRYPTION_KEY` rotation scheduled (requires app-level data migration)
- [ ] `BETTER_AUTH_SECRET` rotated (users re-login)
- [ ] `S3_ACCESS_KEY_ID/SECRET` rotated to bucket-scoped keys
- [ ] `moja_app` restricted DB user created with minimal grants
- [ ] `web` and `cron` services switched to `moja_app` user
- [ ] Superuser `moja` retained for migrations only
- [ ] PostgreSQL `log_statement=mod` enabled
- [ ] `pgaudit` extension planned and scheduled for installation
- [ ] Migrate Docker image verified to have no DATABASE_URL in layers
