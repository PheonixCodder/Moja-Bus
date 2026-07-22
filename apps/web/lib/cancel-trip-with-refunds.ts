import type { PrismaClient } from "@moja/db";
import { CancellationService } from "@/features/payments/services/cancellation-service";
import { getNovuClient } from "@/lib/novu";

type PrismaLike = PrismaClient;

export async function cancelTripWithRefunds(params: {
  prisma: PrismaLike;
  tripId: string;
  cancelReason: string;
  actor: {
    userId: string;
    companyId: string;
    role?: "OPERATOR" | "ADMIN";
  };
  forceAfterDeparture?: boolean;
}): Promise<{
  tripId: string;
  refundResults: Array<{
    bookingReference: string;
    success: boolean;
    error?: string;
    channel?: "WALLET" | "CASH";
    amountXOF?: number;
  }>;
  expiredHolds: number;
}> {
  const { prisma, tripId, cancelReason, actor, forceAfterDeparture } = params;

  const existing = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!existing) {
    throw new Error("Trip not found");
  }

  if (
    !forceAfterDeparture &&
    existing.departureDate <= new Date() &&
    !["SCHEDULED", "DELAYED", "BOARDING"].includes(existing.status)
  ) {
    throw new Error(
      "Cannot cancel trip after departure without forceAfterDeparture",
    );
  }

  const { trip, refundResults, expiredHoldsCount, bookingsToNotify } = await prisma.$transaction(async (tx) => {
    const expiredHolds = await tx.booking.updateMany({
      where: { tripId, status: "PENDING_PAYMENT" },
      data: { status: "EXPIRED", holdExpiresAt: new Date() },
    });

    const affectedHoldGroups = await tx.booking.findMany({
      where: { tripId, status: "EXPIRED" },
      select: { holdGroupId: true },
      distinct: ['holdGroupId']
    });

    for (const b of affectedHoldGroups) {
      if (!b.holdGroupId) continue;
      const remaining = await tx.booking.count({
        where: { holdGroupId: b.holdGroupId, status: { in: ["CONFIRMED", "PENDING_PAYMENT"] } }
      });
      if (remaining === 0) {
        await tx.holdGroup.update({
          where: { id: b.holdGroupId },
          data: { status: "CANCELLED" }
        });
      }
    }

    const trip = await tx.trip.update({
      where: { id: tripId },
      data: { status: "CANCELLED", cancelReason },
    });

    const bookings = await tx.booking.findMany({
      where: { tripId: trip.id, status: "CONFIRMED" },
      include: {
        user: { select: { email: true, fullName: true, phone: true } },
        trip: {
          include: {
            schedule: {
              include: {
                route: {
                  include: {
                    originTerminal: { include: { cityRelation: true } },
                    destTerminal: { include: { cityRelation: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const cancellationService = new CancellationService(tx as any);
    const refundResults: Array<{
      bookingReference: string;
      success: boolean;
      error?: string;
      channel?: "WALLET" | "CASH";
      amountXOF?: number;
    }> = [];

    for (const booking of bookings) {
      // All bookings are account-linked, so refunds always route to WALLET.
      const channel = "WALLET";
      try {
        const refund = await cancellationService.cancelBooking({
          bookingReference: booking.bookingReference,
          userId: actor.userId,
          userRole: actor.role === "ADMIN" ? "ADMIN" : "OPERATOR",
          userCompanyId: actor.companyId,
          channel,
          reason: `Trip cancelled by operator: ${cancelReason}`,
        }, tx);
        
        refundResults.push({
          bookingReference: booking.bookingReference,
          success: true,
          channel,
          amountXOF: refund.amountXOF,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[cancelTripWithRefunds] Failed to refund booking ${booking.bookingReference}:`, message);

        try {
          await tx.booking.update({
            where: { id: booking.id },
            data: { status: "CANCELLED" },
          });

          await tx.financialTransaction.create({
            data: {
              type: "CANCEL_WITHOUT_REFUND",
              description: `Refund failed for booking ${booking.bookingReference}: ${message}`,
              metadata: { bookingId: booking.id, error: message },
            },
          });
        } catch (innerErr) {
          console.error("Secondary failure writing CANCEL_WITHOUT_REFUND:", innerErr);
        }

        refundResults.push({
          bookingReference: booking.bookingReference,
          success: false,
          error: message,
          channel,
          amountXOF: 0,
        });
      }
    }

    return { trip, refundResults, expiredHoldsCount: expiredHolds.count, bookingsToNotify: bookings };
  });

  if (bookingsToNotify.length > 0) {
    const novu = getNovuClient();
    if (novu) {
      try {
        for (const booking of bookingsToNotify) {
          const email =
            booking.user?.email ??
            (booking.passengerPhone
              ? `${booking.passengerPhone.replace(/\s+/g, "")}@guest.mojaride.ci`
              : null);
          if (!email) continue;

          const originCity =
            booking.trip.schedule.route.originTerminal.cityRelation?.name ??
            "Unknown";
          const destCity =
            booking.trip.schedule.route.destTerminal.cityRelation?.name ??
            "Unknown";
          const refundResult = refundResults.find(
            (r) => r.bookingReference === booking.bookingReference,
          );
          const refundSucceeded = refundResult?.success === true;

          await novu
            .trigger({
              workflowId: "passenger-trip-cancelled",
              to: { subscriberId: email, email },
              payload: {
                email,
                passengerName:
                  booking.user?.fullName ?? booking.passengerName,
                originCity,
                destinationCity: destCity,
                departureTime: trip.departureDate.toLocaleString("en-US", {
                  timeZone: "Africa/Abidjan",
                }),
                cancelReason,
                // L3: never surface a misleading "0 XOF" refund when the refund
                // actually failed. Send a `failed` status and omit the amount so
                // the Novu template can show "Refund processing failed, contact
                // support" instead of "Your refund: 0 XOF".
                refundStatus: refundSucceeded ? "success" : "failed",
                refundAmountXOF: refundSucceeded
                  ? (refundResult?.amountXOF ?? 0)
                  : undefined,
                phone:
                  booking.user?.phone ?? booking.passengerPhone ?? undefined,
              },
              transactionId: `passenger-trip-cancelled-${booking.id}`,
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error("Failed to trigger passenger-trip-cancelled via Novu:", err);
      }
    }
  }

  return {
    tripId: trip.id,
    refundResults,
    expiredHolds: expiredHoldsCount,
  };
}
