import { enqueueOutboxMessage, OUTBOX_TYPES, type OutboxDb } from "./enqueue";
import { txIdWithRecipient } from "./tx-id";

type Tx = OutboxDb;

/**
 * Phase B2 — Booth ticket created notification.
 * Enqueues both the ticket-confirmation email and (conditionally) the
 * account-created email in the same transaction as the booth sale.
 */
export async function enqueueBoothTicketCreated(
  db: Tx,
  input: {
    bookingId: string;
    bookingReference: string;
    passengerName: string;
    passengerEmail: string;
    subscriberId: string;
    originTerminalName: string;
    destTerminalName: string;
    departureDate: string;
    seatNumber: string | null;
    amountXOF: number;
    ticketToken: string;
    isNewAccount: boolean;
    verificationUrl?: string | null;
  },
) {
  const ticketKey = `booth-ticket-${input.bookingId}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.BOOTH_TICKET_CREATED,
    idempotencyKey: ticketKey,
    payload: {
      workflowId: "booth-ticket-created",
      subscriber: {
        subscriberId: input.subscriberId,
        email: input.passengerEmail,
      },
      data: {
        passengerName: input.passengerName,
        bookingReference: input.bookingReference,
        originTerminalName: input.originTerminalName,
        destTerminalName: input.destTerminalName,
        departureDate: input.departureDate,
        seatNumber: input.seatNumber,
        amountXOF: input.amountXOF,
        ticketToken: input.ticketToken,
        isNewAccount: input.isNewAccount,
        ...(input.verificationUrl
          ? { verificationUrl: input.verificationUrl }
          : {}),
      },
      transactionId: ticketKey,
    },
  });
}

/**
 * Phase B2 — Booth account created notification.
 * Uses a recipient-scoped idempotency key so each passenger gets exactly one
 * account-created email regardless of how many booth sales they make.
 */
export async function enqueueBoothAccountCreated(
  db: Tx,
  input: {
    passengerId: string;
    passengerEmail: string;
    passengerName: string;
    terminalName: string;
    verificationUrl: string;
  },
) {
  const transactionId = txIdWithRecipient(
    `booth-account-${input.passengerId}`,
    { subscriberId: input.passengerId },
  );
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.BOOTH_ACCOUNT_CREATED,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "booth-account-created",
      subscriber: {
        subscriberId: input.passengerId,
        email: input.passengerEmail,
      },
      data: {
        passengerName: input.passengerName,
        email: input.passengerEmail,
        terminalName: input.terminalName,
        verificationUrl: input.verificationUrl,
      },
      transactionId,
    },
  });
}

/**
 * Phase B2 — Booth urban conflict notification.
 * Fans out to all MANAGER/ADMIN/OWNER operators of the company.
 * Each manager gets their own outbox message with a recipient-scoped
 * idempotency key.
 */
export async function enqueueBoothUrbanConflict(
  db: Tx,
  input: {
    tripId: string;
    companyId: string;
    boothSaleIds: string[];
    excessCount: number;
    tripRoute: string;
    tripDate: string;
    staffName: string;
    terminalName: string;
    managers: {
      subscriberId: string;
      email: string;
      firstName?: string;
    }[];
  },
) {
  const baseKey = `booth-urban-conflict-${input.tripId}-${input.boothSaleIds.slice(0, 3).join("-")}`;
  const tripLink = `${process.env["APP_URL"]}/dashboard/operator/trips/${input.tripId}`;

  const results = [];
  for (const manager of input.managers) {
    const transactionId = txIdWithRecipient(baseKey, manager);
    results.push(
      enqueueOutboxMessage(db, {
        type: OUTBOX_TYPES.BOOTH_URBAN_CONFLICT,
        idempotencyKey: transactionId,
        payload: {
          workflowId: "booth-urban-conflict",
          subscriber: {
            subscriberId: manager.subscriberId,
            email: manager.email,
            ...(manager.firstName ? { firstName: manager.firstName } : {}),
          },
          data: {
            tripRoute: input.tripRoute,
            tripDate: input.tripDate,
            excessCount: input.excessCount,
            staffName: input.staffName,
            terminalName: input.terminalName,
            tripLink,
          },
          transactionId,
        },
      }),
    );
  }
  return results;
}
