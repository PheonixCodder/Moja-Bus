import type { HoldGroup, PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";

export type ResolvedHoldGroup = HoldGroup & {
  bookings: Array<{
    id: string;
    status: string;
    holdExpiresAt: Date | null;
    bookingReference: string;
    farePaid: number;
    passengerName: string;
    passengerPhone: string;
    ticketToken: string;
    paymentStatus: string;
  }>;
  pricingSnapshot: {
    chargeAmountXOF: number;
    convenienceFeeXOF: number;
    subtotalBaseXOF: number;
    commissionXOF: number;
    operatorNetXOF: number;
    platformGrossXOF: number;
    seatCount: number;
  } | null;
  payment: {
    id: string;
    status: string;
    paystackReference: string | null;
    amountXOF: number;
    provider: string;
  } | null;
};

const holdGroupInclude = {
  bookings: {
    select: {
      id: true,
      status: true,
      holdExpiresAt: true,
      bookingReference: true,
      farePaid: true,
      passengerName: true,
      passengerPhone: true,
      ticketToken: true,
      paymentStatus: true,
    },
  },
  pricingSnapshot: {
    select: {
      chargeAmountXOF: true,
      convenienceFeeXOF: true,
      subtotalBaseXOF: true,
      commissionXOF: true,
      operatorNetXOF: true,
      platformGrossXOF: true,
      seatCount: true,
    },
  },
  payment: {
    select: {
      id: true,
      status: true,
      paystackReference: true,
      amountXOF: true,
      provider: true,
    },
  },
} as const;

/** Accept hold group id or legacy first booking id. */
export async function resolveHoldGroup(
  prisma: PrismaClient,
  holdId: string,
): Promise<ResolvedHoldGroup> {
  const byGroup = await prisma.holdGroup.findUnique({
    where: { id: holdId },
    include: holdGroupInclude,
  });
  if (byGroup) {
    return byGroup;
  }

  const anchor = await prisma.booking.findUnique({
    where: { id: holdId },
    select: { holdGroupId: true },
  });

  if (!anchor?.holdGroupId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Hold not found" });
  }

  const byBooking = await prisma.holdGroup.findUnique({
    where: { id: anchor.holdGroupId },
    include: holdGroupInclude,
  });

  if (!byBooking) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Hold not found" });
  }

  return byBooking;
}

export function assertHoldGroupActive(holdGroup: ResolvedHoldGroup): void {
  if (holdGroup.status !== "ACTIVE") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This hold is no longer active",
    });
  }

  if (holdGroup.holdExpiresAt < new Date()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This hold has expired. Please select seats again.",
    });
  }

  const pending = holdGroup.bookings.every((b) => b.status === "PENDING_PAYMENT");
  if (!pending) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This hold has already been processed",
    });
  }
}
