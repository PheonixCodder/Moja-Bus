-- Phase 14/17 (F-DV-07) — one open shift per driver, enforced by the database.
--
-- 1) Repair first: close historical duplicate open shifts, keeping the MOST
--    RECENT per driver (its startedAt anchors earnings); older strays are
--    closed now with accurate minute totals. Without this, the unique index
--    below would fail on any environment that ever hit the double-open bug.
-- 2) Backstop: partial unique index makes a second open shift physically
--    impossible regardless of application bugs.

UPDATE driver_shift ds
SET "endedAt"      = NOW(),
    "totalMinutes" = GREATEST(0, (EXTRACT(EPOCH FROM (NOW() - ds."startedAt")) / 60)::int)
WHERE "endedAt" IS NULL
  AND ds.id NOT IN (
    SELECT ranked.id FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY "driverProfileId" ORDER BY "startedAt" DESC) AS rn
      FROM driver_shift
      WHERE "endedAt" IS NULL
    ) ranked
    WHERE ranked.rn = 1
  );

CREATE UNIQUE INDEX "driver_shift_one_open_per_driver"
  ON "driver_shift"("driverProfileId")
  WHERE "endedAt" IS NULL;
