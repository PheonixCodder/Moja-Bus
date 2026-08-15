export type CampaignFundingType = "PLATFORM" | "OPERATOR" | "HYBRID";
export type BenefitType =
  | "PERCENT_OFF"
  | "FIXED_AMOUNT_OFF"
  | "FREE_SEAT"
  | "WALLET_CREDIT_GRANT";
export type DiscountApplyTarget = "TICKET_ONLY" | "ENTIRE_CHARGE";
export type InstrumentType =
  | "COUPON_CODE"
  | "AUTO_PROMO"
  | "MONETARY_VOUCHER"
  | "CREDIT_LOT";

export type EvalCampaign = {
  id: string;
  companyId: string | null;
  status: string;
  fundingType: CampaignFundingType;
  platformShareBps: number;
  operatorShareBps: number;
  benefitType: BenefitType;
  percentBps: number | null;
  amountXOF: number | null;
  freeSeatCount: number | null;
  applyTarget: DiscountApplyTarget;
  startsAt: Date | null;
  endsAt: Date | null;
  minSubtotalXOF: number | null;
  minSeatCount: number | null;
  maxSeatCount: number | null;
  firstBookingOnly: boolean;
  newUserOnly: boolean;
  maxRedemptionsGlobal: number | null;
  maxRedemptionsPerUser: number | null;
  maxRedemptionsPerPhone: number | null;
  maxDiscountPerBookingXOF: number | null;
  budgetXOF: number | null;
  budgetConsumedXOF: number;
  budgetReservedXOF: number;
  stackGroup: string;
  priority: number;
  isAutoApply: boolean;
  allowCombineWithCredit: boolean;
  requireOperatorOptIn: boolean;
  redemptionCountGlobal?: number | undefined;
  redemptionCountForUser?: number | undefined;
  redemptionCountForPhone?: number | undefined;
  routeIds?: string[] | undefined;
  scheduleIds?: string[] | undefined;
  tripIds?: string[] | undefined;
  optedInCompanyIds?: string[] | undefined;
};

export type EvalCoupon = {
  id: string;
  campaignId: string;
  code: string;
  isActive: boolean;
  maxRedemptions: number | null;
  redemptionCount: number;
  expiresAt: Date | null;
  assignedUserId: string | null;
};

export type EvalVoucher = {
  id: string;
  remainingAmountXOF: number;
  reservedAmountXOF: number;
  status: string;
  expiresAt: Date | null;
  applyTarget?: DiscountApplyTarget | undefined;
};

export type EvalCreditLot = {
  id: string;
  remainingXOF: number;
  reservedXOF: number;
  expiresAt: Date | null;
  status: string;
};

export type EvalContext = {
  now: Date;
  userId: string | null;
  completedBookingCount: number;
  phone?: string | null | undefined;
  companyId: string;
  routeId: string | null;
  scheduleId: string | null;
  tripId: string;
  seatCount: number;
  baseFareXOF: number;
  preDiscountSubtotalXOF: number;
  convenienceFeeBps: number;
  waiveConvenienceFee?: boolean | undefined;
};

export type RejectionReason = {
  code: string;
  messageKey: string;
  meta?: Record<string, string | number | boolean | null> | undefined;
};

export type SelectedInstrument = {
  instrumentType: InstrumentType;
  campaignId?: string | undefined;
  couponCodeId?: string | undefined;
  voucherId?: string | undefined;
  creditLotId?: string | undefined;
  ticketDiscountXOF: number;
  feeDiscountXOF: number;
  creditAppliedXOF: number;
  fundingType?: CampaignFundingType | undefined;
  platformFundedXOF: number;
  operatorFundedXOF: number;
  stackGroup?: string | undefined;
  priority?: number | undefined;
  label?: string | undefined;
};

export type QuoteResult = {
  ok: boolean;
  rejection?: RejectionReason | undefined;
  instruments: SelectedInstrument[];
  ticketDiscountXOF: number;
  feeDiscountXOF: number;
  creditAppliedXOF: number;
  preDiscountSubtotalXOF: number;
  postDiscountSubtotalXOF: number;
  convenienceFeeXOF: number;
  provisionalChargeXOF: number;
  chargeAmountXOF: number;
  platformFundedXOF: number;
  operatorFundedXOF: number;
  autoAppliedCampaignId: string | null;
  rejectedAlternatives: Array<{
    campaignId: string;
    reason: RejectionReason;
  }>;
};

export function roundXOF(value: number): number {
  return Math.round(value);
}
