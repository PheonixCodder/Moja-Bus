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
        holdGroup: {
          select: {
            bookings: {
              select: {
                passengerName: true,
                passengerPhone: true,
                user: { select: { email: true } },
              },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.discountRedemption.count({ where }),
  ]);

  return {
    total,
    items: rows.map((r) => {
      const fallbackBooking = r.holdGroup?.bookings?.[0];
      const rawName = r.user?.fullName ?? fallbackBooking?.passengerName ?? null;
      const rawEmail = r.user?.email ?? fallbackBooking?.user?.email ?? null;
      const rawPhone = r.user?.phoneNumber ?? fallbackBooking?.passengerPhone ?? null;

      const hasUserInfo = Boolean(rawName || rawEmail || rawPhone);

      return {
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
        user: hasUserInfo
          ? {
              id: r.user?.id ?? "guest",
              name: displayName(rawName ?? "Guest Passenger", {
                privacy: input.privacy,
              }),
              email: input.privacy
                ? maskEmail(rawEmail)
                : (rawEmail ?? "—"),
              phone: input.privacy
                ? maskPhone(rawPhone)
                : (rawPhone ?? "—"),
            }
          : null,
      };
    }),
  };
}
