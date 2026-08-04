FROM alpine:3.21

RUN apk add --no-cache curl ca-certificates

COPY crontab.template /etc/crontab.template
COPY entrypoint.sh /usr/local/bin/cron-entrypoint

RUN chmod +x /usr/local/bin/cron-entrypoint

ENTRYPOINT ["/usr/local/bin/cron-entrypoint"]
