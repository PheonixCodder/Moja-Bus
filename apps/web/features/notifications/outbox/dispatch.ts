import { enqueueOutboxMessage, OUTBOX_TYPES, type OutboxDb } from "./enqueue";
import { txIdWithRecipient } from "./tx-id";

type Tx = OutboxDb;

export type DriverRecipient = {
  subscriberId: string;
  email?: string;
  firstName?: string;
};

export type TripDispatchPayload = {
  tripId: string;
  companyName: string;
  busPlate: string | null;
  originName: string;
  destinationName: string;
  departureDate: Date;
  bookedPassengers: number;
  totalSeats: number;
};

/** Operator → Driver: assigned to a trip (urgent variant when departing <2h). */
export function enqueueDriverTripAssigned(
  db: Tx,
  input: { payload: TripDispatchPayload; to: DriverRecipient; urgent: boolean },
) {
  const { payload } = input;
  const transactionId = `driver-trip-assigned-${payload.tripId}-${input.to.subscriberId}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.TRIP_ASSIGNED_TO_DRIVER,
    idempotencyKey: transactionId,
    payload: {
      workflowId: input.urgent
        ? "driver-dispatch-urgent"
        : "driver-trip-assigned",
      subscriber: input.to,
      data: {
        type: "trip-assigned",
        tripId: payload.tripId,
        companyName: payload.companyName,
        busPlate: payload.busPlate ?? null,
        originName: payload.originName,
        destinationName: payload.destinationName,
        departureTime: payload.departureDate.toLocaleString("fr-FR", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "UTC",
        }),
        bookedPassengers: payload.bookedPassengers,
        totalSeats: payload.totalSeats,
      },
      transactionId,
    },
  });
}

/** Operator → Driver: removed from a trip assignment. */
export function enqueueDriverTripUnassigned(
  db: Tx,
  input: { payload: TripDispatchPayload; to: DriverRecipient },
) {
  const { payload } = input;
  const transactionId = `driver-trip-unassigned-${payload.tripId}-${input.to.subscriberId}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.TRIP_UNASSIGNED_FROM_DRIVER,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "driver-trip-unassigned",
      subscriber: input.to,
      data: {
        type: "trip-unassigned",
        tripId: payload.tripId,
        companyName: payload.companyName,
        busPlate: payload.busPlate ?? null,
        originName: payload.originName,
        destinationName: payload.destinationName,
        departureTime: payload.departureDate.toLocaleString("fr-FR", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "UTC",
        }),
        bookedPassengers: payload.bookedPassengers,
        totalSeats: payload.totalSeats,
      },
      transactionId,
    },
  });
}

/** Operator — bus assigned/swapped for a departure (P3-6: via outbox, keyed by user.id). */
export function enqueueOperatorBusAssigned(
  db: Tx,
  input: {
    payload: {
      tripId: string;
      staffName: string;
      busPlate: string;
      routeName: string;
      departureDate: Date;
    };
    to: DriverRecipient;
  },
) {
  const { payload } = input;
  const transactionId = `operator-bus-assigned-${payload.tripId}-${input.to.subscriberId}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.BUS_ASSIGNED_TO_OPERATOR,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "operator-bus-assigned",
      subscriber: input.to,
      data: {
        email: input.to.email ?? "",
        staffName: payload.staffName,
        busPlate: payload.busPlate,
        routeName: payload.routeName,
        departureTime: payload.departureDate.toLocaleString("en-US", {
          timeZone: "Africa/Abidjan",
        }),
      },
      transactionId,
    },
  });
}

/**
 * Phase 19 (P3-5) — operator alert when a delay-shifted departure creates a
 * driver scheduling overlap. Throttled by idempotency key per
 * trip+driver+conflicting-trip+day so creeping delays don't spam.
 */
export function enqueueOperatorDriverAssignmentConflict(
  db: Tx,
  input: {
    payload: {
      tripId: string;
      conflictTripId: string;
      driverName: string;
      delayedRoute: string;
      conflictRoute: string;
      conflictCompany?: string | null;
      busyUntilIso: string;
    };
    to: DriverRecipient;
  },
) {
  const { payload } = input;
  const dayBucket = new Date().toISOString().slice(0, 10);
  // Phase 14/20 (F-NF-04) — recipient-scoped: every operator of the company
  // is alerted, not just whoever enqueued first that day.
  const transactionId = txIdWithRecipient(
    `driver-assignment-conflict-${payload.tripId}-${payload.conflictTripId}-${dayBucket}`,
    input.to,
  );
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.DRIVER_ASSIGNMENT_CONFLICT,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "operator-driver-assignment-conflict",
      subscriber: input.to,
      data: {
        // Phase 34 (F-NF-14) — omitted when absent (matches the bank
        // helpers); the schema makes it optional so one email-less operator
        // can no longer void their company's conflict alert.
        ...(input.to.email ? { email: input.to.email } : {}),
        firstName: input.to.firstName,
        driverName: payload.driverName,
        delayedRoute: payload.delayedRoute,
        conflictRoute: payload.conflictRoute,
        conflictCompany: payload.conflictCompany ?? null,
        // Phase 34 ride-along — ISO, not a pre-formatted fr-FR string (same
        // anti-pattern Phase 31 killed for departures); the workflow formats.
        busyUntilIso: payload.busyUntilIso,
        tripId: payload.tripId,
      },
      transactionId,
    },
  });
}
