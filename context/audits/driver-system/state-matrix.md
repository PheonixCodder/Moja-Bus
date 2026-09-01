# Complete Driver Domain State Matrix

This document maps all stateful entities within the Driver Operations Domain, auditing valid transitions, illegal transitions, authorization guards, and database constraints.

---

## 1. Driver Profile Operational Status (`DriverStatus`)

Defined in `packages/db/prisma/schema.prisma#L235-L242` and `packages/schemas/src/drivers.ts#L8-L19`:

| Current State | Valid Next States | Invalid / Prohibited Transitions | Triggering Action & API | Guard Conditions & Invariants |
| :--- | :--- | :--- | :--- | :--- |
| **`OFFLINE`** | `AVAILABLE`, `ON_TRIP`, `SUSPENDED` | `RESTING` (must be on duty first) | `drivers.toggleShift(onDuty: true)` / `drivers.startTrip` | Driver must be `VERIFIED`. Single-affiliation defaults to latest company. |
| **`AVAILABLE`** | `OFFLINE`, `ON_TRIP`, `RESTING`, `SUSPENDED` | | `drivers.toggleShift(onDuty: false)` / `drivers.startTrip` | Going `OFFLINE` requires `currentTripId === null`. Closes open `DriverShift`. |
| **`ON_TRIP`** | `AVAILABLE`, `OFFLINE`, `SUSPENDED` | `ON_DUTY` (must complete trip first) | `drivers.completeTrip` / `convergeDriversAfterRunEnd` | `currentTripId` must match target trip. Sets `AVAILABLE` if open shift exists, else `OFFLINE`. |
| **`RESTING`** | `AVAILABLE`, `OFFLINE`, `ON_TRIP` | | `drivers.toggleShift` | Resumes shift or goes off duty. |
| **`SUSPENDED`** | `OFFLINE`, `AVAILABLE` (upon restore) | `ON_TRIP` (cannot operate runs) | Admin/Operator restore via `verifyDriver` | Operational teardown executed on suspend (`suspendDriverOperationalState`). |

---

## 2. Driver Verification Status (`DriverVerificationStatus`)

Defined in `packages/db/prisma/schema.prisma#L244-L250`:

| Current State | Valid Next States | Invalid Transitions | Triggering Action & API | Guard Conditions & Invariants |
| :--- | :--- | :--- | :--- | :--- |
| **`PENDING`** | `VERIFIED`, `REJECTED` | `EXPIRED` (must be verified first) | `drivers.verifyDriver` / `admin.verifyDriver` | Approval requires at least one uploaded compliance document (`licenseFrontUrl`, `licenseBackUrl`, `medicalDocUrl`). |
| **`VERIFIED`** | `EXPIRED`, `SUSPENDED`, `REJECTED` | `PENDING` (cannot revert to pending without new docs) | `/api/cron/expire-driver-licenses` / `admin.verifyDriver` | Expiry cron automatically flips to `EXPIRED` if `licenseExpiryDate < now`. Suspension requires reason. |
| **`REJECTED`** | `PENDING` | `VERIFIED` (must resubmit docs first) | `drivers.registerDriver` (Resubmit) | Driver resubmits documents via mobile app, resetting state to `PENDING`. |
| **`EXPIRED`** | `PENDING` | `VERIFIED` (must submit renewed license) | `drivers.registerDriver` (Renewed License) | Driver uploads renewed license date and photos. |
| **`SUSPENDED`** | `VERIFIED`, `REJECTED` | `EXPIRED` | `admin.verifyDriver(APPROVE / RESTORE)` | Admin restores profile after investigation. |

---

## 3. Employment Offer Status (`DriverOfferStatus`)

Defined in `packages/db/prisma/schema.prisma#L272-L279`:

| Current State | Valid Next States | Invalid Transitions | Triggering Action & API | Guard Conditions & Invariants |
| :--- | :--- | :--- | :--- | :--- |
| **`PENDING`** | `COUNTERED`, `ACCEPTED`, `DECLINED`, `WITHDRAWN`, `EXPIRED` | `PENDING` (cannot re-pend) | `drivers.respondToOffer` / `drivers.withdrawOffer` | Anti-spam caps (25 sent per company, 20 received per driver). Rolling 7-day expiry. |
| **`COUNTERED`**| `ACCEPTED`, `DECLINED`, `COUNTERED`, `WITHDRAWN`, `EXPIRED` | `PENDING` | `drivers.respondToCounterOffer` / `drivers.respondToOffer` | Counter round count $< 6$. 7-day rolling expiry refreshed. |
| **`ACCEPTED`** | *Terminal State* | Any transition | `resolveAcceptance` | Auto-terminates conflicting exclusive affiliations; creates `DriverCompanyAffiliation`. |
| **`DECLINED`** | *Terminal State* | Any transition | `drivers.respondToOffer(DECLINE)` | Driver or operator rejected terms. |
| **`WITHDRAWN`**| *Terminal State* | Any transition | `drivers.withdrawOffer` | Operator cancelled offer before acceptance. |
| **`EXPIRED`** | *Terminal State* | Any transition | `/api/cron/expire-offers` | 7-day window elapsed unanswered. |

---

## 4. Trip Driver Assignment Roles (`TripDriverAssignment.role`)

Defined in `packages/db/prisma/schema.prisma#L2375-L2400`:

| Assignment Role | License Class Check | License Expiry Check | Mode Compatibility Guard | Start/Complete Trip Permission | Telemetry Stream Authority |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`PRIMARY`** | Enforced ($E \ge D \ge C \ge B$) | Enforced through trip arrival | `CONTRACTOR_URBAN` blocked on `INTERCITY` | Primary Authority | Primary Streamer |
| **`RELIEF`** | Enforced ($E \ge D \ge C \ge B$) | Enforced through trip arrival | `CONTRACTOR_URBAN` blocked on `INTERCITY` | Allowed | Fallback Streamer |
| **`CONDUCTOR`**| **Exempt** (Driving license skipped) | **Exempt** | **Exempt** | Allowed in conductor mode | Does not stream |
