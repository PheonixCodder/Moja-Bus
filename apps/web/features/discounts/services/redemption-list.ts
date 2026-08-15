import type { PrismaClient } from "@moja/db";
import {
  displayName,
  maskEmail,
  maskPhone,
} from "@/features/discounts/lib/privacy-display";

type ListRedemptionsInput = {
  campaignId?: string | undefined;
  couponCodeId?: string | undefined;
  status?: "RESERVED" | "FINALIZED" | "CANCELLED" | undefined;
  limit: number;
  offset: number;
  /** When set, only redemptions for this operator company. */
  companyId?: string | undefined;
  /** Operators get masked contact details. */
  privacy: boolean;
};

export async function listDiscountRedemptions(
  prisma: PrismaClient,
  input: ListRedemptionsInput,
) {
  const where = {
    ...(input.campaignId ? { campaignId: input.campaignId } : {}),
    ...(input.couponCodeId ? { couponCodeId: input.couponCodeId } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.companyId
      ? {
          OR: [
            { companyId: input.companyId },
            { campaign: { companyId: input.companyId } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.discountRedemption.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: input.limit,
      skip: input.offset,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phoneNumber: true },
        },
        couponCode: { select: { id: true, code: true } },
        campaign: { select: { id: true, name: true } },
      },
    }),
    prisma.discountRedemption.count({ where }),
  ]);

  return {
    total,
    items: rows.map((r) => ({
      id: r.id,
      status: r.status,
      instrumentType: r.instrumentType,
      ticketDiscountXOF: r.ticketDiscountXOF,
      feeDiscountXOF: r.feeDiscountXOF,
      creditAppliedXOF: r.creditAppliedXOF,
      createdAt: r.createdAt,
      campaignId: r.campaignId,
      campaignName: r.campaign?.name ?? null,
      couponCodeId: r.couponCodeId,
      couponCode: r.couponCode?.code ?? null,
      user: r.user
        ? {
            id: r.user.id,
            name: displayName(r.user.fullName, { privacy: input.privacy }),
            email: input.privacy
              ? maskEmail(r.user.email)
              : (r.user.email ?? "—"),
            phone: input.privacy
              ? maskPhone(r.user.phoneNumber)
              : (r.user.phoneNumber ?? "—"),
          }
        : null,
    })),
  };
}
