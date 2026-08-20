import "dotenv/config";
import { getPrismaClient } from "../src/index.js";

// Usage:
//   pnpm --filter @moja/db tsx scripts/purge-operator.ts <email>
//
// Example:
//   pnpm --filter @moja/db tsx scripts/purge-operator.ts operator@example.com

const targetEmail = process.argv[2]?.trim();

if (!targetEmail) {
  console.error("❌ Error: Please provide an email to purge.");
  console.error("Usage: pnpm --filter @moja/db tsx scripts/purge-operator.ts <email>");
  process.exit(1);
}

const prisma = getPrismaClient();

async function purgeOperator() {
  console.log(`🔍 Searching for user with email: ${targetEmail}...`);

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    include: {
      operators: {
        include: {
          company: true,
        },
      },
    },
  });

  if (!user) {
    console.log(`ℹ️ No user found with email "${targetEmail}". Nothing to delete.`);
    return;
  }

  const companyIds = user.operators.map((op) => op.companyId);
  console.log(`Found User ID: ${user.id} (${user.name || "No name"})`);
  console.log(`Found ${companyIds.length} associated company/operator record(s).`);

  await prisma.$transaction(async (tx) => {
    if (companyIds.length > 0) {
      console.log("🗑️  Purging company operational and financial records...");

      // 1. Delete passenger & booking records
      await tx.ticket.deleteMany({
        where: { booking: { companyId: { in: companyIds } } },
      });
      await tx.bookingPassenger.deleteMany({
        where: { booking: { companyId: { in: companyIds } } },
      });
      await tx.payment.deleteMany({
        where: { booking: { companyId: { in: companyIds } } },
      });
      await tx.discountRedemption.deleteMany({
        where: { booking: { companyId: { in: companyIds } } },
      });
      await tx.booking.deleteMany({
        where: { companyId: { in: companyIds } },
      });

      // 2. Delete reviews, trips, stops, manifests, occupancy
      await tx.review.deleteMany({
        where: { trip: { companyId: { in: companyIds } } },
      });
      await tx.tripSegmentOccupancy.deleteMany({
        where: { trip: { companyId: { in: companyIds } } },
      });
      await tx.tripStop.deleteMany({
        where: { trip: { companyId: { in: companyIds } } },
      });
      await tx.tripManifest.deleteMany({
        where: { trip: { companyId: { in: companyIds } } },
      });
      await tx.trip.deleteMany({
        where: { companyId: { in: companyIds } },
      });

      // 3. Delete schedules
      await tx.tripSchedule.deleteMany({
        where: { companyId: { in: companyIds } },
      });
      await tx.recurringSchedule.deleteMany({
        where: { companyId: { in: companyIds } },
      });

      // 4. Delete routes, price tiers, waypoints
      await tx.routePriceTier.deleteMany({
        where: { route: { companyId: { in: companyIds } } },
      });
      await tx.routeWaypoint.deleteMany({
        where: { route: { companyId: { in: companyIds } } },
      });
      await tx.route.deleteMany({
        where: { companyId: { in: companyIds } },
      });

      // 5. Delete buses, maintenance logs, seat maps
      await tx.busMaintenanceLog.deleteMany({
        where: { bus: { companyId: { in: companyIds } } },
      });
      await tx.busSeat.deleteMany({
        where: { bus: { companyId: { in: companyIds } } },
      });
      await tx.bus.deleteMany({
        where: { companyId: { in: companyIds } },
      });

      // 6. Delete ledger entries and financial accounts
      await tx.withdrawalRequest.deleteMany({
        where: { companyId: { in: companyIds } },
      });
      await tx.settlementDisbursement.deleteMany({
        where: { companyId: { in: companyIds } },
      });
      await tx.ledgerEntry.deleteMany({
        where: { account: { companyId: { in: companyIds } } },
      });
      await tx.financialAccount.deleteMany({
        where: { companyId: { in: companyIds } },
      });

      // 7. Delete discount campaigns & coupons
      await tx.discountCoupon.deleteMany({
        where: { campaign: { companyId: { in: companyIds } } },
      });
      await tx.discountCampaign.deleteMany({
        where: { companyId: { in: companyIds } },
      });

      // 8. Delete compliance, bank details, documents, locations
      await tx.companyBankDetails.deleteMany({
        where: { companyId: { in: companyIds } },
      });
      await tx.companyVerification.deleteMany({
        where: { companyId: { in: companyIds } },
      });
      await tx.companyDocument.deleteMany({
        where: { companyId: { in: companyIds } },
      });
      await tx.bankAccessAuditLog.deleteMany({
        where: { companyId: { in: companyIds } },
      });
      await tx.operatorInvitation.deleteMany({
        where: { companyId: { in: companyIds } },
      });

      await tx.locationCapture.deleteMany({
        where: { location: { companyId: { in: companyIds } } },
      });
      await tx.companyLocation.deleteMany({
        where: { companyId: { in: companyIds } },
      });

      // 9. Delete operator onboarding & operators
      await tx.operatorOnboardingEvent.deleteMany({
        where: { operator: { companyId: { in: companyIds } } },
      });
      await tx.operatorOnboarding.deleteMany({
        where: { operator: { companyId: { in: companyIds } } },
      });
      await tx.operator.deleteMany({
        where: { companyId: { in: companyIds } },
      });

      // 10. Delete the company
      await tx.company.deleteMany({
        where: { id: { in: companyIds } },
      });
    }

    // 11. Delete user core & auth records
    console.log("🗑️  Purging user auth, sessions, credits, and profile...");
    await tx.operatorOnboardingEvent.deleteMany({
      where: { operator: { userId: user.id } },
    });
    await tx.operatorOnboarding.deleteMany({
      where: { operator: { userId: user.id } },
    });
    await tx.operator.deleteMany({
      where: { userId: user.id },
    });
    await tx.adminStaff.deleteMany({
      where: { userId: user.id },
    });
    await tx.creditLot.deleteMany({
      where: { userId: user.id },
    });
    await tx.session.deleteMany({
      where: { userId: user.id },
    });
    await tx.account.deleteMany({
      where: { userId: user.id },
    });
    await tx.user.delete({
      where: { id: user.id },
    });
  });

  console.log(`\n✅ Successfully and completely purged all records for: ${targetEmail}`);
}

purgeOperator()
  .catch((err) => {
    console.error("❌ Purge failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
