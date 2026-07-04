import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { getPaymentProvider } from "./registry";

export class PaymentService {
  constructor(private prisma: PrismaClient) {}

  async initiateForHold(holdId: string, providerId: string) {
    const anchor = await this.prisma.booking.findUnique({
      where: { id: holdId },
    });

    if (!anchor) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Hold not found" });
    }

    if (anchor.status !== "PENDING_PAYMENT") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This hold is no longer pending payment",
      });
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        tripId: anchor.tripId,
        status: "PENDING_PAYMENT",
        holdExpiresAt: anchor.holdExpiresAt,
        passengerPhone: anchor.passengerPhone,
      },
    });

    const provider = getPaymentProvider(providerId);
    const paymentIds: string[] = [];

    for (const booking of bookings) {
      const existing = await this.prisma.payment.findFirst({
        where: { bookingId: booking.id, status: "PAID" },
      });
      if (existing) {
        paymentIds.push(existing.id);
        continue;
      }

      const result = await provider.initiate({
        bookingId: booking.id,
        amountXOF: booking.farePaid,
        reference: booking.bookingReference,
      });

      const payment = await this.prisma.payment.create({
        data: {
          bookingId: booking.id,
          provider: provider.id,
          amountXOF: booking.farePaid,
          status: result.status === "PAID" ? "PAID" : "PENDING",
          externalReference: result.paymentIds[0] ?? null,
          ...(result.redirectUrl
            ? { metadata: { redirectUrl: result.redirectUrl } }
            : {}),
        },
      });
      paymentIds.push(payment.id);
    }

    return {
      paymentIds,
      status: "PAID" as const,
      provider: provider.id,
    };
  }

  async assertHoldPaid(holdId: string) {
    const anchor = await this.prisma.booking.findUnique({
      where: { id: holdId },
    });

    if (!anchor) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Hold not found" });
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        tripId: anchor.tripId,
        status: "PENDING_PAYMENT",
        holdExpiresAt: anchor.holdExpiresAt,
        passengerPhone: anchor.passengerPhone,
      },
      include: { payments: true },
    });

    const allPaid = bookings.every((b) =>
      b.payments.some((p) => p.status === "PAID"),
    );

    if (!allPaid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment has not been completed for this hold",
      });
    }
  }
}
