#!/bin/sh
set -e

if [ -z "${CRON_SECRET:-}" ]; then
	echo "[cron] CRON_SECRET is not set — refusing to start." >&2
	exit 1
fi

sed "s#__CRON_SECRET__#${CRON_SECRET}#g" /etc/crontab.template > /etc/crontabs/root
chmod 0644 /etc/crontabs/root

JOB_COUNT="$(grep -Evc '^[[:space:]]*(#|$)' /etc/crontabs/root || true)"
echo "[cron] Installed ${JOB_COUNT} jobs."
exec crond -f -l 6 -L /dev/stdout
