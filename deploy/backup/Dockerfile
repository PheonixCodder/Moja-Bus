FROM postgres:16-alpine

# aws-cli needed to upload backups to Cloudflare R2 (S3-compatible)
RUN apk add --no-cache aws-cli

COPY dump.sh /usr/local/bin/dump.sh
COPY entrypoint.sh /usr/local/bin/backup-entrypoint

RUN chmod +x /usr/local/bin/dump.sh /usr/local/bin/backup-entrypoint

ENTRYPOINT ["/usr/local/bin/backup-entrypoint"]
