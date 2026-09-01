# tRPC & Backend API Reference

## 1. Overview & Procedure Catalog

The Driver Operations API is exposed through three tRPC routers in `apps/web/trpc/routers/`:
1. **`driversRouter`** (`apps/web/trpc/routers/drivers.ts`): 32+ endpoints for operator fleet management, driver mobile app self-service, marketplace, and offer negotiation.
2. **`tripsRouter`** (`apps/web/trpc/routers/trips.ts`): Trip assignment, driver unassignment, and assignable driver queries.
3. **`adminRouter`** (`apps/web/trpc/routers/admin.ts`): Platform-wide driver verification, marketplace moderation, and offer auditing.

---

## 2. Driver Self-Service Procedures (`driverProcedure`)

All procedures in this section authenticate using `driverProcedure` (`apps/web/trpc/init.ts#L323-L350`).

### 2.1 Profile & Status Procedures
* **`drivers.getMyProfile`**
  * *Type*: Query
  * *Input*: `void`
  * *Output*: Full `DriverProfile` including current trip, active shift, company affiliations, and career ratings.
* **`drivers.getMyVerificationStatus`**
  * *Type*: Query
  * *Input*: `void`
  * *Output*: Lightweight payload `{ driver: { id, verificationStatus, rejectionReason } }`.
* **`drivers.registerDriver`**
  * *Type*: Mutation
  * *Input*: `driverSelfRegisterSchema` (`fullName`, `phone`, `licenseNumber`, `licenseCategory`, `licenseExpiryDate`, `licenseFrontUrl`, `licenseBackUrl`, `medicalDocUrl`, `carrierInviteCode`, etc.).
  * *Output*: `{ success: true, driverProfile }`.
* **`drivers.setServicePreference`**
  * *Type*: Mutation
  * *Input*: `setDriverServicePreferenceSchema` (`isAvailableForHire`, `preferredType`, `cityBase`, `routeExperience`, `bio`).
  * *Output*: `{ success: true, preference }`.

---

### 2.2 Shift & Operational Procedures
* **`drivers.toggleShift`**
  * *Type*: Mutation
  * *Input*: `toggleShiftSchema` (`onDuty: boolean`, `companyId?: string`, `serviceType?: "INTERCITY" | "URBAN"`).
  * *Output*: `{ success: true, status: "AVAILABLE" | "OFFLINE", shift }`.
  * *Errors*: `FORBIDDEN` if not `VERIFIED`; `BAD_REQUEST` if going off-duty while on active trip.
* **`drivers.startTrip`**
  * *Type*: Mutation
  * *Input*: `z.object({ tripId: z.string().cuid() })`.
  * *Output*: `{ success: true, trip, telemetryToken }`.
  * *Side Effects*: Transitions trip to `DEPARTED`, stamps `actualDeparture`, updates `DriverProfile.status = "ON_TRIP"`, sets `currentTripId = tripId`, mints signed HMAC dispatch token.
* **`drivers.completeTrip`**
  * *Type*: Mutation
  * *Input*: `z.object({ tripId: z.string().cuid() })`.
  * *Output*: `{ success: true, trip }`.
  * *Side Effects*: Marks trip `ARRIVED`, completes confirmed bookings, executes `convergeDriversAfterRunEnd` (clears `currentTripId`, increments `totalTripsCompleted`, sets `AVAILABLE` if shift open else `OFFLINE`).
* **`drivers.recordStopArrival` & `drivers.recordStopDeparture`**
  * *Type*: Mutation
  * *Input*: `z.object({ tripStopId: z.string().cuid() })`.
  * *Output*: `{ success: true, terminalName, timestamp }`.
  * *Side Effects*: Stamps `actualArrival` or `actualDeparture` on `TripStop`.
* **`drivers.reportTripDelay`**
  * *Type*: Mutation
  * *Input*: `reportTripDelaySchema` (`tripId`, `delayMinutes`, `reason`, `note`).
  * *Output*: `{ success: true }`.
  * *Side Effects*: Updates `Trip.status = "DELAYED"`, logs `DriverLocationPing` with `anomalyReason = "DELAY"`, revalidates downstream driver conflicts.

---

### 2.3 Boarding & Manifest Procedures
* **`drivers.getMyTripManifest`**
  * *Type*: Query
  * *Input*: `z.object({ tripId: z.string().cuid() })`.
  * *Output*: Manifest payload `{ summary: { total, boarded, pending, capacity }, passengers: [...] }`.
* **`drivers.checkInPassenger`**
  * *Type*: Mutation
  * *Input*: `driverCheckInPassengerSchema` (`ticketToken`, `tripId?`).
  * *Output*: `{ success: boolean, alreadyBoarded: boolean, passengerName, seatNumber, boardedAt }`.
* **`drivers.manualCheckInPassenger`**
  * *Type*: Mutation
  * *Input*: `driverManualCheckInSchema` (`bookingId`, `tripId`).
  * *Output*: `{ success: true, passengerName, seatNumber, boardedAt }`.
* **`drivers.batchSyncCheckIns`**
  * *Type*: Mutation
  * *Input*: `driverBatchSyncCheckInsSchema` (`checkIns: Array<{ ticketToken, tripId?, scannedAt }>`).
  * *Output*: `{ syncedCount, alreadyBoardedCount, rejectedCount, results }`.

---

### 2.4 Offer Negotiation Procedures
* **`drivers.getMyOffers`**
  * *Type*: Query
  * *Input*: `z.object({ status?: "ACTIVE", page?: number, limit?: number })`.
  * *Output*: Paginated list of offers with negotiation event histories.
* **`drivers.markMyOffersSeen`**
  * *Type*: Mutation
  * *Input*: `z.object({})`.
  * *Output*: Stamps `firstViewedAt = now()` on unread pending offers.
* **`drivers.respondToOffer`**
  * *Type*: Mutation
  * *Input*: `respondToOfferSchema` (`offerId`, `action: "ACCEPT" | "DECLINE" | "COUNTER"`, `counterSalaryCFA?`, `counterStartDate?`, `note?`, `confirmExclusiveSwitch?: boolean`).
  * *Output*: `{ success: true, offer }`.
  * *Side Effects*: On accept, enforces One-Active-Exclusive rule and creates `DriverCompanyAffiliation`.

---

## 3. Operator ERP Procedures (`operatorCompanyProcedure`)

All procedures in this section authenticate using `operatorCompanyProcedure` (`apps/web/trpc/init.ts#L168-L208`).

| Procedure Name | Type | Required Permission | Input Contract | Core Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **`drivers.listDrivers`** | Query | `drivers:read` | `listDriversSchema` | Lists company roster with verification, status, search, and pagination. |
| **`drivers.getDriver`** | Query | `drivers:read` | `z.object({ id: z.string().cuid() })` | Returns single driver dossier, documents, and historical shifts. |
| **`drivers.createDriver`** | Mutation | `drivers:create` | `createDriverSchema` | Creates driver user/profile and adds to company roster w/ binding checks. |
| **`drivers.updateDriver`** | Mutation | `drivers:update` | `updateDriverSchema` | Updates driver license details, badge number, notes, and wage terms. |
| **`drivers.verifyDriver`** | Mutation | `drivers:verify` | `verifyDriverSchema` | Approves or rejects driver compliance credentials w/ mandatory doc check. |
| **`drivers.deleteDriverAffiliation`** | Mutation | `drivers:delete` | `deleteDriverAffiliationSchema` | Deactivates driver affiliation (roster removal) w/ in-flight guard. |
| **`drivers.getLivePositions`**| Query | `drivers:read` | `z.object({})` | Returns real-time GPS coordinates of all active fleet drivers. |
| **`drivers.listMarketplaceDrivers`**| Query | `drivers:read` | `listMarketplaceDriversSchema` | Corridors/city hub search over available vetted drivers. |
| **`drivers.sendEmploymentOffer`** | Mutation | `drivers:create` | `sendEmploymentOfferSchema` | Transmits formal employment offer w/ anti-spam cap enforcement. |
| **`drivers.respondToCounterOffer`**| Mutation | `drivers:create` | `respondToCounterOfferSchema` | Accepts (`ACCEPT_COUNTER`), declines, or counters back (`COUNTER_BACK`). |
| **`drivers.withdrawOffer`**| Mutation | `drivers:create` | `withdrawOfferSchema` | Cancels an open offer before driver acceptance. |
| **`trips.assignDriver`** | Mutation | `trips:update` | `z.object({ tripId, driverProfileId, role, startStopOrder?, endStopOrder? })` | Assigns driver to trip w/ double-booking check & row locks. |
| **`trips.unassignDriver`** | Mutation | `trips:update` | `z.object({ tripId, driverProfileId, role })` | Removes driver assignment from trip. |

---

## 4. Platform Admin Procedures (`adminProcedure`)

All procedures in this section authenticate using `adminProcedure` (`apps/web/trpc/init.ts#L210-L246`).

| Procedure Name | Type | Required Admin Permission | Description |
| :--- | :--- | :--- | :--- |
| **`admin.listDriversForVerification`** | Query | `drivers:verify.read` | Platform-wide verification queue filtered by `PENDING`, `VERIFIED`, etc. |
| **`admin.verifyDriver`** | Mutation | `drivers:verify.manage` | Approves, rejects, or suspends driver licenses platform-wide w/ outbox alert. |
| **`admin.presignDoc`** | Mutation | `drivers:verify.read` | Presigns compliance document downloads across any operator. |
| **`admin.setDriverMarketplaceStatus`**| Mutation | `marketplace:manage` | `FEATURE`, `UNFEATURE`, `SUSPEND`, `RESTORE` marketplace listings. |
| **`admin.listAllOffers`** | Query | `marketplace:read` | Platform audit log of all employment offers and negotiation rounds. |
| **`admin.getMarketplaceHealth`** | Query | `marketplace:read` | KPI metrics on available drivers, featured drivers, and offer accept rates. |
