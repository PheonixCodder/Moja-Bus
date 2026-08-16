#!/bin/sh
set -e

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
	echo "[backup] POSTGRES_PASSWORD is not set — refusing to start." >&2
	exit 1
fi

DIR="${BACKUP_DIR:-/backups}"
mkdir -p "$DIR"

cat > /etc/crontabs/root <<EOF
30 1 * * * /usr/local/bin/dump.sh
EOF
chmod 0644 /etc/crontabs/root

echo "[backup] scheduled nightly pg_dump at 01:30 -> ${DIR}"
echo "[backup] logs are written to container stdout and rotated by Docker"
exec crond -f -l 6 -L /dev/stdout
