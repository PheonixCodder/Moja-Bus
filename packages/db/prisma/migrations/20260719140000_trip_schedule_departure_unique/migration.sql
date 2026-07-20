-- Trip uniqueness per schedule departure + service exception uniqueness
-- Safe for existing DBs: drop duplicates first if any (keep oldest)

DELETE FROM "trip" a
USING "trip" b
WHERE a."scheduleId" = b."scheduleId"
  AND a."departureDate" = b."departureDate"
  AND a."createdAt" > b."createdAt";

CREATE UNIQUE INDEX IF NOT EXISTS "trip_scheduleId_departureDate_key"
  ON "trip"("scheduleId", "departureDate");

DELETE FROM "service_exception" a
USING "service_exception" b
WHERE a."scheduleId" = b."scheduleId"
  AND a."date" = b."date"
  AND a."id" > b."id";

CREATE UNIQUE INDEX IF NOT EXISTS "service_exception_scheduleId_date_key"
  ON "service_exception"("scheduleId", "date");
