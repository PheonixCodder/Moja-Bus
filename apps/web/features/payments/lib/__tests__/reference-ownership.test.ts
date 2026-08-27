import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { PaymentService } from "@/features/payments/payment-service";

/**
 * F-PS-01 / F-PS-13: user-supplied payment references must be bound to their
 * owner before any Paystack API call, state mutation, confirmation fast-path,
 * or rescue credit can run on them.
 *
 * All rejection paths here throw BEFORE any network I/O, so no Paystack env
 * or fetch mocking is required for them; a global fetch tripwire proves the
 * guard ordering.
 */

const OWNER = "user-owner";
const ATTACKER = "user-attacker";
const HOLD_ID = "hold_1";
const BOOKING_REFERENCE = "moja_ref_test_1";

function confirmedHoldGroupShape() {
  return {
    id: HOLD_ID,
    companyId: "company_1",
    tripId: "trip_1",
    userId: OWNER,
    offerId: "offer_1",
    status: "CONFIRMED",
    holdExpiresAt: new Date(Date.now() + 60_000),
    seatCount: 1,
    baseFareXOF: 5_000,
    bookings: [
      {
        id: "booking_1",
        bookingReference: BOOKING_REFERENCE,
        ticketToken: "tok_secret",
        farePaid: 5_000,
        status: "CONFIRMED",
      },
    ],
    pricingSnapshot: {
      chargeAmountXOF: 5_000,
      convenienceFeeXOF: 0,
      subtotalBaseXOF: 5_000,
      commissionXOF: 0,
      operatorNetXOF: 0,
      platformGrossXOF: 0,
      seatCount: 1,
      platformPromoFundedXOF: 0,
      operatorPromoFundedXOF: 0,
      creditAppliedXOF: 0,
      ticketDiscountXOF: 0,
    },
    payment: null,
  };
}

function createMockPrisma(config: {
  externalPaymentFindFirst?: (args: unknown) => unknown;
  holdGroupFindUnique?: (args: unknown) => unknown;
}) {
  const calls = {
    findFirst: 0,
    externalPaymentUpdate: 0,
  };
  const prisma = {
    externalPayment: {
      findFirst: async (args: unknown) => {
        calls.findFirst++;
        return config.externalPaymentFindFirst?.(args) ?? null;
      },
      // Tripwire: ownership checks must never mutate a payment they reject.
      update: async () => {
        calls.externalPaymentUpdate++;
        throw new Error(
          "externalPayment.update must not run during a rejected verify",
        );
      },
    },
    holdGroup: {
      findUnique: async (args: unknown) =>
        config.holdGroupFindUnique?.(args) ?? null,
    },
  };
  return { prisma: prisma as unknown as PrismaClient, calls };
}

let fetchCalls = 0;
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function installFetchTripwire() {
  fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls++;
    throw new Error("network disabled in ownership tests");
  }) as typeof globalThis.fetch;
}

function assertCode(fn: () => Promise<unknown>, code: string) {
  return assert.rejects(
    fn,
    (err: unknown) => err instanceof TRPCError && err.code === code,
  );
}

describe("verifyAndConfirmForUser (F-PS-01)", () => {
  it("lets the owner verify their own paid reference", async () => {
    installFetchTripwire();
    const { prisma } = createMockPrisma({
      externalPaymentFindFirst: () => ({
        id: "pay_1",
        status: "SUCCESS",
        holdGroupId: HOLD_ID,
        amountXOF: 5_000,
        feesXOF: 0,
        paystackReference: "ref",
        purpose: "CHECKOUT",
        holdGroup: { id: HOLD_ID, userId: OWNER },
      }),
      holdGroupFindUnique: () => confirmedHoldGroupShape(),
    });
    const service = new PaymentService(prisma);

    const result = await service.verifyAndConfirmForUser("ref", OWNER);

    assert.equal(result.status, "CONFIRMED");
    assert.deepEqual(result.bookingReferences, [BOOKING_REFERENCE]);
    assert.equal(fetchCalls, 0);
  });

  it("rejects a foreign reference FORBIDDEN before any Paystack call or mutation", async () => {
    installFetchTripwire();
    const { prisma, calls } = createMockPrisma({
      externalPaymentFindFirst: () => ({
        id: "pay_victim",
        status: "PENDING",
        holdGroupId: HOLD_ID,
        amountXOF: 5_000,
        paystackReference: "victim-ref",
        purpose: "CHECKOUT",
        holdGroup: { id: HOLD_ID, userId: OWNER },
      }),
    });
    const service = new PaymentService(prisma);

    await assertCode(
      () => service.verifyAndConfirmForUser("victim-ref", ATTACKER),
      "FORBIDDEN",
    );

    // Guard ordering proof: no Paystack verify fired, no state written.
    assert.equal(fetchCalls, 0);
    assert.equal(calls.externalPaymentUpdate, 0);
  });

  it("rejects an already-paid foreign reference instead of leaking tickets", async () => {
    installFetchTripwire();
    const { prisma } = createMockPrisma({
      externalPaymentFindFirst: () => ({
        id: "pay_victim",
        status: "SUCCESS",
        holdGroupId: HOLD_ID,
        holdGroup: { id: HOLD_ID, userId: OWNER },
      }),
    });
    const service = new PaymentService(prisma);

    await assertCode(
      () => service.verifyAndConfirmForUser("victim-ref", ATTACKER),
      "FORBIDDEN",
    );
    assert.equal(fetchCalls, 0);
  });

  it("returns NOT_FOUND for an unknown reference", async () => {
    const { prisma } = createMockPrisma({});
    const service = new PaymentService(prisma);

    await assertCode(
      () => service.verifyAndConfirmForUser("ghost-ref", OWNER),
      "NOT_FOUND",
    );
  });

  it("rejects payments not linked to a hold group", async () => {
    const { prisma } = createMockPrisma({
      externalPaymentFindFirst: () => ({
        id: "pay_topup",
        status: "SUCCESS",
        holdGroupId: null,
        holdGroup: null,
      }),
    });
    const service = new PaymentService(prisma);

    await assertCode(
      () => service.verifyAndConfirmForUser("topup-ref", OWNER),
      "BAD_REQUEST",
    );
  });

  it("treats guest holds (userId null) as unowned on the user path", async () => {
    const { prisma } = createMockPrisma({
      externalPaymentFindFirst: () => ({
        id: "pay_guest",
        status: "PENDING",
        holdGroupId: HOLD_ID,
        holdGroup: { id: HOLD_ID, userId: null },
      }),
    });
    const service = new PaymentService(prisma);

    await assertCode(
      () => service.verifyAndConfirmForUser("guest-ref", ATTACKER),
      "FORBIDDEN",
    );
  });

  it("system path still confirms without identity (webhook semantics)", async () => {
    installFetchTripwire();
    const { prisma } = createMockPrisma({
      externalPaymentFindFirst: () => ({
        id: "pay_1",
        status: "SUCCESS",
        holdGroupId: HOLD_ID,
        holdGroup: { id: HOLD_ID, userId: OWNER },
      }),
      holdGroupFindUnique: () => confirmedHoldGroupShape(),
    });
    const service = new PaymentService(prisma);

    const result = await service.verifyAndConfirmSystem("ref");

    assert.equal(result.status, "CONFIRMED");
    assert.equal(fetchCalls, 0);
  });
});

describe("verifyTopUpForUser (F-PS-13 binding half)", () => {
  it("lets the initiator verify their own top-up reference", async () => {
    const { prisma } = createMockPrisma({
      externalPaymentFindFirst: () => ({
        id: "pay_topup",
        status: "SUCCESS",
        metadata: { isTopUp: true, accountId: "acct_1", userId: OWNER },
      }),
    });
    const service = new PaymentService(prisma);

    const result = await service.verifyTopUpForUser("topup-ref", OWNER);

    assert.deepEqual(result, { success: true });
  });

  it("rejects a foreign top-up reference FORBIDDEN", async () => {
    const { prisma } = createMockPrisma({
      externalPaymentFindFirst: () => ({
        id: "pay_topup",
        status: "PENDING",
        metadata: { isTopUp: true, accountId: "acct_1", userId: OWNER },
      }),
    });
    const service = new PaymentService(prisma);

    await assertCode(
      () => service.verifyTopUpForUser("topup-ref", ATTACKER),
      "FORBIDDEN",
    );
  });

  it("fails closed for legacy rows without the userId stamp", async () => {
    const { prisma } = createMockPrisma({
      externalPaymentFindFirst: () => ({
        id: "pay_legacy",
        status: "PENDING",
        metadata: { isTopUp: true, accountId: "acct_1" },
      }),
    });
    const service = new PaymentService(prisma);

    await assertCode(
      () => service.verifyTopUpForUser("legacy-ref", OWNER),
      "FORBIDDEN",
    );
  });

  it("returns NOT_FOUND for an unknown top-up reference", async () => {
    const { prisma } = createMockPrisma({});
    const service = new PaymentService(prisma);

    await assertCode(
      () => service.verifyTopUpForUser("ghost-ref", OWNER),
      "NOT_FOUND",
    );
  });
});
