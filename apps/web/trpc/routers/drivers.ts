import {
  canOperateRuns,
  createDriverSchema,
  // Phase 25 (F-OP-10) — response view typing for the public profile.
  type DriverEmploymentType,
  type DriverVerificationStatus,
  driverAcknowledgeUrgentDispatchSchema,
  driverBatchSyncCheckInsSchema,
  driverCheckInPassengerSchema,
  driverCompleteTripSchema,
  driverGetMyTripsSchema,
  driverManualCheckInSchema,
  driverReportDelaySchema,
  driverSelfRegisterSchema,
  // Phase 14/17 (F-DV-07) — shared shift-toggle contract
  driverShiftToggleSchema,
  driverStartTripSchema,
  driverUpdateStatusSchema,
  getDriverSchema,
  getPublicDriverProfileSchema,
  isLicenseUsableThrough,
  type LicenseCategory,
  licenseMeetsRequirement,
  listAssignableDriversSchema,
  listDriversSchema,
  listMarketplaceDriversSchema,
  listMyOffersSchema,
  listSentOffersSchema,
  MAX_ACTIVE_RECEIVED_OFFERS_PER_DRIVER,
  MAX_ACTIVE_SENT_OFFERS_PER_COMPANY,
  MAX_COUNTER_ROUNDS,
  markMyOffersSeenSchema,
  OFFER_EXPIRY_DAYS,
  respondToCounterOfferSchema,
  respondToOfferSchema,
  // Phase 11 — Offer Board
  sendEmploymentOfferSchema,
  // Phase 9 — Marketplace
  setServicePreferenceSchema,
  URGENT_DISPATCH_WINDOW_HOURS,
  updateDriverSchema,
  verifyDriverSchema,
  withdrawOfferSchema,
} from "@moja/schemas";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { driverPresignDocSchema } from "@/features/driver/lib/driver-doc-access";
import { mintDriverDocUrl } from "@/features/driver/lib/driver-doc-mint";
import { DriverCheckInService } from "@/features/driver/services/driver-check-in-service";
import { companyOperatorRecipients } from "@/features/notifications/company-recipients";
import { enqueuePassengerTripDelayed } from "@/features/notifications/outbox/commercial";
import { enqueueOperatorDriverAssignmentConflict } from "@/features/notifications/outbox/dispatch";
import {
  enqueueDriverAffiliationEnded,
  enqueueDriverCounterResolved,
  enqueueDriverOfferReceived,
  enqueueDriverOfferWithdrawn,
  enqueueDriverRosterRemoved,
  enqueueOfferExpired,
  enqueueOperatorOfferAccepted,
  enqueueOperatorOfferCountered,
  enqueueOperatorOfferDeclined,
} from "@/features/notifications/outbox/driver-offers";
// Phase 27 (F-OP-14) — batch conflict scan shares the pure overlap core;
// getDriverTripConflict stays for the single-driver delay-revalidation path.
import {
  driverInterval,
  findTripConflict,
  getDriverTripConflict,
  type TripConflictCandidate,
} from "@/lib/driver-assignment";
import {
  DEFAULT_DRIVER_PAY_RATE_XOF_PER_MINUTE,
  earningsFromMinutes,
  mondayStartUtc,
  utcMidnight,
} from "@/lib/driver-earnings";
import {
  resolvePostRunStatus,
  suspendDriverOperationalState,
} from "@/lib/driver-run-state";
import { computeTrustBadges } from "@/lib/driver-scoring";
import { getNovuClient } from "@/lib/novu";
import {
  operatorHasPermission,
  requirePermission,
} from "@/lib/permissions/authorize";
import { getPhoneValidationError, toE164 } from "@/lib/phone/phone-number";
import { mintTelemetryDispatchTokenWithCompany } from "@/lib/telemetry-token";
import { finalizeTripArrival } from "@/lib/trip-arrival";
import {
  createTRPCRouter,
  driverProcedure,
  operatorCompanyProcedure,
  protectedProcedure,
} from "../init";

// ============================================================================
// PHASE 11 — EMPLOYMENT OFFER BOARD HELPERS
// ============================================================================

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

function parseOfferDate(value?: string | null): Date | null {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

/** "Ibrahim Touré" → "Ibrahim T." — enough to recognise, not enough to leak. */
function maskName(fullName?: string | null): string {
  if (!fullName) return "—";
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? "—";
  const second = parts[1];
  return second ? `${first} ${second.charAt(0)}.` : first;
}

/** Mask emails/phones to a recognisable fragment ("ib•••@x.com", "+22507••78"). */
function maskIdentifier(value: string): string {
  if (value.includes("@")) {
    const at = value.indexOf("@");
    return `${value.slice(0, 2)}•••@${value.slice(at + 1)}`;
  }
  const digits = value.replace(/\s+/g, "");
  return digits.length <= 4
    ? `•••${digits}`
    : `${digits.slice(0, 4)}•••${digits.slice(-2)}`;
}

/** Phase 02 — resolve a pt. presentation token to its durable ticket token. */
async function resolvePresentationTicket(
  token: string,
): Promise<string | null> {
  const { resolveTicketAccessToken } = await import(
    "@/features/payments/lib/signed-access-tokens"
  );
  return resolveTicketAccessToken(token)?.ticketToken ?? null;
}

/** Lazy expiry — flips an overdue PENDING/COUNTERED offer to EXPIRED with an audit event. */
async function expireOfferIfDue(
  tx: { driverEmploymentOffer: any; driverOfferEvent: any; operator: any },
  offer: {
    id: string;
    companyId: string;
    status: string;
    expiresAt: Date;
    currentSalaryCFA: number;
    company?: { name: string };
    driverProfile?: {
      userId: string;
      user: { id: string; fullName: string | null; email: string | null };
    };
  },
): Promise<boolean> {
  if (
    (offer.status === "PENDING" || offer.status === "COUNTERED") &&
    offer.expiresAt.getTime() < Date.now()
  ) {
    await tx.driverEmploymentOffer.update({
      where: { id: offer.id },
      data: { status: "EXPIRED", resolvedAt: new Date() },
    });
    await tx.driverOfferEvent.create({
      data: {
        offerId: offer.id,
        eventType: "EXPIRED",
        actorType: "SYSTEM",
        salaryCFA: offer.currentSalaryCFA,
      },
    });

    // P3-2 — lazy expiry now matches the expire-offers cron exactly:
    // audit event AND outbox notifications to both sides.
    if (offer.company && offer.driverProfile) {
      const driverUser = offer.driverProfile.user;
      await enqueueOfferExpired(tx as never, {
        offerId: offer.id,
        role: "DRIVER",
        to: {
          subscriberId: driverUser.id,
          ...(driverUser.email ? { email: driverUser.email } : {}),
          ...(driverUser.fullName
            ? { firstName: driverUser.fullName.split(" ")[0] }
            : {}),
        },
        counterpartyName: offer.company.name,
      });
      for (const to of await companyOperatorRecipients(tx, offer.companyId)) {
        await enqueueOfferExpired(tx as never, {
          offerId: offer.id,
          role: "OPERATOR",
          to,
          counterpartyName: driverUser.fullName ?? "",
        });
      }
    }

    return true;
  }
  return false;
}

/**
 * Shared acceptance resolution — used by driver ACCEPT and operator
 * ACCEPT_COUNTER. Enforces the platform rule: one active EXCLUSIVE_INTERCITY
 * affiliation at a time. Conflicting exclusives are auto-terminated with audit
 * events + notifications to the displaced companies.
 */
async function resolveAcceptance(
  tx: any,
  offer: {
    id: string;
    companyId: string;
    employmentType: string;
    currentSalaryCFA: number;
    currentStartDate: Date | null;
    company: { name: string };
    driverProfileId: string;
  },
  driver: {
    id: string;
    userId: string;
    user: { fullName: string | null; email: string | null };
  },
) {
  const now = new Date();

  // 1. Exclusive-conflict enforcement
  if (offer.employmentType === "EXCLUSIVE_INTERCITY") {
    const conflicts = await tx.driverCompanyAffiliation.findMany({
      where: {
        driverProfileId: driver.id,
        isActive: true,
        employmentType: "EXCLUSIVE_INTERCITY",
        companyId: { not: offer.companyId },
      },
      include: { company: { select: { name: true } } },
    });

    for (const conflict of conflicts) {
      await tx.driverCompanyAffiliation.update({
        where: { id: conflict.id },
        data: { isActive: false, terminatedAt: now },
      });
      await tx.driverOfferEvent.create({
        data: {
          offerId: offer.id,
          eventType: "EXCLUSIVE_ENDED",
          actorType: "SYSTEM",
          note: `Exclusive affiliation with ${conflict.company.name} terminated (one-active-exclusive rule).`,
          salaryCFA: offer.currentSalaryCFA,
        },
      });

      // Notify the displaced operator(s)
      const displacedRecipients = await companyOperatorRecipients(
        tx,
        conflict.companyId,
      );
      for (const to of displacedRecipients) {
        await enqueueDriverAffiliationEnded(tx as never, {
          offerId: offer.id,
          companyId: conflict.companyId,
          to,
          driverName: driver.user.fullName ?? "Un chauffeur",
          newCompanyName: offer.company.name,
        });
      }
    }
  }

  // 2. Create or reactivate the affiliation (re-hire safe).
  //    P2002 → CONFLICT: the partial unique index on one-active-exclusive
  //    can fire if two concurrent acceptances race past the conflict sweep
  //    above. Map to a user-facing CONFLICT so the client can retry.
  try {
    await tx.driverCompanyAffiliation.upsert({
      where: {
        driverProfileId_companyId: {
          driverProfileId: driver.id,
          companyId: offer.companyId,
        },
      },
      create: {
        driverProfileId: driver.id,
        companyId: offer.companyId,
        employmentType: offer.employmentType as never,
        isActive: true,
        isVerified: false,
        hiredAt: now,
        notes: `Via Moja offer ${offer.id}`,
      },
      update: {
        employmentType: offer.employmentType as never,
        isActive: true,
        terminatedAt: null,
        hiredAt: now,
        notes: `Re-hired via Moja offer ${offer.id}`,
      },
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      String((err as { code: unknown }).code) === "P2002"
    ) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "A concurrent affiliation change was detected. Please try again.",
      });
    }
    throw err;
  }

  // 3. Resolve the offer
  await tx.driverEmploymentOffer.update({
    where: { id: offer.id },
    data: { status: "ACCEPTED", respondedAt: now, resolvedAt: now },
  });

  await tx.driverOfferEvent.create({
    data: {
      offerId: offer.id,
      eventType: "AFFILIATION_CREATED",
      actorType: "DRIVER",
      actorUserId: driver.userId,
      salaryCFA: offer.currentSalaryCFA,
      startDate: offer.currentStartDate,
    },
  });

  // 4. Notify the hiring company
  const recipients = await companyOperatorRecipients(tx, offer.companyId);
  for (const to of recipients) {
    await enqueueOperatorOfferAccepted(tx as never, {
      offerId: offer.id,
      to,
      driverName: driver.user.fullName ?? "Un chauffeur",
      salaryCFA: offer.currentSalaryCFA,
      employmentType: offer.employmentType,
    });
  }
}

// Phase 25 (F-OP-10) — ONE response shape for both privacy branches of
// getPublicDriverProfile so client typing stays uniform; redaction NULLS
// fields instead of reshaping the payload.
type PublicDriverProfileView = {
  id: string;
  licenseCategory: LicenseCategory | null;
  yearsOfExperience: number;
  averageRating: number;
  totalReviews: number;
  totalTripsCompleted: number;
  totalDistanceKm: number;
  safetyScore: number;
  verifiedAt: Date | null;
  verificationStatus: DriverVerificationStatus;
  user: {
    fullName: string;
    phoneNumber: string | null;
    image: string | null;
  };
  companyAffiliations: Array<{
    companyId: string;
    employmentType: DriverEmploymentType;
    hiredAt: Date;
    terminatedAt: Date | null;
    isActive: boolean;
    company: { name: string; slug: string };
  }>;
  servicePreference: {
    isAvailableForHire: boolean;
    isSuspended: boolean;
    preferredType: DriverEmploymentType;
    cityBase: string | null;
    routeExperience: string[];
    isFeatured: boolean;
  } | null;
  isOnMyRoster: boolean;
  trustBadges: ReturnType<typeof computeTrustBadges>;
};

export const driversRouter = createTRPCRouter({
  getPermissions: operatorCompanyProcedure.query(({ ctx }) => {
    return {
      canRead: operatorHasPermission(ctx, "drivers:read"),
      canCreate: operatorHasPermission(ctx, "drivers:create"),
      canUpdate: operatorHasPermission(ctx, "drivers:update"),
      canDelete: operatorHasPermission(ctx, "drivers:delete"),
      canVerify: operatorHasPermission(ctx, "drivers:verify"),
      // Phase 27 (F-OP-15) — backed by the key assignDriver actually enforces
      // (trips:update). The old drivers:assign advertisement greyed out
      // dispatchers who could in fact assign.
      canAssign: operatorHasPermission(ctx, "trips:update"),
    };
  }),

  listDrivers: operatorCompanyProcedure
    .input(listDriversSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:read");
      const {
        search,
        status,
        verificationStatus,
        employmentType,
        licenseCategory,
        page,
        limit,
      } = input;
      const skip = (page - 1) * limit;

      const whereClause: any = {
        companyAffiliations: {
          some: {
            companyId: ctx.companyId,
            isActive: true,
            ...(employmentType ? { employmentType } : {}),
          },
        },
      };

      if (status) {
        whereClause.status = status;
      }
      if (verificationStatus) {
        whereClause.verificationStatus = verificationStatus;
      }
      if (licenseCategory) {
        whereClause.licenseCategory = licenseCategory;
      }
      if (search) {
        whereClause.OR = [
          { user: { fullName: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          { user: { phoneNumber: { contains: search, mode: "insensitive" } } },
          { licenseNumber: { contains: search, mode: "insensitive" } },
        ];
      }

      const [items, total, statusGroups] = await Promise.all([
        ctx.prisma.driverProfile.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                image: true,
              },
            },
            companyAffiliations: {
              where: { companyId: ctx.companyId },
            },
            currentTrip: {
              select: {
                id: true,
                departureDate: true,
                status: true,
                serviceType: true,
                bus: {
                  select: {
                    id: true,
                    registrationPlate: true,
                    internalName: true,
                  },
                },
              },
            },
            _count: {
              select: {
                assignedTrips: true,
                reviews: true,
              },
            },
          },
        }),
        ctx.prisma.driverProfile.count({ where: whereClause }),
        // P3-4 — fleet-wide aggregates under the SAME filters, so KPIs stay
        // truthful beyond the loaded page.
        ctx.prisma.driverProfile.groupBy({
          by: ["status", "verificationStatus"],
          where: whereClause,
          _count: { id: true },
        }),
      ]);

      let onDuty = 0;
      let verified = 0;
      let pending = 0;
      for (const group of statusGroups) {
        const count = group._count.id;
        if (group.status === "ON_DUTY" || group.status === "ON_TRIP") {
          onDuty += count;
        }
        if (group.verificationStatus === "VERIFIED") verified += count;
        if (group.verificationStatus === "PENDING") pending += count;
      }

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats: { onDuty, verified, pending },
      };
    }),

  getDriver: operatorCompanyProcedure
    .input(getDriverSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:read");

      const driver = await ctx.prisma.driverProfile.findFirst({
        where: {
          id: input.id,
          companyAffiliations: {
            some: { companyId: ctx.companyId },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              image: true,
              createdAt: true,
            },
          },
          companyAffiliations: {
            // P2-9 — scope to the requesting company so multi-affiliated
            // contractors never surface another tenant's badge/hire data.
            where: { companyId: ctx.companyId },
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logoUrl: true,
                },
              },
            },
          },
          currentTrip: {
            include: {
              bus: true,
              tripStops: {
                include: { terminal: true },
                orderBy: { stopOrder: "asc" },
              },
            },
          },
          reviews: {
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
              author: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
              trip: {
                select: {
                  id: true,
                  departureDate: true,
                  serviceType: true,
                },
              },
            },
          },
          shifts: {
            where: { companyId: ctx.companyId },
            take: 10,
            orderBy: { startedAt: "desc" },
          },
          _count: {
            select: {
              assignedTrips: true,
              reviews: true,
              shifts: true,
            },
          },
        },
      });

      if (!driver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver not found or not affiliated with your company.",
        });
      }

      // Phase-2 audit (driver-system-complete-audit/20): raw stored keys flow
      // to the client; rendering goes through <DriverDocPreview> ->
      // drivers.presignDoc for on-demand 5-min URLs. Baked-in presigned URLs
      // expired faster than review sessions and cost N signings per keystroke
      // in list queries.
      return driver;
    }),

  /**
   * Phase-2 audit — mints a short-lived GET URL for ONE of a driver's private
   * compliance documents (see features/driver/lib/driver-doc-access.ts for
   * the authorization model). Operators are scoped to ACTIVE-affiliation
   * drivers; the namespace guard proves the key belongs to that driver.
   */
  presignDoc: operatorCompanyProcedure
    .input(driverPresignDocSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:read");
      return mintDriverDocUrl(ctx.prisma, {
        ...input,
        viewerCompanyId: ctx.companyId,
      });
    }),

  createDriver: operatorCompanyProcedure
    .input(createDriverSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:create");

      // P1-7 + Phase 26 (F-OP-12): match email and phone SEPARATELY so a user
      // matching by email and a DIFFERENT user matching by phone can never be
      // silently collapsed — that ambiguity is surfaced, not resolved.
      const emailUser = await ctx.prisma.user.findFirst({
        where: { email: input.email.toLowerCase() },
        include: {
          driverProfile: {
            include: {
              companyAffiliations: {
                where: { isActive: true },
                include: { company: { select: { name: true } } },
              },
            },
          },
        },
      });
      const phoneUser =
        emailUser && emailUser.phoneNumber === input.phone
          ? emailUser
          : await ctx.prisma.user.findFirst({
              where: { phoneNumber: input.phone },
              include: {
                driverProfile: {
                  include: {
                    companyAffiliations: {
                      where: { isActive: true },
                      include: { company: { select: { name: true } } },
                    },
                  },
                },
              },
            });

      // Ambiguity: email and phone point at TWO different accounts. Refuse
      // with both masked identities — resolving it is a human decision.
      if (
        emailUser &&
        phoneUser &&
        emailUser.id !== phoneUser.id &&
        !input.confirmBinding
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `AMBIGUOUS_BINDING::${maskIdentifier(emailUser.email ?? "")}::${maskIdentifier(phoneUser.phoneNumber ?? "")}`,
        });
      }

      const user = emailUser ?? phoneUser ?? null;

      if (user && !input.confirmBinding) {
        const masked = [
          maskName(user.fullName),
          user.phoneNumber ? maskIdentifier(user.phoneNumber) : "—",
          user.email ? maskIdentifier(user.email) : "—",
          user.driverProfile ? "1" : "0",
        ].join("|");
        throw new TRPCError({
          code: "CONFLICT",
          message: `EXISTING_USER_BINDING_REQUIRED::${masked}`,
        });
      }

      const accountCreated = !user;

      // Phase 26 (F-OP-12) — every write runs in ONE transaction: a mid-flow
      // failure can no longer strand orphan role-DRIVER users or half-created
      // profiles.
      const createdUserId = user?.id ?? null;
      const result = await ctx.prisma.$transaction(async (tx) => {
        let txUser = user;
        if (!txUser) {
          txUser = await tx.user.create({
            data: {
              id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              fullName: input.fullName,
              email: input.email.toLowerCase(),
              phoneNumber: input.phone,
              role: "DRIVER",
            },
            include: {
              driverProfile: {
                include: {
                  companyAffiliations: {
                    where: { isActive: true },
                    include: { company: { select: { name: true } } },
                  },
                },
              },
            },
          });
        }

        // Check if driver profile already exists
        let driverProfile = await tx.driverProfile.findUnique({
          where: { userId: txUser.id },
        });

        if (!driverProfile) {
          // Check if license number is already used elsewhere
          const existingLicense = await tx.driverProfile.findUnique({
            where: { licenseNumber: input.licenseNumber },
          });

          if (existingLicense) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "A driver with this driving license number is already registered on the platform.",
            });
          }

          driverProfile = await tx.driverProfile.create({
            data: {
              userId: txUser.id,
              licenseNumber: input.licenseNumber,
              licenseCategory: input.licenseCategory,
              licenseExpiryDate: input.licenseExpiryDate,
              licenseFrontUrl: input.licenseFrontUrl ?? null,
              licenseBackUrl: input.licenseBackUrl ?? null,
              yearsOfExperience: input.yearsOfExperience,
              medicalClearanceDate: input.medicalClearanceDate ?? null,
              medicalDocUrl: input.medicalDocUrl ?? null,
              verificationStatus: "PENDING",
              status: "OFFLINE",
            },
          });
        }

        // Create or update company affiliation. Rehire branch also clears the
        // stale termination markers (F-OP-12).
        // P2002 → CONFLICT: partial unique index on one-active-exclusive
        // fires if this driver already holds an active exclusive affiliation
        // with another company and the operator tries to add them as exclusive.
        let affiliation;
        try {
          affiliation = await tx.driverCompanyAffiliation.upsert({
            where: {
              driverProfileId_companyId: {
                driverProfileId: driverProfile.id,
                companyId: ctx.companyId,
              },
            },
            create: {
              driverProfileId: driverProfile.id,
              companyId: ctx.companyId,
              employmentType: input.employmentType,
              badgeNumber: input.badgeNumber ?? null,
              notes: input.notes ?? null,
              isActive: true,
              isVerified: false,
            },
            update: {
              employmentType: input.employmentType,
              terminatedAt: null,
              ...(input.badgeNumber !== undefined
                ? { badgeNumber: input.badgeNumber }
                : {}),
              ...(input.notes !== undefined ? { notes: input.notes } : {}),
              isActive: true,
            },
          });
        } catch (err: unknown) {
          if (
            err &&
            typeof err === "object" &&
            "code" in err &&
            String((err as { code: unknown }).code) === "P2002"
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "This driver already holds an active exclusive affiliation with another operator. Terminate the existing affiliation first or choose a different employment type.",
            });
          }
          throw err;
        }

        return { driverProfile, affiliation };
      });

      const { driverProfile, affiliation } = result;

      // Phase 17 (D2): no Operator row for drivers. Roster drivers are not ERP
      // staff — the DriverCompanyAffiliation above is their only company
      // membership, and the Drivers roster is their single source of truth.

      return {
        success: true,
        driverProfileId: driverProfile.id,
        affiliationId: affiliation.id,
        accountCreated,
        existingDriver: !!user?.driverProfile,
        existingCompanies:
          user?.driverProfile?.companyAffiliations.map(
            (a: any) => a.company?.name ?? "Unknown",
          ) ?? [],
      };
    }),

  updateDriver: operatorCompanyProcedure
    .input(updateDriverSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:update");

      const existing = await ctx.prisma.driverCompanyAffiliation.findFirst({
        where: {
          driverProfileId: input.id,
          companyId: ctx.companyId,
          // Phase 13 (F-IN-02 ≡ F-OP-13 ride-along) — match verifyDriver's
          // active-roster semantics: terminated affiliations confer no write
          // access to a driver now exclusive to another company.
          isActive: true,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver is not affiliated with your company.",
        });
      }

      // Phase-2 audit (D3b): document replacements are audit-logged and never
      // demote verification status. Update + log share ONE transaction so a
      // crash can never strand a doc swap without its audit row.
      const updated = await ctx.prisma.$transaction(async (tx) => {
        const before = await tx.driverProfile.findUnique({
          where: { id: input.id },
          select: {
            licenseFrontUrl: true,
            licenseBackUrl: true,
            medicalDocUrl: true,
            user: { select: { id: true, fullName: true } },
          },
        });
        if (!before) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Driver profile not found.",
          });
        }

        const updateData: any = {};
        if (input.licenseNumber) updateData.licenseNumber = input.licenseNumber;
        if (input.licenseCategory)
          updateData.licenseCategory = input.licenseCategory;
        if (input.licenseExpiryDate)
          updateData.licenseExpiryDate = input.licenseExpiryDate;
        if (input.licenseFrontUrl !== undefined)
          updateData.licenseFrontUrl = input.licenseFrontUrl;
        if (input.licenseBackUrl !== undefined)
          updateData.licenseBackUrl = input.licenseBackUrl;
        if (input.yearsOfExperience !== undefined)
          updateData.yearsOfExperience = input.yearsOfExperience;
        if (input.medicalClearanceDate !== undefined)
          updateData.medicalClearanceDate = input.medicalClearanceDate;
        if (input.medicalDocUrl !== undefined)
          updateData.medicalDocUrl = input.medicalDocUrl;
        // Phase 31 (D8-a) — `status` is NO LONGER operator-writable here: the
        // only UI caller never sent it, and a generic write bypassed the
        // Phase-06 run-state convergence matrix (e.g. hand-setting SUSPENDED
        // or ON_TRIP without clearing currentTripId). Driver state changes flow
        // through their dedicated surfaces (dispatch board, verification flow,
        // driver self-service matrix).

        const updated = await tx.driverProfile.update({
          where: { id: input.id },
          data: updateData,
        });

        if (
          input.employmentType ||
          input.badgeNumber !== undefined ||
          input.notes !== undefined
        ) {
          // Phase 3 (3.2 / F4-b): when flipping to EXCLUSIVE_INTERCITY,
          // terminate any other active exclusive affiliations first (same
          // rule as resolveAcceptance). Prevents the DB index from rejecting
          // the write and gives displaced operators proper notification.
          if (input.employmentType === "EXCLUSIVE_INTERCITY") {
            const conflicts = await tx.driverCompanyAffiliation.findMany({
              where: {
                driverProfileId: input.id,
                isActive: true,
                employmentType: "EXCLUSIVE_INTERCITY",
                companyId: { not: ctx.companyId },
              },
              include: { company: { select: { name: true } } },
            });
            for (const conflict of conflicts) {
              await tx.driverCompanyAffiliation.update({
                where: { id: conflict.id },
                data: { isActive: false, terminatedAt: new Date() },
              });
            }
          }

          await tx.driverCompanyAffiliation.update({
            where: {
              driverProfileId_companyId: {
                driverProfileId: input.id,
                companyId: ctx.companyId,
              },
            },
            data: {
              ...(input.employmentType
                ? { employmentType: input.employmentType }
                : {}),
              ...(input.badgeNumber !== undefined
                ? { badgeNumber: input.badgeNumber }
                : {}),
              ...(input.notes !== undefined ? { notes: input.notes } : {}),
            },
          });
        }

        const DOC_FIELDS = [
          ["licenseFrontUrl", "driver-license-front"],
          ["licenseBackUrl", "driver-license-back"],
          ["medicalDocUrl", "driver-medical-doc"],
        ] as const;
        const replacedDocTypes = DOC_FIELDS.filter(([field]) => {
          const next = input[field];
          return next !== undefined && next !== before[field];
        }).map(([, docType]) => docType);

        if (replacedDocTypes.length > 0) {
          await tx.activityLog.create({
            data: {
              companyId: ctx.companyId,
              userId: ctx.user.id,
              action: "DRIVER_DOCS_REPLACED",
              description: `Replaced ${replacedDocTypes.join(", ")} for ${before.user.fullName ?? input.id}`,
              metadata: {
                driverProfileId: input.id,
                replacedDocTypes,
              },
              targetUserId: before.user.id,
            },
          });
        }

        return updated;
      });

      return updated;
    }),

  verifyDriver: operatorCompanyProcedure
    .input(verifyDriverSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:verify");

      // P1-3: verification flips platform-wide gates (marketplace visibility,
      // dispatch eligibility) — only allowed for drivers on this company's
      // active roster. Bare-id updates from any operator were a cross-tenant IDOR.
      const affiliation = await ctx.prisma.driverCompanyAffiliation.findFirst({
        where: {
          driverProfileId: input.id,
          companyId: ctx.companyId,
          isActive: true,
        },
      });

      if (!affiliation) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Driver is not on your active roster — you can only verify your own drivers.",
        });
      }

      const existing = await ctx.prisma.driverProfile.findUnique({
        where: { id: input.id },
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver profile not found.",
        });
      }

      // Phase 26 (F-OP-16) — approving a driver with ZERO compliance
      // documents is a rubber stamp. REJECT/SUSPEND stay available so
      // document-less legacy entries can still be cleaned up.
      if (
        input.verificationStatus === "VERIFIED" &&
        !existing.licenseFrontUrl &&
        !existing.licenseBackUrl &&
        !existing.medicalDocUrl
      ) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Attach at least one compliance document (licence or medical) before verifying this driver.",
        });
      }

      // Phase 06 (F-DV-04) — verification actions now own the operational
      // state machine too. Removing privileges (SUSPEND/REJECT) tears down
      // the run state (close shift, clear currentTripId); restoring them
      // after a suspension parks the driver back at AVAILABLE.
      let operationalStatus = existing.status;
      if (input.verificationStatus === "SUSPENDED") {
        operationalStatus = "SUSPENDED";
      } else if (input.verificationStatus === "REJECTED") {
        operationalStatus = "OFFLINE";
      } else if (
        input.verificationStatus === "VERIFIED" &&
        existing.verificationStatus === "SUSPENDED" &&
        !existing.currentTripId
      ) {
        operationalStatus = "AVAILABLE";
      }

      const driver = await ctx.prisma.$transaction(async (tx) => {
        if (
          input.verificationStatus === "SUSPENDED" ||
          input.verificationStatus === "REJECTED"
        ) {
          const teardownStatus =
            input.verificationStatus === "SUSPENDED" ? "SUSPENDED" : "OFFLINE";
          await suspendDriverOperationalState(
            tx as any,
            input.id,
            teardownStatus,
          );
        }

        const updated = await tx.driverProfile.update({
          where: { id: input.id },
          data: {
            verificationStatus: input.verificationStatus,
            status: operationalStatus,
            verifiedAt:
              input.verificationStatus === "VERIFIED" ? new Date() : null,
            verifiedById:
              input.verificationStatus === "VERIFIED" ? ctx.user.id : null,
            rejectionReason: input.rejectionReason ?? null,
          },
        });

        await tx.driverCompanyAffiliation.updateMany({
          where: {
            driverProfileId: input.id,
            companyId: ctx.companyId,
          },
          data: {
            isVerified: input.verificationStatus === "VERIFIED",
          },
        });

        return updated;
      });

      return driver;
    }),

  deleteDriverAffiliation: operatorCompanyProcedure
    .input(z.object({ driverProfileId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:delete");

      // Phase 13 (F-OP-02) — offboarding is now reachable from the passport UI
      // and guarded + notified. Guard first (D7): removing a MID-RUN driver
      // would reintroduce exactly the ON_TRIP stranding Phase 06 eliminated —
      // converge the run first (complete or cancel), then offboard.
      const profile = await ctx.prisma.driverProfile.findUnique({
        where: { id: input.driverProfileId },
        select: { currentTripId: true },
      });
      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver profile not found.",
        });
      }
      if (profile.currentTripId) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "This driver has an active run. Complete or cancel the run before removing them from the roster.",
        });
      }

      const affiliation = await ctx.prisma.driverCompanyAffiliation.findUnique({
        where: {
          driverProfileId_companyId: {
            driverProfileId: input.driverProfileId,
            companyId: ctx.companyId,
          },
        },
        include: {
          company: { select: { name: true } },
          driverProfile: {
            include: {
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
      });
      if (!affiliation || !affiliation.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver is not on your active roster.",
        });
      }

      // Atomic offboard + notice (same pattern as refund notices): a crash
      // between the soft-delete and the enqueue can't strand the news.
      await ctx.prisma.$transaction(async (tx) => {
        await tx.driverCompanyAffiliation.update({
          where: {
            driverProfileId_companyId: {
              driverProfileId: input.driverProfileId,
              companyId: ctx.companyId,
            },
          },
          data: {
            isActive: false,
            terminatedAt: new Date(),
          },
        });

        // Phase 13 — the driver learns they were dropped (audit gap: no
        // notice existed outside the exclusive-auto-term path).
        try {
          await enqueueDriverRosterRemoved(tx as never, {
            affiliationId: affiliation.id,
            companyId: ctx.companyId,
            to: {
              subscriberId: affiliation.driverProfile.user.id,
              email: affiliation.driverProfile.user.email ?? undefined,
            },
            driverName: affiliation.driverProfile.user.fullName ?? "Driver",
            companyName: affiliation.company.name ?? "Your operator",
          });
        } catch (err) {
          console.error(
            "[deleteDriverAffiliation] roster-removal notice failed:",
            err,
          );
        }
      });

      return { success: true };
    }),

  getAvailableDriversForTrip: operatorCompanyProcedure
    .input(z.object({ tripDate: z.coerce.date().optional() }))
    .query(async ({ ctx }) => {
      requirePermission(ctx, "drivers:read");

      return ctx.prisma.driverProfile.findMany({
        where: {
          companyAffiliations: {
            some: {
              companyId: ctx.companyId,
              isActive: true,
            },
          },
          status: { in: ["AVAILABLE", "ON_DUTY", "OFFLINE"] },
          verificationStatus: "VERIFIED",
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              image: true,
            },
          },
        },
        orderBy: { averageRating: "desc" },
      });
    }),

  getLivePositions: operatorCompanyProcedure.query(async ({ ctx }) => {
    requirePermission(ctx, "drivers:read");

    const activeDrivers = await ctx.prisma.driverProfile.findMany({
      where: {
        companyAffiliations: {
          some: {
            companyId: ctx.companyId,
            isActive: true,
          },
        },
        status: { in: ["ON_TRIP", "ON_DUTY"] },
        lastLatitude: { not: null },
        lastLongitude: { not: null },
      },
      select: {
        id: true,
        status: true,
        lastLatitude: true,
        lastLongitude: true,
        lastHeading: true,
        lastSpeedKmh: true,
        lastPingAt: true,
        user: {
          select: {
            fullName: true,
            phoneNumber: true,
            image: true,
          },
        },
        currentTrip: {
          select: {
            id: true,
            serviceType: true,
            status: true,
            bus: {
              select: {
                registrationPlate: true,
                internalName: true,
              },
            },
          },
        },
      },
    });

    return activeDrivers;
  }),

  // ============================================
  // MOBILE DRIVER SELF-SERVICE PROCEDURES
  // ============================================

  getMyProfile: driverProcedure.query(async ({ ctx }) => {
    const driver = await ctx.prisma.driverProfile.findUnique({
      where: { id: ctx.driver.id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            image: true,
            createdAt: true,
          },
        },
        companyAffiliations: {
          where: { isActive: true },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
        currentTrip: {
          include: {
            bus: true,
            tripStops: {
              include: { terminal: true },
              orderBy: { stopOrder: "asc" },
            },
          },
        },
        _count: {
          select: {
            assignedTrips: true,
            reviews: true,
            shifts: true,
          },
        },
      },
    });

    return driver;
  }),

  getMyVerificationStatus: protectedProcedure.query(async ({ ctx }) => {
    const driver = await ctx.prisma.driverProfile.findUnique({
      where: { userId: ctx.user.id },
      select: {
        id: true,
        verificationStatus: true,
        rejectionReason: true,
        verifiedAt: true,
        licenseNumber: true,
        licenseCategory: true,
        status: true,
      },
    });

    return {
      hasProfile: !!driver,
      driver,
    };
  }),

  registerDriver: protectedProcedure
    .input(driverSelfRegisterSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user already has a driver profile
      const existing = await ctx.prisma.driverProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a driver profile registered on Moja Bus.",
        });
      }

      // Check if license number is already used elsewhere
      const existingLicense = await ctx.prisma.driverProfile.findUnique({
        where: { licenseNumber: input.licenseNumber },
      });

      if (existingLicense) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "This driving license number is already registered on the platform.",
        });
      }

      // Phase 14/16 (F-DV-10) — identity hygiene. Names and avatars are
      // self-owned: overwrite freely. The account PHONE is canonical contact
      // data: validate server-side (the +225 lock was client-only), normalize
      // to E.164, and refuse to silently re-point the account to a different
      // number without OTP re-verification.
      const validationError = getPhoneValidationError(input.phone, "+225");
      const normalizedPhone = toE164(input.phone, "+225");
      if (validationError || !normalizedPhone) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Enter a valid Ivorian phone number (at least 10 digits after +225).",
        });
      }
      if (
        ctx.user.phoneNumber &&
        ctx.user.phoneNumber !== input.phone &&
        ctx.user.phoneNumber !== normalizedPhone
      ) {
        const mask = (p: string) => `${p.slice(0, 5)}••••${p.slice(-2)}`;
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `PHONE_REVERIFICATION_REQUIRED::${mask(ctx.user.phoneNumber)}::${mask(normalizedPhone)}`,
        });
      }

      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          fullName: input.fullName,
          ...(ctx.user.phoneNumber ? {} : { phoneNumber: normalizedPhone }),
          ...(input.selfieUrl ? { image: input.selfieUrl } : {}),
        },
      });

      // Create DriverProfile
      const driver = await ctx.prisma.driverProfile.create({
        data: {
          userId: ctx.user.id,
          licenseNumber: input.licenseNumber,
          licenseCategory: input.licenseCategory,
          licenseExpiryDate: input.licenseExpiryDate,
          licenseFrontUrl: input.licenseFrontUrl ?? null,
          licenseBackUrl: input.licenseBackUrl ?? null,
          yearsOfExperience: input.yearsOfExperience,
          medicalDocUrl: input.medicalDocUrl ?? null,
          // Phase 15 (F-DV-05) — what the wizard collects is what we store.
          nationalIdNumber: input.nationalIdNumber ?? null,
          verificationStatus: "PENDING",
          status: "OFFLINE",
        },
      });

      // Phase 15 (F-DV-05) — honour the chosen contract type as a service
      // preference so marketplace/dispatch surfaces see the same truth.
      if (input.employmentType) {
        await ctx.prisma.driverServicePreference.upsert({
          where: { driverProfileId: driver.id },
          create: {
            driverProfileId: driver.id,
            preferredType: input.employmentType,
            isAvailableForHire: false,
          },
          update: { preferredType: input.employmentType },
        });
      }

      // If carrier invite code provided, match company and affiliate
      let affiliated = false;
      let companyName: string | null = null;
      if (input.carrierInviteCode) {
        const company = await ctx.prisma.company.findFirst({
          where: {
            OR: [
              { slug: input.carrierInviteCode.toLowerCase() },
              { id: input.carrierInviteCode },
            ],
            status: "ACTIVE",
          },
        });

        if (company) {
          await ctx.prisma.driverCompanyAffiliation.create({
            data: {
              driverProfileId: driver.id,
              companyId: company.id,
              // Phase 15 (F-DV-05) — the driver's chosen contract type, not a
              // hardcoded default.
              employmentType: input.employmentType ?? "EXCLUSIVE_INTERCITY",
              isActive: true,
              isVerified: false,
            },
          });
          affiliated = true;
          companyName = company.name;
        }
      }

      return {
        success: true,
        driverId: driver.id,
        verificationStatus: driver.verificationStatus,
        // Phase 15 (F-DV-05) — explicit affiliation outcome instead of silence.
        affiliated,
        companyName,
      };
    }),

  updateMyStatus: driverProcedure
    .input(driverUpdateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      // Phase 14/16 (F-DV-06) — the status machine gets one authority per
      // transition. Mid-run: nobody may hand-edit state (Phase 06 convergence
      // owns it). Shift open: only toggleShift may change status (prevents
      // ledgerless ON_DUTY and silent shift-abandonment). Idle + shiftless:
      // OFFLINE / RESTING / AVAILABLE are free; ON_DUTY requires the duty
      // toggle so a ledger row always backs it.
      if (ctx.driver.currentTripId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You have an active run — finish or report it before changing your status.",
        });
      }

      const openShift = await ctx.prisma.driverShift.findFirst({
        where: { driverProfileId: ctx.driver.id, endedAt: null },
        select: { companyId: true },
      });
      if (openShift) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You have an open shift — clock out via the duty toggle to change your status.",
        });
      }
      if (input.status === "ON_DUTY") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Going on duty requires an open shift — use the duty toggle.",
        });
      }

      const updated = await ctx.prisma.driverProfile.update({
        where: { id: ctx.driver.id },
        data: { status: input.status },
        select: { id: true, status: true },
      });

      return updated;
    }),

  getMyTrips: driverProcedure
    .input(driverGetMyTripsSchema)
    .query(async ({ ctx, input }) => {
      const { filter, page, limit, serviceType } = input;
      const skip = (page - 1) * limit;

      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      );

      // Phase 31 (unnumbered audit observation) — ALL no longer surfaces
      // CANCELLED runs; the specific filters below override with their own
      // status sets, so only the catch-all changes behavior.
      let tripWhere: any = { status: { not: "CANCELLED" } };
      if (filter === "TODAY") {
        tripWhere = {
          departureDate: { gte: startOfDay, lte: endOfDay },
          status: { in: ["SCHEDULED", "BOARDING", "DEPARTED"] },
        };
      } else if (filter === "UPCOMING") {
        tripWhere = {
          departureDate: { gt: endOfDay },
          status: "SCHEDULED",
        };
      } else if (filter === "COMPLETED") {
        tripWhere = {
          status: "ARRIVED",
        };
      }

      // Phase 19 (P3-13) — dual-mode switcher filters for real.
      if (serviceType) {
        tripWhere.serviceType = serviceType;
      }

      const assignments = await ctx.prisma.tripDriverAssignment.findMany({
        where: {
          driverProfileId: ctx.driver.id,
          trip: tripWhere,
        },
        skip,
        take: limit,
        orderBy: { trip: { departureDate: "asc" } },
        include: {
          trip: {
            include: {
              bus: {
                select: {
                  id: true,
                  registrationPlate: true,
                  internalName: true,
                },
              },
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logoUrl: true,
                },
              },
              tripStops: {
                include: { terminal: true },
                orderBy: { stopOrder: "asc" },
              },
              _count: {
                select: {
                  bookings: {
                    where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
                  },
                },
              },
            },
          },
        },
      });

      return {
        items: assignments.map((a) => ({
          assignmentId: a.id,
          role: a.role,
          trip: a.trip,
          passengerCount: a.trip._count.bookings,
        })),
        page,
        limit,
      };
    }),

  getMyTripDetail: driverProcedure
    .input(z.object({ tripId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const assignment = await ctx.prisma.tripDriverAssignment.findFirst({
        where: {
          driverProfileId: ctx.driver.id,
          tripId: input.tripId,
        },
        include: {
          trip: {
            include: {
              bus: true,
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logoUrl: true,
                  phone: true,
                },
              },
              tripStops: {
                include: { terminal: true },
                orderBy: { stopOrder: "asc" },
              },
              _count: {
                select: {
                  bookings: {
                    where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
                  },
                },
              },
            },
          },
        },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not assigned to this trip.",
        });
      }

      return assignment.trip;
    }),

  getMyTripManifest: driverProcedure
    .input(
      z.object({ tripId: z.string().cuid(), search: z.string().optional() }),
    )
    .query(async ({ ctx, input }) => {
      // Verify driver assignment
      const assignment = await ctx.prisma.tripDriverAssignment.findFirst({
        where: {
          driverProfileId: ctx.driver.id,
          tripId: input.tripId,
        },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view the manifest for this trip.",
        });
      }

      const bookings = await ctx.prisma.booking.findMany({
        where: {
          tripId: input.tripId,
          status: { in: ["CONFIRMED", "COMPLETED"] },
          ...(input.search
            ? {
                OR: [
                  {
                    passengerName: {
                      contains: input.search,
                      mode: "insensitive",
                    },
                  },
                  {
                    passengerPhone: {
                      contains: input.search,
                      mode: "insensitive",
                    },
                  },
                  {
                    bookingReference: {
                      contains: input.search,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {}),
        },
        include: {
          seat: {
            select: {
              label: true,
            },
          },
          originTripStop: {
            include: { terminal: true },
          },
          destinationTripStop: {
            include: { terminal: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      const totalBooked = bookings.length;
      const boardedCount = bookings.filter((b) => !!b.boardedAt).length;

      return {
        manifest: bookings.map((b) => ({
          bookingId: b.id,
          bookingReference: b.bookingReference,
          // Phase 03 (F-IN-01) — durable ticketTokens no longer leave the server
          // via the manifest; bookingReference + boarded state suffice.
          passengerName: b.passengerName,
          passengerPhone: b.passengerPhone,
          seatNumber: b.seat?.label ?? "Unassigned",
          status: b.status,
          boardedAt: b.boardedAt,
          originTerminal: b.originTripStop?.terminal?.name,
          destinationTerminal: b.destinationTripStop?.terminal?.name,
        })),
        totalBooked,
        boardedCount,
      };
    }),

  checkInPassenger: driverProcedure
    .input(driverCheckInPassengerSchema)
    .mutation(async ({ ctx, input }) => {
      // Phase 03 (F-IN-01) — guards live in the service; Phase 02 (F-PS-03) —
      // schema preprocess normalizes scanned URLs/JSON, injected resolver
      // handles pt. presentation tokens.
      const service = new DriverCheckInService(
        ctx.prisma,
        resolvePresentationTicket,
      );
      return service.scanCheckIn(ctx.driver.id, input);
    }),

  manualCheckInPassenger: driverProcedure
    .input(driverManualCheckInSchema)
    .mutation(async ({ ctx, input }) => {
      // Phase 03 (F-IN-01) — same guards as scan; gains status/window checks.
      const service = new DriverCheckInService(ctx.prisma);
      return service.manualCheckIn(ctx.driver.id, input);
    }),

  batchSyncCheckIns: driverProcedure
    .input(driverBatchSyncCheckInsSchema)
    .mutation(async ({ ctx, input }) => {
      // Phase 03 (F-IN-01) — per-item outcomes replace the swallow-all catch;
      // Phase 02 — same forgiving token contract as scanCheckIn.
      const service = new DriverCheckInService(
        ctx.prisma,
        resolvePresentationTicket,
      );
      return service.batchSync(ctx.driver.id, input.checkIns);
    }),

  startTrip: driverProcedure
    .input(driverStartTripSchema)
    .mutation(async ({ ctx, input }) => {
      const assignment = await ctx.prisma.tripDriverAssignment.findFirst({
        where: {
          driverProfileId: ctx.driver.id,
          tripId: input.tripId,
        },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not assigned to this trip.",
        });
      }

      const trip = await ctx.prisma.trip.findUnique({
        where: { id: input.tripId },
        select: {
          id: true,
          status: true,
          actualDeparture: true,
          companyId: true,
          estimatedArrival: true,
        },
      });
      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found." });
      }

      // Phase 14 (F-DV-15/F-OP-03) — only VERIFIED drivers with a licence
      // valid through the run may take the wheel. In-flight operations stay
      // ungated once started (Phase 06 never-strand invariant).
      if (!canOperateRuns(ctx.driver.verificationStatus)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Your license verification is not approved yet — you cannot start a run.",
        });
      }
      if (
        !isLicenseUsableThrough(
          ctx.driver.licenseExpiryDate,
          trip.estimatedArrival ?? new Date(),
        )
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Your license expires before this run ends — renew it and have your operator re-verify first.",
        });
      }

      // Phase 16 — transition guard: ARRIVED/CANCELLED runs can never (re)start.
      // DEPARTED → DEPARTED is the "Resume Run" path and must NOT overwrite
      // the original actualDeparture timestamp.
      if (
        !["SCHEDULED", "BOARDING", "DELAYED", "DEPARTED"].includes(trip.status)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot start a ${trip.status} run.`,
        });
      }

      const isResume = trip.status === "DEPARTED";
      await ctx.prisma.$transaction([
        ctx.prisma.trip.update({
          where: { id: input.tripId },
          data: {
            status: "DEPARTED",
            ...(isResume ? {} : { actualDeparture: new Date() }),
          },
        }),
        ctx.prisma.driverProfile.update({
          where: { id: ctx.driver.id },
          data: {
            status: "ON_TRIP",
            currentTripId: input.tripId,
          },
        }),
      ]);

      // Phase 16 — P0-1/P1-4: the response carries the caller's telemetry
      // identity plus a short-lived dispatch token for WS/HTTP ingest.
      return {
        success: true,
        tripId: input.tripId,
        status: "DEPARTED",
        driverProfileId: ctx.driver.id,
        telemetryToken: mintTelemetryDispatchTokenWithCompany(ctx.driver.id, {
          tripId: input.tripId,
          // Phase 11 (F-TM-02) — fleet channel + room ACL derive from this
          // signed claim instead of client-supplied query params.
          companyId: trip.companyId,
        }),
      };
    }),

  /**
   * Phase 16 (P1-4) — re-mint path for app restarts / resume runs so a driver
   * never needs to re-run startTrip just to keep streaming telemetry.
   */
  getTelemetryToken: driverProcedure
    .input(z.object({ tripId: z.string().cuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const tripId = input?.tripId ?? ctx.driver.currentTripId;
      if (!tripId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active run to authorize telemetry for.",
        });
      }

      const assignment = await ctx.prisma.tripDriverAssignment.findFirst({
        where: {
          driverProfileId: ctx.driver.id,
          tripId,
        },
        select: { id: true },
      });
      if (!assignment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not assigned to this trip.",
        });
      }

      const trip = await ctx.prisma.trip.findUnique({
        where: { id: tripId },
        select: { companyId: true },
      });

      return {
        driverProfileId: ctx.driver.id,
        tripId,
        telemetryToken: mintTelemetryDispatchTokenWithCompany(ctx.driver.id, {
          tripId,
          companyId: trip?.companyId ?? null,
        }),
      };
    }),

  completeTrip: driverProcedure
    .input(driverCompleteTripSchema)
    .mutation(async ({ ctx, input }) => {
      const assignment = await ctx.prisma.tripDriverAssignment.findFirst({
        where: {
          driverProfileId: ctx.driver.id,
          tripId: input.tripId,
        },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not assigned to this trip.",
        });
      }

      const trip = await ctx.prisma.trip.findUnique({
        where: { id: input.tripId },
        select: { id: true, status: true },
      });
      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found." });
      }

      // Phase 16 — transition guard: only DEPARTED → ARRIVED is valid, so a
      // double-tap or stale client can never re-complete (stat inflation).
      if (trip.status !== "DEPARTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            trip.status === "ARRIVED"
              ? "This run has already been completed."
              : `Start the run before completing it (current status: ${trip.status}).`,
        });
      }

      const now = new Date();

      // Phase 06 (F-DV-04) — post-run status respects the shift ledger:
      // open shift ⇒ AVAILABLE, otherwise OFFLINE. Same rule as the forced
      // convergence paths in lib/driver-run-state.ts so a driver lands in
      // the same state whether THEY closed the run or dispatch did.
      const openShift = await ctx.prisma.driverShift.findFirst({
        where: { driverProfileId: ctx.driver.id, endedAt: null },
        select: { id: true },
      });

      await ctx.prisma.$transaction([
        ctx.prisma.trip.update({
          where: { id: input.tripId },
          data: {
            status: "ARRIVED",
            actualArrival: now,
          },
        }),
        ctx.prisma.driverProfile.update({
          where: { id: ctx.driver.id },
          data: {
            status: resolvePostRunStatus(!!openShift),
            currentTripId: null,
            totalTripsCompleted: { increment: 1 },
          },
        }),
        // Phase 3 (3.3) — increment shift-level trip counter so the driver
        // app earnings screen shows the correct per-shift trip count.
        ...(openShift
          ? [
              ctx.prisma.driverShift.update({
                where: { id: openShift.id },
                data: { tripsCompleted: { increment: 1 } },
              }),
            ]
          : []),
      ]);

      // Phase 16 — P0-2 parity with operator arrival: stamp booking.completedAt
      // and fan out passenger-review-request so reviews + escrow eligibility fire.
      await finalizeTripArrival(ctx.prisma, input.tripId);

      return {
        success: true,
        tripId: input.tripId,
        status: "ARRIVED",
        driverProfileId: ctx.driver.id,
      };
    }),

  reportTripDelay: driverProcedure
    .input(driverReportDelaySchema)
    .mutation(async ({ ctx, input }) => {
      const assignment = await ctx.prisma.tripDriverAssignment.findFirst({
        where: {
          driverProfileId: ctx.driver.id,
          tripId: input.tripId,
        },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not assigned to this trip.",
        });
      }

      // Phase 19 (P3-12) — delays are only meaningful on live runs.
      const liveTrip = await ctx.prisma.trip.findUnique({
        where: { id: input.tripId },
        select: {
          id: true,
          status: true,
          gate: true,
          departureDate: true,
          delayMinutes: true,
          estimatedArrival: true,
          serviceType: true,
          companyId: true,
          schedule: {
            select: {
              route: {
                select: {
                  originTerminal: {
                    include: { cityRelation: true, municipality: true },
                  },
                  destTerminal: {
                    include: { cityRelation: true, municipality: true },
                  },
                },
              },
            },
          },
        },
      });
      if (!liveTrip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found." });
      }
      if (
        !["SCHEDULED", "BOARDING", "DELAYED", "DEPARTED"].includes(
          liveTrip.status,
        )
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot report a delay on a ${liveTrip.status.toLowerCase()} trip.`,
        });
      }

      // Anti-spam throttle: one driver-reported delay broadcast per 5 minutes
      // per trip. Repeated taps must not fan out to every confirmed passenger.
      const recentReport = await ctx.prisma.driverLocationPing.findFirst({
        where: {
          tripId: input.tripId,
          isAnomaly: true,
          anomalyReason: { startsWith: "DELAY_" },
          recordedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
        select: { id: true },
      });
      if (recentReport) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "A delay was already reported for this run moments ago.",
        });
      }

      // Record telemetry anomaly / incident note
      await ctx.prisma.driverLocationPing.create({
        data: {
          driverProfileId: ctx.driver.id,
          tripId: input.tripId,
          latitude: ctx.driver.lastLatitude ?? 0,
          longitude: ctx.driver.lastLongitude ?? 0,
          isAnomaly: true,
          anomalyReason: `DELAY_${input.reason}: ${input.delayMinutes} mins. ${input.note ?? ""}`,
          recordedAt: new Date(),
        },
      });

      // Phase 14/17 (F-DV-09) — the delay becomes operationally real. Same
      // formula as the operator formalization path (cumulative minutes,
      // DELAYED status pre-departure, departure/arrival shifted) so both
      // actors share one truth and increments can never double-count.
      // DEPARTED runs keep their status: completeTrip's transition guard
      // requires it — flipping would strand the run mid-route.
      const incremental = input.delayMinutes;
      await ctx.prisma.trip.update({
        where: { id: input.tripId },
        data: {
          delayMinutes: (liveTrip.delayMinutes ?? 0) + incremental,
          ...(liveTrip.status === "DEPARTED" ? {} : { status: "DELAYED" }),
          departureDate: new Date(
            liveTrip.departureDate.getTime() + incremental * 60_000,
          ),
          ...(liveTrip.estimatedArrival
            ? {
                estimatedArrival: new Date(
                  liveTrip.estimatedArrival.getTime() + incremental * 60_000,
                ),
              }
            : {}),
        },
      });

      // Phase 14/17 — a shifted window can create driver double-bookings;
      // operators stay in charge of any reassignment (same throttled alert
      // loop as the operator formalization path).
      const activeAssignments = await ctx.prisma.tripDriverAssignment.findMany({
        where: {
          tripId: input.tripId,
          role: { in: ["PRIMARY", "RELIEF"] as const },
        },
        include: {
          driverProfile: {
            include: { user: { select: { id: true, fullName: true } } },
          },
        },
      });
      const delayedRoute = (() => {
        const r = liveTrip.schedule?.route as any;
        if (
          r?.originTerminal?.cityRelation?.name &&
          r?.destTerminal?.cityRelation?.name
        ) {
          return `${r.originTerminal.cityRelation.name} → ${r.destTerminal.cityRelation.name}`;
        }
        return r?.name ?? "ce trajet";
      })();
      for (const assignment of activeAssignments) {
        const conflict = await getDriverTripConflict(
          ctx.prisma,
          assignment.driverProfileId,
          {
            departureDate: new Date(
              liveTrip.departureDate.getTime() + incremental * 60_000,
            ),
            estimatedArrival: liveTrip.estimatedArrival
              ? new Date(
                  liveTrip.estimatedArrival.getTime() + incremental * 60_000,
                )
              : null,
            serviceType: liveTrip.serviceType,
            excludeTripId: input.tripId,
          },
        );
        if (!conflict) continue;
        for (const to of await companyOperatorRecipients(
          ctx.prisma,
          liveTrip.companyId,
        )) {
          await enqueueOperatorDriverAssignmentConflict(ctx.prisma as never, {
            payload: {
              tripId: input.tripId,
              conflictTripId: conflict.tripId,
              driverName:
                assignment.driverProfile.user.fullName ?? "Un chauffeur",
              delayedRoute,
              conflictRoute: conflict.routeName,
              conflictCompany: conflict.companyName || null,
              busyUntilIso: conflict.busyUntilIso,
            },
            to,
          });
        }
      }

      // Fan out to confirmed passengers — copy reflects that the DRIVER
      // reported this. Times come from the live trip row so any earlier
      // operator-formalized delays are already baked in.
      const bookings = await ctx.prisma.booking.findMany({
        where: { tripId: input.tripId, status: "CONFIRMED" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phoneNumber: true,
            },
          },
        },
      });

      // Phase 07 (F-NF-02, D3/D4) — delay notices ride the durable outbox via
      // the shared helper (hourly bucket, retry/backoff, contract-tested).
      if (bookings.length > 0) {
        const originCity =
          liveTrip.schedule?.route.originTerminal.cityRelation?.name ??
          "Unknown";
        const destCity =
          liveTrip.schedule?.route.destTerminal.cityRelation?.name ?? "Unknown";
        const originMunicipality =
          liveTrip.schedule?.route.originTerminal.municipality?.name ?? null;
        const destinationMunicipality =
          liveTrip.schedule?.route.destTerminal.municipality?.name ?? null;
        const newDeparture = new Date(
          liveTrip.departureDate.getTime() + input.delayMinutes * 60_000,
        );
        const fmt = (d: Date) =>
          d.toLocaleString("en-US", { timeZone: "Africa/Abidjan" });

        for (const booking of bookings) {
          const email =
            booking.user?.email ??
            (booking.passengerPhone
              ? `${booking.passengerPhone.replace(/\s+/g, "")}@guest.mojaride.ci`
              : null);
          if (!email) continue;

          await enqueuePassengerTripDelayed(ctx.prisma, {
            tripId: input.tripId,
            bookingId: booking.id,
            reportedBy: "DRIVER",
            email,
            subscriberId: booking.user?.id ?? email,
            firstName:
              (booking.user?.fullName ?? booking.passengerName).split(" ")[0] ??
              undefined,
            data: {
              email,
              passengerName: booking.user?.fullName ?? booking.passengerName,
              originCity,
              destinationCity: destCity,
              originMunicipality,
              destinationMunicipality,
              originalTime: fmt(liveTrip.departureDate),
              newTime: fmt(newDeparture),
              delayMinutes: input.delayMinutes,
              gate: liveTrip.gate ?? undefined,
              phone:
                booking.user?.phoneNumber ??
                booking.passengerPhone ??
                undefined,
              bookingReference: booking.bookingReference,
              reportedBy: "DRIVER" as const,
            },
          });
        }
      }

      return {
        success: true,
        delayMinutes: input.delayMinutes,
        reason: input.reason,
      };
    }),

  toggleShift: driverProcedure
    .input(driverShiftToggleSchema)
    .mutation(async ({ ctx, input }) => {
      // Phase 14 (F-DV-15/F-OP-03) — going on duty is an operational action:
      // VERIFIED only, licence valid at least through today. Clocking OFF is
      // always allowed (never-strand: a driver must be able to close out).
      if (input.onDuty) {
        if (!canOperateRuns(ctx.driver.verificationStatus)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Your license verification is not approved yet — shifts are locked until an operator verifies your account.",
          });
        }
        if (!isLicenseUsableThrough(ctx.driver.licenseExpiryDate, new Date())) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Your license has expired — renew it and have your operator re-verify before going on duty.",
          });
        }
      }

      // Phase 14/17 (F-DV-07) — deterministic company attribution: the most
      // recently hired ACTIVE affiliation wins when the client omits it.
      const affiliations = [...(ctx.driver.companyAffiliations ?? [])].sort(
        (a, b) => new Date(b.hiredAt).getTime() - new Date(a.hiredAt).getTime(),
      );
      const companyId = input.companyId ?? affiliations[0]?.companyId;

      if (!companyId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No affiliated carrier company found for shift record.",
        });
      }

      if (input.onDuty) {
        // Phase 17 (F-DV-07) — exactly one open shift per driver; an existing
        // one is named, not silently double-opened. The DB partial unique
        // index (migration 20260824000001) is the authoritative backstop.
        const openShift = await ctx.prisma.driverShift.findFirst({
          where: { driverProfileId: ctx.driver.id, endedAt: null },
          select: { id: true, startedAt: true, companyId: true },
        });
        if (openShift) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `A shift is already open (since ${openShift.startedAt.toISOString().slice(11, 16)} UTC${openShift.companyId !== companyId ? ", for another carrier" : ""}). Close it first.`,
          });
        }

        const shift = await ctx.prisma.driverShift.create({
          data: {
            driverProfileId: ctx.driver.id,
            companyId,
            startedAt: new Date(),
            serviceType: input.serviceType,
          },
        });

        await ctx.prisma.driverProfile.update({
          where: { id: ctx.driver.id },
          data: { status: "ON_DUTY" },
        });

        return { success: true, shiftId: shift.id, onDuty: true };
      } else {
        // Phase 17 (F-DV-07) — clock-off binds to the resolved company: no
        // more closing whichever shift happens to be open for anyone else.
        const openShift = await ctx.prisma.driverShift.findFirst({
          where: {
            driverProfileId: ctx.driver.id,
            endedAt: null,
            companyId,
          },
          orderBy: { startedAt: "desc" as const },
        });

        if (openShift) {
          const endedAt = new Date();
          const totalMinutes = Math.round(
            (endedAt.getTime() - openShift.startedAt.getTime()) / 60000,
          );

          await ctx.prisma.driverShift.update({
            where: { id: openShift.id },
            data: {
              endedAt,
              totalMinutes,
            },
          });
        } else {
          // Phase 17 (F-DV-07) — distinguish "nothing open" from "your open
          // shift belongs to another carrier" instead of silently closing the
          // wrong company's ledger row.
          const anyOpen = await ctx.prisma.driverShift.findFirst({
            where: { driverProfileId: ctx.driver.id, endedAt: null },
            select: { companyId: true },
          });
          if (anyOpen) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "Your open shift belongs to a different carrier — clock off from that carrier's screen first.",
            });
          }
        }

        await ctx.prisma.driverProfile.update({
          where: { id: ctx.driver.id },
          data: { status: "OFFLINE" },
        });

        return { success: true, onDuty: false };
      }
    }),

  getMyCurrentShift: driverProcedure.query(async ({ ctx }) => {
    const shift = await ctx.prisma.driverShift.findFirst({
      where: {
        driverProfileId: ctx.driver.id,
        endedAt: null,
      },
      include: {
        company: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return shift;
  }),

  getMyEarnings: driverProcedure.query(async ({ ctx }) => {
    // SCOPE RULING (Phase 31 review): totals are GLOBAL ACROSS CARRIERS BY
    // DESIGN — no companyId filter here. INTERCITY exclusivity means one
    // active exclusive carrier at a time; urban-contractor shifts coexist and
    // are labeled per-shift in the UI (shift.company.name). Do NOT "fix" this
    // into per-company scoping without a product decision: it silently
    // changes every multi-affiliated driver's numbers.
    //
    // Phase 31 (F-DV-11) — the rate lives in PlatformSettings (one DB truth,
    // identical across environments), not an env var and not a hardcoded 50.
    const settings = await ctx.prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: { driverPayRateXofPerMinute: true },
    });
    const rateXofPerMinute =
      settings?.driverPayRateXofPerMinute ??
      DEFAULT_DRIVER_PAY_RATE_XOF_PER_MINUTE;

    const now = new Date();
    const startOfDay = utcMidnight(now);
    const startOfWeek = mondayStartUtc(now);

    // One indexed aggregate over UNBOUNDED history (the old take:30 capped
    // the week bucket for >30-shift weeks). Open shifts accrue live minutes;
    // closed shifts use their ledger totalMinutes.
    const rows = await ctx.prisma.$queryRaw<
      Array<{ today_minutes: number; week_minutes: number }>
    >`
      SELECT
        COALESCE(SUM(
          CASE
            WHEN s."endedAt" IS NOT NULL THEN COALESCE(s."totalMinutes", 0)
            ELSE GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - s."startedAt")) / 60))
          END
        ) FILTER (WHERE s."startedAt" >= ${startOfDay}), 0)::int AS today_minutes,
        COALESCE(SUM(
          CASE
            WHEN s."endedAt" IS NOT NULL THEN COALESCE(s."totalMinutes", 0)
            ELSE GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - s."startedAt")) / 60))
          END
        ) FILTER (WHERE s."startedAt" >= ${startOfWeek}), 0)::int AS week_minutes
      FROM "driver_shift" s
      WHERE s."driverProfileId" = ${ctx.driver.id}
        AND s."startedAt" >= ${startOfWeek}
    `;
    const totals = rows[0] ?? { today_minutes: 0, week_minutes: 0 };

    const shifts = await ctx.prisma.driverShift.findMany({
      where: { driverProfileId: ctx.driver.id },
      take: 5,
      orderBy: { startedAt: "desc" },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      todayEarningsXof: earningsFromMinutes(
        totals.today_minutes,
        rateXofPerMinute,
      ),
      weekEarningsXof: earningsFromMinutes(
        totals.week_minutes,
        rateXofPerMinute,
      ),
      // Phase 31 D5 — the UI labels these as an ESTIMATE while the pay-rate
      // model (roadmap) has not replaced this flat per-minute placeholder.
      rateXofPerMinute,
      isPlaceholderRate: true,
      totalTripsCompleted: ctx.driver.totalTripsCompleted,
      totalDistanceKm: ctx.driver.totalDistanceKm,
      averageRating: ctx.driver.averageRating,
      safetyScore: ctx.driver.safetyScore,
      recentShifts: shifts,
    };
  }),

  getMyShifts: driverProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const [items, total] = await Promise.all([
        ctx.prisma.driverShift.findMany({
          where: { driverProfileId: ctx.driver.id },
          skip,
          take: input.limit,
          orderBy: { startedAt: "desc" },
          include: {
            company: {
              select: { id: true, name: true, logoUrl: true },
            },
          },
        }),
        ctx.prisma.driverShift.count({
          where: { driverProfileId: ctx.driver.id },
        }),
      ]);

      return {
        items,
        total,
        page: input.page,
        limit: input.limit,
      };
    }),

  // ============================================================================
  // PHASE 9 — MARKETPLACE PREFERENCE PROCEDURES
  // ============================================================================

  /**
   * Driver sets their own marketplace preferences.
   * Creates the record on first call (upsert), updates on subsequent calls.
   * isAvailableForHire is explicitly set by the driver — not auto-toggled.
   */
  setServicePreference: driverProcedure
    .input(setServicePreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      const normalizedRoutes = [
        ...new Set(input.routeExperience.map((r) => r.trim()).filter(Boolean)),
      ];

      const preference = await ctx.prisma.driverServicePreference.upsert({
        where: { driverProfileId: ctx.driver.id },
        create: {
          driverProfileId: ctx.driver.id,
          isAvailableForHire: input.isAvailableForHire,
          preferredType: input.preferredType,
          cityBase: input.cityBase ?? null,
          routeExperience: normalizedRoutes,
        },
        update: {
          isAvailableForHire: input.isAvailableForHire,
          preferredType: input.preferredType,
          cityBase: input.cityBase ?? null,
          routeExperience: normalizedRoutes,
        },
      });
      return { success: true, preference };
    }),

  /**
   * Driver reads their own preferences (includes private salary field).
   */
  getMyServicePreference: driverProcedure.query(async ({ ctx }) => {
    const preference = await ctx.prisma.driverServicePreference.findUnique({
      where: { driverProfileId: ctx.driver.id },
    });
    return { preference };
  }),

  /**
   * Operator reads a driver's PUBLIC profile card for the marketplace.
   * Salary (minMonthlyRateCFA) is intentionally excluded.
   * Only returns drivers whose verificationStatus = VERIFIED.
   */
  getPublicDriverProfile: operatorCompanyProcedure
    .input(getPublicDriverProfileSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:read");

      const driver = await ctx.prisma.driverProfile.findUnique({
        where: {
          id: input.driverProfileId,
          verificationStatus: "VERIFIED",
        },
        select: {
          id: true,
          licenseCategory: true,
          yearsOfExperience: true,
          averageRating: true,
          totalReviews: true,
          totalTripsCompleted: true,
          totalDistanceKm: true,
          safetyScore: true,
          verifiedAt: true,
          verificationStatus: true,
          user: {
            select: {
              fullName: true,
              phoneNumber: true,
              image: true,
            },
          },
          companyAffiliations: {
            select: {
              // Phase 24 (F-OP-06) — companyId drives isOnMyRoster below.
              companyId: true,
              employmentType: true,
              hiredAt: true,
              terminatedAt: true,
              isActive: true,
              company: {
                select: { name: true, slug: true },
              },
            },
            orderBy: { hiredAt: "desc" as const },
          },
          servicePreference: {
            select: {
              isAvailableForHire: true,
              isSuspended: true,
              preferredType: true,
              cityBase: true,
              routeExperience: true,
              isFeatured: true,
              // minMonthlyRateCFA intentionally excluded
            },
          },
        },
      });

      if (!driver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver not found or not yet verified.",
        });
      }

      // Phase 25 (F-OP-10) — suspended or off-market drivers are REDACTED,
      // not deleted: an operator holding a stale id sees name + verification
      // state only; contact details, history, and hire data stop being
      // readable the moment the driver steps off the market. Available,
      // non-suspended drivers stay fully contactable — that is the
      // marketplace promise. Own-company operators use getDriver for their
      // full roster view regardless.
      const offMarket =
        !driver.servicePreference?.isAvailableForHire ||
        driver.servicePreference.isSuspended;

      // Phase 24 (F-OP-06) — roster state drives the sheet's Send-Offer CTA
      // in BOTH branches (an own-roster driver is unsendable even if redacted).
      const isOnMyRoster = driver.companyAffiliations.some(
        (a) => a.companyId === ctx.companyId && a.isActive,
      );

      if (offMarket) {
        const redacted: PublicDriverProfileView = {
          id: driver.id,
          licenseCategory: null,
          yearsOfExperience: 0,
          averageRating: 0,
          totalReviews: 0,
          totalTripsCompleted: 0,
          totalDistanceKm: 0,
          safetyScore: 100,
          verifiedAt: null,
          verificationStatus: driver.verificationStatus,
          user: {
            fullName: driver.user.fullName,
            phoneNumber: null,
            image: null,
          },
          companyAffiliations: [],
          servicePreference: null,
          isOnMyRoster,
          trustBadges: [],
        };
        return { driver: redacted };
      }

      return {
        driver: {
          ...driver,
          isOnMyRoster,
          trustBadges: computeTrustBadges({
            averageRating: driver.averageRating,
            totalReviews: driver.totalReviews,
            safetyScore: driver.safetyScore,
            totalTripsCompleted: driver.totalTripsCompleted,
          }),
        } satisfies PublicDriverProfileView,
      };
    }),

  /**
   * Operator lists all marketplace-available verified drivers.
   * Excludes drivers already exclusively affiliated with the requesting company.
   * Salary field never returned.
   */
  listMarketplaceDrivers: operatorCompanyProcedure
    .input(listMarketplaceDriversSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:read");

      const {
        licenseCategory,
        preferredType,
        cityBase,
        minRating,
        minSafetyScore,
        page,
        limit,
      } = input;
      const skip = (page - 1) * limit;

      const whereClause: any = {
        verificationStatus: "VERIFIED",
        servicePreference: {
          isAvailableForHire: true,
          isSuspended: false,
          // Exclude drivers explicitly passing preferredType filters
          ...(preferredType ? { preferredType } : {}),
          ...(cityBase
            ? { cityBase: { contains: cityBase, mode: "insensitive" } }
            : {}),
        },
        // Exclude drivers already exclusively affiliated with this operator
        NOT: {
          companyAffiliations: {
            some: {
              companyId: ctx.companyId,
              isActive: true,
              employmentType: "EXCLUSIVE_INTERCITY",
            },
          },
        },
        ...(licenseCategory ? { licenseCategory } : {}),
        ...(minRating ? { averageRating: { gte: minRating } } : {}),
        ...(minSafetyScore ? { safetyScore: { gte: minSafetyScore } } : {}),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.driverProfile.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: [
            // Featured drivers first, then by rating
            { servicePreference: { isFeatured: "desc" } },
            { averageRating: "desc" },
            { totalTripsCompleted: "desc" },
          ],
          select: {
            id: true,
            licenseCategory: true,
            yearsOfExperience: true,
            averageRating: true,
            totalReviews: true,
            totalTripsCompleted: true,
            totalDistanceKm: true,
            safetyScore: true,
            verifiedAt: true,
            user: {
              select: {
                fullName: true,
                phoneNumber: true,
                image: true,
              },
            },
            servicePreference: {
              select: {
                isAvailableForHire: true,
                preferredType: true,
                cityBase: true,
                routeExperience: true,
                isFeatured: true,
                // minMonthlyRateCFA intentionally excluded
              },
            },
            // P3-1 — own-roster detection so the card can disable Send Offer.
            companyAffiliations: {
              where: { companyId: ctx.companyId, isActive: true },
              select: { id: true },
            },
            _count: {
              select: { companyAffiliations: true },
            },
          },
        }),
        ctx.prisma.driverProfile.count({ where: whereClause }),
      ]);

      return {
        drivers: items.map((d: any) => ({
          ...d,
          // P3-1 — the raw affiliation rows never leave the server.
          isOnMyRoster: (d.companyAffiliations as unknown[]).length > 0,
          companyAffiliations: undefined,
          trustBadges: computeTrustBadges({
            averageRating: d.averageRating,
            totalReviews: d.totalReviews,
            safetyScore: d.safetyScore,
            totalTripsCompleted: d.totalTripsCompleted,
          }),
        })),
        total,
        page,
        limit,
      };
    }),

  /**
   * Operator-facing analytics for one driver: 12-month rating trend,
   * rating distribution, and recent scoring-relevant anomalies.
   * Powers the Insights charts on /dashboard/operator/drivers/[id].
   */
  getDriverAnalytics: operatorCompanyProcedure
    .input(z.object({ driverProfileId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:read");

      const driver = await ctx.prisma.driverProfile.findFirst({
        where: {
          id: input.driverProfileId,
          companyAffiliations: { some: { companyId: ctx.companyId } },
        },
        select: {
          id: true,
          averageRating: true,
          totalReviews: true,
          safetyScore: true,
          totalTripsCompleted: true,
          totalDistanceKm: true,
        },
      });
      if (!driver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver not found.",
        });
      }

      const [trendRows, distributionRows, anomalies] = await Promise.all([
        ctx.prisma.$queryRawUnsafe<
          Array<{ month: Date; avg_rating: number | null; cnt: number }>
        >(
          `SELECT date_trunc('month', rv."createdAt") AS month,
                  AVG(rv."driverRating") AS avg_rating,
                  COUNT(*)::int AS cnt
           FROM "review" rv
           WHERE rv."driverId" = $1
             AND rv."driverRating" IS NOT NULL
             AND rv."createdAt" >= NOW() - INTERVAL '12 months'
           GROUP BY 1
           ORDER BY 1`,
          input.driverProfileId,
        ),
        ctx.prisma.$queryRawUnsafe<Array<{ rating: number; cnt: number }>>(
          `SELECT rv."driverRating" AS rating, COUNT(*)::int AS cnt
           FROM "review" rv
           WHERE rv."driverId" = $1 AND rv."driverRating" IS NOT NULL
           GROUP BY 1 ORDER BY 1`,
          input.driverProfileId,
        ),
        ctx.prisma.driverLocationPing.findMany({
          where: {
            driverProfileId: input.driverProfileId,
            isAnomaly: true,
            anomalyReason: { in: ["OVERSPEED", "HARSH_BRAKING"] },
          },
          orderBy: { recordedAt: "desc" },
          take: 20,
          select: { anomalyReason: true, speedKmh: true, recordedAt: true },
        }),
      ]);

      const overspeedCount = anomalies.filter(
        (a: any) => a.anomalyReason === "OVERSPEED",
      ).length;
      const brakingCount = anomalies.length - overspeedCount;

      return {
        summary: {
          averageRating: driver.averageRating,
          totalReviews: driver.totalReviews,
          safetyScore: driver.safetyScore,
          totalTripsCompleted: driver.totalTripsCompleted,
          totalDistanceKm: driver.totalDistanceKm,
          recentOverspeed: overspeedCount,
          recentHarshBraking: brakingCount,
        },
        ratingTrend: trendRows.map((r: any) => ({
          month: new Date(r.month).toISOString().slice(0, 7),
          averageRating: Number(r.avg_rating ?? 0),
          reviews: Number(r.cnt ?? 0),
        })),
        distribution: [1, 2, 3, 4, 5].map((star) => ({
          star,
          count:
            distributionRows.find((d: any) => Number(d.rating) === star)?.cnt ??
            0,
        })),
        recentAnomalies: anomalies.map((a: any) => ({
          reason: a.anomalyReason,
          speedKmh: a.speedKmh,
          recordedAt: a.recordedAt,
        })),
      };
    }),

  // ============================================================================
  // PHASE 11 — EMPLOYMENT OFFER BOARD PROCEDURES
  // ============================================================================

  /**
   * Operator sends a structured employment offer to a marketplace driver.
   * Guards (serializable transaction): VERIFIED driver, isAvailableForHire,
   * no active affiliation with sender, anti-spam caps, one-active-offer-per-pair
   * (DB partial unique index is the backstop).
   */
  sendEmploymentOffer: operatorCompanyProcedure
    .input(sendEmploymentOfferSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:create");

      const startDate = parseOfferDate(input.proposedStartDate);
      if (startDate && startDate.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date cannot be in the past.",
        });
      }

      const expiresAt = addDays(new Date(), OFFER_EXPIRY_DAYS);

      try {
        const offer = await ctx.prisma.$transaction(async (tx: any) => {
          const driver = await tx.driverProfile.findUnique({
            where: { id: input.driverProfileId },
            include: {
              servicePreference: true,
              user: { select: { id: true, fullName: true, email: true } },
            },
          });
          if (!driver || driver.verificationStatus !== "VERIFIED") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Driver not found or not verified.",
            });
          }

          const pref = driver.servicePreference;
          if (!pref?.isAvailableForHire || pref.isSuspended) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "This driver is not currently available for hire.",
            });
          }

          const existingAffiliation =
            await tx.driverCompanyAffiliation.findUnique({
              where: {
                driverProfileId_companyId: {
                  driverProfileId: driver.id,
                  companyId: ctx.companyId,
                },
              },
            });
          if (existingAffiliation?.isActive) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "This driver is already on your roster.",
            });
          }

          const [sentActive, receivedActive] = await Promise.all([
            tx.driverEmploymentOffer.count({
              where: {
                companyId: ctx.companyId,
                status: { in: ["PENDING", "COUNTERED"] },
              },
            }),
            tx.driverEmploymentOffer.count({
              where: {
                driverProfileId: driver.id,
                status: { in: ["PENDING", "COUNTERED"] },
              },
            }),
          ]);
          if (sentActive >= MAX_ACTIVE_SENT_OFFERS_PER_COMPANY) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `You have reached the limit of ${MAX_ACTIVE_SENT_OFFERS_PER_COMPANY} active offers.`,
            });
          }
          if (receivedActive >= MAX_ACTIVE_RECEIVED_OFFERS_PER_DRIVER) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "This driver already has too many pending offers. Try again later.",
            });
          }

          const created = await tx.driverEmploymentOffer.create({
            data: {
              companyId: ctx.companyId,
              driverProfileId: driver.id,
              employmentType: input.employmentType,
              initialSalaryCFA: input.proposedSalaryCFA,
              initialStartDate: startDate,
              initialNote: input.note ?? null,
              currentSalaryCFA: input.proposedSalaryCFA,
              currentStartDate: startDate,
              currentNote: input.note ?? null,
              status: "PENDING",
              expiresAt,
              createdById: ctx.user.id,
            },
          });

          await tx.driverOfferEvent.create({
            data: {
              offerId: created.id,
              eventType: "SENT",
              actorType: "COMPANY",
              actorUserId: ctx.user.id,
              salaryCFA: input.proposedSalaryCFA,
              startDate,
              note: input.note ?? null,
            },
          });

          await enqueueDriverOfferReceived(tx as never, {
            offerId: created.id,
            to: {
              subscriberId: driver.userId,
              ...(driver.user.email ? { email: driver.user.email } : {}),
              ...(driver.user.fullName
                ? { firstName: driver.user.fullName.split(" ")[0] }
                : {}),
            },
            terms: {
              companyName:
                (
                  await tx.company.findUnique({
                    where: { id: ctx.companyId },
                    select: { name: true },
                  })
                )?.name ?? "Un opérateur",
              driverName: driver.user.fullName ?? "",
              employmentType: input.employmentType,
              salaryCFA: input.proposedSalaryCFA,
              startDate: input.proposedStartDate ?? null,
            },
            expiresAt,
            note: input.note ?? null,
          });

          return created;
        });

        return { success: true, offer };
      } catch (err: unknown) {
        if (err instanceof TRPCError && err.code === "BAD_REQUEST") {
          throw err;
        }
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          String((err as { code: unknown }).code) === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "An active offer already exists between your company and this driver.",
          });
        }
        throw err;
      }
    }),

  /** Driver lists their own offers (pending inbox + history) with negotiation timeline. */
  getMyOffers: driverProcedure
    .input(listMyOffersSchema)
    .query(async ({ ctx, input }) => {
      // Phase 14/20 (F-DV-13) — lazy expiry routed through expireOfferIfDue:
      // audit event + both-side outbox notices fire exactly like the cron,
      // instead of a silent status flip that mutes the offer forever.
      await ctx.prisma.$transaction(async (tx) => {
        const due = await tx.driverEmploymentOffer.findMany({
          where: {
            driverProfileId: ctx.driver.id,
            status: { in: ["PENDING", "COUNTERED"] },
            expiresAt: { lt: new Date() },
          },
          include: {
            company: { select: { name: true } },
            driverProfile: {
              include: {
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        });
        for (const offer of due) {
          await expireOfferIfDue(tx as never, offer as never);
        }
      });

      const statusWhere =
        input.status === "ACTIVE"
          ? ["PENDING", "COUNTERED"]
          : input.status
            ? [input.status]
            : undefined;

      const whereClause: Record<string, unknown> = {
        driverProfileId: ctx.driver.id,
        ...(statusWhere ? { status: { in: statusWhere } } : {}),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.driverEmploymentOffer.findMany({
          where: whereClause,
          orderBy: { updatedAt: "desc" as const },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            company: {
              select: { id: true, name: true, slug: true, logoUrl: true },
            },
            events: {
              orderBy: { createdAt: "desc" as const },
              take: 20,
            },
          },
        }),
        ctx.prisma.driverEmploymentOffer.count({ where: whereClause }),
      ]);

      const now = Date.now();
      return {
        items: items.map((o: any) => ({
          ...o,
          isExpiredDue: o.expiresAt.getTime() < now,
        })),
        total,
        page: input.page,
        limit: input.limit,
      };
    }),

  /** Marks all never-viewed live offers as seen (firstViewedAt + VIEWED audit rows). */
  markMyOffersSeen: driverProcedure
    .input(markMyOffersSeenSchema)
    .mutation(async ({ ctx }) => {
      const unseen = await ctx.prisma.driverEmploymentOffer.findMany({
        where: {
          driverProfileId: ctx.driver.id,
          status: { in: ["PENDING", "COUNTERED"] },
          firstViewedAt: null,
        },
        select: { id: true },
      });

      if (unseen.length > 0) {
        await ctx.prisma.$transaction(
          unseen.map((o: { id: string }) =>
            ctx.prisma.driverEmploymentOffer.update({
              where: { id: o.id },
              data: { firstViewedAt: new Date() },
            }),
          ),
        );
        await ctx.prisma.driverOfferEvent.createMany({
          data: unseen.map((o: { id: string }) => ({
            offerId: o.id,
            eventType: "VIEWED",
            actorType: "DRIVER",
            actorUserId: ctx.driver.userId,
          })),
        });
      }

      return { markedSeen: unseen.length };
    }),

  // ============================================================================
  // PHASE 12 — DISPATCH BOARD SUPPORT
  // ============================================================================

  /**
   * Operator lists company-affiliated VERIFIED drivers eligible for a trip,
   * enriched server-side with license match, cross-company conflict info,
   * and current roles on the trip. UI stays dumb; logic lives here.
   */
  listAssignableDrivers: operatorCompanyProcedure
    .input(listAssignableDriversSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:read");

      const trip = await ctx.prisma.trip.findFirst({
        where: { id: input.tripId, companyId: ctx.companyId, archivedAt: null },
        select: {
          id: true,
          departureDate: true,
          estimatedArrival: true,
          serviceType: true,
          driverId: true,
          reliefDriverId: true,
          bus: {
            select: { busType: { select: { requiredLicenseCategory: true } } },
          },
        },
      });
      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found." });
      }

      const requiredLicense =
        (trip as any).bus?.busType?.requiredLicenseCategory ?? null;

      const [drivers, currentAssignments] = await Promise.all([
        ctx.prisma.driverProfile.findMany({
          where: {
            companyAffiliations: {
              some: { companyId: ctx.companyId, isActive: true },
            },
            verificationStatus: "VERIFIED",
          },
          select: {
            id: true,
            licenseCategory: true,
            // Phase 14 ride-along fix — was missing from this select, so the
            // licence-expiry half of licenseOk silently passed everyone.
            licenseExpiryDate: true,
            yearsOfExperience: true,
            averageRating: true,
            safetyScore: true,
            status: true,
            // Phase 3 (3.1) — employmentType from the active affiliation for
            // mode-compatibility signal in the dispatch combobox.
            companyAffiliations: {
              where: { companyId: ctx.companyId, isActive: true },
              select: { employmentType: true },
              take: 1,
            },
            user: {
              select: {
                id: true,
                fullName: true,
                image: true,
                phoneNumber: true,
              },
            },
          },
          orderBy: [{ status: "asc" }, { averageRating: "desc" }],
        }),
        ctx.prisma.tripDriverAssignment.findMany({
          where: { tripId: trip.id },
          select: { driverProfileId: true, role: true },
        }),
      ]);

      const rolesByDriver = new Map<string, string[]>();
      for (const a of currentAssignments) {
        rolesByDriver.set(a.driverProfileId, [
          ...(rolesByDriver.get(a.driverProfileId) ?? []),
          a.role,
        ]);
      }

      // Phase 27 (F-OP-14) — batch conflict scan: ONE query fetches every
      // candidate assignment for the whole roster inside the same ±16 h
      // window the single-driver path uses; overlaps are computed in-process
      // through the SHARED pure core (findTripConflict), so buffer math and
      // conflict selection can never diverge between the two paths.
      const targetInterval = driverInterval(
        trip.departureDate,
        trip.estimatedArrival,
        trip.serviceType,
        null,
      );
      const rosterIds = drivers.map((d: any) => d.id);
      const busyAssignments =
        rosterIds.length > 0
          ? await ctx.prisma.tripDriverAssignment.findMany({
              where: {
                driverProfileId: { in: rosterIds },
                tripId: { not: trip.id },
                trip: {
                  status: {
                    in: ["SCHEDULED", "BOARDING", "DEPARTED", "DELAYED"],
                  },
                  archivedAt: null,
                  departureDate: {
                    gte: new Date(targetInterval.startMs - 16 * 60 * 60 * 1000),
                    lte: new Date(targetInterval.endMs + 16 * 60 * 60 * 1000),
                  },
                },
              },
              orderBy: [{ trip: { departureDate: "asc" } }, { id: "asc" }],
              select: {
                driverProfileId: true,
                trip: {
                  select: {
                    id: true,
                    departureDate: true,
                    estimatedArrival: true,
                    serviceType: true,
                    company: { select: { name: true } },
                    schedule: {
                      select: {
                        route: {
                          select: {
                            name: true,
                            distanceKm: true,
                            originTerminal: {
                              select: {
                                cityRelation: { select: { name: true } },
                              },
                            },
                            destTerminal: {
                              select: {
                                cityRelation: { select: { name: true } },
                              },
                            },
                          },
                        },
                      },
                    },
                    bus: { select: { registrationPlate: true } },
                  },
                },
              },
            })
          : [];

      const conflictsByDriver = new Map<string, TripConflictCandidate[]>();
      for (const row of busyAssignments as Array<any>) {
        const list = conflictsByDriver.get(row.driverProfileId) ?? [];
        list.push({
          tripId: row.trip.id,
          departureDate: row.trip.departureDate,
          estimatedArrival: row.trip.estimatedArrival,
          serviceType: row.trip.serviceType,
          routeDistanceKm: row.trip.schedule?.route?.distanceKm ?? null,
          originCity:
            row.trip.schedule?.route?.originTerminal?.cityRelation?.name ??
            null,
          destCity:
            row.trip.schedule?.route?.destTerminal?.cityRelation?.name ?? null,
          routeName: row.trip.schedule?.route?.name ?? null,
          plate: row.trip.bus?.registrationPlate ?? null,
          companyName: row.trip.company?.name ?? null,
        });
        conflictsByDriver.set(row.driverProfileId, list);
      }

      // Phase 3 (3.1) — mode compatibility: INTERCITY trips need
      // EXCLUSIVE_INTERCITY or HYBRID drivers; URBAN trips need
      // CONTRACTOR_URBAN or HYBRID. CONTRACTOR_URBAN on INTERCITY is a hard
      // mismatch; EXCLUSIVE_INTERCITY on URBAN is a soft mismatch (warn).
      function isModeCompatible(
        employmentType: string | undefined,
        serviceType: string,
      ): boolean {
        if (!employmentType || employmentType === "HYBRID") return true;
        if (serviceType === "INTERCITY")
          return employmentType === "EXCLUSIVE_INTERCITY";
        return employmentType === "CONTRACTOR_URBAN";
      }

      const items = await Promise.all(
        drivers.map(async (d: any) => {
          const conflict = findTripConflict(
            targetInterval,
            conflictsByDriver.get(d.id) ?? [],
          );
          // Phase 3 (3.1) — extract employmentType from the nested affiliation
          const employmentType =
            d.companyAffiliations?.[0]?.employmentType ?? undefined;
          return {
            driverProfileId: d.id,
            fullName: d.user.fullName,
            image: d.user.image,
            phoneNumber: d.user.phoneNumber,
            licenseCategory: d.licenseCategory,
            yearsOfExperience: d.yearsOfExperience,
            averageRating: d.averageRating,
            safetyScore: d.safetyScore,
            liveStatus: d.status,
            requiredLicense,
            employmentType,
            // Phase 3 (3.1) — soft signal: greys out mismatched candidates
            modeOk: isModeCompatible(employmentType, trip.serviceType),
            // Phase 14 (F-OP-03) — class fit AND licence valid through the run.
            licenseOk:
              licenseMeetsRequirement(d.licenseCategory, requiredLicense) &&
              isLicenseUsableThrough(
                d.licenseExpiryDate,
                trip.estimatedArrival ?? trip.departureDate,
              ),
            conflict,
            rolesOnTrip: rolesByDriver.get(d.id) ?? [],
          };
        }),
      );

      return {
        items: items.sort((a: any, b: any) => {
          // Eligible & licensed & mode-matched first; then by rating
          const aOk =
            a.licenseOk &&
            a.modeOk &&
            !a.conflict &&
            a.rolesOnTrip.length === 0;
          const bOk =
            b.licenseOk &&
            b.modeOk &&
            !b.conflict &&
            b.rolesOnTrip.length === 0;
          if (aOk !== bOk) return aOk ? -1 : 1;
          return b.averageRating - a.averageRating;
        }),
        total: items.length,
      };
    }),

  /**
   * Driver checks for urgent dispatches (departure < 2h) — powers the
   * full-screen UrgentDispatchModal. Returns unacknowledged imminent runs.
   */
  getMyUrgentDispatches: driverProcedure.query(async ({ ctx }) => {
    const now = Date.now();
    const graceStart = new Date(now - 15 * 60 * 1000); // just-departed grace
    const windowEnd = new Date(
      now + URGENT_DISPATCH_WINDOW_HOURS * 60 * 60 * 1000,
    );

    const assignments = await ctx.prisma.tripDriverAssignment.findMany({
      where: {
        driverProfileId: ctx.driver.id,
        role: { in: ["PRIMARY", "RELIEF"] },
        // Phase 31 (F-DV-14) — server-side acks: acknowledged dispatches
        // never re-fire, on any device, after any reinstall.
        //
        // ACK-RESET RULING (recorded, not accidental):
        //  • Delay pushing departure OUTSIDE the +2 h window → the row drops
        //    from this feed regardless of ack; window semantics already
        //    re-expose it if a later change brings it back inside.
        //  • Replacement/unassign → different or dead assignment row → fresh
        //    null ack by construction (grain is per driver×trip×role).
        //  • Delay keeping departure INSIDE the window after an ack → the
        //    modal INTENTIONALLY stays silent. Delays reach the driver via
        //    the trips surface (DELAYED status, 30 s poll) and Phase 17's
        //    reportTripDelay fan-out — the modal is a heads-up gate, not the
        //    delay channel. Accepted design; do NOT add silent reset logic.
        urgentDispatchAckAt: null,
        // Phase 14 (F-OP-03) — a run whose licence lapses before arrival is
        // not dispatchable; filter it out of the urgent feed entirely.
        trip: {
          status: { in: ["SCHEDULED", "DELAYED", "BOARDING"] },
          archivedAt: null,
          departureDate: { gte: graceStart, lte: windowEnd },
        },
      },
      take: 5,
      // Phase 27 (F-OP-14) — deterministic feed order: soonest departure
      // first, id as the total tiebreaker.
      orderBy: [{ trip: { departureDate: "asc" } }, { id: "asc" }],
      include: {
        driverProfile: { select: { licenseExpiryDate: true } },
        trip: {
          select: {
            id: true,
            departureDate: true,
            estimatedArrival: true,
            totalSeats: true,
            bus: { select: { registrationPlate: true } },
            company: { select: { name: true } },
            _count: {
              select: { bookings: { where: { status: "CONFIRMED" } } },
            },
            tripStops: {
              orderBy: { stopOrder: "asc" as const },
              select: {
                terminal: {
                  select: {
                    name: true,
                    cityRelation: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Phase 14 (F-OP-03) — drop runs this driver cannot legally complete.
    const dispatchable = assignments.filter((a: any) =>
      isLicenseUsableThrough(
        a.driverProfile?.licenseExpiryDate,
        a.trip.estimatedArrival
          ? new Date(a.trip.estimatedArrival)
          : new Date(a.trip.departureDate),
      ),
    );

    return {
      items: dispatchable.map((a: any) => {
        const stops = a.trip.tripStops ?? [];
        const origin = stops[0]?.terminal;
        const dest = stops[stops.length - 1]?.terminal;
        return {
          assignmentRole: a.role,
          dispatch: {
            tripId: a.trip.id,
            carrierName: a.trip.company?.name ?? "",
            busPlate: a.trip.bus?.registrationPlate ?? "",
            originName: origin?.cityRelation?.name ?? origin?.name ?? "Départ",
            destinationName:
              dest?.cityRelation?.name ?? dest?.name ?? "Arrivée",
            // Phase 31 (F-DV-14) — ISO timestamp; the client formats with the
            // device locale (the old pre-formatted fr-FR string was unparseable
            // for countdowns and wrong under an English UI).
            departureTimeIso: new Date(a.trip.departureDate).toISOString(),
            bookedPassengers: a.trip._count.bookings,
            totalSeats: a.trip.totalSeats,
          },
        };
      }),
    };
  }),

  /**
   * Phase 31 (F-DV-14) — persists an urgent-dispatch acknowledgement on the
   * assignment row (which IS the driver×trip grain). Survives reinstalls,
   * re-logins, and additional devices — AsyncStorage acks did none of these.
   */
  acknowledgeUrgentDispatch: driverProcedure
    .input(driverAcknowledgeUrgentDispatchSchema)
    .mutation(async ({ ctx, input }) => {
      const assignment = await ctx.prisma.tripDriverAssignment.findFirst({
        where: {
          driverProfileId: ctx.driver.id,
          tripId: input.tripId,
        },
        select: { id: true },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not assigned to this trip.",
        });
      }

      await ctx.prisma.tripDriverAssignment.update({
        where: { id: assignment.id },
        data: { urgentDispatchAckAt: new Date() },
      });

      return { success: true };
    }),

  /** Driver accepts / declines / counters an offer addressed to them. */
  respondToOffer: driverProcedure
    .input(respondToOfferSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.$transaction(async (tx: any) => {
        const offer = await tx.driverEmploymentOffer.findUnique({
          where: { id: input.offerId },
          include: {
            company: { select: { id: true, name: true, logoUrl: true } },
            driverProfile: {
              include: {
                user: { select: { id: true, fullName: true, email: true } },
                companyAffiliations: {
                  where: { isActive: true },
                  include: { company: { select: { id: true, name: true } } },
                },
              },
            },
          },
        });

        if (!offer || offer.driverProfileId !== ctx.driver.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Offer not found.",
          });
        }

        const expired = await expireOfferIfDue(tx, offer);
        if (
          expired ||
          (offer.status !== "PENDING" && offer.status !== "COUNTERED")
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This offer is no longer actionable.",
          });
        }

        const driverCtx = {
          id: ctx.driver.id,
          userId: ctx.driver.userId,
          user: offer.driverProfile.user,
        };
        const now = new Date();

        if (input.action === "ACCEPT") {
          // Consent gate for exclusive-conflict switch (server-enforced)
          if (offer.employmentType === "EXCLUSIVE_INTERCITY") {
            const conflicts = offer.driverProfile.companyAffiliations.filter(
              (a: any) =>
                a.isActive &&
                a.employmentType === "EXCLUSIVE_INTERCITY" &&
                a.companyId !== offer.companyId,
            );
            if (conflicts.length > 0 && !input.confirmExclusiveSwitch) {
              throw new TRPCError({
                code: "CONFLICT",
                // Client parses: EXCLUSIVE_CONFLICT_REQUIRED::<names joined by |>
                message: `EXCLUSIVE_CONFLICT_REQUIRED::${conflicts
                  .map((c: any) => c.company?.name ?? "Unknown")
                  .join("|")}`,
              });
            }
          }

          await resolveAcceptance(tx, offer, driverCtx);
          return { ok: true, status: "ACCEPTED" as const };
        }

        if (input.action === "DECLINE") {
          await tx.driverEmploymentOffer.update({
            where: { id: offer.id },
            data: { status: "DECLINED", respondedAt: now, resolvedAt: now },
          });
          await tx.driverOfferEvent.create({
            data: {
              offerId: offer.id,
              eventType: "DECLINED",
              actorType: "DRIVER",
              actorUserId: ctx.driver.userId,
              note: input.note ?? null,
              salaryCFA: offer.currentSalaryCFA,
            },
          });

          for (const to of await companyOperatorRecipients(
            tx,
            offer.companyId,
          )) {
            await enqueueOperatorOfferDeclined(tx as never, {
              offerId: offer.id,
              to,
              driverName: offer.driverProfile.user.fullName ?? "Un chauffeur",
              note: input.note ?? null,
            });
          }
          return { ok: true, status: "DECLINED" as const };
        }

        // COUNTER — updates effective terms, refreshes the rolling 7-day window
        // Phase 3 (3.4) — cap negotiation rounds to prevent infinite haggling.
        const counterEventCount = await tx.driverOfferEvent.count({
          where: {
            offerId: offer.id,
            eventType: { in: ["COUNTERED_BY_DRIVER", "COUNTERED_BY_OPERATOR"] },
          },
        });
        if (counterEventCount >= MAX_COUNTER_ROUNDS) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Maximum negotiation rounds (${MAX_COUNTER_ROUNDS}) reached. Accept, decline, or withdraw.`,
          });
        }

        if (!input.counterSalaryCFA) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "counterSalaryCFA is required.",
          });
        }
        const counterDate = parseOfferDate(input.counterStartDate);
        const updated = await tx.driverEmploymentOffer.update({
          where: { id: offer.id },
          data: {
            status: "COUNTERED",
            currentSalaryCFA: input.counterSalaryCFA,
            currentStartDate: counterDate,
            currentNote: input.note ?? null,
            respondedAt: now,
            expiresAt: addDays(now, OFFER_EXPIRY_DAYS),
          },
        });
        await tx.driverOfferEvent.create({
          data: {
            offerId: offer.id,
            eventType: "COUNTERED_BY_DRIVER",
            actorType: "DRIVER",
            actorUserId: ctx.driver.userId,
            salaryCFA: input.counterSalaryCFA,
            startDate: counterDate,
            note: input.note ?? null,
          },
        });

        for (const to of await companyOperatorRecipients(tx, offer.companyId)) {
          await enqueueOperatorOfferCountered(tx as never, {
            offerId: offer.id,
            to,
            driverName: offer.driverProfile.user.fullName ?? "Un chauffeur",
            counterSalaryCFA: input.counterSalaryCFA,
            counterStartDate: input.counterStartDate ?? null,
            note: input.note ?? null,
          });
        }
        return { ok: true, status: updated.status };
      });

      return result;
    }),

  /** Operator views offers they have sent (with Seen chips + counter review data). */
  listSentOffers: operatorCompanyProcedure
    .input(listSentOffersSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:read");

      // Phase 14/20 (F-DV-13) — operator-side sweep routed through
      // expireOfferIfDue as well (audit event + both-side notices).
      await ctx.prisma.$transaction(async (tx) => {
        const due = await tx.driverEmploymentOffer.findMany({
          where: {
            companyId: ctx.companyId,
            status: { in: ["PENDING", "COUNTERED"] },
            expiresAt: { lt: new Date() },
          },
          include: {
            company: { select: { name: true } },
            driverProfile: {
              include: {
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        });
        for (const offer of due) {
          await expireOfferIfDue(tx as never, offer as never);
        }
      });

      const statusWhere =
        input.status === "ACTIVE"
          ? ["PENDING", "COUNTERED"]
          : input.status
            ? [input.status]
            : undefined;

      const whereClause: Record<string, unknown> = {
        companyId: ctx.companyId,
        ...(statusWhere ? { status: { in: statusWhere } } : {}),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.driverEmploymentOffer.findMany({
          where: whereClause,
          orderBy: { updatedAt: "desc" as const },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            driverProfile: {
              select: {
                id: true,
                licenseCategory: true,
                yearsOfExperience: true,
                averageRating: true,
                safetyScore: true,
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    image: true,
                    phoneNumber: true,
                  },
                },
              },
            },
            events: {
              orderBy: { createdAt: "desc" as const },
              take: 5,
            },
          },
        }),
        ctx.prisma.driverEmploymentOffer.count({ where: whereClause }),
      ]);

      const now = Date.now();
      return {
        items: items.map((o: any) => ({
          ...o,
          hasBeenSeen: !!o.firstViewedAt,
          isExpiredDue: o.expiresAt.getTime() < now,
        })),
        total,
        page: input.page,
        limit: input.limit,
      };
    }),

  /** Operator resolves a COUNTERED offer: accept it, decline it, or counter back. */
  respondToCounterOffer: operatorCompanyProcedure
    .input(respondToCounterOfferSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:update");

      const result = await ctx.prisma.$transaction(async (tx: any) => {
        const offer = await tx.driverEmploymentOffer.findUnique({
          where: { id: input.offerId },
          include: {
            company: { select: { id: true, name: true } },
            driverProfile: {
              include: {
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        });

        if (!offer || offer.companyId !== ctx.companyId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Offer not found.",
          });
        }

        const expired = await expireOfferIfDue(tx, offer);
        if (expired || offer.status !== "COUNTERED") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This counter-offer is no longer actionable.",
          });
        }

        const driverCtx = {
          id: offer.driverProfileId,
          userId: offer.driverProfile.userId,
          user: offer.driverProfile.user,
        };
        const now = new Date();

        if (input.action === "ACCEPT_COUNTER") {
          // Platform rule enforcement (auto-terminate conflicting exclusives + notify)
          await resolveAcceptance(tx, offer, driverCtx);

          // Tell the driver their counter won
          await enqueueDriverCounterResolved(tx as never, {
            offerId: offer.id,
            outcome: "ACCEPTED",
            to: {
              subscriberId: driverCtx.userId,
              ...(driverCtx.user.email ? { email: driverCtx.user.email } : {}),
              ...(driverCtx.user.fullName
                ? { firstName: driverCtx.user.fullName.split(" ")[0] }
                : {}),
            },
            companyName: offer.company.name,
            salaryCFA: offer.currentSalaryCFA,
            startDate:
              offer.currentStartDate?.toISOString().slice(0, 10) ?? null,
            note: input.note ?? null,
          });
          return { ok: true, status: "ACCEPTED" as const };
        }

        if (input.action === "DECLINE_COUNTER") {
          await tx.driverEmploymentOffer.update({
            where: { id: offer.id },
            data: { status: "DECLINED", respondedAt: now, resolvedAt: now },
          });
          await tx.driverOfferEvent.create({
            data: {
              offerId: offer.id,
              eventType: "DECLINED",
              actorType: "COMPANY",
              actorUserId: ctx.user.id,
              note: input.note ?? null,
              salaryCFA: offer.currentSalaryCFA,
            },
          });

          await enqueueDriverCounterResolved(tx as never, {
            offerId: offer.id,
            outcome: "DECLINED",
            to: {
              subscriberId: driverCtx.userId,
              ...(driverCtx.user.email ? { email: driverCtx.user.email } : {}),
              ...(driverCtx.user.fullName
                ? { firstName: driverCtx.user.fullName.split(" ")[0] }
                : {}),
            },
            companyName: offer.company.name,
            note: input.note ?? null,
          });
          return { ok: true, status: "DECLINED" as const };
        }

        // COUNTER_BACK
        // Phase 3 (3.4) — cap negotiation rounds (same guard as driver side).
        const opCounterEventCount = await tx.driverOfferEvent.count({
          where: {
            offerId: offer.id,
            eventType: { in: ["COUNTERED_BY_DRIVER", "COUNTERED_BY_OPERATOR"] },
          },
        });
        if (opCounterEventCount >= MAX_COUNTER_ROUNDS) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Maximum negotiation rounds (${MAX_COUNTER_ROUNDS}) reached. Accept, decline, or withdraw.`,
          });
        }

        if (!input.newSalaryCFA) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "newSalaryCFA is required.",
          });
        }
        const newDate = parseOfferDate(input.newStartDate);
        await tx.driverEmploymentOffer.update({
          where: { id: offer.id },
          data: {
            currentSalaryCFA: input.newSalaryCFA,
            currentStartDate: newDate,
            currentNote: input.note ?? null,
            respondedAt: now,
            expiresAt: addDays(now, OFFER_EXPIRY_DAYS),
          },
        });
        await tx.driverOfferEvent.create({
          data: {
            offerId: offer.id,
            eventType: "COUNTERED_BY_OPERATOR",
            actorType: "COMPANY",
            actorUserId: ctx.user.id,
            salaryCFA: input.newSalaryCFA,
            startDate: newDate,
            note: input.note ?? null,
          },
        });

        await enqueueDriverCounterResolved(tx as never, {
          offerId: offer.id,
          outcome: "COUNTERED",
          to: {
            subscriberId: driverCtx.userId,
            ...(driverCtx.user.email ? { email: driverCtx.user.email } : {}),
            ...(driverCtx.user.fullName
              ? { firstName: driverCtx.user.fullName.split(" ")[0] }
              : {}),
          },
          companyName: offer.company.name,
          salaryCFA: input.newSalaryCFA,
          startDate: input.newStartDate ?? null,
          note: input.note ?? null,
        });
        return { ok: true, status: "COUNTERED" as const };
      });

      return result;
    }),

  /** Operator cancels one of their own live offers. */
  withdrawOffer: operatorCompanyProcedure
    .input(withdrawOfferSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:create");

      await ctx.prisma.$transaction(async (tx: any) => {
        const offer = await tx.driverEmploymentOffer.findUnique({
          where: { id: input.offerId },
          include: {
            company: { select: { name: true } },
            driverProfile: {
              include: {
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        });
        if (!offer || offer.companyId !== ctx.companyId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Offer not found.",
          });
        }
        if (offer.status !== "PENDING" && offer.status !== "COUNTERED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only pending or countered offers can be withdrawn.",
          });
        }

        const now = new Date();
        // Phase 3 (3.4) — WITHDRAWN is operator-initiated, not a response.
        // Only resolvedAt is set; respondedAt stays as-is (null or last response).
        await tx.driverEmploymentOffer.update({
          where: { id: offer.id },
          data: { status: "WITHDRAWN", resolvedAt: now },
        });
        await tx.driverOfferEvent.create({
          data: {
            offerId: offer.id,
            eventType: "WITHDRAWN",
            actorType: "COMPANY",
            actorUserId: ctx.user.id,
            salaryCFA: offer.currentSalaryCFA,
          },
        });

        const dUser = offer.driverProfile.user;
        await enqueueDriverOfferWithdrawn(tx as never, {
          offerId: offer.id,
          to: {
            subscriberId: offer.driverProfile.userId,
            ...(dUser.email ? { email: dUser.email } : {}),
            ...(dUser.fullName
              ? { firstName: dUser.fullName.split(" ")[0] }
              : {}),
          },
          companyName: offer.company.name,
        });
      });

      return { success: true };
    }),
});
