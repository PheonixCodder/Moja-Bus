# Production Deployment Report — Moja Buss

Full review of how to containerize `apps/web`, the self-hosted production topology (PostgreSQL, observability, tracking, Novu), the Docker vs Kubernetes decision, and the phased sequence to implement it — all captured as of 2026-08-03.

> **Scope:** Hosting `apps/web` first; `apps/traveler-app` (Expo) is pre-production but must be *monitored*, and adds API load onto `apps/web`. The report covers both.

---

## Legend / statuses

- **ACTION** — something to do (code, config, infra, or verification)
- **DECISION** — a product/architecture choice that must be made before the dependent work can proceed
- **RISK** — a production-blocking problem confirmed in the code
- **NOTE** — a discovered fact you should not forget
- **✅ READY** / **🕐 LATER** — relative to the launch timeline

---

## 1. Dependency inventory of `apps/web` (what the container must contain)

### 1.1 Monorepo structure the Docker build context depends on

- **Package manager:** pnpm `10.34.4` (`package.json:6` `packageManager`), workspace defined by `pnpm-workspace.yaml` (workspaces: `apps/*`, `packages/*`), lockfile `pnpm-lock.yaml`.
- **`.npmrc`** — `auto-install-peers=true`, `strict-peer-dependencies=false`, `engine-strict=false`. It does **not** currently contain `node-linker=hoisted`, despite an older `memory.md` note referencing it — verify whether hoisting was ever re-applied; if it was, the broken-junction Vercel build issue documented in `memory.md` can recur in Docker.
- **`pnpm-workspace.yaml` `allowBuilds`** — whitelists `@prisma/engines`, `esbuild`, `prisma`, `sharp`. This is essential: pnpm 10 blocks postinstall/bin scripts unless approved, and this whitelist is what lets `prisma generate` (in `@moja/db`) and `sharp` run. Fund the same approval in CI/Docker.
- **Root scripts:** `turbo build/dev/lint/typecheck/test`, `format`/`check` via Biome. Root deps: `turbo@2.10`, `typescript@6`, `@biomejs/biome`, husky, lint-staged. Root runtime deps also list `@tanstack/react-query`, `axios`, `zod`, `zustand`.

### 1.2 Workspace packages consumed by `apps/web` (all source-only, no build step)

| Package | Exports | Why it matters for Docker |
|---|---|---|
| `@moja/config` | `./src/index.ts` | `getRequiredEnv` throws when `DATABASE_URL` is missing — it is called eagerly by `packages/db/prisma.config.ts` (see 1.3). Source-only, compiled by Next via `transpilePackages`. |
| `@moja/db` | `./src/index.ts` + services | Prisma 7 client factory. `exports` points to raw `.ts`, `postinstall` runs `prisma generate`, deps `@prisma/adapter-pg@7`, `pg`, `dotenv`. Uses a global-`prisma` singleton. |
| `@moja/schemas` | `./src/*.ts` (auth, booking, fleet, payments, search, sync, tracking, operator, permissions, contact) | Shared zod contracts; source-only. |
| `@moja/types` | `./src/index.ts` | Shared TS types; source-only. |
| `@moja/ui` | `./src/components/*`, `.tsx`, hooks, lib, `globals.css` | shadcn-based component library depending on `@moja/theme`. Source-only, transpiled. |
| `@moja/theme` | `./global.css`, `./tokens.ts` | Design tokens. Peer-depends on `react-native@0.85.3` (odd for web; harmless if unused in web runtime but keep both deps resolvable). |
| `@moja/shared` | `./src/index.ts` | Pure utilities; used mainly by `apps/traveler-app`. |
| `@moja/typescript` | `base.json`, `next.json`, `node.json`, `react-native.json` | DevDep only (build-time tsconfigs). |

**Key consequence:** workspace packages ship **raw TypeScript**, not compiled output. Next.js compiles them at build via `next.config.ts` `transpilePackages: ["@moja/ui", "@moja/schemas", "@moja/db"]`. Therefore the Docker image MUST contain the whole `packages/` tree at build time — you can never build from just `apps/web` in isolation.

### 1.3 `@moja/db` — the special case

- `packages/db/prisma.config.ts` imports `@moja/config` and calls `getRequiredEnv("DATABASE_URL")` **at module top-level**.
- `packages/db/package.json` `postinstall` = `prisma generate --schema=prisma/schema.prisma`.
- **Implication:** running `pnpm install` in the image triggers `prisma generate`, which loads `prisma.config.ts`, which requires `DATABASE_URL` to be present — **or the install will fail**. You must set a `DATABASE_URL` (a placeholder is fine; `generate` does not connect) as a build ARG/ENV during install. Alternative: `pnpm install --ignore-scripts` and run `prisma generate` explicitly with `DATABASE_URL` set.
- Runtime client (`packages/db/src/index.ts`) uses `createRequire(import.meta.url)` to load `@prisma/adapter-pg` (a **dynamic require**). In a standalone image this package must be traced/copied; otherwise the runtime can’t build the adapter.

### 1.4 Next.js 16 specifics (read from `node_modules/next/dist/docs`)

- Version `16.2.9`; **engines: node >=20.9.0** → use **Node 22 LTS** in the image.
- Current image config would run as `next build` + `next start`. There is **no `output: "standalone"`** today → `next start` needs full `node_modules` present at runtime (unless we add standalone — see §2).
- `next.config.ts`:
  - `transpilePackages: ["@moja/ui", "@moja/schemas", "@moja/db"]`
  - `serverExternalPackages: ["better-auth"]` (better-auth left external, dynamic)
  - `images.remotePatterns` allow-list `cdn.mojaride.com`
  - `turbopack.resolveExtensions` and a `webpack` `extensionAlias` (`.js` → `.ts/.tsx`)
  - `createNextIntlPlugin("./i18n/request.ts")` (next-intl 4)
- Middleware: **`proxy.ts`** (Next 16 renamed `middleware.ts`); runs next‑intl locale handling; matcher excludes `api`, `_next`, dot-prefixed paths.

### 1.5 Production-packages / externals

- Native/expensive: **`sharp`** (images), **`@vercel/og`**, **`@aws-sdk/client-s3`** + `@aws-sdk/s3-request-presigner` (uploads), **`@prisma/client` + `@prisma/adapter-pg` + `pg`**, **`@novu/api` + `@novu/framework` + `@novu/nextjs` + `@novu/react`**.
- Auth: **`better-auth`** (+ `@better-auth/expo`, email-otp, phone-number, next-js plugins). Email OTP is delivered via Novu.
- Payments: **`@paystack/inline-js`**; VAT/ledger/escrow logic in `apps/web/features/payments`.
- Rendering: `next`, `react@19`, `next-intl`, `rehype`/`remark` (MDX docs/blogs), `shiki`, `nuqs`, `next-sitemap`, `orama` (search), `leaflet` (maps), `recharts`, `sonner`, `framer-motion`.
- Note: `resend` and `@react-email/components` are present (email artifacts); verify whether they must be exercised at runtime.

### 1.6 Environment variables — full production list

Source: `apps/web/.env.example` + code scan. Server (private):
- Required: `DATABASE_URL` (Prisma + `@prisma/adapter-pg`), `BETTER_AUTH_SECRET` (≥32 chars), `PAYSTACK_SECRET_KEY`, `NOVU_SECRET_KEY`, `CRON_SECRET`, `BANK_ENCRYPTION_KEY` (32-byte hex). Without `BETTER_AUTH_SECRET` auth breaks.
- Required Public (inlined at build by Next): `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_PAYSTACK_CHECKOUT_MODE`, `NEXT_PUBLIC_NOVU_APP_ID`.
- Optional server: `BANK_ENCRYPTION_KEY_PREVIOUS` (rotation), `BETTER_AUTH_URL`, `APP_URL`, `WITHDRAWAL_2FA_PEPPER` (falls back to `BETTER_AUTH_SECRET`).
- Optional server (S3/R2): `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_PUBLIC_URL_BASE` (all five S3_* required together; if omitted uploads break — the app has no local-disk fallback in `lib/storage/s3.ts`, it throws).
- Optional (auth): `ALLOWED_ORIGINS` (CSV; Better-Auth trusted origins — **must include the production origin**), `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (all four must be set or Google login is disabled), `EXPO_DEV_ORIGIN` (dev only).

**NEXT_PUBLIC_* nuance:** `trpc/routers/wallet.ts:50`, `payment-service.ts:116`, and `trpc/routers/passenger.ts:357` read `NEXT_PUBLIC_APP_URL` **server-side** too. Next inlines NEXT_PUBLIC_* into client bundles at build, but server reads happen at runtime. So set NEXT_PUBLIC_* **both** as build `args` and runtime `environment` in docker-compose.

### 1.7 Cron jobs (Vercel-only today)

`apps/web/vercel.json` schedules:
- `0 0 * * *` → `/api/cron/reconcile-payments`, `/api/cron/release-reservations`, `/api/cron/snapshot-accounts`, `/api/cron/publish-blogs`
- `0 1 * * *` → `/api/cron/release-escrow`
- `0 2 * * *` → `/api/cron/generate-trips`

All handlers call `assertCronAuthorized(request)` (`lib/cron-auth.ts`) and fail closed in production without header `Authorization: Bearer $CRON_SECRET` (a 401, or 500 if the secret is unset). **Vercel’s scheduler disappears on self-host — recreate these 6 jobs via host `crontab` or an Ofelia sidecar.** Time them so the 00:00 and 01:00 jobs don’t collide.

---

## 2. Dockerfile — how to build `apps/web`

### 2.1 Build context

Must be the **monorepo root** (`.`), because workspace package sources (`packages/*`), the shared lockfile, `.npmrc`, `pnpm-workspace.yaml`, `turbo.json`, and `tsconfig.base.json` are all required. Add a proper `.dockerignore` (exclude `node_modules`, `.next`, `.turbo`, `.git`, `apps/*` you don’t need, `.env`, logs). Do **not** rely on any platform adapter; we run a Node server.

### 2.2 Recomended multi-stage shape

| Stage | Base | Purpose |
|---|---|---|
| `base` | `node:22-alpine` + `corepack enable` | Install `pnpm`. Set `NEXT_TELEMETRY_DISABLED=1`. |
| `deps` | `base` | Copy manifests (`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`, `turbo.json`, `tsconfig.base.json`, `biome.json`) + `packages/` + `apps/web/`. Run `pnpm install --frozen-lockfile` with `DATABASE_URL` set (see 1.3), cached via `--mount=type=cache,id=pnpm`. |
| `builder` | `deps` | Set build-time envs, run `pnpm --filter web build`. |
| `runner` | `node:22-alpine` | Copy only the runtime output. `EXPOSE 3000`; `HOSTNAME=0.0.0.0 PORT=3000`. |

### 2.3 Runtime mode: Option A (standalone) vs Option B (next start)

**Option B — `next start` (recommended as the safe baseline).**
- Ship the full installed working tree (Node modules with workspace symlinks + `.next` + `public`).
- `CMD ["pnpm", "--filter", "web", "start"]` with `HOSTNAME=0.0.0.0 PORT=3000`.
- Pros: no tracing surprises — better-auth (external), `@prisma/adapter-pg`, `.prisma/client` generated code, etc. all resolve because nothing is stripped.
- Cons: large image (~1.5–2 GB), includes devDeps unless you prune.

**Option A — `output: "standalone"` (optimization, do after launch).**
- Requires two config changes (flagged, not done here):
  1. `next.config.ts`: add `output: "standalone"` **and** `outputFileTracingRoot: path.join(__dirname, "../..")` (the relative monorepo root). The tracing helper doc (in `node_modules/next/dist/docs/.../output.md`) explicitly calls out monorepo tracing root.
  2. Verify the trace includes `better-auth`, `@prisma/adapter-pg`, `pg`, `@prisma/client` (+ `.prisma/client` generated files); if not, add them to `serverExternalPackages` or `outputFileTracingIncludes`.
- Runner copies `.next/standalone`, `.next/static`, `public`; launch `node apps/web/.next/standalone/apps/web/server.js`.
- Caveat: workspace packages are raw TS + the adapter uses `createRequire` dynamic require → riskier. **Smoke-test `/api/auth/*`, `/api/trpc/*`, `/api/novu` from the built image before trusting it.**

**Build/migration timing:** do not run migrations at app startup. Run them as a one-shot step in the deploy (see §4).

---

## 3. PostgreSQL (self-hosted, Docker)

- **Image:** `postgres:16-alpine` (or 17), pinned. Named volume for data, `healthcheck` via `pg_isready`, on an internal bridge network. Never expose the port publicly.
- **Provisioning:** DB `moja`, dedicated user, strong password via env file / Docker secrets. Create DB + user before first app boot (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, initdb scripts for extensions).
- **Extensions:** the migration runner checks for `uuid-ossp` and `pgTRGGM` (search). Pre-create them (`CREATE EXTENSION IF NOT EXISTS`).
- **TLS:** enable SSL and set the `sslmode` accordingly in `DATABASE_URL`.
- **Pooling:** the app uses `@prisma/adapter-pg` with a single `DATABASE_URL`, no pooler. Fine for a single web replica. Add **PgBouncer** (in the Prisma 7 adapter works) only if you later scale replicas and hit connection limits.
- **Backups — mandatory:** nightly `pg_dump` (the custom migration runner itself refuses to skip backups and shells out to `pg_dump`). Store off-box/off-site; document restore via `psql "$DATABASE_URL" < backup.sql`.

### RISK — no versioned migrations exist

- There is **no `prisma/migrations` directory** anywhere (`packages/db/prisma/` has only `schema.prisma` + `seed.ts`; `apps/web/migrations/` has raw SQL `001_foundation_constraints(_rollback).sql`).
- Schema is currently pushed with `prisma db push` (per `memory.md`). `db push` is not safe for production (non-versioned, can force-destructive diffs).
- **Fix before production:** generate the first migration set locally (`prisma migrate dev --name init` against a fresh DB), commit it, and swap the deploy path to `prisma migrate deploy` as a one-shot pre-start job. Keep the custom foundation-constraints runner as a guarded step.

---

## 4. Environment / secrets integrity

- **Stop using `packages/db/.env`** — it currently holds a **real Neon PostgreSQL `DATABASE_URL` with a password** (file is gitignored but present on disk). Do not copy it into Docker, CI, or logs.
- Use per-environment `.env` files consumed by docker-compose (`.env` is already gitignored — `!.env.example` keeps the template tracked).
- Secrets are unique per environment and strong: `BETTER_AUTH_SECRET` / `CRON_SECRET` (`openssl rand -base64 32`), `BANK_ENCRYPTION_KEY` (`openssl rand -hex 32`).
- Never commit `.env`, `.env.local`, `*.pem`, or any S3/card/Google/Nou keys.

---

## 5. Reverse proxy, TLS, and URL wiring

- Put **Caddy** (or Nginx) in front of `web.:3000` with automatic Let’s Encrypt TLS for your domain(s). Configure WebSocket support if you later tunnel Novu WS.
- Set `BETTER_AUTH_URL` and `APP_URL` and `ALLOWED_ORIGINS` to the real canonical origin; verify `web/app/api/auth` callbacks and Paystack return URLs all match.
- **Add a `/api/health` route** (DB ping + basic status) — it does not exist yet, and health probes for the load balancer/uptime checker will want it. This is a small code addition.

---

## 6. Cron (self-host)

- Recreate all 6 Vercel jobs as host `crontab` (or an **Ofelia** container) hitting `https://<domain>/api/cron/<name>` with `Authorization: Bearer $CRON_SECRET`.
- Stagger times (00:00, 00:05, 00:10…; 01:00; 02:00) to avoid DB contention.
- Monitor cron success in SigNoz / Uptime Kuma / logs.

---

## 7. Observability & tracking (SigNoz + the rest)

### Recommission SigNoz — ✅ yes

- **Why:** OTel-native (metrics, traces, logs in one stack), self-hosted via Docker Compose (ClickHouse + OTLP Collector + Query-Service + frontend), Apache-2.0, no per-node license. Fits your self-managed dedicated-server model.
- **How for `apps/web` (Next.js):**
  - Add an `instrumentation.ts` (Next 16 supports `instrumentation.ts`) that registers the Node OpenTelemetry SDK with `@opentelemetry/auto-instrumentations-node` (http, PG/Prisma, Express/Next) and an OTLP exporter → SigNoz OTel Collector.
  - Next emits its own server-component/traceroute spans through the OTel hooks; `instrumentation.ts` ties them in.
  - Route server logs as structured JSON (e.g. pino/`next-logger`) to stdout and let the SigNoz collector ingest them as logs.
- **How for `apps/traveler-app` (Expo):**
  - OTel React Native is immature — don’t rely on it for the mobile app runtime.
  - Because the mobile backend is entirely `apps/web` (`/api/trpc`, `/api/payments/mobile-callback`), **SigNoz monitoring `apps/web` already covers the mobile app’s API**.
  - For mobile-side crash + product telemetry use **PostHog** (see below) or Sentry.

### Product tracking (open-source) — Recommission **PostHog**

- Self-hostable (open-core), with first-class **React Native SDK** → single tool for both web and mobile: funnels, retention, folder, session replay, feature flags.
- Alternative if you only need simple page-views on web: self-host **Umami** or **Plausible**. But since the mobile app must be tracked, PostHog is the single best choice.
- Set the snippet in `apps/web` and the React Native SDK in `apps/traveler`.

### Uptime / synthetic

- **Uptime Kuma** (self-host) checking `https://<domain>/` and `/api/health`, plus mobile API endpoints.

---

## 8. Novu hosting

- Current state: **code-first workflows** via `@novu/framework` **bridge served inside `apps/web` at `/api/novu`**, triggered through the REST SDK `@novu/api` (`lib/novu.ts`). ~30+ workflows across Email (SendGrid), SMS (Twilio), In-App inbox, push (Expo). In-app also surfaced via `@novu/nextjs` (`NEXT_PUBLIC_NOVU_APP_ID`).
- **Option A — Novu Cloud (managed):** simplest; set `NOVU_SECRET_KEY` / `NEXT_PUBLIC_NOVU_APP_ID`; cost per active subscriber; zero infra.
- **Option B — Self-host (matches your open-source premise):** Novu’s Docker Compose runs **MongoDB + Redis + `novu-api` + `novu-worker` + `novu-web` (dashboard) + `novu-ws`** (in-app websocket).
  - **VERIFY BEFORE COMMITTING:** recent Novu releases gate several **email/SMS providers (SendGrid, Twilio)** and some In-App features behind **Novu Enterprise (paid)**, not the free community self-host. If your production channels need Enterprise, self-hosting saves nothing.
- **Code changes required to self-host (flagged, not done):**
  - `lib/novu.ts`: `new Novu({ secretKey })` defaults to `https://api.novu.co` — must pass `serverURL` (verified: `@novu/api/lib/config.js` ServerList) to the self-hosted API.
  - `apps/web/app/api/novu/route.ts`: `new Client({ secretKey, apiUrl })` (verified: `@novu/framework` `Client` accepts `apiUrl`) must point at the self-hosted API.
  - Set the **Inbox WS** origin and `NEXT_PUBLIC_NOVU_APP_ID` from the self-hosted dashboard.
  - The web container must be reachable by Novu API/worker to sync bridge workflows.

---

## 9. Docker vs Kubernetes

**Recommission: start with Docker Compose on the dedicated servers.**

- Why: one app, few services (web, postgres, novu, sigNoz, postingtor, caddy, backups). Compose gives ordering (`depends_on`, healthchecks), restart policies, named volumes — no control plane.
- Kubernetes k3s adds etcd, CNI, ingress controller, cert manager, RBAC — real daily operational cost with no scaling benefit yet.
- **Path to upgrade:** when you need ≥2 web replicas with HA, multiple service replicas, rolling zero-downtime deploys, or several servers — move to **k3s on bare metal** or a 2-node cluster. The Docker images you build now port over unchanged.

**Suggested 2-server layout:**
- **Host A:** `web` (Next.js) + Caddy/Nginx TLS + SigNoz + Uptime Kuma + PostHog/Umami.
- **Host B:** PostgreSQL + nightly backups + Novu (MongoDB + Redis + Novu services) + (optional) MinIO if self-hosting S3-compatible storage.
  Storage note: `@aws-sdk` + `S3_ENDPOINT` supports MinIO/R2/AWS — no local upload volume needed.

---

## 10. Phased implementation sequence

Dependency-ordered so that nothing blocks and risk is removed first.

### Phase 0 — Decisions (this week)
- **D1. Database migration strategy** (RISK): switch from `prisma db push` to versioned `prisma migrate`. Generate `init` migration locally, commit, plan `migrate deploy` one-shot at deploy.
- **D2. Novu** — self-host vs cloud; confirm SendGrid/Twilio provider licensing before choosing self-host. Default: **Novu Cloud** for launch.
- **D3. Tracking tool** — PostHog (self-host) vs Umami. Default: **PostHog** (needed mobile anyway).

### Phase 1 — Reproducible Docker build (unblocks everything)
- **T1.** Write `.dockerignore` + not-wired test Dockerfile from the monorepo root; placeholder `DATABASE_URL` for install; `pnpm install --frozen-lockfile`; `pnpm --filter web build`.
- **T2.** Choose runtime mode: **standalone output now** (decision taken; not `next start`).
- **Verify:** built image boots; `/api/auth/*`, `/api/trpc/*`, `/api/novu` respond.

**✅ PHASE 1 DONE (2026-08-03):**
- `next.config.ts`: added `output: "standalone"` + `outputFileTracingRoot: path.join(__dirname, "../..")`; extended `serverExternalPackages` to `["better-auth", "@prisma/adapter-pg", "pg"]`.
- Added repo-root `.dockerignore` (excludes node_modules/.next/env/docs/etc.; keeps all `packages/*` and the three workspace app importers — `apps/traveler-app`, `apps/traveler-app-2`, `apps/web`; `app-example`/`duolingo-clone` are not importers and are excluded).
- Added repo-root `Dockerfile` (base → deps → builder → runner; `node:22-alpine`, `corepack`, `pnpm install --frozen-lockfile` with pnpm store cache mount + `--config.package-import-method=copy` for overlayfs, `DATABASE_URL` build-arg for the `prisma generate` postinstall, `pnpm --filter web build`, manual copy of `public` + `.next/static` into `.next/standalone`, non-root `nextjs` user, `HEALTHCHECK` on `/`, `CMD ["node", "apps/web/server.js"]`).
- Build: `docker build -f Dockerfile --build-arg DATABASE_URL=<dev Neon> --build-arg NEXT_PUBLIC_* ... -t moja-web:phase1 .` → **succeeded**; image **416 MB**.
- Runtime smoke-test (real DB via Neon): `/` 200, `/operators` 200, `/blog` 200, `/api/auth/ok` 200 `{"ok":true}` (better-auth external OK), `POST/GET /api/trpc/public.listOperators` 200 (Prisma adapter + pg round-trip OK), `/api/novu` 200 (bridge, 34 workflows). next-intl 307s are default-locale canonicalization, not loops.
- Lockfile synced: `pnpm install` reports lockfile up to date (the large `pnpm-lock.yaml` diff vs HEAD is pre-existing working-tree state — commit it to make `--frozen-lockfile` reproducible in CI).

### Phase 2 — Production hardening (before exposing to users)
- **T3.** Secrets & env hygiene (§3): move off `packages/db/.env`, per-env `.env`/secrets, unique strong secrets.
- **T4.** `/api/health` endpoint (§4) + recreate the 6 crons via host `crontab`/ & and verify each returns 200 in staging.
- **T5.** Caddy/Nginx + Let’s Encrypt in front; set `BETTER_AUTH_URL`, `APP_URL`, `ALLOWED_ORIGINS` to the real domain; smoke-test sign-in through the proxy.

**✅ PHASE 2 DONE (2026-08-03):**
- **T3 (secrets/env):** Added root `compose.yml` reading a gitignored root `.env` (Compose auto-loads it), plus a committed `.env.example` documenting every runtime/build var and how to generate secrets (`openssl rand -base64 32` / `-hex 32`). Production domain decision: **`mojaride.net`** (Caddy Let’s Encrypt on the server; `SITE_ADDRESS=localhost` + internal CA used for the local smoke test).
- **T4 (health + crons):**
  - New `GET /api/health` (`apps/web/app/api/health/route.ts`): plain Next route (outside the next-intl matcher, which already excludes `/api`). Liveness (no query) → always 200 `{status,uptime,timestamp,db:"skipped"}` — no DB hit, so a brief external-DB blip can’t restart the container. Readiness `?full=1` → runs `$queryRaw\`SELECT 1\`` and returns 503 `{db:"error"}` if the DB is unreachable.
  - Docker `HEALTHCHECK` updated from `/` to `/api/health`; compose `web` healthcheck matches (wget, 30s/5s/60s/3).
  - Recreated all 6 Vercel crons as a **containerized curl-cron sidecar** (`deploy/cron`: alpine + curl + busybox crond). `entrypoint.sh` substitutes `CRON_SECRET` into the crontab at start (sed `#` delimiter — safe for base64), then runs `crond -f -L /dev/stdout` so job output lands in `docker logs`. Schedules staggered from `vercel.json` to avoid 00:00 DB contention: reconcile-payments `0 0`, release-reservations `5 0`, snapshot-accounts `10 0`, publish-blogs `15 0`, release-escrow `0 1`, generate-trips `0 2`. `cron` depends on `web: service_healthy`.
- **T5 (Caddy/TLS):** Added `deploy/caddy/Caddyfile` — `{$SITE_ADDRESS}` site block (env-injected), `reverse_proxy web:3000`, gzip/zstd, HSTS + security headers, JSON access logs to stdout. `web` is not port-published (internal-only); Caddy publishes 80/443.
- **Verified locally** (Docker Desktop, `SITE_ADDRESS=localhost`, internal CA): stack up, `web` healthy; through Caddy `https://localhost` → `/` 200, `/api/auth/ok` 200 `{"ok":true}`, `/api/novu` 200, `/api/health` 200, `/api/health?full=1` 200 (DB round-trip OK via Neon), cron with wrong secret 401, cron with correct secret 200. `cron` container: “Installed 6 jobs”, crond running, secret substituted, zero leftover `__CRON_SECRET__` placeholders.
- **Notes for launch:** rotate the Neon password (still present in `packages/db/.env` on disk, gitignored); on the server set `SITE_ADDRESS=mojaride.net` in `.env` and let Caddy provision the cert.

**✅ QUICK WINS DONE (2026-08-04):**
- **`metadataBase` build warning fixed** (`apps/web/app/[locale]/layout.tsx`): added `metadataBase: new URL(process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000")` + `openGraph.siteName` so relative OG/Twitter image paths (blog, home) resolve against the production origin instead of `localhost`. Verified: build log no longer shows the warning; live homepage renders `og:image="https://localhost/home/_.jpg"` (would be `https://mojaride.net/…` on the server). Used index-signature access (`process.env["…"]`) to satisfy `tsc --noEmit`.
- **End-to-end smoke test through Caddy** (all against self-hosted Postgres): `/api/health` + `?full=1` 200; `/api/auth/ok`, `get-session` 200; **email OTP send** `{"success":true}`; **phone OTP send** `{"message":"code sent"}`; email+password sign-in correctly returns `EMAIL_PASSWORD_DISABLED` (OTP/Google-only auth by design); **tRPC** `public.listOperators` 200 `{"json":[]}` (real DB round-trip, empty fresh DB); **Paystack webhook** bad signature → 401; **payment verify** invalid holdGroupId → 400; **ticket verify** bad token → 404; **cron** without secret 401, with `Authorization: Bearer <secret>` 200 (matches `deploy/cron/crontab.template`).
- **R7 (Neon password rotation) — still a MANUAL step, needs you:** no `neonctl` / `NEON_API_KEY` available in this environment. After rotating in the Neon console/API, update **both**: (1) `packages/db/.env` → `DATABASE_URL` (local prisma CLI/dev; gitignored, excluded from Docker via `.dockerignore`), and (2) root `.env` → `DATABASE_URL_BUILD` (feeds `docker build --build-arg DATABASE_URL`, used by `prisma generate` postinstall + Next prerender).

### Phase 3 — Stack bring-up (parallel)
- **T6.** PostgreSQL container + healthcheck + nightly `pg_dump`; then run the new migration strategy (Phase 0. D1) against it.

**✅ T6 DONE (2026-08-04):**
- **Self-hosted Postgres:** `postgres:16-alpine` `db` service with `db_data` volume, `pg_isready` healthcheck, and `deploy/db/init/01-extensions.sql` (`uuid-ossp`, `pg_trgm`) auto-applied on first init.
- **Versioned migrations:** baseline `0_init` generated via `prisma migrate diff --from-empty --to-schema` (2009 lines, committed under `packages/db/prisma/migrations/`, plus `migration_lock.toml`). One-shot `migrate` service (`Dockerfile` target `migrate`, `depends_on db: service_healthy`) runs `prisma migrate deploy`; `web` waits on `migrate: service_completed_successfully`. Runtime `DATABASE_URL` for `web`/`migrate` points at the `db` service; build-time `DATABASE_URL_BUILD` (Neon) only feeds image build.
- **Nightly backups:** `backup` service (postgres client + busybox crond) runs `pg_dump | gzip` nightly at 01:30 into the `backups` volume; retention 14 days (`find -mtime +N -delete`). **Fix during T6:** `pg_dump` does not read `POSTGRES_PASSWORD` — `dump.sh` now exports `PGPASSWORD` (else backups silently write a 20-byte gzip of the auth error).
- **Verified locally:** 67 tables created from `0_init` (snake_case via `@@map` — `company`, `operator`, …); `_prisma_migrations` has 1 applied row; stack up: `db` healthy, `migrate` exited 0, `web` healthy; through Caddy `https://localhost` → `/api/health` 200, `/api/health?full=1` 200 (DB round-trip against **self-hosted** Postgres), `/api/auth/ok` 200; backup container wrote a valid gzipped dump (`gzip -t` OK, real pg_dump SQL).
- **Decision — stale foundation runner removed from migrate flow:** the legacy `apps/web/scripts/run-migrations.ts` + `001_foundation_constraints.sql` targets PascalCase tables (`"Company"`, `"Operator"`, `"Revenue"`) that no longer exist — the schema models use `@@map` to snake_case, so the runner fails on a fresh DB (`relation "Operator" does not exist`) and its rollback cannot run (`DROP INDEX CONCURRENTLY` inside a transaction). No app code references its objects (`AuditLog`, `version` columns, UTC/timezone functions). **Per user decision, the migrate flow now runs `prisma migrate deploy` only** (see R10).
- **T7.** ~~SigNoz deploy via compose; instrument Web with `instrumentation.ts` + OTel SDK + collection; verify traces for `/api/trpc` calls from the mobile app.~~ **✅ DONE (code) 2026-08-04** — see done-block below.
- **T8.** PostHog (or Umami) self-host; add web snippet + React Native SDK.

**✅ T8 DONE (code) 2026-08-04 — full official PostHog hobby stack (self-host):**
- **Why full official stack:** the Expo app must be tracked, and only PostHog covers web + React Native product telemetry (posthog-js + posthog-react-native) in one product. Chosen over server-only/binary (kept API compatible but more setup), Umami (web only), and PostHog Cloud (data leaves our infra).
- **Cost/weight warning accepted:** ~25 services (web, worker, plugins, capture/livestream Rust images, kafka, zookeeper, redis7, clickhouse, temporal, minio, postgres:15, browserless) + its **own Caddy proxy on 80/443**, ~16GB RAM/30GB disk, ~5-10 min boot. **Cannot boot on this Docker Desktop** (no local state) — it targets a Linux VM. Official `bin/deploy-hobby` clones the whole PostHog repo (ClickHouse configs, Rust build contexts, entrypoints), so it is a **separate compose project** under `deploy/posthog/`, NOT part of the root `compose.yml`.
- **Phase 1 — server installer done:** `deploy/posthog/install.sh` (adapted from official `bin/deploy-hobby`: non-interactive `POSTHOG_APP_TAG`/`DOMAIN`, no apt/docker/sudo, clones `posthog/posthog`, downloads `share/GeoLite2-City.mmdb`, writes `.env` only on fresh install with generated `POSTHOG_SECRET`/`ENCRYPTION_SALT_KEYS`/`BROWSERLESS_SECRET`, copies official compose files + entrypoint scripts, writes a `docker-compose.override.yml` that disables PostHog's own `proxy` via profiles and publishes `web` loopback-only `127.0.0.1:8000`, then `docker compose up -d --no-build --pull always` — nothing compiled on the server). README with prerequisites/deploy/upgrade/troubleshooting written.
- **Phase 3 — Caddy fronting done:** third site block `{$POSTHOG_ADDRESS}` in `deploy/caddy/Caddyfile` → `host.docker.internal:8000` (PostHog web is loopback-only on the host; `extra_hosts: host.docker.internal:host-gateway` added to the `caddy` service in `compose.yml`). `POSTHOG_ADDRESS=posthog.mojaride.net` in `.env.example`; local `.env` uses `posthog.localhost` placeholder (an empty value would be a Caddy parse error). PostHog's own Caddy is never started → no 80/443 conflict.
- **Phase 2 — web SDK done:** `posthog-js@1.410.6` added to `apps/web`; `components/posthog-provider.tsx` (client, inits `posthog.init` with `NEXT_PUBLIC_POSTHOG_KEY`/`NEXT_PUBLIC_POSTHOG_HOST`; no-ops when env is absent) mounted in `app/[locale]/layout.tsx`. Web typecheck + biome clean.
- **Phase 2 — RN SDK done:** `posthog-react-native@4.61.4` added to `apps/traveler-app`; `lib/posthog.ts` (`new PostHog(key,{host})` from `EXPO_PUBLIC_POSTHOG_KEY`/`EXPO_PUBLIC_POSTHOG_HOST`, null without them) wired as `<PHProvider client={posthog ?? undefined}>` in `app/_layout.tsx`. Traveler typecheck + biome clean (2 pre-existing warnings only).
- **Phase 4 — build verification done:** local `next build` exit 0 (posthog-js bundled into a client chunk `3oa7uj3wriwte.js`, no warnings/errors); `docker compose build web` succeeded (core-js build script ignored by pnpm is harmless — package ships precompiled); `web` container recreated on the new image, healthy; smoke through Caddy: `/api/health?full=1` 200, `/api/auth/ok` 200, `/` 200. **Remaining is server-side only (user TODO):** DNS A record `posthog.mojaride.net`, run `deploy/posthog/install.sh`, set admin password, create project, copy key into root `.env` `NEXT_PUBLIC_POSTHOG_KEY` + `apps/traveler-app/.env.local` `EXPO_PUBLIC_POSTHOG_KEY` (host `https://posthog.mojaride.net`).
- **TODO on the server (user):** DNS **A record `posthog.mojaride.net`** → server IP; run `cd deploy/posthog && POSTHOG_APP_TAG=latest DOMAIN=posthog.mojaride.net ./install.sh`; set admin password; create a project and copy its API key into root `.env` (`NEXT_PUBLIC_POSTHOG_KEY`) + `apps/traveler-app/.env.local` (`EXPO_PUBLIC_POSTHOG_KEY`), host is `https://posthog.mojaride.net`.

**✅ T9 DONE (2026-08-04):**
- **Uptime Kuma** (`louislam/uptime-kuma:1`) added as `status` service in `compose.yml` with `kuma_data` named volume (SQLite + monitor config) and its built-in healthcheck (`node extra/healthcheck.js`).
- **Public subdomain** per user decision: Caddy now serves `{$STATUS_ADDRESS}` (`deploy/caddy/Caddyfile` second site block) → `status:3001`, same HSTS/security headers; `STATUS_ADDRESS=status.mojaride.net` documented in `.env.example`, `status.localhost` used for the local smoke test.
- **Verified locally:** `status` healthy; Caddy auto-issued an internal cert for `status.localhost`; `https://status.localhost` → 302 → `/dashboard` 200 serving the Kuma app.
- **TODO on the server (user):** add a **DNS A record `status.mojaride.net`** → server IP; after first login at the status page, set the **admin password** and add monitors: `https://mojaride.net/`, `/api/health`, `/api/health?full=1`, `/api/auth/ok`, and the mobile API base (`EXPO_PUBLIC_API_URL`). Alerts (email/webhook/Telegram) are configured in the Kuma UI, not compose.
**✅ T7 DONE (code) 2026-08-04 — SigNoz (self-host, OTel-native tracing):**
- **Why SigNoz:** OTel-native (traces/metrics/logs in one stack), Apache-2.0 self-host; the mobile traveler app's backend is entirely `apps/web`, so monitoring `apps/web` covers the mobile API. Chosen over Sentry (SaaS/proprietary) and the deprecated `deploy/` compose (removed in SigNoz v0.130.0 — **Foundry** `foundryctl` is now the supported install: 5 services, UI/OTLP ports 8080/4317/4318).
- **Web instrumentation (applied + verified):** `@vercel/otel@2.1.3` + `@opentelemetry/api@1.9.1` added to `apps/web`; `apps/web/instrumentation.ts` calls `registerOTel({ serviceName: process.env["OTEL_SERVICE_NAME"] || "moja-buss-web" })`. Auto-config reads `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`; verified in the OTel SDK source that an **empty/undefined endpoint short-circuits export** — local dev sends no traces. `tsc --noEmit` clean, biome clean, `instrumentation` emitted into `.next/server/instrumentation.js` + chunk `apps_web_instrumentation_ts_0937fhg._.js`.
- **Compose/Caddy/env wiring:** `OTEL_SERVICE_NAME`/`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`/`OTEL_RESOURCE_ATTRIBUTES` on the `web` service in `compose.yml` + `extra_hosts: host.docker.internal:host-gateway`; fourth Caddy block `{$SIGNOZ_ADDRESS}` → `host.docker.internal:8080`; `SIGNOZ_ADDRESS` on the `caddy` service env. `.env.example`: `SIGNOZ_ADDRESS=signoz.mojaride.net` + OTel block (`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://host.docker.internal:4318/v1/traces`); local `.env`: `SIGNOZ_ADDRESS=signoz.localhost`, empty OTel vars.
- **Server installer done:** `deploy/signoz/install.sh` (installs `foundryctl` via the official `https://signoz.io/foundry.sh`, writes a minimal `casting.yaml` only on fresh install, `foundryctl forge` renders the compose under `pours/deployment/`, then failure-tolerant `sed` binds UI/OTLP to loopback `127.0.0.1:8080/4317/4318`, `docker compose up -d`) + `deploy/signoz/README.md` (architecture, why Foundry, install, `.env` wiring, first login, upgrade, troubleshooting incl. the ClickHouse-Keeper-on-Docker-Desktop restart-loop caveat).
- **Verified locally (web side):** `docker compose config --quiet` OK re: instrumentation typecheck + web build; Docker image `moja-buss-web` rebuilt, container healthy; smoke through Caddy: `/api/health?full=1` 200, `/api/auth/ok` 200, `/` 200; `https://signoz.localhost/` → 502 (expected — SigNoz not deployed locally; proves the 4th block parses/routes). **Remaining is server-side only (user TODO):** DNS A record `signoz.mojaride.net`, run `deploy/signoz/install.sh`, set admin password, set `SIGNOZ_ADDRESS` + `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` in root `.env`.
- **T10.** ~~Storage: point uploads at R2/AWS or MinIO (`S3_*`), verify a file upload end-to-end.~~ **✅ DONE (confirmed) 2026-08-04** — **Cloudflare R2 in production, working end-to-end; the R2 free quota is sufficient for us** (no self-hosted MinIO needed). `S3_ENDPOINT`/`S3_REGION`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`/`S3_BUCKET`/`S3_PUBLIC_URL_BASE` in root `.env` point at R2; `apps/web/lib/storage/s3.ts` (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, `cdn.mojaride.com` already allow-listed in `next.config.ts` images.remotePatterns) is the single upload path. No code changes required. **User TODO (launch):** ensure the R2 custom domain (`cdn.mojaride.com`) DNS + bucket CNAME are in place and re-verify one upload from staging.

### Phase 4 — Cutover
- **T11.** Run migrations; ship `web`; point the domain; smoke-test **auth / payments / webhooks / crons / invoices**.
- **T12.** Watch SigNoz for the first day of traffic.
- **T13.** Before mobile release, repoint `EXPO_PUBLIC_API_URL` in `apps/traveler-app` to the new production domain; release the app.

---

## 11. Risks / follow-ups tracker

| # | Risk | Severity | Owner | Status | Notes |
|---|---|---|---|---|---|
| R1 | No versioned DB migrations (`prisma db push`) | **High** | Back-end | ✅ Resolved | Phase 3 T6 — baseline `0_init` committed + `migrate` one-shot service runs `prisma migrate deploy`; verified against self-hosted Postgres. |
| R2 | `prisma generate` in Docker fails without `DATABASE_URL` | **High** | Infra/Backend | ✅ Resolved | Confirmed: `prisma.config.ts` reads it eagerly; build-arg `DATABASE_URL` fixes install. Verified in Phase 1 build. |
| R3 | Novu self-host provider licensing (SendGrid/Twilio/In-App) | **High** | Product/Infra | Open | Phase 0 D2 |
| R4 | Cron jobs are Vercel-only (vercel.json) | Medium | Infra | ✅ Resolved | Phase 2 T4 — containerized curl-cron sidecar (`deploy/cron`), 6 jobs, verified 401 without / 200 with secret. |
| R5 | No `/api/health` | Medium | Backend | ✅ Resolved | Phase 2 T4 — `/api/health` (liveness) + `?full=1` (readiness w/ DB ping); wired into Docker + compose healthchecks. |
| R6 | `NEXT_PUBLIC_*` needed at build AND runtime | Low | Infra | ✅ Resolved | Passed as build-args AND `docker run -e`; verified working (server-side reads OK). |
| R7 | `packages/db/.env` holds live Neon creds | High | Security | 🕐 Mitigated | Compose path no longer references it; root gitignored `.env` is the single source for the stack; excluded from Docker via `.dockerignore`. **Still on disk (gitignored, untracked) — rotation is a manual Neon-console step (no neonctl/API key here); update `packages/db/.env` + root `.env` `DATABASE_URL_BUILD` after rotating.** |
| R8 | OTel RN immature for traveler-app native tracing | Low | Infra | 🕐 Mitigated | PostHog RN SDK wired into `apps/traveler-app` (T8 Phase 2); system/APM metrics still via SigNoz on web. |
| R9 | Standalone output + raw-TS workspace packages + adapter requires | Medium | Backend/Infra | ✅ Resolved | `outputFileTracingRoot` + `serverExternalPackages`(better-auth, @prisma/adapter-pg, pg) → all resolve at runtime; image 416 MB. |
| R10 | Stale foundation-constraints migration (`run-migrations.ts` + `001_foundation_constraints.sql`) | Medium | Backend | ✅ Resolved | Targets PascalCase tables that no longer exist after the `@@map` snake_case refactor; never re-run against current schema; no app code uses its objects. **User decision:** removed from the migrate flow (Dockerfile `migrate` CMD now runs `prisma migrate deploy` only). Files kept for history. |

---

## 12. Decisions log

- **D1 — DB migrations:** ✅ **`prisma migrate` (versioned)** — baseline `0_init` committed; `migrate` one-shot service runs `migrate deploy`; legacy foundation SQL runner removed from the flow (R10).
- **D2 — Novu:** [pending] → default Novu Cloud for launch; revisit self-host.
- **D3 — Tracking:** ✅ **PostHog (self-host, full official hobby stack)** — separate compose project `deploy/posthog/`, fronted by the moja-buss Caddy at `posthog.mojaride.net`; web + React Native SDKs wired (T8).
- **D4 — Scheduler:** ✅ **Containerized curl-cron sidecar** (`deploy/cron`: alpine + busybox crond; crontab generated at container start from `CRON_SECRET`). Chosen over host crontab (stays inside Docker, no docker socket like Ofelia).
- **D5 — Runtime mode:** ✅ **Standalone output** (`output: "standalone"` + `outputFileTracingRoot` + extended `serverExternalPackages`). Verified working; image 416 MB.
- **D6 — Orchestration:** ✅ **Docker Compose now** (`compose.yml`: web + cron + caddy; `depends_on: service_healthy`; k3s later).
- **D7 — Proxy/TLS/domain:** ✅ **Caddy** with automatic Let’s Encrypt; production domain **`mojaride.net`** (DNS points at the server); `SITE_ADDRESS` env-injected into the Caddyfile. Local smoke test uses `SITE_ADDRESS=localhost` (internal CA).
- **D8 — Storage:** ✅ **Cloudflare R2** (confirmed working 2026-08-04; free quota sufficient — no self-hosted MinIO). `S3_*` envs point at R2; `cdn.mojaride.com` allow-listed for images.

---

## 13. Appendix — quick commands / references (do not run blindly)

- `openssl rand -base64 32` → `BETTER_AUTH_SECRET`, `CRON_SECRET`
- `openssl rand -hex 32` → `BANK_ENCRYPTION_KEY`
- Prisma generate (if not using postinstall): `pnpm --filter @moja/db exec prisma generate`
- Build: `pnpm --filter web build`
- Run: `pnpm --filter web start` (or standalone `server.js`)
- Backup: `pg_dump "$DATABASE_URL" > backup_$(date +%F).sql`
- Restore: `psql "$DATABASE_URL" < backup.sql`
- Related Next docs (installed): `node_modules/next/dist/docs/01-app/01-getting-started/17-deploying.md`, `.output config` at `01-app/03-api-reference/05-config/01-next-config-js/output.md`