import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { feeDiscountForCampaign } from "../../engine/benefits";
import { canStackTicketPromos } from "../../engine/stacking";
import type { EvalCampaign } from "../../engine/types";

function campaign(partial: Partial<EvalCampaign>): EvalCampaign {
  return {
    id: "c1",
    companyId: null,
    status: "ACTIVE",
    fundingType: "PLATFORM",
    platformShareBps: 10_000,
    operatorShareBps: 0,
    benefitType: "FIXED_AMOUNT_OFF",
    percentBps: null,
    amountXOF: 1000,
    freeSeatCount: null,
    applyTarget: "TICKET_ONLY",
    startsAt: null,
    endsAt: null,
    minSubtotalXOF: null,
    minSeatCount: null,
    maxSeatCount: null,
    firstBookingOnly: false,
    newUserOnly: false,
    maxRedemptionsGlobal: null,
    maxRedemptionsPerUser: null,
    maxRedemptionsPerPhone: null,
    maxDiscountPerBookingXOF: null,
    budgetXOF: null,
    budgetConsumedXOF: 0,
    budgetReservedXOF: 0,
    stackGroup: "PROMO",
    priority: 0,
    isAutoApply: true,
    allowCombineWithCredit: true,
    requireOperatorOptIn: false,
    ...partial,
  };
}

describe("feeDiscountForCampaign", () => {
  it("returns 0 for TICKET_ONLY", () => {
    assert.equal(
      feeDiscountForCampaign(
        campaign({ applyTarget: "TICKET_ONLY" }),
        500,
        200,
      ),
      0,
    );
  });

  it("applies remaining fixed amount to fee for ENTIRE_CHARGE", () => {
    assert.equal(
      feeDiscountForCampaign(
        campaign({ applyTarget: "ENTIRE_CHARGE", amountXOF: 1000 }),
        800,
        300,
      ),
      200,
    );
  });
});

describe("canStackTicketPromos", () => {
  it("allows credit after a ticket promo", () => {
    assert.equal(
      canStackTicketPromos(
        [
          {
            instrumentType: "AUTO_PROMO",
            ticketDiscountXOF: 100,
            feeDiscountXOF: 0,
            creditAppliedXOF: 0,
            platformFundedXOF: 100,
            operatorFundedXOF: 0,
            stackGroup: "PROMO",
          },
        ],
        "CREDIT",
      ),
      true,
    );
  });

  it("blocks a second ticket promo", () => {
    assert.equal(
      canStackTicketPromos(
        [
          {
            instrumentType: "COUPON_CODE",
            ticketDiscountXOF: 100,
            feeDiscountXOF: 0,
            creditAppliedXOF: 0,
            platformFundedXOF: 100,
            operatorFundedXOF: 0,
            stackGroup: "PROMO",
          },
        ],
        "PROMO",
      ),
      false,
    );
  });
});
