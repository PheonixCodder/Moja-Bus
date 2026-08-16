import type { PrismaClient } from "@moja/db";
import { CancellationService } from "@/features/payments/services/cancellation-service";
import { enqueueTripCancelled } from "@/features/notifications/outbox/commercial";

type PrismaLike = PrismaClient;

export type TripRefundChannel = "WALLET" | "CASH" | "VOUCHER";

export async function cancelTripWithRefunds(params: {
  prisma: PrismaLike;
  tripId: string;
  cancelReason: string;
  refundChannel?: TripRefundChannel | undefined;
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
    channel?: TripRefundChannel;
    amountXOF?: number;
  }>;
  expiredHolds: number;
  skippedCheckedIn: number;
}> {
  const {
    prisma,
    tripId,
    cancelReason,
    actor,
    forceAfterDeparture,
    refundChannel = "WALLET",
  } = params;

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

  const checkedInCount = await prisma.booking.count({
    where: {
      tripId,
      status: "CONFIRMED",
      checkedInAt: { not: null },
    },
  });
  if (checkedInCount > 0) {
    throw new Error(
      `Cannot cancel trip while ${checkedInCount} passenger(s) are checked in. Handle checked-in bookings first, or cancel non-checked-in seats individually.`,
    );
  }

  const { trip, refundResults, expiredHoldsCount, bookingsToNotify } =
    await prisma.$transaction(async (tx) => {
      const expiredHolds = await tx.booking.updateMany({
        where: { tripId, status: "PENDING_PAYMENT" },
        data: { status: "EXPIRED", holdExpiresAt: new Date() },
      });

      const affectedHoldGroups = await tx.booking.findMany({
        where: { tripId, status: "EXPIRED" },
        select: { holdGroupId: true },
        distinct: ["holdGroupId"],
      });

      for (const b of affectedHoldGroups) {
        if (!b.holdGroupId) continue;
        const remaining = await tx.booking.count({
          where: {
            holdGroupId: b.holdGroupId,
            status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
          },
        });
        if (remaining === 0) {
          await tx.holdGroup.update({
            where: { id: b.holdGroupId },
            data: { status: "CANCELLED" },
          });
        }
      }

      const trip = await tx.trip.update({
        where: { id: tripId },
        data: { status: "CANCELLED", cancelReason },
      });

      const bookings = await tx.booking.findMany({
        where: { tripId: trip.id, status: "CONFIRMED", checkedInAt: null },
        include: {
          user: { select: { email: true, fullName: true, phoneNumber: true } },
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
        channel?: TripRefundChannel;
        amountXOF?: number;
      }> = [];

      for (const booking of bookings) {
        const channel: TripRefundChannel =
          !booking.userId && refundChannel === "WALLET"
            ? "CASH"
            : !booking.userId && refundChannel === "VOUCHER"
              ? "CASH"
              : refundChannel;
        try {
          const refund = await cancellationService.cancelBooking(
            {
              bookingReference: booking.bookingReference,
              userId: actor.userId,
              userRole: actor.role === "ADMIN" ? "ADMIN" : "OPERATOR",
              userCompanyId: actor.companyId,
              channel,
              reason: `Trip cancelled by operator: ${cancelReason}`,
            },
            tx,
          );

          refundResults.push({
            bookingReference: booking.bookingReference,
            success: true,
            channel,
            amountXOF: refund.amountXOF,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(
            `[cancelTripWithRefunds] Failed to refund booking ${booking.bookingReference}:`,
            message,
          );

          // D3: do not cancel the ticket without a durable refund obligation.
          try {
            await tx.booking.update({
              where: { id: booking.id },
              data: { status: "REFUND_PENDING" },
            });

            if (booking.holdGroupId) {
              await tx.refund.create({
                data: {
                  holdGroupId: booking.holdGroupId,
                  bookingId: booking.id,
                  amountXOF: booking.farePaid,
                  channel,
                  status: "FAILED",
                  reason: `Trip cancel refund failed: ${message}`,
                  requestIdempotencyKey: `TRIP_CANCEL_FAIL_${booking.id}`,
                },
              });
            }

            await tx.financialTransaction.create({
              data: {
                type: "REFUND_PENDING",
                businessIdempotencyKey: `REFUND_PENDING_${booking.id}`,
                description: `Refund pending for booking ${booking.bookingReference}: ${message}`,
                metadata: {
                  bookingId: booking.id,
                  error: message,
                  channel,
                },
              },
            });
          } catch (innerErr) {
            console.error(
              "Secondary failure writing REFUND_PENDING obligation:",
              innerErr,
            );
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

      return {
        trip,
        refundResults,
        expiredHoldsCount: expiredHolds.count,
        bookingsToNotify: bookings,
      };
    });

  if (bookingsToNotify.length > 0) {
    try {
      for (const booking of bookingsToNotify) {
        const email = booking.user?.email ?? null;
        if (!email) continue;

        const originCity =
          booking.trip.schedule?.route.originTerminal.cityRelation?.name ??
          "Unknown";
        const destCity =
          booking.trip.schedule?.route.destTerminal.cityRelation?.name ??
          "Unknown";
        const refundResult = refundResults.find(
          (r) => r.bookingReference === booking.bookingReference,
        );
        const refundSucceeded = refundResult?.success === true;
        const firstName =
          (booking.user?.fullName ?? booking.passengerName).split(" ")[0] ??
          "Passenger";
        const data: {
          email: string;
          passengerName: string;
          originCity: string;
          destinationCity: string;
          departureTime: string;
          cancelReason: string;
          refundStatus: string;
          refundAmountXOF?: number;
          phone?: string;
        } = {
          email,
          passengerName: booking.user?.fullName ?? booking.passengerName,
          originCity,
          destinationCity: destCity,
          departureTime: trip.departureDate.toLocaleString("en-US", {
            timeZone: "Africa/Abidjan",
          }),
          cancelReason,
          refundStatus: refundSucceeded ? "success" : "failed",
        };
        if (refundSucceeded) {
          data.refundAmountXOF = refundResult?.amountXOF ?? 0;
        }
        const phone = booking.user?.phoneNumber ?? booking.passengerPhone;
        if (phone) {
          data.phone = phone;
        }

        await enqueueTripCancelled(prisma, {
          bookingId: booking.id,
          email,
          subscriberId: booking.userId ?? email,
          firstName,
          data,
        });
      }
    } catch (err) {
      console.error("Failed to enqueue passenger-trip-cancelled outbox:", err);
    }
  }

  return {
    tripId: trip.id,
    refundResults,
    expiredHolds: expiredHoldsCount,
    skippedCheckedIn: checkedInCount,
  };
}
