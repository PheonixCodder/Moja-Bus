import type { EvalCampaign, EvalContext, RejectionReason } from "./types";

export function isCampaignActiveWindow(
  campaign: EvalCampaign,
  now: Date,
): boolean {
  if (campaign.status !== "ACTIVE") return false;
  if (campaign.startsAt && now < campaign.startsAt) return false;
  if (campaign.endsAt && now > campaign.endsAt) return false;
  return true;
}

export function checkCampaignEligibility(
  campaign: EvalCampaign,
  ctx: EvalContext,
): RejectionReason | null {
  if (!isCampaignActiveWindow(campaign, ctx.now)) {
    return { code: "INACTIVE", messageKey: "discounts.errors.inactive" };
  }

  if (campaign.companyId && campaign.companyId !== ctx.companyId) {
    return {
      code: "WRONG_OPERATOR",
      messageKey: "discounts.errors.wrongOperator",
    };
  }

  if (
    campaign.requireOperatorOptIn &&
    campaign.optedInCompanyIds &&
    !campaign.optedInCompanyIds.includes(ctx.companyId)
  ) {
    return { code: "NO_OPT_IN", messageKey: "discounts.errors.noOptIn" };
  }

  if (campaign.routeIds?.length) {
    if (!ctx.routeId || !campaign.routeIds.includes(ctx.routeId)) {
      return { code: "ROUTE_SCOPE", messageKey: "discounts.errors.routeScope" };
    }
  }
  if (campaign.scheduleIds?.length) {
    if (!ctx.scheduleId || !campaign.scheduleIds.includes(ctx.scheduleId)) {
      return {
        code: "SCHEDULE_SCOPE",
        messageKey: "discounts.errors.scheduleScope",
      };
    }
  }
  if (campaign.tripIds?.length) {
    if (!campaign.tripIds.includes(ctx.tripId)) {
      return { code: "TRIP_SCOPE", messageKey: "discounts.errors.tripScope" };
    }
  }

  if (
    campaign.minSubtotalXOF != null &&
    ctx.preDiscountSubtotalXOF < campaign.minSubtotalXOF
  ) {
    return { code: "MIN_SPEND", messageKey: "discounts.errors.minSpend" };
  }
  if (campaign.minSeatCount != null && ctx.seatCount < campaign.minSeatCount) {
    return { code: "MIN_SEATS", messageKey: "discounts.errors.minSeats" };
  }
  if (campaign.maxSeatCount != null && ctx.seatCount > campaign.maxSeatCount) {
    return { code: "MAX_SEATS", messageKey: "discounts.errors.maxSeats" };
  }

  if (campaign.firstBookingOnly && ctx.completedBookingCount > 0) {
    return {
      code: "FIRST_BOOKING_ONLY",
      messageKey: "discounts.errors.firstBookingOnly",
    };
  }
  // newUserOnly: account age ≤ 14 days (independent of booking count).
  if (campaign.newUserOnly) {
    if (ctx.userAccountAgeDays == null) {
      return {
        code: "NEW_USER_ONLY",
        messageKey: "discounts.errors.newUserOnly",
      };
    }
    if (ctx.userAccountAgeDays > 14) {
      return {
        code: "NEW_USER_ONLY",
        messageKey: "discounts.errors.newUserOnly",
      };
    }
  }

  if (
    campaign.maxRedemptionsGlobal != null &&
    (campaign.redemptionCountGlobal ?? 0) >= campaign.maxRedemptionsGlobal
  ) {
    return { code: "GLOBAL_CAP", messageKey: "discounts.errors.globalCap" };
  }
  if (
    campaign.maxRedemptionsPerUser != null &&
    ctx.userId &&
    (campaign.redemptionCountForUser ?? 0) >= campaign.maxRedemptionsPerUser
  ) {
    return { code: "USER_CAP", messageKey: "discounts.errors.userCap" };
  }
  if (
    campaign.maxRedemptionsPerPhone != null &&
    ctx.phone &&
    (campaign.redemptionCountForPhone ?? 0) >= campaign.maxRedemptionsPerPhone
  ) {
    return { code: "PHONE_CAP", messageKey: "discounts.errors.phoneCap" };
  }

  const remainingBudget =
    campaign.budgetXOF == null
      ? null
      : campaign.budgetXOF -
        campaign.budgetConsumedXOF -
        campaign.budgetReservedXOF;
  if (remainingBudget != null && remainingBudget <= 0) {
    return { code: "BUDGET", messageKey: "discounts.errors.budget" };
  }

  if (campaign.benefitType === "WALLET_CREDIT_GRANT") {
    return {
      code: "NOT_CHECKOUT_BENEFIT",
      messageKey: "discounts.errors.notCheckoutBenefit",
    };
  }

  return null;
}
