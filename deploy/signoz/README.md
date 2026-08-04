# SigNoz (self-hosted) — T7

OpenTelemetry-native tracing for the moja-buss backend. Since the mobile
traveler app is a thin client over the `apps/web` API, instrumenting `apps/web`
covers the whole mobile backend.

## Architecture

```
[traffic] ──> Caddy (port 443)
                ├── https://mojaride.net        -> web container  (Next.js)
                └── https://signoz.mojaride.net -> 127.0.0.1:8080 (SigNoz UI)

web container ──OTLP HTTP──> host.docker.internal:4318 ──> SigNoz ingester
```

- `apps/web/instrumentation.ts` boots `@vercel/otel` `registerOTel`. It is a
  safe no-op when `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` is unset, so local dev
  sends no traces.
- The `web` compose service gets the OTel env vars + an `extra_hosts` entry so
  `host.docker.internal` resolves from inside the container.
- The Caddy block for `{$SIGNOZ_ADDRESS}` proxies to `host.docker.internal:8080`
  (SigNoz runs as a **separate** compose project, not in `compose.yml`).

## Why Foundry

SigNoz removed its bundled `deploy/` docker-compose in v0.130.0. The supported
install path is now **Foundry** (`foundryctl`), which renders the
`clickhouse-setup` preset: otel-collector-ingester, signoz-server, clickhouse,
clickhouse-keeper and postgres. The output lands in `pours/deployment/` inside
the `deploy/signoz/` directory — entirely separate from the moja-buss root
compose project.

## Install (Linux VM / production server)

Prerequisites: Docker + Compose v2, ~4 GB RAM, ~4 vCPUs, and a native Linux
Docker engine. Like the PostHog stack, SigNoz's ClickHouse Keeper **will not
run on Docker Desktop** (segfaults/restart loops) — use WSL2 with the native
Docker Engine, or the production VM.

```bash
cd deploy/signoz
./install.sh
```

The script installs `foundryctl`, writes a minimal `casting.yaml`, renders the
compose files with `foundryctl forge`, then rewrites the published ports to
loopback-only and starts the stack:

- `127.0.0.1:8080` — SigNoz UI + API (never exposed directly; Caddy fronts it)
- `127.0.0.1:4317` — OTLP gRPC
- `127.0.0.1:4318` — OTLP HTTP (what `apps/web` exports to)

## Point the app at it

In the repo-root `.env` (server):

```bash
SIGNOZ_ADDRESS=signoz.mojaride.net
OTEL_SERVICE_NAME=moja-buss-web
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://host.docker.internal:4318/v1/traces
OTEL_RESOURCE_ATTRIBUTES=service.version=1.0.0   # optional
```

Then `docker compose up -d web caddy` to apply the env + restart. Traces should
appear in the SigNoz UI within ~30 s (traces tab → "Moja Bus Web" service).

## First login

Open `https://signoz.mojaride.net`. On first visit SigNoz asks you to create the
admin account (email + password). Store these in the password manager — there is
no recovery flow.

## Upgrade

```bash
cd deploy/signoz
foundryctl forge -f casting.yaml   # re-render (keeps your casting.yaml edits)
docker compose -f pours/deployment/compose.yaml up -d --force-recreate
```

## Troubleshooting

- **UI/OTLP exposed on 0.0.0.0** — the loopback rewrite is failure-tolerant.
  If `docker ps` shows `0.0.0.0:8080->8080`, the port lines in the generated
  compose changed format; edit `pours/deployment/compose.yaml` and bind
  `8080`, `4317`, `4318` to `127.0.0.1`.
- **clickhouse-keeper restart-looping** — you are on Docker Desktop; use WSL2
  native engine or the VM (see above).
- **No traces in UI** — confirm `docker ps` shows `signoz-ingester-1` publishing
  `4317-4318`, and that the web container can reach `host.docker.internal:4318`
  (`docker exec -it <web> wget -qO- http://host.docker.internal:4318/v1/traces`
  should return a 404 with an HTTP body, proving reachability).
- **Admin login broken** — the SigNoz postgres persists credentials in its own
  volume; recreate with `docker compose -f pours/deployment/compose.yaml down -v`
  only if you accept losing stored traces.
