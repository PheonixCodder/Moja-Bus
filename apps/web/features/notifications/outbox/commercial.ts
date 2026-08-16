import {
  enqueueOutboxMessage,
  OUTBOX_TYPES,
  type OutboxDb,
} from "./enqueue";

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
