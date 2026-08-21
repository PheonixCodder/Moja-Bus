import { FinancialAccountService, Prisma } from "@moja/db";
import {
  createSavedPassengerSchema,
  deleteSavedPassengerSchema,
  getRecentBookingsSchema,
  getTravelInsightsSchema,
  submitReviewSchema,
  updatePreferencesSchema,
  updateSavedPassengerSchema,
} from "@moja/schemas";
import type { TravelInsightsBucket } from "@moja/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { SavedPassengerService } from "@/features/passenger/services/saved-passenger-service";
import { paystackInitialize } from "@/features/payments/providers/paystack-client";
import { toSafeDisplayNumber } from "@/lib/money";
import { getNovuClient } from "@/lib/novu";
import { getPhoneValidationError, toE164 } from "@/lib/phone/phone-number";
import { getCalendarDateKey, getZonedDateParts } from "@/lib/timezone";
import { createTRPCRouter, protectedProcedure } from "../init";

export const passengerRouter = createTRPCRouter({
  ensureProfile: protectedProcedure.query(async ({ ctx }) => {
    const service = new SavedPassengerService(ctx.prisma);
    return service.ensureProfile(ctx.user.id);
  }),

  listSaved: protectedProcedure.query(async ({ ctx }) => {
    const service = new SavedPassengerService(ctx.prisma);
    return service.listSaved(ctx.user.id);
  }),

  createSaved: protectedProcedure
    .input(createSavedPassengerSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new SavedPassengerService(ctx.prisma);
      return service.createSaved(ctx.user.id, input);
    }),

  updateSaved: protectedProcedure
    .input(updateSavedPassengerSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new SavedPassengerService(ctx.prisma);
      return service.updateSaved(ctx.user.id, input);
    }),

  deleteSaved: protectedProcedure
    .input(deleteSavedPassengerSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new SavedPassengerService(ctx.prisma);
      return service.deleteSaved(ctx.user.id, input.id);
    }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const now = new Date();

    const [upcomingTrips, pendingPayments, digitalTickets, savedContacts] =
      await Promise.all([
        // 1. Upcoming trips (CONFIRMED bookings where trip departure is in the future)
        ctx.prisma.booking.count({
          where: {
            userId,
            status: "CONFIRMED",
            trip: {
              departureDate: {
                gt: now,
              },
            },
          },
        }),
        // 2. Pending payments (PENDING_PAYMENT bookings that haven't expired)
        ctx.prisma.booking.count({
          where: {
            userId,
            status: "PENDING_PAYMENT",
            holdExpiresAt: {
              gt: now,
            },
          },
        }),
        // 3. Digital tickets (CONFIRMED bookings)
        ctx.prisma.booking.count({
          where: {
            userId,
            status: "CONFIRMED",
          },
        }),
        // 4. Saved passengers
        ctx.prisma.savedPassenger.count({
          where: {
            profile: {
              userId,
            },
          },
        }),
      ]);

    return {
      upcomingTripsCount: upcomingTrips,
      pendingPaymentsCount: pendingPayments,
      digitalTicketsCount: digitalTickets,
      savedContactsCount: savedContacts,
    };
  }),

  getTravelInsights: protectedProcedure
    .input(getTravelInsightsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const fromDate = new Date(input.from);
      const toDate = new Date(input.to);

      const bookings = await ctx.prisma.booking.findMany({
        where: {
          userId,
          status: "CONFIRMED",
          createdAt: { gte: fromDate, lte: toDate },
        },
        select: { createdAt: true, farePaid: true },
      });

      const spanDays = Math.max(
        1,
        Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000),
      );
      const bucket: TravelInsightsBucket = spanDays > 62 ? "MONTHLY" : "DAILY";

      const totals = new Map<string, { trips: number; spent: bigint }>();
      for (const booking of bookings) {
        const parts = getZonedDateParts(booking.createdAt);
        const key =
          bucket === "MONTHLY"
            ? `${parts.year}-${String(parts.month).padStart(2, "0")}`
            : getCalendarDateKey(booking.createdAt);
        const current = totals.get(key) ?? { trips: 0, spent: 0n };
        current.trips += 1;
        current.spent += BigInt(booking.farePaid);
        totals.set(key, current);
      }

      const items = Array.from(totals.entries())
        .map(([key, value]) => ({
          key,
          trips: value.trips,
          spentXOF: toSafeDisplayNumber(value.spent),
        }))
        .sort((a, b) => a.key.localeCompare(b.key));

      return { bucket, items };
    }),

  getRecentBookings: protectedProcedure
    .input(getRecentBookingsSchema)
    .query(async ({ ctx, input }) => {
      return ctx.prisma.booking.findMany({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        include: {
          trip: {
            include: {
              schedule: {
                include: {
                  route: {
                    include: { originTerminal: true, destTerminal: true },
                  },
                },
              },
            },
          },
          originTripStop: { include: { terminal: true } },
          destinationTripStop: { include: { terminal: true } },
          company: true,
        },
      });
    }),

  getNextDeparture: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.booking.findFirst({
      where: {
        userId: ctx.user.id,
        status: "CONFIRMED",
        trip: { departureDate: { gte: new Date() } },
      },
      orderBy: { trip: { departureDate: "asc" } },
      include: {
        trip: {
          include: {
            schedule: {
              include: {
                route: {
                  include: { originTerminal: true, destTerminal: true },
                },
              },
            },
          },
        },
        originTripStop: { include: { terminal: true } },
        destinationTripStop: { include: { terminal: true } },
      },
    });
  }),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.passengerProfile.findUnique({
      where: { userId: ctx.user.id },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phoneNumber: true,
            image: true,
          },
        },
      },
    });

    if (!profile) {
      const service = new SavedPassengerService(ctx.prisma);
      await service.ensureProfile(ctx.user.id);
      return ctx.prisma.passengerProfile.findUnique({
        where: { userId: ctx.user.id },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              phoneNumber: true,
              image: true,
            },
          },
        },
      });
    }

    return profile;
  }),

  updatePreferences: protectedProcedure
    .input(updatePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      let profile = await ctx.prisma.passengerProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!profile) {
        const service = new SavedPassengerService(ctx.prisma);
        await service.ensureProfile(ctx.user.id);
        profile = await ctx.prisma.passengerProfile.findUnique({
          where: { userId: ctx.user.id },
        });
      }

      if (!profile) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not provision passenger profile.",
        });
      }

      let normalizedPhone: string | undefined;
      if (input.fullName || input.phone) {
        if (input.phone) {
          // The client sends E.164; validate strictly and reject invalid
          // numbers before touching the database.
          const validationError = getPhoneValidationError(input.phone);
          normalizedPhone = toE164(input.phone) ?? undefined;
          if (validationError || !normalizedPhone) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Please enter a valid international phone number.",
            });
          }
        }

        try {
          await ctx.prisma.user.update({
            where: { id: ctx.user.id },
            data: {
              ...(input.fullName ? { fullName: input.fullName.trim() } : {}),
              ...(normalizedPhone ? { phoneNumber: normalizedPhone } : {}),
            },
          });
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002"
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "This phone number is already linked to another account. Please use a different number.",
            });
          }
          throw err;
        }
      }

      const changedFields: string[] = [];
      if (input.fullName) changedFields.push("Full Name");
      if (input.phone) changedFields.push("Phone Number");
      if (input.preferredSeat) changedFields.push("Preferred Seat");
      if (input.preferredClass) changedFields.push("Preferred Seat Class");
      if (input.dateOfBirth) changedFields.push("Date of Birth");
      if (input.marketingOptIn !== undefined)
        changedFields.push("Marketing Preferences");

      const existingPrefs = (profile.preferencesJson as any) || {};
      const newPrefs = {
        ...existingPrefs,
        ...(input.preferredSeat !== undefined
          ? { preferredSeat: input.preferredSeat }
          : {}),
        ...(input.preferredClass !== undefined
          ? { preferredClass: input.preferredClass }
          : {}),
        ...(input.dateOfBirth !== undefined
          ? { dateOfBirth: input.dateOfBirth }
          : {}),
      };

      const updatedProfile = await ctx.prisma.passengerProfile.update({
        where: { id: profile.id },
        data: {
          preferencesJson: newPrefs,
          ...(input.marketingOptIn !== undefined
            ? { marketingOptIn: input.marketingOptIn }
            : {}),
        },
      });

      // Trigger passenger-profile-updated
      if (changedFields.length > 0 && ctx.user.email) {
        const novu = getNovuClient();
        if (novu) {
          try {
            await novu
              .trigger({
                workflowId: "passenger-profile-updated",
                to: {
                  subscriberId: ctx.user.email,
                  email: ctx.user.email,
                },
                payload: {
                  email: ctx.user.email,
                  passengerName: input.fullName || ctx.user.name || "Passenger",
                  changedFields,
                  phone: normalizedPhone || ctx.user.phoneNumber || undefined,
                },
                transactionId: `passenger-profile-updated-${ctx.user.id}-${Date.now()}`,
              })
              .catch(() => {});
          } catch (err) {
            console.error(
              "Failed to trigger passenger-profile-updated via Novu:",
              err,
            );
          }
        }
      }

      return updatedProfile;
    }),

  updateAvatar: protectedProcedure
    .input(z.object({ image: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { image: input.image },
      });
      return { success: true };
    }),

  submitReview: protectedProcedure
    .input(submitReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId, userId: ctx.user.id },
        include: {
          trip: {
            select: {
              id: true,
              driverId: true,
              busId: true,
            },
          },
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found or not associated with your account.",
        });
      }

      const existingReview = await ctx.prisma.review.findUnique({
        where: { bookingId: input.bookingId },
      });

      if (existingReview) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already reviewed this trip.",
        });
      }

      const review = await ctx.prisma.review.create({
        data: {
          companyId: booking.companyId,
          bookingId: input.bookingId,
          rating: input.rating,
          driverRating: input.driverRating ?? null,
          busRating: input.busRating ?? null,
          punctualityRating: input.punctualityRating ?? null,
          driverId: booking.trip?.driverId ?? null,
          busId: booking.trip?.busId ?? null,
          tripId: booking.trip?.id ?? null,
          content: input.content || null,
          authorId: ctx.user.id,
        },
      });

      // Update driver aggregate reputation if assigned
      if (booking.trip?.driverId) {
        const agg = await ctx.prisma.review.aggregate({
          where: { driverId: booking.trip.driverId },
          _avg: { driverRating: true, rating: true },
          _count: { id: true },
        });

        await ctx.prisma.driverProfile.update({
          where: { id: booking.trip.driverId },
          data: {
            averageRating: agg._avg.driverRating ?? agg._avg.rating ?? input.rating,
            totalReviews: agg._count.id,
          },
        });
      }

      // Trigger passenger-review-submitted
      const company = await ctx.prisma.company.findUnique({
        where: { id: booking.companyId },
        select: { name: true },
      });

      const novu = getNovuClient();
      if (novu && ctx.user.email) {
        try {
          await novu
            .trigger({
              workflowId: "passenger-review-submitted",
              to: {
                subscriberId: ctx.user.email,
                email: ctx.user.email,
              },
              payload: {
                email: ctx.user.email,
                passengerName: ctx.user.name ?? "Passenger",
                companyName: company?.name ?? "Transport Operator",
                rating: input.rating,
                content: input.content ?? undefined,
              },
              transactionId: `passenger-review-submitted-${review.id}`,
            })
            .catch(() => {});
        } catch (err) {
          console.error(
            "Failed to trigger passenger-review-submitted via Novu:",
            err,
          );
        }
      }

      return review;
    }),

  getUserReviews: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.review.findMany({
      where: { authorId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        bookingId: true,
        rating: true,
        content: true,
        response: true,
        respondedAt: true,
        createdAt: true,
        company: { select: { id: true, name: true } },
      },
    });
  }),

  getWalletBalance: protectedProcedure.query(async ({ ctx }) => {
    const accountService = new FinancialAccountService(ctx.prisma);
    const wallet = await accountService.getUserWallet(ctx.user.id);
    return {
      availableBalance: toSafeDisplayNumber(wallet.availableBalance),
      postedBalance: toSafeDisplayNumber(wallet.postedBalance),
      reservedBalance: toSafeDisplayNumber(wallet.reservedBalance),
    };
  }),

  getWalletLedger: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const accountService = new FinancialAccountService(ctx.prisma);
      const wallet = await accountService.getUserWallet(ctx.user.id);

      const [items, total] = await Promise.all([
        ctx.prisma.ledgerEntry.findMany({
          where: { accountId: wallet.id },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.prisma.ledgerEntry.count({
          where: { accountId: wallet.id },
        }),
      ]);

      return {
        items: items.map((i) => ({
          ...i,
          amount: toSafeDisplayNumber(i.amount),
        })),
        total,
      };
    }),

  initiateWalletTopUp: protectedProcedure
    .input(
      z.object({
        amountXOF: z.number().int().positive().min(100),
        callbackUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const accountService = new FinancialAccountService(ctx.prisma);
      const wallet = await accountService.getUserWallet(ctx.user.id);

      const reference = `ref_topup_${wallet.id.slice(-6)}_${Date.now()}`;
      const email = ctx.user.email;
      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "A verified email is required to top up with card/mobile money.",
        });
      }

      const payment = await ctx.prisma.externalPayment.create({
        data: {
          provider: "PAYSTACK",
          amountXOF: input.amountXOF,
          status: "INITIALIZED",
          purpose: "TOP_UP",
          paystackReference: reference,
          metadata: {
            isTopUp: true,
            accountId: wallet.id,
          },
        },
      });

      const paystackMetadata: Record<string, unknown> = {
        isTopUp: true,
        accountId: wallet.id,
        cancel_action: `${process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"}/api/payments/mobile-callback?cancel=1`,
      };

      const callbackUrl = input.callbackUrl
        ? `${input.callbackUrl}?reference=${reference}`
        : `${process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"}/dashboard/wallet?topup=pending&ref=${reference}`;

      let initialized;
      try {
        initialized = await paystackInitialize({
          email,
          amountXOF: input.amountXOF,
          reference,
          metadata: paystackMetadata,
          callbackUrl,
        });
      } catch (error) {
        await ctx.prisma.externalPayment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
        throw error;
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.externalPayment.update({
          where: { id: payment.id },
          data: {
            status: "PENDING",
            metadata: {
              isTopUp: true,
              accountId: wallet.id,
              authorizationUrl: initialized.authorizationUrl,
            },
          },
        });

        await tx.paymentAttempt.create({
          data: {
            paymentId: payment.id,
            attemptNumber: 1,
            paystackReference: reference,
            status: "PENDING",
            metadata: { accessCode: initialized.accessCode },
          },
        });
      });

      return { authorizationUrl: initialized.authorizationUrl, reference };
    }),

  verifyWalletTopUp: protectedProcedure
    .input(z.object({ reference: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { PaymentService } = await import(
        "@/features/payments/payment-service"
      );
      const service = new PaymentService(ctx.prisma);
      return service.verifyTopUp(input.reference);
    }),
});
