FROM postgres:16-alpine

COPY dump.sh /usr/local/bin/dump.sh
COPY entrypoint.sh /usr/local/bin/backup-entrypoint

RUN chmod +x /usr/local/bin/dump.sh /usr/local/bin/backup-entrypoint

ENTRYPOINT ["/usr/local/bin/backup-entrypoint"]
