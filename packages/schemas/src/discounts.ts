import { z } from "zod";

export const campaignOwnerTypeSchema = z.enum(["PLATFORM", "OPERATOR"]);
export const campaignFundingTypeSchema = z.enum([
  "PLATFORM",
  "OPERATOR",
  "HYBRID",
]);
export const campaignStatusSchema = z.enum([
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "PAUSED",
  "EXHAUSTED",
  "EXPIRED",
  "ARCHIVED",
]);
export const benefitTypeSchema = z.enum([
  "PERCENT_OFF",
  "FIXED_AMOUNT_OFF",
  "FREE_SEAT",
  "WALLET_CREDIT_GRANT",
]);
export const instrumentTypeSchema = z.enum([
  "COUPON_CODE",
  "AUTO_PROMO",
  "CREDIT_LOT",
]);
export const discountApplyTargetSchema = z.enum([
  "TICKET_ONLY",
  "ENTIRE_CHARGE",
]);

export const couponCodeValueSchema = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .regex(/^[A-Za-z0-9-]+$/, "Code must be alphanumeric or hyphen")
  .transform((v) => v.toUpperCase());

const shareBpsSchema = z.number().int().min(0).max(10_000);

export const campaignScopeInputSchema = z.object({
  routeIds: z.array(z.string().min(1)).optional(),
  scheduleIds: z.array(z.string().min(1)).optional(),
  tripIds: z.array(z.string().min(1)).optional(),
});

const campaignFieldsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  status: campaignStatusSchema.optional(),
  fundingType: campaignFundingTypeSchema,
  platformShareBps: shareBpsSchema.default(0),
  operatorShareBps: shareBpsSchema.default(10_000),
  benefitType: benefitTypeSchema,
  percentBps: z.number().int().min(1).max(10_000).optional().nullable(),
  amountXOF: z.number().int().positive().optional().nullable(),
  freeSeatCount: z.number().int().min(1).max(10).optional().nullable(),
  applyTarget: discountApplyTargetSchema.default("TICKET_ONLY"),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  minSubtotalXOF: z.number().int().min(0).optional().nullable(),
  minSeatCount: z.number().int().min(1).optional().nullable(),
  maxSeatCount: z.number().int().min(1).optional().nullable(),
  firstBookingOnly: z.boolean().default(false),
  newUserOnly: z.boolean().default(false),
  maxRedemptionsGlobal: z.number().int().positive().optional().nullable(),
  maxRedemptionsPerUser: z.number().int().positive().optional().nullable(),
  maxRedemptionsPerPhone: z.number().int().positive().optional().nullable(),
  maxDiscountPerBookingXOF: z.number().int().positive().optional().nullable(),
  budgetXOF: z.number().int().positive().optional().nullable(),
  stackGroup: z.string().trim().min(1).max(40).default("PROMO"),
  priority: z.number().int().min(0).max(10_000).default(100),
  isAutoApply: z.boolean().default(false),
  allowCombineWithCredit: z.boolean().default(true),
  requireOperatorOptIn: z.boolean().default(false),
  scopes: campaignScopeInputSchema.optional(),
});

function refineCampaignFields(
  data: {
    fundingType?: z.infer<typeof campaignFundingTypeSchema> | undefined;
    platformShareBps?: number | undefined;
    operatorShareBps?: number | undefined;
    benefitType?: z.infer<typeof benefitTypeSchema> | undefined;
    percentBps?: number | null | undefined;
    amountXOF?: number | null | undefined;
    freeSeatCount?: number | null | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
  },
  ctx: z.RefinementCtx,
  opts: { requireBenefitFields: boolean },
) {
  if (
    data.fundingType === "HYBRID" &&
    data.platformShareBps != null &&
    data.operatorShareBps != null &&
    data.platformShareBps + data.operatorShareBps !== 10_000
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Hybrid shares must sum to 10000 bps",
      path: ["platformShareBps"],
    });
  }
  if (opts.requireBenefitFields) {
    if (data.benefitType === "PERCENT_OFF" && !data.percentBps) {
      ctx.addIssue({
        code: "custom",
        message: "percentBps required for PERCENT_OFF",
        path: ["percentBps"],
      });
    }
    if (data.benefitType === "FIXED_AMOUNT_OFF" && !data.amountXOF) {
      ctx.addIssue({
        code: "custom",
        message: "amountXOF required for FIXED_AMOUNT_OFF",
        path: ["amountXOF"],
      });
    }
    if (data.benefitType === "FREE_SEAT" && !data.freeSeatCount) {
      ctx.addIssue({
        code: "custom",
        message: "freeSeatCount required for FREE_SEAT",
        path: ["freeSeatCount"],
      });
    }
    if (data.benefitType === "WALLET_CREDIT_GRANT" && !data.amountXOF) {
      ctx.addIssue({
        code: "custom",
        message: "amountXOF required for WALLET_CREDIT_GRANT",
        path: ["amountXOF"],
      });
    }
  }
  if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
    ctx.addIssue({
      code: "custom",
      message: "endsAt must be after startsAt",
      path: ["endsAt"],
    });
  }
}

export const upsertCampaignBaseSchema = campaignFieldsSchema.superRefine(
  (data, ctx) => refineCampaignFields(data, ctx, { requireBenefitFields: true }),
);

export const adminCreateCampaignSchema = upsertCampaignBaseSchema.and(
  z.object({
    ownerType: z.literal("PLATFORM").default("PLATFORM"),
  }),
);

export const operatorCreateCampaignSchema = upsertCampaignBaseSchema.and(
  z.object({
    fundingType: z.literal("OPERATOR").default("OPERATOR"),
  }),
);

export const updateCampaignSchema = campaignFieldsSchema
  .partial()
  .extend({ id: z.string().min(1) })
  .superRefine((data, ctx) =>
    refineCampaignFields(data, ctx, { requireBenefitFields: false }),
  );

export const setCampaignStatusSchema = z.object({
  id: z.string().min(1),
  status: campaignStatusSchema,
  pauseReason: z.string().trim().max(500).optional(),
});

export const listCampaignsSchema = z.object({
  status: campaignStatusSchema.optional(),
  search: z.string().trim().max(100).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const createCouponSchema = z.object({
  campaignId: z.string().min(1),
  code: couponCodeValueSchema,
  maxRedemptions: z.number().int().positive().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  assignedUserId: z.string().min(1).optional().nullable(),
});

export const bulkCreateCouponsSchema = z.object({
  campaignId: z.string().min(1),
  prefix: z
    .string()
    .trim()
    .min(2)
    .max(12)
    .regex(/^[A-Za-z0-9-]+$/)
    .transform((v) => v.toUpperCase()),
  count: z.number().int().min(1).max(500),
  maxRedemptions: z.number().int().positive().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const deactivateCouponSchema = z.object({
  id: z.string().min(1),
});

export const listCouponsSchema = z.object({
  campaignId: z.string().min(1).optional(),
  search: z.string().trim().max(64).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const updateReferralProgramSchema = z.object({
  isActive: z.boolean().optional(),
  refereeCouponCampaignId: z.string().min(1).optional().nullable(),
  referrerCreditAmountXOF: z.number().int().min(0).optional(),
  recurringCreditAmountXOF: z.number().int().min(0).optional(),
  recurringMaxBookings: z.number().int().min(0).max(50).optional(),
  recurringWindowDays: z.number().int().min(1).max(730).optional(),
  requirePaidConfirmedBooking: z.boolean().optional(),
  rewardDelayHours: z.number().int().min(0).max(720).optional(),
  selfReferralBlock: z.boolean().optional(),
  sameDeviceBlock: z.boolean().optional(),
  samePhoneBlock: z.boolean().optional(),
  maxQualificationsPerReferrerPerDay: z.number().int().min(1).max(100).optional(),
});

export const applyReferralCodeSchema = z.object({
  code: couponCodeValueSchema,
  deviceHash: z.string().max(128).optional(),
});

export const notifyOptedInCampaignSchema = z.object({
  campaignId: z.string().min(1),
  limit: z.number().int().min(1).max(5000).optional(),
});

export const checkoutDiscountInputSchema = z.object({
  code: couponCodeValueSchema.optional(),
  autoApply: z.boolean().default(true),
  useCredits: z.boolean().default(true),
  creditAmountXOF: z.number().int().min(0).optional(),
});

export const campaignOptInSchema = z.object({
  campaignId: z.string().min(1),
  status: z.enum(["OPTED_IN", "OPTED_OUT"]),
});

export const listRedemptionsSchema = z.object({
  campaignId: z.string().min(1).optional(),
  couponCodeId: z.string().min(1).optional(),
  status: z.enum(["RESERVED", "FINALIZED", "CANCELLED"]).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const listMyInviteesSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const listScopeSchedulesSchema = z.object({
  routeIds: z.array(z.string().min(1)).max(100).default([]),
  companyId: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(200).default(100),
});

export const listScopeTripsSchema = z.object({
  scheduleIds: z.array(z.string().min(1)).max(100).default([]),
  routeIds: z.array(z.string().min(1)).max(100).optional(),
  companyId: z.string().min(1).optional(),
  daysAhead: z.number().int().min(1).max(180).default(60),
  limit: z.number().int().min(1).max(100).default(100),
});

export const issuePromoCreditSchema = z.object({
  userId: z.string().min(1),
  amountXOF: z.number().int().positive(),
  source: z
    .enum([
      "GOODWILL",
      "MARKETING_GRANT",
      "ADMIN_MANUAL",
      "ADMIN",
      "PROMO_GRANT",
      "REFERRAL",
      "LOYALTY",
    ])
    .default("ADMIN_MANUAL"),
  reason: z.string().min(3).optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

export const listUserCreditLotsSchema = z.object({
  userId: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(50),
});

export const claimCreditGrantSchema = z.object({
  code: couponCodeValueSchema,
  deviceHash: z.string().max(128).optional(),
});

export type CheckoutDiscountInput = z.infer<typeof checkoutDiscountInputSchema>;
export type UpsertCampaignBase = z.infer<typeof upsertCampaignBaseSchema>;
