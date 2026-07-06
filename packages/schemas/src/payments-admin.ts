import { z } from "zod";

export const commissionTierSchema = z.object({
  label: z.string().min(1),
  minDistanceKm: z.number().min(0),
  maxDistanceKm: z.number().min(0).nullable().optional(),
  commissionBps: z.number().int().min(0).max(10_000),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const createCommissionTierSchema = commissionTierSchema;
export const updateCommissionTierSchema = commissionTierSchema.extend({
  id: z.string().min(1),
});

export const deleteCommissionTierSchema = z.object({
  id: z.string().min(1),
});

export const updatePlatformSettingsSchema = z.object({
  defaultCommissionBps: z.number().int().min(0).max(10_000).optional(),
  defaultConvenienceFeeBps: z.number().int().min(0).max(10_000).optional(),
});

export const listLedgerEntriesSchema = z.object({
  companyId: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

export const exportOperatorLedgerSchema = z.object({
  companyId: z.string().min(1),
});

export const recordSettlementSchema = z.object({
  companyId: z.string().min(1),
  amountXOF: z.number().int().positive(),
  note: z.string().optional(),
});

export const cancelBookingSchema = z.object({
  bookingReference: z.string().min(1),
  channel: z.enum(["CASH", "VOUCHER"]),
  reason: z.string().optional(),
});

export const getCheckoutPricingSchema = z.object({
  offerId: z.string().min(1),
  seatCount: z.number().int().min(1).max(6),
});
