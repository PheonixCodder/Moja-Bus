# Phase 5: Testing & Verification Checklist

> **File**: `context/plans/unified-driver-conductor-system/05-testing-and-verification.md`  
> **Status**: Ready for Implementation  

---

## 1. Database & Schema Testing

- [ ] Run Prisma validation: `pnpm --filter @moja/db exec prisma validate` passes with zero errors.
- [ ] Verify relations: `Trip` has `driver` (Primary), `reliefDriver` (Relief), and `conductorStaff` (Operator Staff).
- [ ] Confirm `trip_driver_assignment` only contains records with role `"PRIMARY"` or `"RELIEF"`.

---

## 2. Backend & tRPC Testing

- [ ] **Driver Assignment**:
  - `trips.assignDriver` with role `PRIMARY` succeeds for verified driver.
  - `trips.assignDriver` with role `RELIEF` succeeds for verified driver.
  - Attempting to pass `role: "CONDUCTOR"` to `assignDriver` fails Zod schema validation.
  - License class mismatch fails with `BAD_REQUEST`.
- [ ] **Conductor Assignment**:
  - `trips.assignConductor` succeeds for staff member with `role === "CONDUCTOR"`.
  - Attempting to assign staff from a different company fails with `NOT_FOUND` / `FORBIDDEN`.
- [ ] **Telemetry & Run State**:
  - Primary driver calls `startTrip` → receives valid HMAC telemetry token, trip status becomes `DEPARTED`.
  - Conductor attempts to call `startTrip` → receives `FORBIDDEN`.
  - Primary and Relief perform `handoverTripControl` → active telemetry token moves to Relief.
- [ ] **Boarding / Check-in**:
  - `checkInPassenger` allows scanning by Primary Driver.
  - `checkInPassenger` allows scanning by Relief Driver.
  - `checkInPassenger` allows scanning by assigned Staff Conductor.
  - Unassigned user receives `FORBIDDEN`.

---

## 3. Mobile App (`apps/driver-app`) Testing

- [ ] **Login & Gating**:
  - Login as verified Driver (`role: DRIVER`) → Enters app, sees full tabs (Trips, Offers, Live, Scanner, Profile).
  - Login as Conductor (`role: OPERATOR`, staff `role: CONDUCTOR`) → Enters app, sees restricted tabs (Trips, Scanner, Profile).
  - Login as Operator Manager (`role: OPERATOR`, staff `role: MANAGER`) → Blocked with toast: *"Ce compte administrateur/gestionnaire doit être utilisé sur le portail web Moja Ride."*
  - Login as Traveler (`role: TRAVELER`) → Blocked with toast: *"Accès réservé à l'équipage de bord."*
- [ ] **UI Navigation & Actions**:
  - In Conductor mode, Live HUD tab and Offers tab are completely removed from navigation and tab bar.
  - In Trip Card, Conductor sees only Manifest and Scanner buttons.
  - In Trip Card, Primary Driver sees Start Trip / Resume HUD buttons.
  - In Trip Card, Relief Driver sees Take Over button when trip is in flight.

---

## 4. Operator Dashboard Testing

- [ ] Staff Invitation Sheet lists `CONDUCTOR` role.
- [ ] Trip Dispatch UI clearly displays Chauffeur Principal, Chauffeur de relais (optionnel), and Convoyeur (optionnel).
