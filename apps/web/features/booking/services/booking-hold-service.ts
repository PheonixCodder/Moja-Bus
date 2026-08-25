import type { PrismaClient } from "@moja/db";
import { Prisma } from "@moja/db";
import { TRPCError } from "@trpc/server";
import type { BookingHoldResult, ConfirmedBookingResult } from "@moja/types";
import { SavedPassengerService } from "@/features/passenger/services/saved-passenger-service";
import {
  loadPlatformSettings,
  resolvePricing,
} from "@/features/payments/lib/pricing-resolver";
import { generateBookingReference } from "../lib/booking-reference";
import { holdGroupWhere } from "../lib/hold-group";
import { isActiveBookingStatus, segmentsOverlap } from "../lib/segment-overlap";
import { enqueueHoldCreated } from "@/features/notifications/outbox/commercial";
import { SeatAvailabilityService } from "./seat-availability-service";
import { TripDetailsService } from "./trip-details-service";

const HOLD_DURATION_MS = 15 * 60 * 1000;

type SeatPassengerInput = {
  seatId: string;
  savedPassengerId?: string | undefined;
  passenger?: { passengerName: string; passengerPhone: string } | undefined;
};

export class BookingHoldService {
  constructor(
    private prisma: PrismaClient,
    private tripDetailsService = new TripDetailsService(prisma),
    private seatAvailabilityService = new SeatAvailabilityService(prisma),
    private savedPassengerService = new SavedPassengerService(prisma),
  ) {}

  async createHold(input: {
    offerId: string;
    passengers: SeatPassengerInput[];
    userId?: string | null;
    quoteId: string;
    discount?: {
      code?: string | undefined;
      autoApply?: boolean | undefined;
      useCredits?: boolean | undefined;
      creditAmountXOF?: number | undefined;
    } | undefined;
    deviceHash?: string | undefined;
    /**
     * Phase 32 (F-PS-14) — when present, the passenger-hold-created outbox
     * row enqueues INSIDE the hold transaction (atomic with the hold; a
     * crash between commit and notify is no longer possible). Absent = no
     * notice (e.g. non-email callers).
     */
    notify?: {
      email: string;
      subscriberId: string;
      /** Full display name (payload) — firstName is derived for greeting. */
      passengerName: string;
      phone?: string | null;
    } | undefined;
  }): Promise<BookingHoldResult> {
    const {
      verifyCheckoutQuote,
      quoteMatchesHoldInput,
    } = await import("@/features/payments/lib/checkout-quote");
    const signedQuote = verifyCheckoutQuote(input.quoteId);
    if (
      !quoteMatchesHoldInput(signedQuote, {
        offerId: input.offerId,
        seatCount: [...new Set(input.passengers.map((p) => p.seatId))].length,
        code: input.discount?.code,
        autoApply: input.discount?.autoApply,
        useCredits: input.discount?.useCredits,
      })
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Checkout quote does not match this hold. Refresh pricing and try again.",
      });
    }

    const details = await this.tripDetailsService.getTripDetails(input.offerId);

    if (details.availability.status === "SOLD_OUT") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This trip segment is sold out",
      });
    }

    const seatIds = input.passengers.map((p) => p.seatId);
    const uniqueSeatIds = [...new Set(seatIds)];
    if (uniqueSeatIds.length !== seatIds.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Duplicate seats selected",
      });
    }

    if (uniqueSeatIds.length !== input.passengers.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Each seat must have exactly one passenger",
      });
    }

    const availability = await this.seatAvailabilityService.getSeatAvailability(
      input.offerId,
    );

    for (const seatId of uniqueSeatIds) {
      const seat = availability.seats.find((s) => s.seatId === seatId);
      if (!seat) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid seat selection",
        });
      }
      if (seat.status !== "AVAILABLE") {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Seat ${seat.label} is no longer available`,
        });
      }
    }

    if (uniqueSeatIds.length > details.availability.remaining) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Not enough seats remaining for this segment",
      });
    }

    const resolvedPassengers = await Promise.all(
      input.passengers.map(async (entry) => ({
        seatId: entry.seatId,
        ...(await this.savedPassengerService.resolveSeatPassenger(
          input.userId,
          entry,
        )),
      })),
    );

    const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MS);

    const trip = await this.prisma.trip.findUnique({
      where: { id: details.tripId },
      select: {
        status: true,
        scheduleId: true,
        schedule: {
          select: {
            isActive: true,
            routeId: true,
            route: { select: { distanceKm: true } },
          },
        },
      },
    });

    if (!trip) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
    }
    if (!trip.schedule?.isActive) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This schedule is no longer available for booking",
      });
    }
    if (["CANCELLED", "ARRIVED", "DEPARTED"].includes(trip.status)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This trip can no longer be booked",
      });
    }

    // The fare used below (`details.priceXOF`) is always recomputed live by
    // TripDetailsService from the current schedule fares, so a stale search
    // price can never reach the hold. The passenger-facing "price changed"
    // warning for the login-resume case lives in the booking dialog (M28).

    const distanceKm = trip.schedule?.route.distanceKm ?? null;
    const { settings, tiers } = await loadPlatformSettings(this.prisma);
    const pricing = resolvePricing({
      baseFareXOF: details.priceXOF,
      seatCount: uniqueSeatIds.length,
      distanceKm,
      settings,
      tiers,
    });

    const { quoteCheckoutDiscounts, reserveDiscountOnHold: freezeDiscountOnHold } = await import(
      "@/features/discounts/services/quote-service"
    );
    const discountQuote = await quoteCheckoutDiscounts(this.prisma, {
      offerCompanyId: details.companyId,
      routeId: trip.schedule?.routeId ?? null,
      scheduleId: trip.scheduleId ?? null,
      tripId: details.tripId,
      baseFareXOF: details.priceXOF,
      seatCount: uniqueSeatIds.length,
      convenienceFeeBps: pricing.convenienceFeeBps,
      waiveConvenienceFee: signedQuote.waiveConvenienceFee,
      userId: input.userId,
      code: input.discount?.code,
      autoApply: input.discount?.autoApply,
      useCredits: input.discount?.useCredits,
      creditAmountXOF: input.discount?.creditAmountXOF,
      strict: true,
    });

    if (discountQuote.chargeAmountXOF !== signedQuote.chargeAmountXOF) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Price changed since quote. Refresh pricing and try again.",
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Serialize hold creation per trip so the seat-conflict check + booking
      // insert below are atomic. Without this lock, two concurrent holds on the
      // same seat can both pass the non-locking conflict check and both insert a
      // PENDING_PAYMENT booking — selling one seat to two passengers (F-16
      // over-sale). The lock is held until this transaction commits, so a
      // concurrent createHold for the same trip blocks, then re-runs its conflict
      // check against the now-committed bookings and correctly throws CONFLICT.
      await tx.$queryRaw<{ id: string }[]>(
        Prisma.sql`SELECT id FROM "trip" WHERE id = ${details.tripId} FOR UPDATE`,
      );

      const overlappingBookings = await tx.booking.findMany({
        where: {
          tripId: details.tripId,
          seatId: { in: uniqueSeatIds },
          OR: [
            { status: "CONFIRMED" },
            {
              status: "PENDING_PAYMENT",
              holdExpiresAt: { gt: new Date() },
            },
          ],
        },
        select: {
          seatId: true,
          boardingStopOrder: true,
          dropoffStopOrder: true,
          status: true,
          holdExpiresAt: true,
        },
      });

      for (const seatId of uniqueSeatIds) {
        const conflict = overlappingBookings.find(
          (b) =>
            b.seatId === seatId &&
            segmentsOverlap(
              b.boardingStopOrder,
              b.dropoffStopOrder,
              details.boardingStopOrder,
              details.dropoffStopOrder,
            ) &&
            isActiveBookingStatus(b.status, b.holdExpiresAt),
        );
        if (conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "One or more seats were just booked. Please try again.",
          });
        }
      }

      const holdGroup = await tx.holdGroup.create({
        data: {
          companyId: details.companyId,
          tripId: details.tripId,
          userId: input.userId ?? null,
          offerId: input.offerId,
          status: "ACTIVE",
          holdExpiresAt,
          seatCount: uniqueSeatIds.length,
          baseFareXOF: details.priceXOF,
        },
      });

      await tx.pricingSnapshot.create({
        data: {
          holdGroupId: holdGroup.id,
          distanceKm: pricing.distanceKm,
          commissionBps: pricing.commissionBps,
          convenienceFeeBps: pricing.convenienceFeeBps,
          baseFareXOF: pricing.baseFareXOF,
          seatCount: pricing.seatCount,
          subtotalBaseXOF: pricing.subtotalBaseXOF,
          convenienceFeeXOF: pricing.convenienceFeeXOF,
          chargeAmountXOF: pricing.chargeAmountXOF,
          commissionXOF: pricing.commissionXOF,
          operatorNetXOF: pricing.operatorNetXOF,
          platformGrossXOF: pricing.platformGrossXOF,
        },
      });

      await freezeDiscountOnHold(tx, {
        holdGroupId: holdGroup.id,
        userId: input.userId ?? null,
        companyId: details.companyId,
        quote: discountQuote,
        deviceHash: input.deviceHash ?? null,
      });

      const bookingReferences: string[] = [];
      const createdIds: string[] = [];

      for (const passenger of resolvedPassengers) {
        let reference = generateBookingReference();
        while (bookingReferences.includes(reference)) {
          reference = generateBookingReference();
        }
        bookingReferences.push(reference);

        const booking = await tx.booking.create({
          data: {
            companyId: details.companyId,
            tripId: details.tripId,
            userId: input.userId ?? null,
            seatId: passenger.seatId,
            originTripStopId: details.originTripStopId,
            destinationTripStopId: details.destinationTripStopId,
            boardingStopOrder: details.boardingStopOrder,
            dropoffStopOrder: details.dropoffStopOrder,
            status: "PENDING_PAYMENT",
            holdExpiresAt,
            holdGroupId: holdGroup.id,
            farePaid: details.priceXOF,
            paymentStatus: "UNPAID",
            bookingReference: reference,
            passengerName: passenger.passengerName,
            passengerPhone: passenger.passengerPhone,
            savedPassengerId: passenger.savedPassengerId,
          },
        });
        createdIds.push(booking.id);
      }

      // Phase 32 (F-PS-14) — durable passenger-hold-created outbox row,
      // enqueued INSIDE the tx (was post-commit best-effort with a
      // console.error swallow — a crash between commit and enqueue
      // permanently lost the notice). If this insert fails the hold rolls
      // back atomically, matching the refund-notice pattern.
      if (input.notify?.email) {
        const notifyTrip = await tx.trip.findFirst({
          where: { bookings: { some: { holdGroupId: holdGroup.id } } },
          include: {
            schedule: {
              include: {
                route: {
                  include: {
                    originTerminal: {
                      include: {
                        cityRelation: true,
                        municipality: true,
                        quarter: true,
                      },
                    },
                    destTerminal: {
                      include: {
                        cityRelation: true,
                        municipality: true,
                        quarter: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (notifyTrip) {
          const originCity =
            notifyTrip.schedule?.route.originTerminal.cityRelation?.name ??
            "Unknown";
          const destCity =
            notifyTrip.schedule?.route.destTerminal.cityRelation?.name ??
            "Unknown";
          const originMunicipality =
            notifyTrip.schedule?.route.originTerminal.municipality?.name ??
            null;
          const destinationMunicipality =
            notifyTrip.schedule?.route.destTerminal.municipality?.name ?? null;
          await enqueueHoldCreated(tx, {
            holdId: holdGroup.id,
            email: input.notify.email,
            subscriberId: input.notify.subscriberId,
            firstName: input.notify.passengerName.split(" ")[0] ?? "",
            data: {
              email: input.notify.email,
              passengerName: input.notify.passengerName,
              originCity,
              destinationCity: destCity,
              originMunicipality,
              destinationMunicipality,
              departureTime: notifyTrip.departureDate.toLocaleString("en-US", {
                timeZone: "Africa/Abidjan",
              }),
              holdId: holdGroup.id,
              expiresAt: holdExpiresAt.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                timeZone: "Africa/Abidjan",
              }),
              totalAmountXOF: pricing.chargeAmountXOF,
              phone: input.notify.phone ?? undefined,
            },
          });
        }
      }

      return {
        holdId: holdGroup.id,
        bookingReferences,
        holdExpiresAt,
        chargeAmountXOF: discountQuote.chargeAmountXOF,
      };
    });

    return {
      holdId: result.holdId,
      holdExpiresAt: result.holdExpiresAt,
      bookingReferences: result.bookingReferences,
      totalAmountXOF: result.chargeAmountXOF,
      subtotalBaseXOF: discountQuote.postDiscountSubtotalXOF,
      convenienceFeeXOF: discountQuote.convenienceFeeXOF,
    };
  }

  async confirmBooking(
    holdId: string,
    userId?: string | null,
  ): Promise<ConfirmedBookingResult> {
    const { BookingConfirmationService } = await import(
      "@/features/payments/services/booking-confirmation-service"
    );
    const confirmationService = new BookingConfirmationService(this.prisma);
    return confirmationService.confirmFromPayment(holdId, userId);
  }

  async releaseHold(holdId: string): Promise<{ success: true }> {
    const { resolveHoldGroup } = await import(
      "@/features/payments/lib/resolve-hold-group"
    );
    const holdGroup = await resolveHoldGroup(this.prisma, holdId);

    const { expireOrReleaseHold } = await import(
      "@/features/payments/services/expire-or-release-hold"
    );
    await expireOrReleaseHold(this.prisma, {
      holdGroupId: holdGroup.id,
      reason: "RELEASED",
      force: true,
    });

    return { success: true };
  }
}
