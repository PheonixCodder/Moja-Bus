#!/bin/sh
set -e

DIR="${BACKUP_DIR:-/backups}"
TS=$(date +%F_%H%M%S)
FILE="${DIR}/moja_${TS}.sql.gz"
TMP_FILE="${FILE}.tmp"

mkdir -p "$DIR"
export PGPASSWORD="${POSTGRES_PASSWORD}"
pg_dump -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f "$TMP_FILE"
unset PGPASSWORD
mv "$TMP_FILE" "$FILE"

echo "[backup] wrote $FILE ($(du -h "$FILE" | cut -f1))"

KEEP="${BACKUP_RETENTION_DAYS:-7}"
find "$DIR" -name 'moja_*.sql.gz' -mtime +"$KEEP" -delete
