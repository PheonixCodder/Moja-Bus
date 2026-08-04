#!/bin/sh
set -e

DIR="${BACKUP_DIR:-/backups}"
TS=$(date +%F_%H%M%S)
FILE="${DIR}/moja_${TS}.sql.gz"

mkdir -p "$DIR"
export PGPASSWORD="${POSTGRES_PASSWORD}"
pg_dump -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$FILE"
unset PGPASSWORD

echo "[backup] wrote $FILE ($(du -h "$FILE" | cut -f1))"

KEEP="${BACKUP_RETENTION_DAYS:-14}"
find "$DIR" -name 'moja_*.sql.gz' -mtime +"$KEEP" -delete
