import { enqueueOutboxMessage, OUTBOX_TYPES, type OutboxDb } from "./enqueue";
import { txIdWithRecipient } from "./tx-id";

type Tx = OutboxDb;

export type OfferSubscriber = {
  subscriberId: string;
  email?: string;
  firstName?: string;
};

type OfferTerms = {
  companyName: string;
  driverName: string;
  employmentType: string;
  salaryCFA: number;
  startDate?: string | null;
};

/** Operator → Driver: new offer received. */
export function enqueueDriverOfferReceived(
  db: Tx,
  input: {
    offerId: string;
    to: OfferSubscriber;
    terms: OfferTerms;
    expiresAt: Date;
    note?: string | null;
  },
) {
  const transactionId = `driver-offer-received-${input.offerId}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.OFFER_SENT_TO_DRIVER,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "driver-offer-received",
      subscriber: input.to,
      data: {
        offerId: input.offerId,
        companyName: input.terms.companyName,
        employmentType: input.terms.employmentType,
        salaryCFA: input.terms.salaryCFA.toLocaleString("fr-FR"),
        startDate: input.terms.startDate ?? null,
        expiresAt: input.expiresAt.toISOString(),
        note: input.note ?? null,
      },
      transactionId,
    },
  });
}

/** Driver → Operator: counter-offer received. */
export function enqueueOperatorOfferCountered(
  db: Tx,
  input: {
    offerId: string;
    to: OfferSubscriber;
    driverName: string;
    counterSalaryCFA: number;
    counterStartDate?: string | null;
    note?: string | null;
  },
) {
  // Phase 14/20 (F-NF-04) — recipient-scoped keys: multi-operator companies
  // receive EVERY notice instead of only the first.
  const transactionId = txIdWithRecipient(
    `operator-offer-countered-${input.offerId}-${input.counterSalaryCFA}`,
    input.to,
  );
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.OFFER_COUNTERED_BY_DRIVER,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "operator-offer-countered",
      subscriber: input.to,
      data: {
        offerId: input.offerId,
        driverName: input.driverName,
        counterSalaryCFA: input.counterSalaryCFA.toLocaleString("fr-FR"),
        counterStartDate: input.counterStartDate ?? null,
        note: input.note ?? null,
      },
      transactionId,
    },
  });
}

/** Operator → Driver: operator countered back / accepted / declined a counter. */
export function enqueueDriverCounterResolved(
  db: Tx,
  input: {
    offerId: string;
    outcome: "COUNTERED" | "ACCEPTED" | "DECLINED";
    to: OfferSubscriber;
    companyName: string;
    salaryCFA?: number;
    startDate?: string | null;
    note?: string | null;
  },
) {
  const map = {
    COUNTERED: {
      type: OUTBOX_TYPES.OFFER_COUNTERED_BY_OPERATOR,
      workflowId: "driver-offer-countered",
    },
    ACCEPTED: {
      type: OUTBOX_TYPES.OFFER_ACCEPTED,
      workflowId: "driver-offer-counter-accepted",
    },
    DECLINED: {
      type: OUTBOX_TYPES.OFFER_DECLINED,
      workflowId: "driver-offer-counter-declined",
    },
  } as const;
  const transactionId = txIdWithRecipient(
    `${map[input.outcome].workflowId}-${input.offerId}-${input.salaryCFA ?? "final"}`,
    input.to,
  );
  return enqueueOutboxMessage(db, {
    type: map[input.outcome].type,
    idempotencyKey: transactionId,
    payload: {
      workflowId: map[input.outcome].workflowId,
      subscriber: input.to,
      data: {
        offerId: input.offerId,
        companyName: input.companyName,
        ...(input.salaryCFA != null
          ? { salaryCFA: input.salaryCFA.toLocaleString("fr-FR") }
          : {}),
        startDate: input.startDate ?? null,
        note: input.note ?? null,
      },
      transactionId,
    },
  });
}

/** Driver → Operator: offer accepted (affiliation auto-created). */
export function enqueueOperatorOfferAccepted(
  db: Tx,
  input: {
    offerId: string;
    to: OfferSubscriber;
    driverName: string;
    salaryCFA: number;
    employmentType: string;
  },
) {
  const transactionId = `operator-offer-accepted-${input.offerId}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.OFFER_ACCEPTED,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "operator-offer-accepted",
      subscriber: input.to,
      data: {
        offerId: input.offerId,
        driverName: input.driverName,
        salaryCFA: input.salaryCFA.toLocaleString("fr-FR"),
        employmentType: input.employmentType,
      },
      transactionId,
    },
  });
}

/** Driver → Operator: offer declined. */
export function enqueueOperatorOfferDeclined(
  db: Tx,
  input: {
    offerId: string;
    to: OfferSubscriber;
    driverName: string;
    note?: string | null;
  },
) {
  const transactionId = `operator-offer-declined-${input.offerId}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.OFFER_DECLINED,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "operator-offer-declined",
      subscriber: input.to,
      data: {
        offerId: input.offerId,
        driverName: input.driverName,
        note: input.note ?? null,
      },
      transactionId,
    },
  });
}

/** Operator → Driver: pending/countered offer withdrawn by operator. */
export function enqueueDriverOfferWithdrawn(
  db: Tx,
  input: { offerId: string; to: OfferSubscriber; companyName: string },
) {
  const transactionId = `driver-offer-withdrawn-${input.offerId}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.OFFER_WITHDRAWN,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "driver-offer-withdrawn",
      subscriber: input.to,
      data: { offerId: input.offerId, companyName: input.companyName },
      transactionId,
    },
  });
}

/** System → Driver + Operator: expiring within 24h (deduped by event row). */
export function enqueueOfferExpiringSoon(
  db: Tx,
  input: {
    offerId: string;
    role: "DRIVER" | "OPERATOR";
    to: OfferSubscriber;
    counterpartyName: string;
    hoursLeft: number;
  },
) {
  const transactionId = txIdWithRecipient(
    `offer-expiring-soon-${input.offerId}-${input.role.toLowerCase()}`,
    input.to,
  );
  const workflowId =
    input.role === "DRIVER"
      ? "driver-offer-expiring-soon"
      : "operator-offer-expiring-soon";
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.OFFER_EXPIRING_SOON,
    idempotencyKey: transactionId,
    payload: {
      workflowId,
      subscriber: input.to,
      data: {
        offerId: input.offerId,
        counterpartyName: input.counterpartyName,
        hoursLeft: input.hoursLeft,
      },
      transactionId,
    },
  });
}

/** System → Driver + Operator: offer expired unanswered. */
export function enqueueOfferExpired(
  db: Tx,
  input: {
    offerId: string;
    role: "DRIVER" | "OPERATOR";
    to: OfferSubscriber;
    counterpartyName: string;
  },
) {
  const transactionId = txIdWithRecipient(
    `offer-expired-${input.offerId}-${input.role.toLowerCase()}`,
    input.to,
  );
  const workflowId =
    input.role === "DRIVER" ? "driver-offer-expired" : "operator-offer-expired";
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.OFFER_EXPIRED,
    idempotencyKey: transactionId,
    payload: {
      workflowId,
      subscriber: input.to,
      data: {
        offerId: input.offerId,
        counterpartyName: input.counterpartyName,
      },
      transactionId,
    },
  });
}

/** System → displaced operator(s): exclusive affiliation ended via marketplace acceptance. */
export function enqueueDriverAffiliationEnded(
  db: Tx,
  input: {
    offerId: string;
    companyId: string;
    to: OfferSubscriber;
    driverName: string;
    newCompanyName: string;
  },
) {
  const transactionId = txIdWithRecipient(
    `driver-affiliation-ended-${input.offerId}-${input.companyId}`,
    input.to,
  );
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.DRIVER_AFFILIATION_ENDED,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "driver-affiliation-ended",
      subscriber: input.to,
      data: {
        offerId: input.offerId,
        driverName: input.driverName,
        newCompanyName: input.newCompanyName,
      },
      transactionId,
    },
  });
}

/**
 * Phase 13 (F-OP-02) — operator removed a driver from their roster. Sibling of
 * `enqueueDriverAffiliationEnded` (co-located for discoverability, though this
 * is not offer-related): the existing workflow's exclusive-contract copy would
 * read as nonsense here, so this targets the dedicated `driver-roster-removed`
 * workflow and keys on the affiliation id.
 */
export function enqueueDriverRosterRemoved(
  db: Tx,
  input: {
    affiliationId: string;
    companyId: string;
    to: OfferSubscriber;
    driverName: string;
    companyName: string;
  },
) {
  const transactionId = `driver-roster-removed-${input.affiliationId}-${input.companyId}`;
  return enqueueOutboxMessage(db, {
    type: OUTBOX_TYPES.DRIVER_ROSTER_REMOVED,
    idempotencyKey: transactionId,
    payload: {
      workflowId: "driver-roster-removed",
      subscriber: input.to,
      data: {
        driverName: input.driverName,
        companyName: input.companyName,
        ...(input.to.email ? { email: input.to.email } : {}),
      },
      transactionId,
    },
  });
}
