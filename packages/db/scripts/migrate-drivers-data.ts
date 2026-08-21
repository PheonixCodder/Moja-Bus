/**
 * Moja Bus — Driver Database Migration & Backfill Script
 * 
 * Migrates and backfills existing database records to match the Driver ERP & Real-Time Telemetry subsystem:
 * 1. Backfills `DriverProfile` records for all existing `DRIVER` staff members and users.
 * 2. Creates `DriverCompanyAffiliation` records linking drivers to their respective operator companies.
 * 3. Backfills `Review` records with `tripId`, `busId`, `driverId`, and initializes 3-way ratings (`driverRating`, `busRating`, `punctualityRating`).
 * 4. Generates `TripDriverAssignment` junction records for all existing trips with assigned drivers.
 * 5. Recomputes lifetime career aggregates (`averageRating`, `totalReviews`, `totalTripsCompleted`, `totalDistanceKm`) for every driver profile.
 * 
 * Idempotent: Safe to run multiple times.
 * 
 * Usage:
 *   pnpm --filter @moja/db exec tsx scripts/migrate-drivers-data.ts
 */

import "dotenv/config";
import { getPrismaClient } from "../src";

const prisma = getPrismaClient();

async function migrateDriverProfilesAndAffiliations() {
  console.log("\n📦 Phase 1: Migrating Driver Profiles & Company Affiliations...");

  // 1. Find all operator staff members with DRIVER role
  const driverStaff = await prisma.operator.findMany({
    where: {
      role: "DRIVER",
      deletedAt: null,
    },
    include: {
      user: true,
      company: true,
    },
  });

  console.log(`Found ${driverStaff.length} staff member(s) with DRIVER role.`);

  let profilesCreated = 0;
  let affiliationsCreated = 0;

  for (const staff of driverStaff) {
    if (!staff.userId) continue;

    // Check if DriverProfile already exists for this user
    let profile = await prisma.driverProfile.findUnique({
      where: { userId: staff.userId },
    });

    if (!profile) {
      const cleanPhone = staff.user.phoneNumber?.replace(/[^0-9]/g, "") || "";
      const fallbackLicense = `CI-DRV-${cleanPhone.slice(-8) || staff.id.slice(-8).toUpperCase()}`;

      // Ensure license number is unique
      const existingWithLicense = await prisma.driverProfile.findUnique({
        where: { licenseNumber: fallbackLicense },
      });

      const uniqueLicense = existingWithLicense
        ? `${fallbackLicense}-${Math.floor(Math.random() * 1000)}`
        : fallbackLicense;

      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 3);

      profile = await prisma.driverProfile.create({
        data: {
          userId: staff.userId,
          licenseNumber: uniqueLicense,
          licenseCategory: "D",
          licenseExpiryDate: expiry,
          yearsOfExperience: 3,
          verificationStatus: staff.status === "ACTIVE" ? "VERIFIED" : "PENDING",
          verifiedAt: staff.status === "ACTIVE" ? (staff.joinedAt || new Date()) : null,
          averageRating: 5.0,
          totalReviews: 0,
          totalTripsCompleted: 0,
          totalDistanceKm: 0.0,
          safetyScore: 98,
        },
      });
      profilesCreated++;
      console.log(`  ✓ Created DriverProfile for user "${staff.user.fullName || staff.user.email}" (${profile.licenseNumber})`);
    }

    // Ensure DriverCompanyAffiliation exists
    if (staff.companyId) {
      const existingAffiliation = await prisma.driverCompanyAffiliation.findUnique({
        where: {
          driverProfileId_companyId: {
            driverProfileId: profile.id,
            companyId: staff.companyId,
          },
        },
      });

      if (!existingAffiliation) {
        await prisma.driverCompanyAffiliation.create({
          data: {
            driverProfileId: profile.id,
            companyId: staff.companyId,
            employmentType: "EXCLUSIVE_INTERCITY",
            isActive: staff.status === "ACTIVE",
            isVerified: staff.status === "ACTIVE",
            badgeNumber: `DRV-${staff.id.slice(-4).toUpperCase()}`,
            hiredAt: staff.joinedAt || new Date(),
          },
        });
        affiliationsCreated++;
        console.log(`  ✓ Created Affiliation with company "${staff.company.name}"`);
      }
    }
  }

  console.log(`Phase 1 complete: ${profilesCreated} profile(s) created, ${affiliationsCreated} affiliation(s) created.`);
}

async function backfillReviewsData() {
  console.log("\n⭐ Phase 2: Backfilling Reviews with Trip, Bus, Driver & 3-Way Ratings...");

  // Find reviews missing tripId, busId, driverId, or multi-criteria ratings
  const reviews = await prisma.review.findMany({
    where: {
      bookingId: { not: null },
    },
    include: {
      booking: {
        include: {
          trip: {
            select: {
              id: true,
              driverId: true,
              busId: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${reviews.length} total review(s) to inspect for backfilling.`);

  let updatedReviews = 0;

  for (const review of reviews) {
    const trip = review.booking?.trip;
    const needsTripId = !review.tripId && trip?.id;
    const needsBusId = !review.busId && trip?.busId;
    const needsDriverId = !review.driverId && trip?.driverId;
    const needs3WayRatings =
      review.driverRating === null ||
      review.busRating === null ||
      review.punctualityRating === null;

    if (needsTripId || needsBusId || needsDriverId || needs3WayRatings) {
      await prisma.review.update({
        where: { id: review.id },
        data: {
          tripId: review.tripId || trip?.id || null,
          busId: review.busId || trip?.busId || null,
          driverId: review.driverId || trip?.driverId || null,
          driverRating: review.driverRating ?? review.rating,
          busRating: review.busRating ?? review.rating,
          punctualityRating: review.punctualityRating ?? review.rating,
        },
      });
      updatedReviews++;
    }
  }

  console.log(`Phase 2 complete: ${updatedReviews} review(s) updated with trip, driver, bus, and 3-way ratings.`);
}

async function backfillTripDriverAssignments() {
  console.log("\n🚦 Phase 3: Backfilling Trip Driver Assignment Junctions...");

  const tripsWithDriver = await prisma.trip.findMany({
    where: {
      OR: [
        { driverId: { not: null } },
        { reliefDriverId: { not: null } },
      ],
    },
    select: {
      id: true,
      driverId: true,
      reliefDriverId: true,
      createdAt: true,
    },
  });

  console.log(`Found ${tripsWithDriver.length} trip(s) with assigned drivers.`);

  let assignmentsCreated = 0;

  for (const trip of tripsWithDriver) {
    if (trip.driverId) {
      const existing = await prisma.tripDriverAssignment.findUnique({
        where: {
          tripId_driverProfileId_role: {
            tripId: trip.id,
            driverProfileId: trip.driverId,
            role: "PRIMARY",
          },
        },
      });

      if (!existing) {
        await prisma.tripDriverAssignment.create({
          data: {
            tripId: trip.id,
            driverProfileId: trip.driverId,
            role: "PRIMARY",
            assignedAt: trip.createdAt,
          },
        });
        assignmentsCreated++;
      }
    }

    if (trip.reliefDriverId) {
      const existingRelief = await prisma.tripDriverAssignment.findUnique({
        where: {
          tripId_driverProfileId_role: {
            tripId: trip.id,
            driverProfileId: trip.reliefDriverId,
            role: "RELIEF",
          },
        },
      });

      if (!existingRelief) {
        await prisma.tripDriverAssignment.create({
          data: {
            tripId: trip.id,
            driverProfileId: trip.reliefDriverId,
            role: "RELIEF",
            assignedAt: trip.createdAt,
          },
        });
        assignmentsCreated++;
      }
    }
  }

  console.log(`Phase 3 complete: ${assignmentsCreated} trip driver assignment(s) generated.`);
}

async function recalculateDriverAggregates() {
  console.log("\n📊 Phase 4: Recalculating Lifetime Career Aggregates for All Drivers...");

  const allDrivers = await prisma.driverProfile.findMany({
    include: {
      assignedTrips: {
        where: { status: "ARRIVED" },
        select: { id: true },
      },
      reviews: {
        select: { rating: true, driverRating: true },
      },
    },
  });

  console.log(`Recomputing KPIs for ${allDrivers.length} driver profile(s)...`);

  let updatedCount = 0;

  for (const driver of allDrivers) {
    const totalTrips = driver.assignedTrips.length;
    const totalReviews = driver.reviews.length;

    let averageRating = 5.0;
    if (totalReviews > 0) {
      const sum = driver.reviews.reduce(
        (acc, r) => acc + (r.driverRating ?? r.rating),
        0
      );
      averageRating = Math.round((sum / totalReviews) * 100) / 100;
    }

    // Estimated distance based on completed trips (avg 180 km per intercity run)
    const estimatedDistance = Math.max(driver.totalDistanceKm, totalTrips * 180.0);

    await prisma.driverProfile.update({
      where: { id: driver.id },
      data: {
        totalTripsCompleted: totalTrips,
        totalReviews,
        averageRating,
        totalDistanceKm: estimatedDistance,
      },
    });

    updatedCount++;
    console.log(
      `  ✓ Driver ${driver.licenseNumber}: ${totalTrips} completed trips, ${totalReviews} reviews, ${averageRating}★ rating, ${estimatedDistance} km`
    );
  }

  console.log(`Phase 4 complete: ${updatedCount} driver profile(s) refreshed.`);
}

async function main() {
  console.log("=================================================");
  console.log("🚚 Starting Moja Bus Driver Subsystem Data Migration");
  console.log("=================================================");

  try {
    await migrateDriverProfilesAndAffiliations();
    await backfillReviewsData();
    await backfillTripDriverAssignments();
    await recalculateDriverAggregates();

    console.log("\n=================================================");
    console.log("✅ Driver Database Migration Completed Successfully!");
    console.log("=================================================\n");
  } catch (error) {
    console.error("\n❌ Migration Failed with Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
