#!/bin/sh
set -eu

echo "== Filesystems =="
df -h

echo
echo "== Root directory usage =="
sudo du -xh --max-depth=1 / | sort -h

echo
echo "== Docker directory usage =="
sudo du -sh /var/lib/docker/* 2>/dev/null || true

echo
echo "== Docker system usage =="
docker system df -v

echo
echo "== Docker volume usage =="
sudo du -sh /var/lib/docker/volumes/* 2>/dev/null | sort -h || true

echo
echo "== Docker container JSON logs =="
sudo find /var/lib/docker/containers -name '*-json.log' -exec du -h {} + 2>/dev/null | sort -h || true

echo
echo "== Journal usage =="
journalctl --disk-usage
