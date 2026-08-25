import { enqueueOutboxMessage, OUTBOX_TYPES, type OutboxDb } from "./enqueue";

type Tx = OutboxDb;

import { txIdWithRecipient } from "./tx-id";

/**
 * Phase 22 (F-NF-07) — a discount campaign reached its budget ceiling.
 *
 * Fired after redemption finalization when the finalize pass reports the
 * campaign as exhausted. Recipients are the owning company's active
 * operators; the DAY-bucket transactionId throttles to one alert per
 * operator per day the budget stays exhausted (documented limitation: if the
 * operator raises the budget and it re-exhausts the same day, the follow-up
 * alert waits until the next day).
 */
export function enqueueCampaignBudgetExhausted(
  db: Tx,
  input: {
    campaignId: string;
    to: { subscriberId: string; email?: string };
    campaignName: string;
    budgetXOF: number;
    now?: Date;
  },
) {
  const dayBucket = (input.now ?? new Date()).toISOString().slice(0, 10);
  const transactionId = txIdWithRecipient(
    `campaign-budget-exhausted-${input.campaignId}-${dayBucket}`,
    input.to,
  );
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.CAMPAIGN_BUDGET_EXHAUSTED,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "campaign-budget-exhausted",
      subscriber: input.to,
      data: {
        campaignId: input.campaignId,
        campaignName: input.campaignName,
        budgetXOF: input.budgetXOF,
      },
      transactionId,
    },
  });
}
