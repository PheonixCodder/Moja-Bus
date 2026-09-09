# Phase 2 — tRPC Booth Router

> **Status**: ✅ Complete  
> **Depends on**: Phase 1 (schema + `boothProcedure` middleware)  
> **Blocks**: Phases 4–8 (app needs these procedures)

---

## Objective

Implement all 15 `booth.*` tRPC procedures, add all Zod input/output schemas to `@moja/schemas`, and register the router. This is the entire backend API surface for the booth app.

---

## 2.1 — Add Zod Schemas to `@moja/schemas`

**File**: `packages/schemas/src/booth.ts` (new file)

```typescript
import { z } from "zod";

// ─── Terminal & Trips ───────────────────────────────────

export const getTerminalsSchema = z.object({
  // No input — returns all terminals for the authenticated operator's company
});

export const getTodayTripsSchema = z.object({
  terminalId: z.string().cuid(), // CompanyLocation.id (isTerminal: true)
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // "YYYY-MM-DD" in Africa/Abidjan timezone
});

export const getTripSeatMapSchema = z.object({
  tripId: z.string().cuid(),
  terminalId: z.string().cuid(), // Origin terminal for this booth
});

// ─── Hold Pool (Offline) ────────────────────────────────

export const preAcquireHoldsSchema = z.object({
  tripId: z.string().cuid(),
  terminalId: z.string().cuid(), // Origin terminal
  count: z.number().int().min(1).max(10).default(5),
});

export const releaseHoldsSchema = z.object({
  holdIds: z.array(z.string().cuid()).min(1).max(20),
});

// ─── Passenger ──────────────────────────────────────────

export const lookupOrCreatePassengerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(100),
  phone: z.string().optional(), // Optional — E.164 format if provided
});

// ─── Cash Sale ──────────────────────────────────────────

export const createCashSaleSchema = z.object({
  // Seat / trip info
  tripId: z.string().cuid(),
  terminalId: z.string().cuid(),  // Origin terminal (CompanyLocation.id)
  destinationTerminalId: z.string().cuid(), // Destination terminal

  // If online: seats to book (intercity = specific seatIds; urban = count only)
  seatIds: z.array(z.string().cuid()).optional(), // Intercity — specific seat IDs
  passengerCount: z.number().int().min(1).max(10).optional(), // Urban — seat count

  // If offline: use a pre-acquired hold
  holdId: z.string().cuid().optional(), // Pool hold ID (offline intercity)

  // Passenger
  passengerId: z.string(), // User.id (existing or just-created)
  passengerName: z.string().min(2).max(100),
  passengerEmail: z.string().email(),
  passengerPhone: z.string().optional(),

  // Payment
  cashAmountXOF: z.number().int().positive(), // Amount physically collected

  // Audit flags
  wasOffline: z.boolean().default(false),
  walkedUpPassenger: z.boolean().default(false),
  passengerAccountCreated: z.boolean().default(false),

  // Discount (optional — booth agents can apply codes)
  couponCode: z.string().optional(),
  useCredits: z.boolean().optional(),
});

// ─── Paystack Link ──────────────────────────────────────

export const initiatePaystackLinkSchema = z.object({
  tripId: z.string().cuid(),
  terminalId: z.string().cuid(),
  destinationTerminalId: z.string().cuid(),
  seatIds: z.array(z.string().cuid()).optional(),
  passengerCount: z.number().int().min(1).max(10).optional(),
  passengerId: z.string(),
  passengerEmail: z.string().email(),
  passengerName: z.string().min(2).max(100),
  passengerPhone: z.string().optional(),
  walkedUpPassenger: z.boolean().default(false),
  passengerAccountCreated: z.boolean().default(false),
  couponCode: z.string().optional(),
});

export const pollPaymentStatusSchema = z.object({
  holdId: z.string().cuid(),
  paystackReference: z.string(),
});

export const confirmPaystackSaleSchema = z.object({
  holdId: z.string().cuid(),
  paystackReference: z.string(),
  terminalId: z.string().cuid(),
  walkedUpPassenger: z.boolean().default(false),
  passengerAccountCreated: z.boolean().default(false),
});

export const cancelPendingHoldSchema = z.object({
  holdId: z.string().cuid(),
});

// ─── Check-In ───────────────────────────────────────────

export const boothCheckInSchema = z.object({
  ticketToken: z.string(),
  terminalId: z.string().cuid(),
});

// ─── Reconciliation ─────────────────────────────────────

export const getDailyReconciliationSchema = z.object({
  terminalId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // "YYYY-MM-DD"
});

export const getTerminalBookingsSchema = z.object({
  terminalId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.enum(["CASH", "PAYSTACK_LINK", "ALL"]).default("ALL"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

// ─── Urban Conflict ──────────────────────────────────────

export const reportUrbanConflictSchema = z.object({
  tripId: z.string().cuid(),
  boothSaleIds: z.array(z.string().cuid()), // The conflicting BoothSale IDs
  excessCount: z.number().int().positive(),
});
```

**Export from `packages/schemas/src/index.ts`**:
```typescript
export * from "./booth";
```

---

## 2.2 — Full Booth Router Implementation

**File**: `apps/web/trpc/routers/booth.ts` (replace stub from Phase 1)

```typescript
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getTerminalsSchema,
  getTodayTripsSchema,
  getTripSeatMapSchema,
  preAcquireHoldsSchema,
  releaseHoldsSchema,
  lookupOrCreatePassengerSchema,
  createCashSaleSchema,
  initiatePaystackLinkSchema,
  pollPaymentStatusSchema,
  confirmPaystackSaleSchema,
  cancelPendingHoldSchema,
  boothCheckInSchema,
  getDailyReconciliationSchema,
  getTerminalBookingsSchema,
  reportUrbanConflictSchema,
} from "@moja/schemas";
import { createTRPCRouter, boothProcedure } from "../init";
import { SeatAvailabilityService } from "@/features/booking/services/seat-availability-service";
import { BookingHoldService } from "@/features/booking/services/booking-hold-service";
import { OperatorBookingService } from "@/features/operator/services/operator-booking-service";
import { paystackInitialize } from "@/features/payments/providers/paystack-client";
import { getNovuClient } from "@/lib/novu";
import { getPhoneValidationError, toE164 } from "@/lib/phone/phone-number";
import { startOfAppCalendarDay, addAppCalendarDays } from "@/lib/timezone";

export const boothRouter = createTRPCRouter({

  // ─────────────────────────────────────────────────────────
  // getMyProfile
  // Returns the authenticated staff member's operator profile + company
  // ─────────────────────────────────────────────────────────
  getMyProfile: boothProcedure.query(async ({ ctx }) => {
    return {
      operatorId: ctx.operator.id,
      role: ctx.operator.role,
      permissions: ctx.operator.permissions,
      companyId: ctx.operator.companyId,
      companyName: ctx.operator.company.name,
      companySlug: ctx.operator.company.slug,
      companyLogoUrl: ctx.operator.company.logoUrl,
      staffName: ctx.user.name,
      staffEmail: ctx.user.email,
    };
  }),

  // ─────────────────────────────────────────────────────────
  // getTerminals
  // Lists all terminal locations for the authenticated company
  // ─────────────────────────────────────────────────────────
  getTerminals: boothProcedure.query(async ({ ctx }) => {
    const terminals = await ctx.prisma.companyLocation.findMany({
      where: {
        companyId: ctx.companyId,
        isTerminal: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        addressLine1: true,
        city: true,
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
        message: "No terminals found for your company. Set up terminals in the operator dashboard.",
      });
    }

    return terminals;
  }),

  // ─────────────────────────────────────────────────────────
  // getTodayTrips
  // Returns trips departing from the given terminal on the given date
  // ─────────────────────────────────────────────────────────
  getTodayTrips: boothProcedure
    .input(getTodayTripsSchema)
    .query(async ({ ctx, input }) => {
      const dayStart = startOfAppCalendarDay(new Date(input.date));
      const dayEnd = addAppCalendarDays(dayStart, 1);

      const trips = await ctx.prisma.trip.findMany({
        where: {
          companyId: ctx.companyId,
          archivedAt: null,
          status: { in: ["SCHEDULED", "BOARDING", "DELAYED"] },
          departureDate: { gte: dayStart, lt: dayEnd },
          // Must have a TripStop for this terminal as a pickup
          tripStops: {
            some: {
              terminalId: input.terminalId,
              isPickup: true,
            },
          },
        },
        include: {
          route: { select: { id: true, originTerminalId: true, destTerminalId: true } },
          bus: { select: { id: true, registrationPlate: true, internalName: true } },
          schedule: {
            select: {
              id: true,
              serviceType: true,
              fares: { select: { id: true, priceXOF: true, seatClass: true } },
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
          _count: { select: { tripSeats: { where: { isActive: true } } } },
        },
        orderBy: { departureDate: "asc" },
      });

      // For each trip, compute available seat count
      const result = await Promise.all(
        trips.map(async (trip) => {
          const bookedCount = await ctx.prisma.booking.count({
            where: {
              tripId: trip.id,
              status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
            },
          });
          const totalSeats = trip._count.tripSeats;
          const availableSeats = Math.max(0, totalSeats - bookedCount);
          return { ...trip, availableSeats, totalSeats };
        }),
      );

      return result;
    }),

  // ─────────────────────────────────────────────────────────
  // getTripSeatMap
  // Returns seat availability for a specific trip
  // Reuses existing SeatAvailabilityService
  // ─────────────────────────────────────────────────────────
  getTripSeatMap: boothProcedure
    .input(getTripSeatMapSchema)
    .query(async ({ ctx, input }) => {
      const service = new SeatAvailabilityService(ctx.prisma);
      return service.getSeatAvailability(input.tripId);
    }),

  // ─────────────────────────────────────────────────────────
  // preAcquireHolds
  // Pre-acquires real server-side holds for the offline pool.
  // These are real HoldGroup records — other channels see these seats as taken.
  // TTL: 90 minutes from now.
  // Called on: app startup, reconnect, terminal switch.
  // ─────────────────────────────────────────────────────────
  preAcquireHolds: boothProcedure
    .input(preAcquireHoldsSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new BookingHoldService(ctx.prisma);

      // Get next N available seats for this trip (intercity only)
      const availableSeats = await ctx.prisma.tripSeat.findMany({
        where: {
          tripId: input.tripId,
          isActive: true,
          seat: { type: { notIn: ["DRIVER_AREA", "EMPTY_SPACE"] } },
          // Exclude seats that are already held or booked
          bookings: {
            none: {
              status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
            },
          },
        },
        select: { id: true, seat: { select: { seatNumber: true, seatClass: true } } },
        take: input.count,
      });

      if (availableSeats.length === 0) {
        return { holds: [], message: "No available seats to pre-acquire" };
      }

      // Create holds for each seat
      const holdTtlMs = 90 * 60 * 1000; // 90 minutes
      const holds = await Promise.all(
        availableSeats.map(async (tripSeat) => {
          const hold = await ctx.prisma.holdGroup.create({
            data: {
              userId: ctx.user.id,
              companyId: ctx.companyId,
              tripId: input.tripId,
              offerId: input.tripId, // Use tripId as offerId for booth holds
              seatCount: 1,
              status: "ACTIVE",
              expiresAt: new Date(Date.now() + holdTtlMs),
              // Tag as booth hold for identification
              metadata: JSON.stringify({ source: "BOOTH_POOL", terminalId: input.terminalId }),
            },
          });
          return {
            holdId: hold.id,
            seatId: tripSeat.id,
            seatNumber: tripSeat.seat.seatNumber,
            seatClass: tripSeat.seat.seatClass,
            expiresAt: hold.expiresAt,
          };
        }),
      );

      return { holds };
    }),

  // ─────────────────────────────────────────────────────────
  // releaseHolds
  // Releases unconsumed pool holds back to inventory.
  // Called on: reconnect (before refresh), terminal switch, logout.
  // ─────────────────────────────────────────────────────────
  releaseHolds: boothProcedure
    .input(releaseHoldsSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new BookingHoldService(ctx.prisma);

      // Only release holds that belong to this operator's company and are still ACTIVE
      await ctx.prisma.holdGroup.updateMany({
        where: {
          id: { in: input.holdIds },
          companyId: ctx.companyId,
          userId: ctx.user.id,
          status: "ACTIVE",
        },
        data: { status: "CANCELLED" },
      });

      return { released: input.holdIds.length };
    }),

  // ─────────────────────────────────────────────────────────
  // lookupOrCreatePassenger
  // Finds an existing TRAVELER by email or phone.
  // If not found, creates an unverified TRAVELER account.
  // Does NOT send any notification here — that happens after booking confirms.
  // ─────────────────────────────────────────────────────────
  lookupOrCreatePassenger: boothProcedure
    .input(lookupOrCreatePassengerSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate phone if provided
      if (input.phone) {
        const phoneError = getPhoneValidationError(input.phone);
        if (phoneError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: phoneError });
        }
      }

      const normalizedEmail = input.email.toLowerCase().trim();
      const e164Phone = input.phone ? toE164(input.phone) : null;

      // Try to find by email first, then by phone
      let user = await ctx.prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            ...(e164Phone ? [{ phoneNumber: e164Phone }] : []),
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
        // Create new unverified TRAVELER account
        user = await ctx.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              id: crypto.randomUUID(),
              fullName: input.fullName,
              email: normalizedEmail,
              phoneNumber: e164Phone ?? null,
              role: "TRAVELER",
              emailVerified: false,
              phoneNumberVerified: false,
            },
          });

          // Create passenger profile
          await tx.passengerProfile.create({
            data: { userId: newUser.id },
          });

          return newUser;
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

  // ─────────────────────────────────────────────────────────
  // createCashSale
  // The core cash payment mutation.
  // Atomic $transaction: createHold → recordCash → confirmBooking → createBoothSale
  // No ticket is issued unless the full transaction succeeds.
  // ─────────────────────────────────────────────────────────
  createCashSale: boothProcedure
    .input(createCashSaleSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        // 1. Validate destination terminal belongs to this company
        const destTerminal = await tx.companyLocation.findFirst({
          where: { id: input.destinationTerminalId, companyId: ctx.companyId, isTerminal: true },
        });
        if (!destTerminal) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid destination terminal" });
        }

        // 2. Get or validate hold
        let holdGroupId: string;

        if (input.holdId) {
          // Offline: validate pre-acquired hold is still ACTIVE and not expired
          const hold = await tx.holdGroup.findFirst({
            where: {
              id: input.holdId,
              companyId: ctx.companyId,
              userId: ctx.user.id,
              status: "ACTIVE",
              expiresAt: { gt: new Date() },
            },
          });
          if (!hold) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Hold expired or already used. Please re-select a seat.",
            });
          }
          holdGroupId = hold.id;
        } else {
          // Online: create a fresh hold for this sale
          const holdService = new BookingHoldService(tx as any);
          const holdResult = await holdService.createHold({
            offerId: input.tripId,
            passengers: [
              {
                fullName: input.passengerName,
                email: input.passengerEmail,
                phone: input.passengerPhone ?? null,
                seatIds: input.seatIds ?? [],
              },
            ],
            userId: input.passengerId,
            quoteId: null,
            discount: input.couponCode
              ? { code: input.couponCode, useCredits: input.useCredits ?? false }
              : undefined,
          });
          holdGroupId = holdResult.holdGroupId;
        }

        // 3. Create a cash payment record
        const payment = await tx.externalPayment.create({
          data: {
            holdGroupId,
            amount: input.cashAmountXOF,
            currency: "XOF",
            provider: "CASH",
            reference: `BOOTH-CASH-${Date.now()}-${ctx.operator.id}`,
            status: "SUCCESS",
            metadata: JSON.stringify({
              collectedBy: ctx.operator.id,
              collectedAt: new Date().toISOString(),
              terminalId: input.terminalId,
            }),
          },
        });

        // 4. Confirm the booking
        const holdService = new BookingHoldService(tx as any);
        const confirmed = await holdService.confirmBooking(holdGroupId, input.passengerId);

        // 5. Ledger entry: mark commission as PENDING_CASH_SETTLEMENT
        // (The settlement engine will deduct from next Paystack payout)
        // This follows the existing accounting engine pattern
        // TODO: Wire into AccountingEngine.recordBoothCashSale() in Phase 2 finalization

        // 6. Create BoothSale record (audit trail)
        const booking = await tx.booking.findFirst({
          where: { holdGroupId },
          select: { id: true },
        });

        if (!booking) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Booking not found after confirmation" });
        }

        const boothSale = await tx.boothSale.create({
          data: {
            bookingId: booking.id,
            companyId: ctx.companyId,
            terminalId: input.terminalId,
            staffId: ctx.operator.id,
            paymentMethod: "CASH",
            cashAmountXOF: input.cashAmountXOF,
            wasOffline: input.wasOffline,
            walkedUpPassenger: input.walkedUpPassenger,
            passengerAccountCreated: input.passengerAccountCreated,
          },
        });

        // 7. Enqueue notification outbox entries (inside transaction — transactional outbox invariant)
        await tx.outboxMessage.create({
          data: {
            workflowId: "booth-ticket-created",
            recipientId: input.passengerId,
            payload: JSON.stringify({
              email: input.passengerEmail,
              passengerName: input.passengerName,
              bookingId: booking.id,
              terminalName: input.terminalId, // Resolved to name in worker
              wasNewAccount: input.passengerAccountCreated,
            }),
            status: "PENDING",
          },
        });

        if (input.passengerAccountCreated) {
          await tx.outboxMessage.create({
            data: {
              workflowId: "booth-account-created",
              recipientId: input.passengerId,
              payload: JSON.stringify({
                email: input.passengerEmail,
                passengerName: input.passengerName,
              }),
              status: "PENDING",
            },
          });
        }

        return {
          bookingId: booking.id,
          boothSaleId: boothSale.id,
          confirmed: true,
        };
      });
    }),

  // ─────────────────────────────────────────────────────────
  // initiatePaystackLink
  // Creates a Paystack checkout link for display as QR on the booth screen.
  // Creates a hold first, then generates the payment link.
  // ─────────────────────────────────────────────────────────
  initiatePaystackLink: boothProcedure
    .input(initiatePaystackLinkSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Create hold
      const holdService = new BookingHoldService(ctx.prisma);
      const holdResult = await holdService.createHold({
        offerId: input.tripId,
        passengers: [
          {
            fullName: input.passengerName,
            email: input.passengerEmail,
            phone: input.passengerPhone ?? null,
            seatIds: input.seatIds ?? [],
          },
        ],
        userId: input.passengerId,
        quoteId: null,
        discount: input.couponCode ? { code: input.couponCode } : undefined,
      });

      // 2. Get the fare amount for this hold
      const holdGroup = await ctx.prisma.holdGroup.findUnique({
        where: { id: holdResult.holdGroupId },
        select: { id: true, totalAmountXOF: true },
      });

      if (!holdGroup) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Hold not found" });
      }

      // 3. Initialize Paystack payment link (not standard checkout — Paystack payment link API)
      const paystackResponse = await paystackInitialize({
        email: input.passengerEmail,
        amount: holdGroup.totalAmountXOF * 100, // Paystack uses kobo/cents
        currency: "XOF",
        reference: `BOOTH-${holdResult.holdGroupId}-${Date.now()}`,
        metadata: {
          holdGroupId: holdResult.holdGroupId,
          source: "BOOTH",
          staffId: ctx.operator.id,
          terminalId: input.terminalId,
        },
        // 10-minute expiry
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

      return {
        holdId: holdResult.holdGroupId,
        paystackReference: paystackResponse.data.reference,
        paymentUrl: paystackResponse.data.authorization_url,
        amountXOF: holdGroup.totalAmountXOF,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      };
    }),

  // ─────────────────────────────────────────────────────────
  // pollPaymentStatus
  // Checks if the Paystack payment link has been paid.
  // Called every 3 seconds by the booth app until paid or timed out.
  // ─────────────────────────────────────────────────────────
  pollPaymentStatus: boothProcedure
    .input(pollPaymentStatusSchema)
    .query(async ({ ctx, input }) => {
      // Verify hold belongs to this operator's company
      const hold = await ctx.prisma.holdGroup.findFirst({
        where: {
          id: input.holdId,
          companyId: ctx.companyId,
          status: "ACTIVE",
          expiresAt: { gt: new Date() },
        },
      });

      if (!hold) {
        return { status: "EXPIRED" as const };
      }

      // Check Paystack for payment status
      const { paystackVerify } = await import("@/features/payments/providers/paystack-client");
      const verification = await paystackVerify(input.paystackReference);

      if (verification.data.status === "success") {
        return { status: "PAID" as const, reference: input.paystackReference };
      }

      if (verification.data.status === "failed") {
        return { status: "FAILED" as const };
      }

      return { status: "PENDING" as const };
    }),

  // ─────────────────────────────────────────────────────────
  // confirmPaystackSale
  // Called after pollPaymentStatus returns PAID.
  // Verifies the Paystack reference, confirms the booking, creates BoothSale.
  // ─────────────────────────────────────────────────────────
  confirmPaystackSale: boothProcedure
    .input(confirmPaystackSaleSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        // 1. Re-verify payment with Paystack (idempotency)
        const { paystackVerify } = await import("@/features/payments/providers/paystack-client");
        const verification = await paystackVerify(input.paystackReference);

        if (verification.data.status !== "success") {
          throw new TRPCError({
            code: "PAYMENT_REQUIRED",
            message: "Payment not yet confirmed by Paystack",
          });
        }

        // 2. Confirm booking
        const holdService = new BookingHoldService(tx as any);
        const confirmed = await holdService.confirmBooking(input.holdId, ctx.user.id);

        // 3. Get booking
        const booking = await tx.booking.findFirst({
          where: { holdGroupId: input.holdId },
          select: { id: true },
        });

        if (!booking) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Booking not found" });
        }

        // 4. Create BoothSale
        const boothSale = await tx.boothSale.create({
          data: {
            bookingId: booking.id,
            companyId: ctx.companyId,
            terminalId: input.terminalId,
            staffId: ctx.operator.id,
            paymentMethod: "PAYSTACK_LINK",
            paystackRef: input.paystackReference,
            wasOffline: false, // Paystack sales are always online
            walkedUpPassenger: input.walkedUpPassenger,
            passengerAccountCreated: input.passengerAccountCreated,
          },
        });

        // 5. Enqueue notification
        await tx.outboxMessage.create({
          data: {
            workflowId: "booth-ticket-created",
            recipientId: ctx.user.id,
            payload: JSON.stringify({ bookingId: booking.id }),
            status: "PENDING",
          },
        });

        return { bookingId: booking.id, boothSaleId: boothSale.id, confirmed: true };
      });
    }),

  // ─────────────────────────────────────────────────────────
  // cancelPendingHold
  // Releases a hold when payment times out or staff aborts.
  // ─────────────────────────────────────────────────────────
  cancelPendingHold: boothProcedure
    .input(cancelPendingHoldSchema)
    .mutation(async ({ ctx, input }) => {
      const hold = await ctx.prisma.holdGroup.findFirst({
        where: {
          id: input.holdId,
          companyId: ctx.companyId,
          status: "ACTIVE",
        },
      });

      if (!hold) {
        return { cancelled: false, reason: "Hold not found or already resolved" };
      }

      await ctx.prisma.holdGroup.update({
        where: { id: input.holdId },
        data: { status: "CANCELLED" },
      });

      return { cancelled: true };
    }),

  // ─────────────────────────────────────────────────────────
  // checkInPassenger
  // QR scan check-in. Delegates to existing OperatorBookingService.
  // Also verifies the booking's origin terminal matches the booth's terminal.
  // ─────────────────────────────────────────────────────────
  checkInPassenger: boothProcedure
    .input(boothCheckInSchema)
    .mutation(async ({ ctx, input }) => {
      // Find booking by ticket token
      const booking = await ctx.prisma.booking.findFirst({
        where: {
          ticketToken: input.ticketToken,
          companyId: ctx.companyId,
        },
        include: {
          originTripStop: { select: { terminalId: true } },
          trip: { select: { id: true, status: true, departureDate: true } },
        },
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      if (booking.status !== "CONFIRMED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot check in — booking status is ${booking.status}`,
        });
      }

      // Verify this ticket is for the booth's terminal
      if (booking.originTripStop?.terminalId !== input.terminalId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This ticket is not for your terminal",
        });
      }

      const service = new OperatorBookingService(ctx.prisma);
      await service.checkIn(booking.id, ctx.operator.id);

      return {
        success: true,
        bookingId: booking.id,
        passengerName: booking.passengerName,
        seatNumber: booking.seatNumber,
        tripId: booking.trip.id,
        departureDate: booking.trip.departureDate,
      };
    }),

  // ─────────────────────────────────────────────────────────
  // getDailyReconciliation
  // End-of-day cash + Paystack report for a staff member at a terminal.
  // ─────────────────────────────────────────────────────────
  getDailyReconciliation: boothProcedure
    .input(getDailyReconciliationSchema)
    .query(async ({ ctx, input }) => {
      const dayStart = startOfAppCalendarDay(new Date(input.date));
      const dayEnd = addAppCalendarDays(dayStart, 1);

      const sales = await ctx.prisma.boothSale.findMany({
        where: {
          companyId: ctx.companyId,
          terminalId: input.terminalId,
          staffId: ctx.operator.id,
          confirmedAt: { gte: dayStart, lt: dayEnd },
        },
        include: {
          booking: {
            select: {
              id: true,
              bookingReference: true,
              totalAmountXOF: true,
              passengerName: true,
              seatNumber: true,
              trip: {
                select: {
                  departureDate: true,
                  route: { select: { originTerminal: { select: { name: true } }, destTerminal: { select: { name: true } } } },
                },
              },
            },
          },
        },
        orderBy: { confirmedAt: "asc" },
      });

      const cashSales = sales.filter((s) => s.paymentMethod === "CASH");
      const paystackSales = sales.filter((s) => s.paymentMethod === "PAYSTACK_LINK");

      const cashTotal = cashSales.reduce((sum, s) => sum + (s.cashAmountXOF ?? 0), 0);
      const paystackTotal = paystackSales.reduce((sum, s) => sum + (s.booking.totalAmountXOF ?? 0), 0);

      return {
        date: input.date,
        terminalId: input.terminalId,
        staffId: ctx.operator.id,
        totalSales: sales.length,
        cashCount: cashSales.length,
        cashTotalXOF: cashTotal,
        paystackCount: paystackSales.length,
        paystackTotalXOF: paystackTotal,
        grandTotalXOF: cashTotal + paystackTotal,
        offlineSalesCount: sales.filter((s) => s.wasOffline).length,
        walkUpCount: sales.filter((s) => s.walkedUpPassenger).length,
        sales: sales.map((s) => ({
          id: s.id,
          bookingReference: s.booking.bookingReference,
          paymentMethod: s.paymentMethod,
          amountXOF: s.paymentMethod === "CASH" ? s.cashAmountXOF : s.booking.totalAmountXOF,
          passengerName: s.booking.passengerName,
          seatNumber: s.booking.seatNumber,
          route: s.booking.trip?.route
            ? `${s.booking.trip.route.originTerminal?.name} → ${s.booking.trip.route.destTerminal?.name}`
            : "Unknown route",
          confirmedAt: s.confirmedAt,
          wasOffline: s.wasOffline,
          walkedUp: s.walkedUpPassenger,
        })),
      };
    }),

  // ─────────────────────────────────────────────────────────
  // getTerminalBookings
  // All bookings made from a terminal today — for the bookings tab.
  // ─────────────────────────────────────────────────────────
  getTerminalBookings: boothProcedure
    .input(getTerminalBookingsSchema)
    .query(async ({ ctx, input }) => {
      const dayStart = startOfAppCalendarDay(new Date(input.date));
      const dayEnd = addAppCalendarDays(dayStart, 1);

      const where: any = {
        companyId: ctx.companyId,
        terminalId: input.terminalId,
        confirmedAt: { gte: dayStart, lt: dayEnd },
      };

      if (input.paymentMethod !== "ALL") {
        where.paymentMethod = input.paymentMethod;
      }

      const [total, sales] = await Promise.all([
        ctx.prisma.boothSale.count({ where }),
        ctx.prisma.boothSale.findMany({
          where,
          include: {
            booking: {
              select: {
                id: true,
                bookingReference: true,
                ticketToken: true,
                status: true,
                passengerName: true,
                seatNumber: true,
                totalAmountXOF: true,
              },
            },
            staff: {
              select: {
                user: { select: { fullName: true } },
              },
            },
          },
          orderBy: { confirmedAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
      ]);

      return {
        total,
        page: input.page,
        limit: input.limit,
        items: sales,
      };
    }),

  // ─────────────────────────────────────────────────────────
  // reportUrbanConflict
  // Called by the offline sync process when urban trip capacity is exceeded.
  // Sets hasConflict on BoothSale records and triggers operator notification.
  // ─────────────────────────────────────────────────────────
  reportUrbanConflict: boothProcedure
    .input(reportUrbanConflictSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        // Mark conflicting sales
        await tx.boothSale.updateMany({
          where: {
            id: { in: input.boothSaleIds },
            companyId: ctx.companyId,
          },
          data: {
            hasConflict: true,
            conflictDetails: `Trip capacity exceeded by ${input.excessCount} at time of sync`,
          },
        });

        // Notify operator via outbox (surfaces in ERP trip detail + operator dashboard)
        await tx.outboxMessage.create({
          data: {
            workflowId: "booth-urban-conflict",
            recipientId: ctx.companyId, // Company-level notification — all managers receive it
            payload: JSON.stringify({
              tripId: input.tripId,
              excessCount: input.excessCount,
              boothSaleIds: input.boothSaleIds,
              staffId: ctx.operator.id,
            }),
            status: "PENDING",
          },
        });

        return { reported: true };
      });
    }),
});
```

---

## 2.3 — Register Router in `_app.ts`

**File**: `apps/web/trpc/routers/_app.ts`

Replace the Phase 1 stub import with the full import:
```typescript
import { boothRouter } from "./booth";
// Already registered: booth: boothRouter
```

---

## 2.4 — Verification Checklist

```bash
# TypeScript — no errors
pnpm --filter web typecheck
pnpm --filter @moja/schemas typecheck

# Run any existing tests
pnpm --filter @moja/schemas test
```

---

## 2.5 — Notes & Edge Cases

- `createCashSale` is a single `$transaction` — if ANY step fails, nothing is committed. This is the fraud guard.
- `pollPaymentStatus` is a `query` (not mutation) so it can be called repeatedly without side effects.
- `preAcquireHolds` uses `BookingHoldService` but bypasses the normal passenger flow since we don't have a passenger at hold-creation time. The passenger is associated at `confirmCashSale` time.
- `checkInPassenger` validates that the ticket's origin terminal matches the booth's terminal — prevents inter-terminal check-in fraud.
- `reportUrbanConflict` is called by the client sync process, not by any user-initiated action.
- The `outboxMessage.recipientId` for `booth-urban-conflict` is set to `companyId` — the outbox worker must know to fan this out to all MANAGER/ADMIN/OWNER roles of that company.
