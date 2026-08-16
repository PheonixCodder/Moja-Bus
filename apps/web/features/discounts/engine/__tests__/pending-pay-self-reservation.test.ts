/**
 * Unit tests for pending-pay self-reservation exclusion (P1-17 / Trace C).
 * Simulates creditHoldSelfReservations math via evaluate availability.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateCheckoutDiscounts } from "../index";

describe("pending-pay self-reservation (Trace C)", () => {
  it("sees credits when reserved for this hold is credited back", () => {
    const lotReservedElsewhere = {
      id: "lot_1",
      remainingXOF: 5000,
      reservedXOF: 5000,
      expiresAt: null,
      status: "ACTIVE" as const,
    };
    // Without exclude: available = 0
    const blocked = evaluateCheckoutDiscounts({
      ctx: {
        now: new Date("2026-08-16T12:00:00.000Z"),
        userId: "u1",
        completedBookingCount: 1,
        companyId: "co",
        routeId: null,
        scheduleId: null,
        tripId: "t1",
        seatCount: 1,
        baseFareXOF: 4000,
        preDiscountSubtotalXOF: 4000,
        convenienceFeeBps: 0,
        waiveConvenienceFee: true,
      },
      campaigns: [],
      creditLots: [lotReservedElsewhere],
      useCredits: true,
      autoApply: false,
    });
    assert.equal(blocked.creditAppliedXOF, 0);

    // With exclude-self: treat reserved as available again
    const unblocked = evaluateCheckoutDiscounts({
      ctx: {
        now: new Date("2026-08-16T12:00:00.000Z"),
        userId: "u1",
        completedBookingCount: 1,
        companyId: "co",
        routeId: null,
        scheduleId: null,
        tripId: "t1",
        seatCount: 1,
        baseFareXOF: 4000,
        preDiscountSubtotalXOF: 4000,
        convenienceFeeBps: 0,
        waiveConvenienceFee: true,
      },
      campaigns: [],
      creditLots: [
        {
          ...lotReservedElsewhere,
          reservedXOF: 0, // after creditHoldSelfReservations
        },
      ],
      useCredits: true,
      autoApply: false,
    });
    assert.equal(unblocked.creditAppliedXOF, 4000);
  });
});
