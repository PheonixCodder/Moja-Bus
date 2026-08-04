# PostHog (self-hosted) — server deployment

Moja Buss runs the **official PostHog hobby stack** as a separate Docker
Compose project in this directory. It is NOT part of `compose.yml` at the repo
root — it is heavy (~25 services: ClickHouse, Kafka, Redis, Temporal, MinIO,
SeaweedFS, Postgres, plus the PostHog web/worker/plugins/capture apps),
needs **~16GB RAM / 30GB disk / 4 vCPU**, and boots slowly (~5-10 min).

The root `moja-buss` Caddy fronts it, so the two stacks never fight over
ports 80/443.

## Why a separate project

- PostHog's hobby compose ships its **own Caddy `proxy` on 80/443** which
  would conflict with the moja-buss Caddy.
- It is designed to be installed by a bash script (`bin/deploy-hobby`) that
  clones the whole PostHog repo (ClickHouse configs, Rust build contexts,
  entrypoint scripts) — too large and volatile to vendor into `compose.yml`.
- Isolating it means upgrading PostHog with the official `upgrade-hobby`
  script never touches the moja-buss stack.

## Requirements (server)

- Ubuntu/Debian VM, 16GB RAM, 30GB+ disk, 4 vCPU (PostHog official guidance).
- Docker + Docker Compose v2 installed.
- `curl`, `git`, `openssl`, `brotli` available.
- DNS: an **A record** for `posthog.mojaride.net` -> server IP.

## Deploy

```bash
cd deploy/posthog
POSTHOG_APP_TAG=latest DOMAIN=posthog.mojaride.net ./install.sh
```

`install.sh` (adapted from PostHog's `bin/deploy-hobby`):

1. Clones `posthog/posthog` (blob:none) into `deploy/posthog/posthog`.
2. Downloads `share/GeoLite2-City.mmdb`.
3. Writes `.env` with generated `POSTHOG_SECRET`, `ENCRYPTION_SALT_KEYS`,
   `BROWSERLESS_SECRET`, `DOMAIN`. Preserved on re-run.
4. Copies the official `docker-compose.base.yml` + `docker-compose.hobby.yml`
   and writes the `compose/start|wait|temporal-django-worker` entrypoints.
5. Writes `docker-compose.override.yml`:
   - Disables PostHog's `proxy` (Caddy) service via `profiles`.
   - Publishes `web` on `127.0.0.1:8000:8000` (loopback only — NOT exposed
     to the internet directly).
6. `docker compose up -d --no-build --pull always` (prebuilt images; nothing
   is compiled on the server).

## After install

- Set the admin password on first visit.
- Create a project, then copy the **project API key** (phc_...) into the root
  `.env` as `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` is
  `https://posthog.mojaride.net` (see repo-root `.env.example`).

## How TLS works (no port conflict)

```
posthog.mojaride.net (DNS A) ──► server :443 ──► moja-buss caddy
                                              └── reverse_proxy 127.0.0.1:8000 ──► posthog web
```

The moja-buss Caddy block for PostHog is in `deploy/caddy/Caddyfile`
(`{$POSTHOG_ADDRESS}`), and `POSTHOG_ADDRESS=posthog.mojaride.net` lives in
the repo-root `.env`. PostHog's own Caddy is never started.

## Upgrade

```bash
cd deploy/posthog/posthog
# then run PostHog's official upgrade script from that repo:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/posthog/posthog/HEAD/bin/upgrade-hobby)"
```

## Troubleshooting

- `docker compose -f deploy/posthog/docker-compose.yml logs web` — migrations
  run here and fail loudly.
- ClickHouse needs significant RAM; if queries time out, give the VM more RAM.
- PostHog is officially "unsupported" self-hosted; pin the dashboard behind
  the admin password and keep the stack on the latest tag.
