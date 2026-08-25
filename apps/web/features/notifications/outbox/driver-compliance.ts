import { enqueueOutboxMessage, OUTBOX_TYPES, type OutboxDb } from "./enqueue";

type Tx = OutboxDb;

export type ComplianceSubscriber = {
  subscriberId: string;
  email?: string;
  firstName?: string;
};

/**
 * Phase 14 (F-OP-03/F-DV-12) — licence lifecycle notice (driver + roster
 * operators). The monthly bucket in the transactionId self-dedupes the
 * EXPIRING_SOON warnings without any warned-state column; EXPIRED fires once
 * because the VERIFIED→EXPIRED flip is a one-way transition.
 */
export function enqueueDriverLicenseStatus(
  db: Tx,
  input: {
    driverId: string;
    kind: "EXPIRING_SOON" | "EXPIRED";
    to: ComplianceSubscriber;
    driverName: string;
    expiryDateIso: string;
    companyName?: string | null;
    now?: Date;
  },
) {
  const monthBucket = (input.now ?? new Date()).toISOString().slice(0, 7);
  const transactionId = `driver-license-${input.kind.toLowerCase()}-${input.driverId}-${monthBucket}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.DRIVER_LICENSE_STATUS,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "driver-license-status",
      subscriber: input.to,
      data: {
        kind: input.kind,
        driverName: input.driverName,
        expiryDate: input.expiryDateIso,
        ...(input.companyName ? { companyName: input.companyName } : {}),
        ...(input.to.email ? { email: input.to.email } : {}),
      },
      transactionId,
    },
  });
}

/**
 * Phase 25 (F-OP-09) — platform verification outcome notice to the DRIVER.
 * Enqueued INSIDE admin.verifyDriver's flip transaction: a rollback can never
 * strand a logged action or a sent notice. Day-bucketed per action, so
 * SUSPEND → RESTORE → SUSPEND within one day still fires both suspend
 * notices (the actions differ); only identical same-day repeats dedupe.
 */
export function enqueueDriverVerificationOutcome(
  db: Tx,
  input: {
    driverProfileId: string;
    kind: "APPROVE" | "REJECT" | "SUSPEND";
    to: ComplianceSubscriber;
    driverName: string;
    reason?: string | null;
    now?: Date;
  },
) {
  const dayBucket = (input.now ?? new Date()).toISOString().slice(0, 10);
  const transactionId = `driver-verification-outcome-${input.kind.toLowerCase()}-${input.driverProfileId}-${dayBucket}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.DRIVER_VERIFICATION_OUTCOME,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "driver-verification-outcome",
      subscriber: input.to,
      data: {
        kind: input.kind,
        driverName: input.driverName,
        ...(input.reason ? { reason: input.reason } : {}),
        ...(input.to.email ? { email: input.to.email } : {}),
      },
      transactionId,
    },
  });
}
