-- Phase 31 (F-DV-14) — server-side urgent-dispatch acknowledgement.
-- Assignment row IS the driver×trip grain, so a nullable timestamp beats a
-- join table. AsyncStorage acks died on reinstall/re-login; this survives.
ALTER TABLE "trip_driver_assignment"
  ADD COLUMN "urgentDispatchAckAt" TIMESTAMP(3);
