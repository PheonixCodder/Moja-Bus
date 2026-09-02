#!/bin/sh
set -eu

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

# Upload to Cloudflare R2 (or any S3-compatible store) if credentials are set
if [ -n "${S3_ENDPOINT:-}" ] && [ -n "${S3_BUCKET:-}" ] && [ -n "${S3_ACCESS_KEY_ID:-}" ]; then
  echo "[backup] uploading to R2: s3://${S3_BUCKET}/db-backups/$(basename "$FILE")"
  AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID}" \
  AWS_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY}" \
  aws s3 cp "$FILE" \
    "s3://${S3_BUCKET}/db-backups/$(basename "$FILE")" \
    --endpoint-url "${S3_ENDPOINT}" \
    --region "${S3_REGION:-auto}" \
    --no-progress
  echo "[backup] R2 upload complete"
else
  echo "[backup] skipping R2 upload (S3_ENDPOINT/S3_BUCKET/S3_ACCESS_KEY_ID not set)"
fi

# Prune local copies older than retention days
KEEP="${BACKUP_RETENTION_DAYS:-7}"
find "$DIR" -name 'moja_*.sql.gz' -mtime +"$KEEP" -delete
