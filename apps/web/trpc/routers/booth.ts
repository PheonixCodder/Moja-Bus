/**
 * Booth Router — Phase B2
 *
 * Full tRPC API surface for the booth app (apps/booth-app).
 * All procedures are gated by boothProcedure which verifies:
 *   - Authenticated user with an active Operator record
 *   - Role is booth-eligible (BOOTH / DISPATCHER / OPERATIONS / MANAGER / ADMIN / OWNER)
 *   - Company is ACTIVE or VERIFIED
 *
 * Field name reference (corrected per schema.prisma):
 *   User.fullName     (NOT .name)
 *   Trip.totalSeats   (direct field, NOT bus.totalSeats)
 *   Trip.serviceType  (direct field, NOT schedule.serviceType)
 *   Seat.label        (NOT .seatNumber)
 *   Fare.type         (FareType enum; no .seatClass)
 *   TripSeat          fields: id, tripId, seatId, isActive, blockedReason — seat via include
 */

import {
  boothCheckInSchema,
  cancelPendingHoldSchema,
  confirmPaystackSaleSchema,
  createCashSaleSchema,
  getDailyReconciliationSchema,
  getTerminalBookingsSchema,
  getTodayTripsSchema,
  getTripSeatMapSchema,
  initiatePaystackLinkSchema,
  lookupOrCreatePassengerSchema,
  pollPaymentStatusSchema,
  preAcquireHoldsSchema,
  releaseHoldsSchema,
  reportUrbanConflictSchema,
} from "@moja/schemas";
import { TRPCError } from "@trpc/server";
import { generateBookingReference } from "@/features/booking/lib/booking-reference";
import { SeatAvailabilityService } from "@/features/booking/services/seat-availability-service";
import {
  enqueueBoothAccountCreated,
  enqueueBoothTicketCreated,
  enqueueBoothUrbanConflict,
} from "@/features/notifications/outbox/booth";
import {
  buildPaystackReference,
  paystackInitialize,
  paystackVerify,
} from "@/features/payments/providers/paystack-client";
import { boothProcedure, createTRPCRouter } from "../init";

// ─── Outbox event types for booth notifications ─────────────────────────────
// (Phase B2 — defined in features/notifications/outbox/enqueue.ts OUTBOX_TYPES;
//  enqueue helpers live in features/notifications/outbox/booth.ts)

// ─── Hold TTL for pre-acquired pool holds (90 minutes) ─────────────────────
const BOOTH_HOLD_TTL_MS = 90 * 60 * 1000;

// ─── Sentinel passenger name for pool holds ─────────────────────────────────
const POOL_HOLD_SENTINEL = "BOOTH_POOL_HOLD";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Africa/Abidjan day boundaries — UTC+0 (no DST), maps directly to UTC midnight */
function dayBoundaries(date: string): { start: Date; end: Date } {
  return {
    start: new Date(`${date}T00:00:00.000Z`),
    end: new Date(`${date}T23:59:59.999Z`),
  };
}

/** First name from full name for notification greeting */
function firstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName;
}

/** Format departureDate Date to fr-CA localized string */
function formatDepartureDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Abidjan",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
export const boothRouter = createTRPCRouter({
  // ───────────────────────────────────────────────────────────────────────────
  // getMyProfile — boot gate check
  // ───────────────────────────────────────────────────────────────────────────
  getMyProfile: boothProcedure.query(async ({ ctx }) => {
    return {
      operatorId: ctx.operator.id,
      role: ctx.operator.role,
      companyId: ctx.operator.companyId,
      staffName: ctx.user.name, // Better Auth session — fullName proxied as name
      staffEmail: ctx.user.email,
    };
  }),

  // ───────────────────────────────────────────────────────────────────────────
  // getTerminals — all active terminals for this company
  // ───────────────────────────────────────────────────────────────────────────
  getTerminals: boothProcedure.query(async ({ ctx }) => {
    const terminals = await ctx.prisma.companyLocation.findMany({
      where: { companyId: ctx.companyId, isTerminal: true, isActive: true },
      select: {
        id: true,
        name: true,
        addressLine1: true,
        cityRelation: { select: { id: true, name: true } },
        municipality: { select: { id: true, name: true } },
        latitude: true,
        longitude: true,
      },
      orderBy: { name: "asc" },
    });

    if (terminals.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message:
          "No terminals configured for your company. Add terminals in the operator dashboard first.",
      });
    }

    return terminals;
  }),

  // ───────────────────────────────────────────────────────────────────────────
  // getTodayTrips — trips from this terminal on a given date
  // ───────────────────────────────────────────────────────────────────────────
  getTodayTrips: boothProcedure
    .input(getTodayTripsSchema)
    .query(async ({ ctx, input }) => {
      const { start, end } = dayBoundaries(input.date);

      const trips = await ctx.prisma.trip.findMany({
        where: {
          companyId: ctx.companyId,
          archivedAt: null,
          status: { in: ["SCHEDULED", "BOARDING", "DELAYED"] },
          departureDate: { gte: start, lte: end },
          tripStops: {
            some: { terminalId: input.terminalId, isPickup: true },
          },
        },
        select: {
          id: true,
          status: true,
          departureDate: true,
          serviceType: true, // direct field on Trip
          totalSeats: true, // direct field on Trip
          gate: true,
          schedule: {
            select: {
              id: true,
              name: true,
              fares: {
                where: { isActive: true },
                select: { id: true, priceXOF: true, type: true },
              },
            },
          },
          bus: {
            select: {
              id: true,
              registrationPlate: true,
              internalName: true,
              seatClass: true,
            },
          },
          tripStops: {
            select: {
              id: true,
              terminalId: true,
              stopOrder: true,
              isPickup: true,
              isDropoff: true,
              scheduledDeparture: true,
              terminal: {
                select: {
                  id: true,
                  name: true,
                  cityRelation: { select: { name: true } },
                },
              },
            },
            orderBy: { stopOrder: "asc" },
          },
          _count: {
            select: {
              bookings: {
                where: {
                  status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
                  OR: [
                    { holdExpiresAt: null },
                    { holdExpiresAt: { gt: new Date() } },
                  ],
                },
              },
            },
          },
        },
        orderBy: { departureDate: "asc" },
      });

      return trips.map((trip) => ({
        id: trip.id,
        status: trip.status,
        departureDate: trip.departureDate,
        serviceType: trip.serviceType,
        gate: trip.gate,
        totalSeats: trip.totalSeats,
        bookedCount: trip._count.bookings,
        availableSeats: Math.max(0, trip.totalSeats - trip._count.bookings),
        schedule: trip.schedule,
        bus: trip.bus,
        tripStops: trip.tripStops,
      }));
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // getTripSeatMap — full seat grid via SeatAvailabilityService
  // ───────────────────────────────────────────────────────────────────────────
  getTripSeatMap: boothProcedure
    .input(getTripSeatMapSchema)
    .query(async ({ ctx, input }) => {
      const service = new SeatAvailabilityService(ctx.prisma);
      return service.getSeatAvailability(input.tripId);
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // preAcquireHolds — pre-grab real DB holds for the offline pool (intercity)
  // ───────────────────────────────────────────────────────────────────────────
  preAcquireHolds: boothProcedure
    .input(preAcquireHoldsSchema)
    .mutation(async ({ ctx, input }) => {
      const terminal = await ctx.prisma.companyLocation.findFirst({
        where: {
          id: input.terminalId,
          companyId: ctx.companyId,
          isTerminal: true,
        },
        select: { id: true },
      });
      if (!terminal) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Terminal not found or does not belong to your company.",
        });
      }

      const trip = await ctx.prisma.trip.findFirst({
        where: { id: input.tripId, companyId: ctx.companyId, archivedAt: null },
        include: {
          schedule: { include: { fares: { where: { isActive: true } } } },
          tripStops: { orderBy: { stopOrder: "asc" } },
        },
      });
      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found." });
      }

      const originStop = trip.tripStops.find(
        (s) => s.terminalId === input.terminalId && s.isPickup,
      );
      if (!originStop) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No pickup stop found for this terminal on this trip.",
        });
      }
      const destStop = trip.tripStops[trip.tripStops.length - 1];
      if (!destStop) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Trip has no stops.",
        });
      }

      const farePaid = trip.schedule?.fares[0]?.priceXOF ?? 0;

      // Seats currently held/confirmed
      const bookedSeatIds = await ctx.prisma.booking
        .findMany({
          where: {
            tripId: input.tripId,
            status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
            OR: [
              { holdExpiresAt: null },
              { holdExpiresAt: { gt: new Date() } },
            ],
          },
          select: { seatId: true },
        })
        .then((rows) => new Set(rows.map((r) => r.seatId)));

      // Fetch available trip seats (overfetch, filter below)
      const tripSeats = await ctx.prisma.tripSeat.findMany({
        where: {
          tripId: input.tripId,
          isActive: true,
        },
        include: {
          seat: { select: { id: true, label: true, seatType: true } },
        },
        take: input.count * 4,
      });

      const available = tripSeats
        .filter(
          (ts) =>
            !bookedSeatIds.has(ts.seatId) &&
            ts.seat.seatType !== "DRIVER_AREA" &&
            ts.seat.seatType !== "EMPTY_SPACE",
        )
        .slice(0, input.count);

      if (available.length === 0) {
        return { holds: [], message: "No seats available to pre-acquire." };
      }

      const expiresAt = new Date(Date.now() + BOOTH_HOLD_TTL_MS);

      const holds = await Promise.all(
        available.map(async (tripSeat) => {
          const booking = await ctx.prisma.booking.create({
            data: {
              companyId: ctx.companyId,
              tripId: input.tripId,
              userId: ctx.user.id,
              seatId: tripSeat.seatId,
              originTripStopId: originStop.id,
              destinationTripStopId: destStop.id,
              boardingStopOrder: originStop.stopOrder,
              dropoffStopOrder: destStop.stopOrder,
              status: "PENDING_PAYMENT",
              holdExpiresAt: expiresAt,
              farePaid,
              paymentStatus: "UNPAID",
              bookingReference: generateBookingReference(),
              passengerName: POOL_HOLD_SENTINEL,
              passengerPhone: "",
            },
            select: { id: true },
          });
          return {
            holdId: booking.id,
            seatId: tripSeat.seatId,
            seatLabel: tripSeat.seat.label,
            expiresAt,
          };
        }),
      );

      return { holds };
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // releaseHolds — cancel unconsumed pool holds
  // ───────────────────────────────────────────────────────────────────────────
  releaseHolds: boothProcedure
    .input(releaseHoldsSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.booking.updateMany({
        where: {
          id: { in: input.holdIds },
          companyId: ctx.companyId,
          userId: ctx.user.id,
          status: "PENDING_PAYMENT",
          passengerName: POOL_HOLD_SENTINEL,
        },
        data: { status: "CANCELLED" },
      });
      return { released: input.holdIds.length };
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // lookupOrCreatePassenger — find or create unverified TRAVELER
  // ───────────────────────────────────────────────────────────────────────────
  lookupOrCreatePassenger: boothProcedure
    .input(lookupOrCreatePassengerSchema)
    .mutation(async ({ ctx, input }) => {
      const normalizedEmail = input.email.toLowerCase().trim();

      let user = await ctx.prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            ...(input.phone ? [{ phoneNumber: input.phone }] : []),
          ],
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          emailVerified: true,
          role: true,
        },
      });

      let isNewAccount = false;

      if (!user) {
        user = await ctx.prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            fullName: input.fullName,
            email: normalizedEmail,
            phoneNumber: input.phone ?? null,
            emailVerified: false,
            role: "TRAVELER",
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            emailVerified: true,
            role: true,
          },
        });
        isNewAccount = true;
      }

      return {
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phoneNumber,
        emailVerified: user.emailVerified,
        isNewAccount,
      };
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // createCashSale — atomic cash booking transaction
  // ───────────────────────────────────────────────────────────────────────────
  createCashSale: boothProcedure
    .input(createCashSaleSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const destTerminal = await tx.companyLocation.findFirst({
          where: {
            id: input.destinationTerminalId,
            companyId: ctx.companyId,
            isTerminal: true,
          },
          select: { id: true, name: true },
        });
        if (!destTerminal) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid destination terminal.",
          });
        }

        let bookingId: string;

        if (input.holdId) {
          // ── Offline path: consume a pre-acquired pool hold ──────────────
          const hold = await tx.booking.findFirst({
            where: {
              id: input.holdId,
              companyId: ctx.companyId,
              status: "PENDING_PAYMENT",
              passengerName: POOL_HOLD_SENTINEL,
              holdExpiresAt: { gt: new Date() },
            },
            select: { id: true },
          });
          if (!hold) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "Hold expired or already used. Re-select a seat and try again.",
            });
          }

          await tx.booking.update({
            where: { id: hold.id },
            data: {
              userId: input.passengerId,
              passengerName: input.passengerName,
              passengerPhone: input.passengerPhone ?? "",
              status: "CONFIRMED",
              holdExpiresAt: null,
              paymentStatus: "PAID",
              issuedAt: new Date(),
            },
          });
          bookingId = hold.id;
        } else {
          // ── Online path: create a fresh confirmed booking ───────────────
          if (!input.seatIds || input.seatIds.length === 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Either holdId (offline) or seatIds (online) must be provided.",
            });
          }

          const trip = await tx.trip.findFirst({
            where: { id: input.tripId, companyId: ctx.companyId },
            include: {
              schedule: { include: { fares: { where: { isActive: true } } } },
              tripStops: { orderBy: { stopOrder: "asc" } },
            },
          });
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Trip not found.",
            });
          }

          const originStop = trip.tripStops.find(
            (s) => s.terminalId === input.terminalId && s.isPickup,
          );
          const destStop =
            trip.tripStops.find(
              (s) =>
                s.terminalId === input.destinationTerminalId && s.isDropoff,
            ) ?? trip.tripStops[trip.tripStops.length - 1];

          if (!originStop || !destStop) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Could not resolve trip stops for origin/destination.",
            });
          }

          const farePaid =
            trip.schedule?.fares[0]?.priceXOF ?? input.cashAmountXOF;

          // Verify seat availability
          const seatId = input.seatIds[0]!;
          const conflict = await tx.booking.findFirst({
            where: {
              tripId: input.tripId,
              seatId,
              status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
              OR: [
                { holdExpiresAt: null },
                { holdExpiresAt: { gt: new Date() } },
              ],
            },
            select: { id: true },
          });
          if (conflict) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "Seat is no longer available. Please select a different seat.",
            });
          }

          const booking = await tx.booking.create({
            data: {
              companyId: ctx.companyId,
              tripId: input.tripId,
              userId: input.passengerId,
              seatId,
              originTripStopId: originStop.id,
              destinationTripStopId: destStop.id,
              boardingStopOrder: originStop.stopOrder,
              dropoffStopOrder: destStop.stopOrder,
              status: "CONFIRMED",
              holdExpiresAt: null,
              farePaid,
              paymentStatus: "PAID",
              bookingReference: generateBookingReference(),
              passengerName: input.passengerName,
              passengerPhone: input.passengerPhone ?? "",
              issuedAt: new Date(),
            },
            select: { id: true },
          });
          bookingId = booking.id;
        }

        // Create BoothSale audit record
        const boothSale = await tx.boothSale.create({
          data: {
            bookingId,
            companyId: ctx.companyId,
            terminalId: input.terminalId,
            staffId: ctx.operator.id,
            paymentMethod: "CASH",
            cashAmountXOF: input.cashAmountXOF,
            wasOffline: input.wasOffline,
            walkedUpPassenger: input.walkedUpPassenger,
            passengerAccountCreated: input.passengerAccountCreated,
          },
          select: { id: true },
        });

        // Fetch enriched booking data for notification payloads
        const enrichedBooking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: {
            trip: { select: { departureDate: true } },
            seat: { select: { label: true } },
            originTripStop: {
              include: { terminal: { select: { name: true } } },
            },
            destinationTripStop: {
              include: { terminal: { select: { name: true } } },
            },
          },
        });
        const originTerminalName =
          enrichedBooking?.originTripStop?.terminal?.name ?? "";
        const destTerminalName =
          enrichedBooking?.destinationTripStop?.terminal?.name ?? "";

        // Enqueue ticket notification
        await enqueueBoothTicketCreated(tx, {
          bookingId,
          bookingReference: enrichedBooking?.bookingReference ?? "",
          passengerName: input.passengerName,
          passengerEmail: input.passengerEmail,
          subscriberId: input.passengerId,
          originTerminalName,
          destTerminalName,
          departureDate: formatDepartureDate(
            enrichedBooking?.trip?.departureDate ?? null,
          ),
          seatNumber: enrichedBooking?.seat?.label ?? null,
          amountXOF: input.cashAmountXOF,
          ticketToken: enrichedBooking?.ticketToken ?? "",
          isNewAccount: input.passengerAccountCreated,
          verificationUrl: input.passengerAccountCreated
            ? `${process.env["APP_URL"]}/verify-email?ticketToken=${enrichedBooking?.ticketToken ?? ""}`
            : null,
        });

        if (input.passengerAccountCreated) {
          const terminalName = await tx.companyLocation
            .findUnique({
              where: { id: input.terminalId },
              select: { name: true },
            })
            .then((t) => t?.name ?? "");

          await enqueueBoothAccountCreated(tx, {
            passengerId: input.passengerId,
            passengerEmail: input.passengerEmail,
            passengerName: input.passengerName,
            terminalName,
            verificationUrl: `${process.env["APP_URL"]}/verify-email?ticketToken=${enrichedBooking?.ticketToken ?? ""}`,
          });
        }

        return { bookingId, boothSaleId: boothSale.id, confirmed: true };
      });
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // initiatePaystackLink — create hold + Paystack QR link
  // ───────────────────────────────────────────────────────────────────────────
  initiatePaystackLink: boothProcedure
    .input(initiatePaystackLinkSchema)
    .mutation(async ({ ctx, input }) => {
      const trip = await ctx.prisma.trip.findFirst({
        where: { id: input.tripId, companyId: ctx.companyId },
        include: {
          schedule: { include: { fares: { where: { isActive: true } } } },
          tripStops: { orderBy: { stopOrder: "asc" } },
        },
      });
      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found." });
      }

      const originStop = trip.tripStops.find(
        (s) => s.terminalId === input.terminalId && s.isPickup,
      );
      const destStop =
        trip.tripStops.find(
          (s) => s.terminalId === input.destinationTerminalId && s.isDropoff,
        ) ?? trip.tripStops[trip.tripStops.length - 1];

      if (!originStop || !destStop) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not resolve trip stops for this sale.",
        });
      }

      const amountXOF =
        trip.schedule?.fares[0]?.priceXOF ?? input.quotedAmountXOF;

      // Find an available seat
      let seatId: string | undefined = input.seatIds?.[0];

      if (!seatId) {
        // Urban trip — find any available TripSeat
        const bookedSeatIds = await ctx.prisma.booking
          .findMany({
            where: {
              tripId: input.tripId,
              status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
              OR: [
                { holdExpiresAt: null },
                { holdExpiresAt: { gt: new Date() } },
              ],
            },
            select: { seatId: true },
          })
          .then((rows) => new Set(rows.map((r) => r.seatId)));

        const available = await ctx.prisma.tripSeat.findFirst({
          where: { tripId: input.tripId, isActive: true },
          include: { seat: { select: { seatType: true } } },
        });

        if (
          available &&
          !bookedSeatIds.has(available.seatId) &&
          available.seat.seatType !== "DRIVER_AREA" &&
          available.seat.seatType !== "EMPTY_SPACE"
        ) {
          seatId = available.seatId;
        }
      } else {
        // Verify the chosen seat is available
        const conflict = await ctx.prisma.booking.findFirst({
          where: {
            tripId: input.tripId,
            seatId,
            status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
            OR: [
              { holdExpiresAt: null },
              { holdExpiresAt: { gt: new Date() } },
            ],
          },
          select: { id: true },
        });
        if (conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Seat is no longer available.",
          });
        }
      }

      if (!seatId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "No seats available for this trip.",
        });
      }

      const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      const pendingBooking = await ctx.prisma.booking.create({
        data: {
          companyId: ctx.companyId,
          tripId: input.tripId,
          userId: input.passengerId,
          seatId,
          originTripStopId: originStop.id,
          destinationTripStopId: destStop.id,
          boardingStopOrder: originStop.stopOrder,
          dropoffStopOrder: destStop.stopOrder,
          status: "PENDING_PAYMENT",
          holdExpiresAt,
          farePaid: amountXOF,
          paymentStatus: "UNPAID",
          bookingReference: generateBookingReference(),
          passengerName: input.passengerName,
          passengerPhone: input.passengerPhone ?? "",
        },
        select: { id: true },
      });

      const reference = buildPaystackReference(pendingBooking.id, 1);

      const paystack = await paystackInitialize({
        email: input.passengerEmail,
        amountXOF,
        reference,
        metadata: {
          bookingId: pendingBooking.id,
          source: "BOOTH",
          staffId: ctx.operator.id,
          terminalId: input.terminalId,
          walkedUpPassenger: input.walkedUpPassenger,
          passengerAccountCreated: input.passengerAccountCreated,
        },
      });

      return {
        bookingId: pendingBooking.id,
        paystackReference: paystack.reference,
        authorizationUrl: paystack.authorizationUrl,
        amountXOF,
        expiresAt: holdExpiresAt.toISOString(),
      };
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // pollPaymentStatus — check Paystack payment (called every 3s)
  // ───────────────────────────────────────────────────────────────────────────
  pollPaymentStatus: boothProcedure
    .input(pollPaymentStatusSchema)
    .query(async ({ input }) => {
      const verification = await paystackVerify(input.paystackReference);
      if (verification.status === "success") {
        return { status: "PAID" as const, reference: input.paystackReference };
      }
      if (verification.status === "failed") {
        return { status: "FAILED" as const };
      }
      return { status: "PENDING" as const };
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // confirmPaystackSale — re-verify + confirm booking + create BoothSale
  // ───────────────────────────────────────────────────────────────────────────
  confirmPaystackSale: boothProcedure
    .input(confirmPaystackSaleSchema)
    .mutation(async ({ ctx, input }) => {
      const verification = await paystackVerify(input.paystackReference);
      if (verification.status !== "success") {
        throw new TRPCError({
          code: "PAYMENT_REQUIRED",
          message: "Payment not yet confirmed by Paystack.",
        });
      }

      return ctx.prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findFirst({
          where: {
            id: input.holdGroupId,
            companyId: ctx.companyId,
            status: "PENDING_PAYMENT",
          },
          select: { id: true },
        });

        if (!booking) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pending booking not found — may already be confirmed.",
          });
        }

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "CONFIRMED",
            holdExpiresAt: null,
            paymentStatus: "PAID",
            issuedAt: new Date(),
            passengerName: input.passengerName,
            userId: input.passengerId,
          },
        });

        const boothSale = await tx.boothSale.create({
          data: {
            bookingId: booking.id,
            companyId: ctx.companyId,
            terminalId: input.terminalId,
            staffId: ctx.operator.id,
            paymentMethod: "PAYSTACK_LINK",
            paystackRef: input.paystackReference,
            wasOffline: false,
            walkedUpPassenger: input.walkedUpPassenger,
            passengerAccountCreated: input.passengerAccountCreated,
          },
          select: { id: true },
        });

        // Enqueue ticket notification
        const enrichedBooking = await tx.booking.findUnique({
          where: { id: booking.id },
          include: {
            trip: { select: { departureDate: true } },
            seat: { select: { label: true } },
            originTripStop: {
              include: { terminal: { select: { name: true } } },
            },
            destinationTripStop: {
              include: { terminal: { select: { name: true } } },
            },
          },
        });
        const originTerminalName =
          enrichedBooking?.originTripStop?.terminal?.name ?? "";
        const destTerminalName =
          enrichedBooking?.destinationTripStop?.terminal?.name ?? "";

        await enqueueBoothTicketCreated(tx, {
          bookingId: booking.id,
          bookingReference: enrichedBooking?.bookingReference ?? "",
          passengerName: input.passengerName,
          passengerEmail: input.passengerEmail,
          subscriberId: input.passengerId,
          originTerminalName,
          destTerminalName,
          departureDate: formatDepartureDate(
            enrichedBooking?.trip?.departureDate ?? null,
          ),
          seatNumber: enrichedBooking?.seat?.label ?? null,
          amountXOF: enrichedBooking?.farePaid ?? 0,
          ticketToken: enrichedBooking?.ticketToken ?? "",
          isNewAccount: input.passengerAccountCreated,
          verificationUrl: input.passengerAccountCreated
            ? `${process.env["APP_URL"]}/verify-email?ticketToken=${enrichedBooking?.ticketToken ?? ""}`
            : null,
        });

        if (input.passengerAccountCreated) {
          const terminalName = await tx.companyLocation
            .findUnique({
              where: { id: input.terminalId },
              select: { name: true },
            })
            .then((t) => t?.name ?? "");

          await enqueueBoothAccountCreated(tx, {
            passengerId: input.passengerId,
            passengerEmail: input.passengerEmail,
            passengerName: input.passengerName,
            terminalName,
            verificationUrl: `${process.env["APP_URL"]}/verify-email?ticketToken=${enrichedBooking?.ticketToken ?? ""}`,
          });
        }

        return {
          bookingId: booking.id,
          boothSaleId: boothSale.id,
          confirmed: true,
        };
      });
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // cancelPendingHold — release a timed-out Paystack hold
  // ───────────────────────────────────────────────────────────────────────────
  cancelPendingHold: boothProcedure
    .input(cancelPendingHoldSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.booking.updateMany({
        where: {
          id: input.holdGroupId,
          companyId: ctx.companyId,
          status: "PENDING_PAYMENT",
        },
        data: { status: "CANCELLED" },
      });
      return { cancelled: true };
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // checkInPassenger — validate QR token and stamp checkedInAt
  // ───────────────────────────────────────────────────────────────────────────
  checkInPassenger: boothProcedure
    .input(boothCheckInSchema)
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findFirst({
        where: {
          ticketToken: input.ticketToken,
          companyId: ctx.companyId,
          status: "CONFIRMED",
        },
        select: {
          id: true,
          tripId: true,
          passengerName: true,
          checkedInAt: true,
          userId: true,
          trip: {
            select: {
              id: true,
              status: true,
              departureDate: true,
              tripStops: {
                where: { terminalId: input.terminalId, isPickup: true },
                select: { id: true },
              },
            },
          },
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found or already used.",
        });
      }

      if (booking.trip.tripStops.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "This ticket is not for a trip departing from this terminal.",
        });
      }

      if (booking.checkedInAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Passenger already checked in at ${booking.checkedInAt.toISOString()}.`,
        });
      }

      const now = new Date();
      await ctx.prisma.booking.update({
        where: { id: booking.id },
        data: { checkedInAt: now },
      });

      return {
        bookingId: booking.id,
        passengerName: booking.passengerName,
        passengerEmail: booking.user?.email ?? null,
        tripId: booking.tripId,
        checkedInAt: now.toISOString(),
      };
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // getTerminalBookings — paginated day's sales for the bookings tab
  // ───────────────────────────────────────────────────────────────────────────
  getTerminalBookings: boothProcedure
    .input(getTerminalBookingsSchema)
    .query(async ({ ctx, input }) => {
      const { start, end } = dayBoundaries(input.date);
      const skip = (input.page - 1) * input.limit;

      const where = {
        terminalId: input.terminalId,
        companyId: ctx.companyId,
        confirmedAt: { gte: start, lte: end },
        ...(input.paymentMethod !== "ALL"
          ? { paymentMethod: input.paymentMethod as "CASH" | "PAYSTACK_LINK" }
          : {}),
      };

      const [sales, total] = await Promise.all([
        ctx.prisma.boothSale.findMany({
          where,
          include: {
            booking: {
              select: {
                id: true,
                bookingReference: true,
                passengerName: true,
                passengerPhone: true,
                farePaid: true,
                status: true,
                checkedInAt: true,
                trip: {
                  select: {
                    id: true,
                    departureDate: true,
                    serviceType: true,
                  },
                },
              },
            },
            staff: {
              select: {
                id: true,
                user: { select: { id: true, fullName: true } },
              },
            },
          },
          orderBy: { confirmedAt: "desc" },
          skip,
          take: input.limit,
        }),
        ctx.prisma.boothSale.count({ where }),
      ]);

      return {
        sales,
        total,
        page: input.page,
        pageCount: Math.ceil(total / input.limit),
      };
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // getDailyReconciliation — end-of-day totals
  // ───────────────────────────────────────────────────────────────────────────
  getDailyReconciliation: boothProcedure
    .input(getDailyReconciliationSchema)
    .query(async ({ ctx, input }) => {
      const { start, end } = dayBoundaries(input.date);

      const sales = await ctx.prisma.boothSale.findMany({
        where: {
          terminalId: input.terminalId,
          companyId: ctx.companyId,
          confirmedAt: { gte: start, lte: end },
          ...(input.staffId ? { staffId: input.staffId } : {}),
        },
        include: {
          booking: {
            select: {
              id: true,
              bookingReference: true,
              farePaid: true,
              passengerName: true,
              status: true,
              trip: {
                select: {
                  departureDate: true,
                  serviceType: true,
                },
              },
            },
          },
          staff: {
            select: {
              id: true,
              user: { select: { id: true, fullName: true } },
            },
          },
        },
        orderBy: { confirmedAt: "asc" },
      });

      const cashSales = sales.filter((s) => s.paymentMethod === "CASH");
      const paystackSales = sales.filter(
        (s) => s.paymentMethod === "PAYSTACK_LINK",
      );

      const cashTotal = cashSales.reduce(
        (sum, s) => sum + (s.cashAmountXOF ?? 0),
        0,
      );
      const paystackTotal = paystackSales.reduce(
        (sum, s) => sum + s.booking.farePaid,
        0,
      );

      return {
        date: input.date,
        terminalId: input.terminalId,
        staffId: input.staffId ?? null,
        totalSales: sales.length,
        cashCount: cashSales.length,
        paystackCount: paystackSales.length,
        cashTotalXOF: cashTotal,
        paystackTotalXOF: paystackTotal,
        grandTotalXOF: cashTotal + paystackTotal,
        offlineSalesCount: sales.filter((s) => s.wasOffline).length,
        walkUpCount: sales.filter((s) => s.walkedUpPassenger).length,
        conflictCount: sales.filter((s) => s.hasConflict).length,
        sales,
      };
    }),

  // ───────────────────────────────────────────────────────────────────────────
  // reportUrbanConflict — flag overbooking + notify ERP
  // ───────────────────────────────────────────────────────────────────────────
  reportUrbanConflict: boothProcedure
    .input(reportUrbanConflictSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(async (tx) => {
        await tx.boothSale.updateMany({
          where: { id: { in: input.boothSaleIds }, companyId: ctx.companyId },
          data: {
            hasConflict: true,
            conflictDetails: `Urban overbooking: ${input.excessCount} excess passenger(s) on trip ${input.tripId}`,
          },
        });

        // Fetch trip route + staff + terminal for enrichment
        const [trip, firstSale] = await Promise.all([
          tx.trip.findFirst({
            where: { id: input.tripId, companyId: ctx.companyId },
            include: {
              schedule: {
                include: {
                  route: {
                    include: {
                      originTerminal: { select: { name: true } },
                      destTerminal: { select: { name: true } },
                    },
                  },
                },
              },
            },
          }),
          tx.boothSale.findFirst({
            where: {
              id: { in: input.boothSaleIds },
              companyId: ctx.companyId,
            },
            include: {
              staff: { include: { user: { select: { fullName: true } } } },
              terminal: { select: { name: true } },
            },
          }),
        ]);
        const tripRoute = trip?.schedule?.route
          ? `${trip.schedule.route.originTerminal?.name ?? "?"} → ${trip.schedule.route.destTerminal?.name ?? "?"}`
          : "—";
        const tripDate = trip ? formatDepartureDate(trip.departureDate) : "";
        const terminalName = firstSale?.terminal?.name ?? "—";
        const staffName =
          firstSale?.staff?.user?.fullName ?? ctx.user.name ?? "—";

        // Fan out to all MANAGER/ADMIN/OWNER operators
        const managers = await tx.operator.findMany({
          where: {
            companyId: ctx.companyId,
            role: { in: ["MANAGER", "ADMIN", "OWNER"] },
            isActive: true,
            deletedAt: null,
          },
          include: {
            user: { select: { id: true, email: true, fullName: true } },
          },
        });

        await enqueueBoothUrbanConflict(tx, {
          tripId: input.tripId,
          companyId: ctx.companyId,
          boothSaleIds: input.boothSaleIds,
          excessCount: input.excessCount,
          tripRoute,
          tripDate,
          staffName,
          terminalName,
          managers: managers.map((m) => ({
            subscriberId: m.user.id,
            email: m.user.email,
            firstName: firstName(m.user.fullName),
          })),
        });
      });

      return { reported: true, conflictCount: input.boothSaleIds.length };
    }),
});
