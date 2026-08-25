import { enqueueOutboxMessage, OUTBOX_TYPES, type OutboxDb } from "./enqueue";

type Tx = OutboxDb;

export async function enqueueBookingConfirmed(
  db: Tx,
  input: {
    holdGroupId: string;
    email: string;
    subscriberId: string;
    firstName?: string;
    data: Record<string, unknown>;
  },
) {
  const transactionId = `booking-receipt-${input.holdGroupId}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.BOOKING_CONFIRMED,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "passenger-booking-confirmed",
      subscriber: {
        subscriberId: input.subscriberId,
        email: input.email,
        ...(input.firstName ? { firstName: input.firstName } : {}),
      },
      data: input.data,
      transactionId,
    },
  });
}

export async function enqueueBookingRefunded(
  db: Tx,
  input: {
    refundId: string;
    email: string;
    subscriberId: string;
    firstName?: string;
    data: Record<string, unknown>;
  },
) {
  const transactionId = `booking-refunded-${input.refundId}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.BOOKING_REFUNDED,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "passenger-booking-refunded",
      subscriber: {
        subscriberId: input.subscriberId,
        email: input.email,
        ...(input.firstName ? { firstName: input.firstName } : {}),
      },
      data: input.data,
      transactionId,
    },
  });
}

export async function enqueueTripCancelled(
  db: Tx,
  input: {
    bookingId: string;
    email: string;
    subscriberId: string;
    firstName?: string;
    data: Record<string, unknown>;
  },
) {
  const transactionId = `passenger-trip-cancelled-${input.bookingId}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.TRIP_CANCELLED,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "passenger-trip-cancelled",
      subscriber: {
        subscriberId: input.subscriberId,
        email: input.email,
        ...(input.firstName ? { firstName: input.firstName } : {}),
      },
      data: input.data,
      transactionId,
    },
  });
}

/**
 * Phase 07 (F-NF-02, D3/D4) — BOTH delay paths (operator `trips.delay` and
 * driver `reportTripDelay`) enqueue through here instead of firing Novu
 * directly, so delay notices gain outbox durability, retry/backoff, dead-letter
 * visibility and the enqueue↔schema contract test.
 *
 * D4: the transactionId buckets per UTC hour (matching the driver path's
 * previous semantics) so an escalating delay re-notifies in a later hour but
 * cannot spam within one.
 */
export async function enqueuePassengerTripDelayed(
  db: Tx,
  input: {
    tripId: string;
    bookingId: string;
    reportedBy: "OPERATOR" | "DRIVER";
    email: string;
    subscriberId: string;
    firstName?: string | undefined;
    data: Record<string, unknown>;
  },
) {
  const hourBucket = new Date().toISOString().slice(0, 13);
  const transactionId = `passenger-trip-delayed-${input.reportedBy.toLowerCase()}-${input.tripId}-${input.bookingId}-${hourBucket}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.TRIP_DELAYED,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "passenger-trip-delayed",
      subscriber: {
        subscriberId: input.subscriberId,
        email: input.email,
        ...(input.firstName ? { firstName: input.firstName } : {}),
      },
      data: input.data,
      transactionId,
    },
  });
}

export async function enqueueReferralAttributed(
  db: Tx,
  input: {
    edgeId: string;
    email: string;
    subscriberId: string;
    firstName?: string;
    data: Record<string, unknown>;
  },
) {
  const transactionId = `referral-attributed-${input.edgeId}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.REFERRAL_ATTRIBUTED,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "passenger-referral-attributed",
      subscriber: {
        subscriberId: input.subscriberId,
        email: input.email,
        ...(input.firstName ? { firstName: input.firstName } : {}),
      },
      data: input.data,
      transactionId,
    },
  });
}

export async function enqueueReferralReward(
  db: Tx,
  input: {
    creditLotId: string;
    email: string;
    subscriberId: string;
    firstName?: string;
    data: Record<string, unknown>;
  },
) {
  const transactionId = `referral-reward-${input.creditLotId}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.REFERRAL_REWARD,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "passenger-referral-reward",
      subscriber: {
        subscriberId: input.subscriberId,
        email: input.email,
        ...(input.firstName ? { firstName: input.firstName } : {}),
      },
      data: input.data,
      transactionId,
    },
  });
}

/**
 * Phase 33 (F-PS-16) — operator-initiated rebooking confirmation to the
 * passenger. Idempotency keys on the NEW booking reference: a second
 * rebooking of the same passenger mints a new reference and therefore a new
 * honest notification, while retries of the same rebooking dedupe.
 */
export async function enqueuePassengerRebooked(
  db: Tx,
  input: {
    newBookingReference: string;
    email: string;
    subscriberId: string;
    firstName?: string;
    data: Record<string, unknown>;
  },
) {
  const transactionId = `passenger-rebooked-${input.newBookingReference}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.PASSENGER_REBOOKED,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "passenger-rebooked",
      subscriber: {
        subscriberId: input.subscriberId,
        email: input.email,
        ...(input.firstName ? { firstName: input.firstName } : {}),
      },
      data: input.data,
      transactionId,
    },
  });
}

export async function enqueueHoldCreated(
  db: Tx,
  input: {
    holdId: string;
    email: string;
    subscriberId: string;
    firstName?: string;
    data: Record<string, unknown>;
  },
) {
  const transactionId = `passenger-hold-created-${input.holdId}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.HOLD_CREATED,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "passenger-hold-created",
      subscriber: {
        subscriberId: input.subscriberId,
        email: input.email,
        ...(input.firstName ? { firstName: input.firstName } : {}),
      },
      data: input.data,
      transactionId,
    },
  });
}
