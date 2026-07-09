import type { PrismaClient } from "@moja/db";
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
  }): Promise<BookingHoldResult> {
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
        schedule: {
          select: {
            route: { select: { distanceKm: true } },
          },
        },
      },
    });
    const distanceKm = trip?.schedule.route.distanceKm ?? null;
    const { settings, tiers } = await loadPlatformSettings(this.prisma);
    const pricing = resolvePricing({
      baseFareXOF: details.priceXOF,
      seatCount: uniqueSeatIds.length,
      distanceKm,
      settings,
      tiers,
    });

    const result = await this.prisma.$transaction(async (tx) => {
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

      return {
        holdId: holdGroup.id,
        bookingReferences,
        holdExpiresAt,
        chargeAmountXOF: pricing.chargeAmountXOF,
      };
    });

    return {
      holdId: result.holdId,
      holdExpiresAt: result.holdExpiresAt,
      bookingReferences: result.bookingReferences,
      totalAmountXOF: result.chargeAmountXOF,
      subtotalBaseXOF: pricing.subtotalBaseXOF,
      convenienceFeeXOF: pricing.convenienceFeeXOF,
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

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.updateMany({
        where: { holdGroupId: holdGroup.id, status: "PENDING_PAYMENT" },
        data: { status: "EXPIRED", holdExpiresAt: null },
      });
      await tx.holdGroup.update({
        where: { id: holdGroup.id },
        data: { status: "EXPIRED" },
      });
    });

    return { success: true };
  }
}
