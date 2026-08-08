# M — Schema Prisma Reference (captured models)

Source: `packages/db/prisma/schema.prisma` lines 1–1823 read. Enums + models captured here for the
urban/intercity + schedule + trip + booking + financial context. (Remainder 1823+ not yet read.)

## Enums
- `ServiceType`: INTERCITY | URBAN
- `RouteStatus`: DRAFT | ACTIVE | SUSPENDED | ARCHIVED
- `BusStatus`, `SeatType`, `SeatClass`, `RecurrenceType`, `ExceptionType`
  (CANCELLED | EXTRA_SERVICE | MODIFIED), `ExceptionReason`, `FareType`, `TripStatus`
- `LocationGeoCaptureStatus`: COMPLETE | PENDING_CAPTURE | PENDING_CONFIRMATION
- `LocationCaptureStatus`: OPEN | PENDING_CONFIRMATION | CONFIRMED | APPROVED | REJECTED | EXPIRED

## City / Municipality / Quarter
- `City`: name (French), nameEn?, region, district, lat/long, isMajorHub, pcode, source, isActive
- `Municipality`: cityId FK, isPassThrough, PostGIS geometry (Unsupported)
- `Quarter`: municipalityId FK, geometry (Unsupported)

## CompanyLocation (terminal)
- FKs: cityId/municipalityId/quarterId; legacy nullable `city` string kept; `isTerminal`
- `geoCaptureStatus` (LocationGeoCaptureStatus), `captureToken` @unique, `captureExpiresAt`
- `@@unique([companyId, name])`
- Relations: originRoutes, destRoutes, waypoints, tripStops, captures

## LocationCapture
- Per-attempt token, expiresAt, status (LocationCaptureStatus), GPS lat/long,
  resolvedCityId/resolvedMunicipalityId/resolvedQuarterId, reverseGeocodedAddress, submitter fields

## Route
- originTerminalId/destTerminalId → CompanyLocation; `serviceType` default INTERCITY (derived
  server-side via lib/route-service-type.ts); waypoints; `@@unique([companyId, name])`

## RouteWaypoint
- stopOrder (0 = origin), distanceFromOriginKm, isPickup, isDropoff; `@@unique([routeId, stopOrder])`

## Schedule
- `departureTime` VarChar(5) (legacy single), `departureTimes String[]` (default []), isActive,
  estimatedMinutes, preferredBusId (SchedulePreferredBus relation), calendar, exceptions, fares,
  scheduleWaypoints. Only indexes, no unique constraint.

## ServiceCalendar
- 7 weekday booleans, validFrom/validUntil, scheduleId @unique (1:1)

## ServiceException
- date, type, reason, overrideDepartureTime (MODIFIED), `@@unique([scheduleId, date])`

## ScheduleWaypoint
- scheduleId, routeWaypointId, arrivalOffsetMinutes, departureOffsetMinutes, dwellMinutes,
  `@@unique([scheduleId, routeWaypointId])`

## Fare
- type, fromStopOrder, toStopOrder, durationMinutes, priceXOF, validFrom/validUntil, isActive

## Trip
- scheduleId, companyId, busId (per-trip), departureDate (full timestamp), `serviceType` snapshot,
  estimatedArrival, actualDeparture/Arrival, delayMinutes, gate, status, routeSnapshotJson,
  totalSeats, `@@unique([scheduleId, departureDate])`

## TripStop
- terminalId, stopOrder, scheduledArrival/Departure, actualArrival/Departure, isPickup, isDropoff,
  originBookings/destinationBookings; `@@unique([tripId, stopOrder])`

## TripSeat
- tripId+seatId unique, isActive, blockedReason; availability derived at query time

## Bus / Seat / BusType / SeatLayoutTemplate / SeatTemplate
- Seat.isActive=false → operator-disabled; Seat.isBookable immutable from template

## Booking
- tripId, seatId, originTripStopId/destinationTripStopId, boardingStopOrder/dropoffStopOrder, status,
  holdExpiresAt, farePaid, bookingReference unique, ticketToken unique, holdGroupId, savedPassengerId,
  checkedInAt/boardedAt/completedAt/clearedAt

## Financial
- PlatformSettings, CommissionDistanceTier, HoldGroup, PricingSnapshot, ExternalPayment,
  PaymentAttempt, PaymentEvent, WebhookEvent, Refund, FinancialAccount(+Snapshot),
  FinancialTransaction, LedgerEntry, WalletReservation, SettlementPolicy

## Auth/operator
- User, Session, Account, Verification, WithdrawalTwoFactorChallenge, RateLimit, RefreshToken,
  Company, CompanyDocument, BankAccount, BankAccessLog, CompanyVerification, Operator,
  OperatorOnboarding(+Event), PendingOperatorSignup, AdminStaff, AdminStaffInvitation,
  AdminStaffActivityLog

## Notes / potential issues (to verify against seed + routers)
- `Trip @@unique([scheduleId, departureDate])` — the "same time same day" guard. `departureDate` is a
  full timestamp; uniqueness is exact-instant. `trips.create` checks exact equality. With cadence
  lists, two schedules on the same route/company could collide only if same scheduleId — fine.
- `CompanyLocation.city` legacy nullable string coexists with cityId FK; `format-location-label` and
  `trips.list` q search reference `city` AND `cityRelation` — dual source of truth risk. If a terminal
  has both set inconsistently, labels/search diverge. Recommend deprecating `city` string.
- `ServiceCalendar` 1:1 with scheduleId — but `updateCalendar` requires `schedule.calendar` to exist
  in the drawer (D2); what happens when calendar is null? `create` always creates it? Verify.
