import type { DriverRecipient } from "./dispatch";
import { enqueueOutboxMessage, OUTBOX_TYPES, type OutboxDb } from "./enqueue";

type Tx = OutboxDb;

/**
 * Phase 24 (F-OP-08 remainder) — day-bucketed keys replace Date.now():
 * identical re-actions dedupe within a day (kills toggle-spam), while a
 * genuine next-day re-feature still notifies.
 *
 * Phase 34 (F-NF-13 ruling, ratified): the audit's "Date.now() toggle-spam"
 * was pre-closed by this day-bucketing — no further change. Accepted edge:
 * SUSPEND→RESTORE→SUSPEND within the SAME day notifies once (the second
 * suspension is silent). This matches the platform-wide F-OP-08 semantics;
 * suspended drivers discover the state instantly via hard FORBIDDEN on any
 * driver action, so silence is acceptable.
 */
/** Admin → Driver: featured across the marketplace (positive reinforcement). */
export function enqueueDriverMarketplaceFeatured(
  db: Tx,
  input: { driverProfileId: string; to: DriverRecipient },
) {
  const transactionId = `driver-marketplace-featured-${input.driverProfileId}-${new Date().toISOString().slice(0, 10)}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.DRIVER_MARKETPLACE_FEATURED,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "driver-marketplace-featured",
      subscriber: input.to,
      data: {},
      transactionId,
    },
  });
}

/** Admin → Driver: marketplace visibility suspended, with reason. */
export function enqueueDriverMarketplaceSuspended(
  db: Tx,
  input: { driverProfileId: string; to: DriverRecipient; reason: string },
) {
  const transactionId = `driver-marketplace-suspended-${input.driverProfileId}-${new Date().toISOString().slice(0, 10)}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.DRIVER_MARKETPLACE_SUSPENDED,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "driver-marketplace-suspended",
      subscriber: input.to,
      data: { reason: input.reason },
      transactionId,
    },
  });
}
