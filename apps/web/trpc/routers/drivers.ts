import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";
import {
  requirePermission,
  operatorHasPermission,
} from "@/lib/permissions/authorize";
import {
  listDriversSchema,
  getDriverSchema,
  createDriverSchema,
  updateDriverSchema,
  verifyDriverSchema,
} from "@moja/schemas";

export const driversRouter = createTRPCRouter({
  getPermissions: operatorCompanyProcedure.query(({ ctx }) => {
    return {
      canRead: operatorHasPermission(ctx, "drivers:read"),
      canCreate: operatorHasPermission(ctx, "drivers:create"),
      canUpdate: operatorHasPermission(ctx, "drivers:update"),
      canDelete: operatorHasPermission(ctx, "drivers:delete"),
      canVerify: operatorHasPermission(ctx, "drivers:verify"),
      canAssign: operatorHasPermission(ctx, "drivers:assign"),
    };
  }),

  listDrivers: operatorCompanyProcedure
    .input(listDriversSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:read");
      const { search, status, verificationStatus, employmentType, licenseCategory, page, limit } = input;
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

      const [items, total] = await Promise.all([
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
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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

      return driver;
    }),

  createDriver: operatorCompanyProcedure
    .input(createDriverSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:create");

      // Check if user already exists by email or phone
      let user = await ctx.prisma.user.findFirst({
        where: {
          OR: [
            { email: input.email.toLowerCase() },
            { phoneNumber: input.phone },
          ],
        },
      });

      if (!user) {
        // Create user placeholder for the driver
        user = await ctx.prisma.user.create({
          data: {
            id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            fullName: input.fullName,
            email: input.email.toLowerCase(),
            phoneNumber: input.phone,
            role: "OPERATOR",
          },
        });
      }

      // Check if driver profile already exists
      let driverProfile = await ctx.prisma.driverProfile.findUnique({
        where: { userId: user.id },
      });

      if (!driverProfile) {
        // Check if license number is already used elsewhere
        const existingLicense = await ctx.prisma.driverProfile.findUnique({
          where: { licenseNumber: input.licenseNumber },
        });

        if (existingLicense) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A driver with this driving license number is already registered on the platform.",
          });
        }

        driverProfile = await ctx.prisma.driverProfile.create({
          data: {
            userId: user.id,
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

      // Create or update company affiliation
      const affiliation = await ctx.prisma.driverCompanyAffiliation.upsert({
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
          ...(input.badgeNumber !== undefined ? { badgeNumber: input.badgeNumber } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          isActive: true,
        },
      });

      // Also create an Operator staff entry if one doesn't exist
      const existingOperator = await ctx.prisma.operator.findUnique({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId: ctx.companyId,
          },
        },
      });

      if (!existingOperator) {
        await ctx.prisma.operator.create({
          data: {
            userId: user.id,
            companyId: ctx.companyId,
            role: "DRIVER",
            permissions: ["trips:read", "bookings:read", "bookings:checkin", "telemetry:stream"],
            status: "ACTIVE",
          },
        });
      }

      return {
        success: true,
        driverProfileId: driverProfile.id,
        affiliationId: affiliation.id,
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
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver is not affiliated with your company.",
        });
      }

      const updateData: any = {};
      if (input.licenseNumber) updateData.licenseNumber = input.licenseNumber;
      if (input.licenseCategory) updateData.licenseCategory = input.licenseCategory;
      if (input.licenseExpiryDate) updateData.licenseExpiryDate = input.licenseExpiryDate;
      if (input.licenseFrontUrl !== undefined) updateData.licenseFrontUrl = input.licenseFrontUrl;
      if (input.licenseBackUrl !== undefined) updateData.licenseBackUrl = input.licenseBackUrl;
      if (input.yearsOfExperience !== undefined) updateData.yearsOfExperience = input.yearsOfExperience;
      if (input.medicalClearanceDate !== undefined) updateData.medicalClearanceDate = input.medicalClearanceDate;
      if (input.medicalDocUrl !== undefined) updateData.medicalDocUrl = input.medicalDocUrl;
      if (input.status) updateData.status = input.status;

      const updated = await ctx.prisma.driverProfile.update({
        where: { id: input.id },
        data: updateData,
      });

      if (input.employmentType || input.badgeNumber !== undefined || input.notes !== undefined) {
        await ctx.prisma.driverCompanyAffiliation.update({
          where: {
            driverProfileId_companyId: {
              driverProfileId: input.id,
              companyId: ctx.companyId,
            },
          },
          data: {
            ...(input.employmentType ? { employmentType: input.employmentType } : {}),
            ...(input.badgeNumber !== undefined ? { badgeNumber: input.badgeNumber } : {}),
            ...(input.notes !== undefined ? { notes: input.notes } : {}),
          },
        });
      }

      return updated;
    }),

  verifyDriver: operatorCompanyProcedure
    .input(verifyDriverSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:verify");

      const driver = await ctx.prisma.driverProfile.update({
        where: { id: input.id },
        data: {
          verificationStatus: input.verificationStatus,
          verifiedAt: input.verificationStatus === "VERIFIED" ? new Date() : null,
          verifiedById: input.verificationStatus === "VERIFIED" ? ctx.user.id : null,
          rejectionReason: input.rejectionReason ?? null,
        },
      });

      await ctx.prisma.driverCompanyAffiliation.updateMany({
        where: {
          driverProfileId: input.id,
          companyId: ctx.companyId,
        },
        data: {
          isVerified: input.verificationStatus === "VERIFIED",
        },
      });

      return driver;
    }),

  deleteDriverAffiliation: operatorCompanyProcedure
    .input(z.object({ driverProfileId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "drivers:delete");

      await ctx.prisma.driverCompanyAffiliation.update({
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
});
