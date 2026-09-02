# Phase 3 — Harden the CI/CD Pipeline

> **Priority**: 🟠 HIGH — Execute within 1 week of Phase 1  
> **Findings addressed**: DB-14, DB-15, DB-16, DB-10  
> **Goal**: Make the deploy pipeline safe against partial failures, credential leaks, and drift slipping through  
> **Estimated effort**: 3–5 hours  
> **Risk**: Medium — changes to CI/CD workflows and Dockerfile

---

## Task 3.1 — Make the Drift Gate a Deploy Prerequisite

> **Addresses**: DB-16

Currently `db-drift.yml` and `deploy.yml` run **independently**. A developer can merge a PR that has schema drift and the deploy will still run, attempting `prisma migrate deploy` against a schema that doesn't match the migrations. If `prisma migrate deploy` succeeds but the diff is still non-zero, production ends up with an incorrect schema silently.

### Solution

Add a `needs: [db-drift]` dependency in `deploy.yml` so the deploy job only runs if the drift check passes.

**In `.github/workflows/deploy.yml`**, update the `deploy` job header:

```yaml
deploy:
  name: Deploy to Production
  needs: [quality-gate, build-and-push]   # current
```

→

```yaml
deploy:
  name: Deploy to Production
  needs: [quality-gate, build-and-push, db-drift-check]   # updated
```

But this requires `deploy.yml` and `db-drift.yml` to be in the same workflow file, OR you can use `workflow_run` to trigger the deploy only when the drift check passes.

**Simpler approach — merge the drift check into `deploy.yml` as a job:**

Move the drift-check steps from `db-drift.yml` into `deploy.yml` as a new `schema-drift-check` job that runs before `deploy`:

```yaml
jobs:
  quality-gate:
    ...

  schema-drift-check:
    name: Schema drift gate
    needs: [quality-gate]
    runs-on: ubuntu-latest
    services:
      shadow:
        image: postgis/postgis:16-3.4-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: shadow
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/shadow
      - name: Replay migrations
        run: pnpm --dir packages/db exec prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/shadow
      - name: Assert zero drift
        run: pnpm --dir packages/db exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/shadow

  build-and-push:
    needs: [schema-drift-check]
    ...

  deploy:
    needs: [build-and-push]
    ...
```

This ensures: **drift check must pass → build happens → deploy runs**. A single broken chain stops everything.

---

## Task 3.2 — Remove DATABASE_URL from Migrate Docker Image

> **Addresses**: DB-15

The `migrate` image is built `FROM builder AS migrate` and inherits all builder layers, including the `ARG DATABASE_URL` env layer. This image is pushed publicly to Docker Hub with the credential baked in an intermediate layer.

### Solution — Use a separate migration-only entrypoint that receives the URL at runtime only

**Change the `migrate` stage in `Dockerfile`** to start fresh from a minimal base instead of inheriting from builder:

```dockerfile
###############################################################################
# migrate-deps — minimal migration runner (no full app code needed)
###############################################################################
FROM node:22-alpine AS migrate-deps
RUN corepack enable
WORKDIR /app

# Copy only what's needed for prisma migrate deploy
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db ./packages/db

# Install only the db package (no DATABASE_URL needed at install time
# because prisma.config.ts reading DATABASE_URL is guarded to run-time only here)
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    PRISMA_SKIP_POSTINSTALL_GENERATE=1 \
    pnpm install --frozen-lockfile --filter @moja/db --store-dir /pnpm/store

###############################################################################
# migrate — one-shot DB migration job (no baked credentials)
###############################################################################
FROM migrate-deps AS migrate
RUN apk add --no-cache postgresql-client
# DATABASE_URL is provided ONLY at runtime via docker compose environment:
CMD ["sh", "-c", "pnpm --dir packages/db exec prisma migrate deploy"]
```

> [!IMPORTANT]
> This change requires that `prisma generate` NOT run during `pnpm install` in the migrate stage. Set `PRISMA_SKIP_POSTINSTALL_GENERATE=1` or remove the `postinstall` from `packages/db/package.json` for the migrate target. The Prisma client is not needed in the migrate container.

**Remove `DATABASE_URL_BUILD` secret from the `migrate` image build args** in `deploy.yml`:

```yaml
# OLD — credentials baked in
- name: Build and push migrate image
  uses: docker/build-push-action@v6
  with:
    build-args: |
      DATABASE_URL=${{ secrets.DATABASE_URL_BUILD }}

# NEW — no credentials at build time
- name: Build and push migrate image
  uses: docker/build-push-action@v6
  with:
    # No DATABASE_URL build arg for migrate target
    target: migrate
```

The `DATABASE_URL` is already injected at runtime via `compose.yml`:
```yaml
migrate:
  environment:
    DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
```

---

## Task 3.3 — Add Migration Rollback Safety to Deploy Script

> **Addresses**: DB-14

The current deploy sequence has no safety net if migration fails partway:

```bash
docker compose pull    # 1. pull
docker compose run --rm migrate  # 2. migrate  ← if this fails partially...
docker compose up -d   # 3. restart  ← new code runs against partially-migrated DB
```

### Solution — Health check before restart + rollback guidance

Add a migration status check before starting the app:

**In `.github/workflows/deploy.yml`**, the SSH deploy step should be updated:

```bash
# Step 3: Run migrations
docker compose run --rm migrate
MIGRATE_EXIT=$?

if [ $MIGRATE_EXIT -ne 0 ]; then
  echo "MIGRATION FAILED (exit $MIGRATE_EXIT)"
  echo "Not restarting app containers — DB may be in a partial state"
  echo "Manual intervention required:"
  echo "  1. docker exec moja-buss-db-1 psql -U moja -d moja -c 'SELECT * FROM _prisma_migrations WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL;'"
  echo "  2. Roll back or fix the failed migration before restarting the app"
  exit 1
fi

# Step 4: Restart app only if migration succeeded
docker compose up -d
```

This prevents new application code from running against an incomplete database schema.

Additionally, **document the manual recovery playbook** in `packages/db/MIGRATIONS.md`:

```markdown
## If a migration fails in production

1. Do NOT restart the web container yet.
2. Check which migration failed:
   docker exec moja-buss-db-1 psql -U moja -d moja \
     -c "SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5;"
3. If the migration is idempotent (uses IF NOT EXISTS / IF EXISTS), re-run it manually.
4. If it's not idempotent, assess the partial state and decide whether to complete manually or mark rolled back.
5. Once the DB is in a clean state, restart: docker compose up -d
```

---

## Task 3.4 — Enforce Incremental Migration Discipline

> **Addresses**: DB-10 (4-day bulk deploy gap pattern)

The audit found evidence that migrations are being committed days after being developed, then applied in bulk. This pattern caused the P0 incident documented in MIGRATIONS.md.

### Steps

**1. Add a MIGRATIONS checklist to the PR template** (create `.github/PULL_REQUEST_TEMPLATE.md` if it doesn't exist):

```markdown
## Database Changes
- [ ] If I modified `schema.prisma`, I ran `prisma migrate dev` and committed the generated migration
- [ ] The migration name follows the `YYYYMMDDHHMMSS_phaseXX_descriptive_name` format
- [ ] I did NOT use `prisma db push` against any shared database
- [ ] The drift gate is passing (`db-drift.yml` ✅)
```

**2. Update `packages/db/MIGRATIONS.md`** — add explicit rule about the pooler vs direct URL:

```markdown
## Rule 6 — Never use a pooler URL for migration commands
Migration commands (`prisma migrate dev`, `prisma migrate deploy`, `prisma migrate diff`,
`prisma db pull`) require a direct (non-pooler) PostgreSQL connection. Always use
`DATABASE_URL_DIRECT` for these commands. The runtime `DATABASE_URL` may point to a pooler.
```

---

## Completion Checklist

- [ ] `schema-drift-check` job added to `deploy.yml` as a prerequisite for `build-and-push`
- [ ] `db-drift.yml` can be retired or kept as a standalone PR check (both are fine)
- [ ] `migrate` Dockerfile stage no longer inherits from `builder` — starts from minimal base
- [ ] `DATABASE_URL_BUILD` arg removed from migrate image build in CI
- [ ] Deploy SSH script checks migration exit code before restarting app containers
- [ ] Migration failure recovery playbook added to `MIGRATIONS.md`
- [ ] PR template created with database changes checklist
- [ ] `MIGRATIONS.md` updated with pooler URL rule
