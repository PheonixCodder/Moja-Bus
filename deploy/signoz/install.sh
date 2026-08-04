#!/usr/bin/env bash
# Installs SigNoz (self-hosted) via Foundry — the officially supported method.
# The legacy bundled docker-compose (deploy/docker/clickhouse-setup) was
# removed from the SigNoz repo in v0.130.0; foundryctl renders the stack from a
# declarative casting.yaml.
#
#   cd deploy/signoz
#   ./install.sh
#
# Result: a SEPARATE compose project under pours/deployment/ publishing:
#   - 8080        SigNoz UI + API      (bound to 127.0.0.1, fronted by our Caddy)
#   - 4317/4318   OTLP gRPC / HTTP     (bound to 127.0.0.1; web sends traces here)
set -euo pipefail

DOMAIN="${DOMAIN:-signoz.mojaride.net}"
FOUNDRYCTL="${FOUNDRYCTL:-foundryctl}"

# 1. Ensure foundryctl is installed (official installer puts it in ~/.local/bin).
if ! command -v "$FOUNDRYCTL" >/dev/null 2>&1; then
  echo "Installing foundryctl via the official installer..."
  curl -fsSL https://signoz.io/foundry.sh | bash
  export PATH="$HOME/.local/bin:$PATH"
fi
"$FOUNDRYCTL" --version >/dev/null 2>&1 || { echo "foundryctl not on PATH after install"; exit 1; }

# 2. Write casting.yaml only on a fresh install so later edits survive upgrades.
if [ ! -f casting.yaml ]; then
  cat > casting.yaml <<'EOF'
apiVersion: v1alpha1
kind: Installation
metadata:
  name: signoz
spec:
  deployment:
    flavor: compose
    mode: docker
EOF
fi

# 3. Render the compose files (does NOT start containers).
"$FOUNDRYCTL" forge -f casting.yaml

COMPOSE="pours/deployment/compose.yaml"

# 4. Bind UI + OTLP to loopback so they are never exposed to the internet
#    directly. The moja-buss Caddy fronts https://${DOMAIN} -> 127.0.0.1:8080
#    and the web container exports traces to host.docker.internal:4318.
#    Failure-tolerant: if the port lines do not match a future foundry format
#    this is a no-op (see README).
sed -i -E \
  's/^([[:space:]]*)- "8080:8080"/\1- "127.0.0.1:8080:8080"/; s/^([[:space:]]*)- "4317:4317"/\1- "127.0.0.1:4317:4317"/; s/^([[:space:]]*)- "4318:4318"/\1- "127.0.0.1:4318:4318"/' \
  "$COMPOSE" || true

# 5. Start the stack (prebuilt images; nothing is compiled here).
docker compose -f "$COMPOSE" up -d

echo
echo "SigNoz deployed. UI: http://127.0.0.1:8080 (fronted by the moja-buss Caddy at https://${DOMAIN})."
echo "OTLP ingest: 127.0.0.1:4317 (gRPC) / 127.0.0.1:4318 (HTTP)."
echo
echo "Next:"
echo "  1. Add a DNS A record: ${DOMAIN} -> this server."
echo "  2. In the repo-root .env set SIGNOZ_ADDRESS=${DOMAIN}."
echo "  3. In the repo-root .env set OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://host.docker.internal:4318/v1/traces"
echo "  4. Open https://${DOMAIN} and set the admin credentials on first visit."
