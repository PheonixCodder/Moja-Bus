#!/bin/sh
set -eu

JOURNAL_RETENTION="${JOURNAL_RETENTION:-3d}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script with sudo so it can vacuum journald and truncate Docker logs." >&2
  exit 1
fi

echo "== Docker usage before cleanup =="
docker system df -v || true

echo
echo "== Prune unused Docker images, networks, containers, and build cache =="
docker system prune -af
docker builder prune -af

echo
echo "== Vacuum journald older than ${JOURNAL_RETENTION} =="
journalctl --vacuum-time="${JOURNAL_RETENTION}"

echo
echo "== Truncate Docker JSON logs =="
find /var/lib/docker/containers -name '*-json.log' -exec truncate -s 0 {} +

echo
echo "== Docker usage after cleanup =="
docker system df -v || true

echo
echo "== Filesystems after cleanup =="
df -h
