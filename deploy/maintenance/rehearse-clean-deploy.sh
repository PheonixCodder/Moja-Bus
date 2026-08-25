#!/usr/bin/env sh
# Phase 00 (F-DV-01, ratified D4-A) — clean-volume deploy rehearsal.
#
# Proves a fresh machine can go from empty disk to healthy app using ONLY what
# git + Docker provide. Run before any release that touches migrations:
#
#   sh deploy/maintenance/rehearse-clean-deploy.sh
#
# WARNING: destroys the local compose stack INCLUDING its volume (db_data).
# Never point DATABASE_URL at a shared/production DB while running this.
set -eu

echo "==> 1. Destroying local stack + volume for a truly clean start..."
docker compose down -v --remove-orphans

echo "==> 2. Building migrate + web images from the WORKING TREE..."
docker compose build migrate web

echo "==> 3. Starting database..."
docker compose up -d db
docker compose exec -T db sh -c 'until pg_isready -U "$POSTGRES_USER"; do sleep 1; done'

echo "==> 4. Running full migration history against an EMPTY volume..."
docker compose run --rm migrate

echo "==> 5. Verifying driver enums match the shipped model..."
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "
SELECT unnest(enum_range(NULL::\"DriverStatus\"));"' | tr '\n' ' '
echo "(expect OFFLINE AVAILABLE ON_DUTY ON_TRIP RESTING SUSPENDED)"

docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "
SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL;"' | {
  read -r pending
  if [ "${pending:-1}" != "0" ]; then
    echo "FAIL: $pending migration(s) did not complete cleanly."; exit 1
  fi
}

echo "==> 6. Booting web + cron and checking health..."
docker compose up -d
sleep 15
docker compose exec -T web wget -qO- http://127.0.0.1:3000/api/health

echo ""
echo "REHEARSAL PASSED — migrations reproduce the application from nothing."
