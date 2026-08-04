#!/usr/bin/env bash
#
# Moja Buss — self-hosted PostHog installer (adapted from the official
# bin/deploy-hobby script).
#
# Runs the official hobby Docker Compose stack as a SEPARATE compose project
# in deploy/posthog/. Differences from the official script:
#   - Non-interactive: read POSTHOG_APP_TAG / DOMAIN from env (no prompts).
#   - Assumes Docker + Compose are already installed (no apt/docker install).
#   - Disables PostHog's own Caddy `proxy` (which would bind host 80/443 and
#     conflict with our moja-buss Caddy) via docker-compose.override.yml, and
#     publishes PostHog `web` on 127.0.0.1:8000 (loopback only).
#     Our root Caddy then fronts https://posthog.mojaride.net.
#
# Usage (on the production Linux server):
#   cd deploy/posthog
#   POSTHOG_APP_TAG=latest DOMAIN=posthog.mojaride.net ./install.sh
#
# Prereqs: Docker + Compose v2, curl, git. 16GB RAM / 30GB disk recommended.
# Upgrade: run the official upgrade script inside deploy/posthog/posthog.
set -e

export POSTHOG_APP_TAG="${POSTHOG_APP_TAG:-latest}"
export DOMAIN="${DOMAIN:?Set DOMAIN, e.g. DOMAIN=posthog.mojaride.net}"

echo "Installing PostHog (tag=$POSTHOG_APP_TAG) for https://$DOMAIN"

# 1. Clone the posthog repo (needed for compose configs, clickhouse configs,
#    rust build contexts, and the compose/start entrypoint).
if [ ! -d posthog/.git ]; then
    echo "Cloning posthog/posthog (blob:none)..."
    git clone --filter=blob:none https://github.com/PostHog/posthog.git posthog
    echo "Checking out master..."
    git -C posthog fetch origin
    git -C posthog reset --hard origin/master
else
    echo "posthog repo present — pulling latest master..."
    git -C posthog fetch origin
    git -C posthog reset --hard origin/master
fi

# 2. Download GeoLite2-City.mmdb (used by feature-flags / geo enrichment).
mkdir -p share
if [ ! -f share/GeoLite2-City.mmdb ]; then
    echo "Downloading GeoLite2-City.mmdb..."
    curl -fsSL 'https://mmdbcdn.posthog.net/' --http1.1 | brotli --decompress > share/GeoLite2-City.mmdb \
        && echo '{"date": "'"$(date +%Y-%m-%d)"'"}' > share/GeoLite2-City.json
    chmod 644 share/GeoLite2-City.mmdb share/GeoLite2-City.json
fi

# 3. Write .env only on a fresh install (preserve secrets on re-run).
if [ ! -f .env ]; then
    POSTHOG_SECRET=$(head -c 28 /dev/urandom | sha224sum -b | head -c 56)
    ENCRYPTION_SALT_KEYS=$(openssl rand -hex 16)
    BROWSERLESS_SECRET=$(openssl rand -hex 32)
    cat > .env <<EOF
POSTHOG_SECRET=$POSTHOG_SECRET
ENCRYPTION_SALT_KEYS=$ENCRYPTION_SALT_KEYS
BROWSERLESS_SECRET=$BROWSERLESS_SECRET
DOMAIN=$DOMAIN
TLS_BLOCK=
REGISTRY_URL=posthog/posthog
CADDY_TLS_BLOCK=
CADDY_HOST="$DOMAIN, http://, https://"
POSTHOG_APP_TAG=$POSTHOG_APP_TAG
EOF
    echo "Wrote .env (secrets generated)."
else
    echo "Existing .env found — preserving POSTHOG_SECRET / ENCRYPTION_SALT_KEYS."
fi

# 4. Assemble the official hobby stack into this directory.
cp posthog/docker-compose.base.yml docker-compose.base.yml
cp posthog/docker-compose.hobby.yml docker-compose.yml

# 5. Write the entrypoint scripts the hobby compose mounts from ./compose.
mkdir -p compose
cat > compose/start <<'EOF'
#!/bin/bash
./compose/wait
./bin/migrate
./bin/docker-server
EOF
chmod +x compose/start

cat > compose/temporal-django-worker <<'EOF'
#!/bin/bash
./bin/temporal-django-worker
EOF
chmod +x compose/temporal-django-worker

cat > compose/wait <<'EOF'
#!/usr/bin/env python3

import socket
import time

def loop():
    print("Waiting for ClickHouse and Postgres to be ready")
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect(('clickhouse', 9000))
        print("Clickhouse is ready")
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect(('db', 5432))
        print("Postgres is ready")
    except ConnectionRefusedError as e:
        time.sleep(5)
        loop()

loop()
EOF
chmod +x compose/wait

# 6. Overrides: disable PostHog's Caddy proxy (port conflict with ours) and
#    publish the web app on host loopback 127.0.0.1:8000. Our root Caddy
#    reverse_proxies posthog.mojaride.net -> host:8000.
cat > docker-compose.override.yml <<EOF
services:
  proxy:
    # Do not start PostHog's bundled Caddy — the moja-buss Caddy fronts TLS.
    profiles: ["posthog-internal-caddy"]
    ports: []
  web:
    ports:
      - "127.0.0.1:8000:8000"
EOF

# 7. Start the stack (pull prebuilt images; do not build Rust locally).
echo "Starting the PostHog stack..."
docker compose up -d --no-build --pull always

echo ""
echo "PostHog installed. Give it 5-10 minutes for migrations to finish."
echo "Dashboard: http://127.0.0.1:8000 (behind moja-buss Caddy at https://$DOMAIN)"
echo "Set the admin password on first visit."
