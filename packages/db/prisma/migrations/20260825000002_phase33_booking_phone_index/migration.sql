-- Phase 33 (F-PS-11 D5 ruling) — index for phone-scoped booking access.
-- Guest reads are now PURE (no claim-on-read); this index serves the
-- unlinked-candidate lookups and the future explicit-claim endpoint.
CREATE INDEX "booking_passengerPhone_idx" ON "booking"("passengerPhone");
