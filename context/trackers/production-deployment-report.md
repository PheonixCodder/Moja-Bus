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

### Phase 3 — Stack bring-up (parallel)
- **T6.** PostgreSQL container + healthcheck + nightly `pg_dump`; then run the new migration strategy (Phase 0. D1) against it.
- **T7.** SigNoz deploy via compose; instrument Web with `instrumentation.ts` + OTel SDK + collection; verify traces for `/api/trpc` calls from the mobile app.
- **T8.** PostHog (or Umami) self-host; add web snippet + React Native SDK.
- **T9.** Uptime Kuma monitoring the web app, `/api/health`, mobile API endpoints.
- **T10.** Storage: point uploads at R2/AWS or MinIO (`S3_*`), verify a file upload end-to-end.

### Phase 4 — Cutover
- **T11.** Run migrations; ship `web`; point the domain; smoke-test **auth / payments / webhooks / crons / invoices**.
- **T12.** Watch SigNoz for the first day of traffic.
- **T13.** Before mobile release, repoint `EXPO_PUBLIC_API_URL` in `apps/traveler-app` to the new production domain; release the app.

---

## 11. Risks / follow-ups tracker

| # | Risk | Severity | Owner | Status | Notes |
|---|---|---|---|---|---|
| R1 | No versioned DB migrations (`prisma db push`) | **High** | Back-end | Open | Phase 0 D1 / T4 |
| R2 | `prisma generate` in Docker fails without `DATABASE_URL` | **High** | Infra/Backend | ✅ Resolved | Confirmed: `prisma.config.ts` reads it eagerly; build-arg `DATABASE_URL` fixes install. Verified in Phase 1 build. |
| R3 | Novu self-host provider licensing (SendGrid/Twilio/In-App) | **High** | Product/Infra | Open | Phase 0 D2 |
| R4 | Cron jobs are Vercel-only (vercel.json) | Medium | Infra | Open | Phase 2 T4 |
| R5 | No `/api/health` | Medium | Backend | Open | Phase 2 T4 |
| R6 | `NEXT_PUBLIC_*` needed at build AND runtime | Low | Infra | ✅ Resolved | Passed as build-args AND `docker run -e`; verified working (server-side reads OK). |
| R7 | `packages/db/.env` holds live Neon creds | High | Security | Open | Clean & move to compose/secrets |
| R8 | OTel RN immature for traveler-app native tracing | Low | Infra | Open | Use PostHog; monitor via web |
| R9 | Standalone output + raw-TS workspace packages + adapter requires | Medium | Backend/Infra | ✅ Resolved | `outputFileTracingRoot` + `serverExternalPackages`(better-auth, @prisma/adapter-pg, pg) → all resolve at runtime; image 416 MB. |

---

## 12. Decisions log

- **D1 — DB migrations:** [pending] → default `prisma migrate` (versioned).
- **D2 — Novu:** [pending] → default Novu Cloud for launch; revisit self-host.
- **D3 — Tracking:** [pending] → default PostHog (self-host); fallback Umami.
- **D4 — Scheduler:** [pending] → host `crontab` or Ofelia.
- **D5 — Runtime mode:** ✅ **Standalone output** (`output: "standalone"` + `outputFileTracingRoot` + extended `serverExternalPackages`). Verified working; image 416 MB.
- **D6 — Orchestration:** [pending] → Docker Compose now; k3s later.

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