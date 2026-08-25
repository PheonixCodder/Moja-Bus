# Phase 02 — Scanner Reads Issued Tickets

> **Closes:** F-PS-03 ≡ F-DV-02 (P1) · Evidence: `06-passenger-commerce-tickets.md` trace 2 + findings; `04-driver-trip-execution.md` trace 3.
> `booking-read-service.ts:472` (QR = `${APP_URL}/tickets/{token}`) vs `scanner.tsx:77-89` (raw passthrough) vs `drivers.ts:1281-1300` (exact match). Parser already exists: `features/operator/lib/parse-ticket-token.ts` (tested).

## Objective
Scanning a real passenger boarding pass boards the passenger. Today every standard scan fails "Invalid ticket QR code" because the QR encodes a URL and the driver path does exact-token matching.

## Tasks
- [x] Move `parse-ticket-token.ts` into a shared location (e.g. `packages/schemas` or `@moja/shared`) with its tests. *(→ `packages/schemas/src/ticket-token.ts`, regex-only/host-agnostic for Hermes + DOM-lib-free compile; old apps/web copy deleted, operator service re-pointed.)*
- [x] Apply parsing in `drivers.checkInPassenger` and `drivers.batchSyncCheckIns`: accept raw durable token, `pt.` presentation token (via the existing resolver), bare token, and URL-wrapped `${origin}/tickets/{token}` forms. *(pt. resolution = injected `resolvePresentationToken` on `DriverCheckInService`; per-item batch rejection falls out of the Phase-03 outcome pipeline.)*
- [x] Optionally also normalize in `driverCheckInPassengerSchema` preprocess so the client contract is forgiving. *(chosen as the primary mechanism — also applied to batch items; legacy JSON unwrap folded into the parser and removed from `scanner.tsx`).*
- [x] Contract test matrix: URL form, bare token, JSON-wrapped `{ticketToken}`, `pt.` token, garbage → expected outcomes. *(20 parser/schema cases incl. malformed `%zz` no-crash + host-agnostic drift cases; 4 pt.-resolver service tests.)*

## Acceptance criteria
- Staging: render a real traveler ticket QR, scan with the driver app → `Boarding Cleared` with correct passenger/seat.
- Duplicate scan still returns `alreadyBoarded` idempotently; invalid forms still rejected.

## Verification
End-to-end scan on staging (Gate A probe from `12-release-checklist.md`).

## Dependencies
Phase 00 (fresh DB), Phase 03 lands the authorization binding — order 02 → 03 is fine either way; both touch `drivers.ts` check-in family, so execute sequentially, not in parallel.
