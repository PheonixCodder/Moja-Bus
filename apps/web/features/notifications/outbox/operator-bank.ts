import { enqueueOutboxMessage, OUTBOX_TYPES, type OutboxDb } from "./enqueue";

type BankRecipient = {
  subscriberId: string;
  email?: string;
  firstName?: string;
};

type BankNoticeInput = {
  /** Deterministic per decision event — keys stay retry-safe. */
  decidedAt: Date;
  bankAccountId: string;
  companyName: string;
  bankName: string;
  accountNumberLast4?: string | null;
  recipients: BankRecipient[];
};

const maskedAccount = (last4?: string | null) => `•••• ${last4 ?? "••••"}`;

/**
 * P2-3 (D5): operator-facing bank verification outcomes, delivered via the
 * durable outbox. Fired from admin verifyOperator / rejectOperator.
 */
export async function enqueueOperatorBankVerified(
  db: OutboxDb,
  input: BankNoticeInput,
) {
  const idempotencyKey = `operator-bank-verified-${input.bankAccountId}-${input.decidedAt.toISOString()}`;
  for (const recipient of input.recipients) {
    if (!recipient.email) continue;
    await enqueueOutboxMessage(db, {
      type: OUTBOX_TYPES.OPERATOR_BANK_VERIFIED,
      idempotencyKey: `${idempotencyKey}-${recipient.subscriberId}`,
      payload: {
        workflowId: "operator-bank-verified",
        subscriber: {
          subscriberId: recipient.subscriberId,
          email: recipient.email,
          ...(recipient.firstName ? { firstName: recipient.firstName } : {}),
        },
        data: {
          email: recipient.email,
          ownerName: recipient.firstName ?? "Operator Owner",
          companyName: input.companyName,
          bankName: input.bankName,
          accountNumberHidden: maskedAccount(input.accountNumberLast4),
        },
        transactionId: `${idempotencyKey}-${recipient.subscriberId}`,
      },
    });
  }
}

export async function enqueueOperatorBankRejected(
  db: OutboxDb,
  input: BankNoticeInput & { reason: string },
) {
  const idempotencyKey = `operator-bank-rejected-${input.bankAccountId}-${input.decidedAt.toISOString()}`;
  for (const recipient of input.recipients) {
    if (!recipient.email) continue;
    await enqueueOutboxMessage(db, {
      type: OUTBOX_TYPES.OPERATOR_BANK_REJECTED,
      idempotencyKey: `${idempotencyKey}-${recipient.subscriberId}`,
      payload: {
        workflowId: "operator-bank-rejected",
        subscriber: {
          subscriberId: recipient.subscriberId,
          email: recipient.email,
          ...(recipient.firstName ? { firstName: recipient.firstName } : {}),
        },
        data: {
          email: recipient.email,
          ownerName: recipient.firstName ?? "Operator Owner",
          companyName: input.companyName,
          bankName: input.bankName,
          accountNumberHidden: maskedAccount(input.accountNumberLast4),
          reason: input.reason,
        },
        transactionId: `${idempotencyKey}-${recipient.subscriberId}`,
      },
    });
  }
}
