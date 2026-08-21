import "dotenv/config";
import { getPrismaClient } from "../src/index.js";

// Usage:
//   pnpm --filter @moja/db tsx scripts/purge-operator.ts <email>
//
// Example:
//   pnpm --filter @moja/db tsx scripts/purge-operator.ts operator@example.com
//
// What this purges (for operators):
//   - All company operational data: trips, schedules, routes, buses, seats, bookings,
//     payments, refunds, ledger entries, financial accounts, discount campaigns,
//     documents, verifications, bank details, locations, invitations.
//   - All operator profiles linked to the user.
//   - The user account itself (cascades: sessions, accounts, refreshTokens,
//     creditLots, passengerProfile, referralCode, referralEdges, adminStaff).
//
// Cascade Note: Session, Account, RefreshToken, PassengerProfile, SavedPassenger,
// CreditLot, ReferralCode, ReferralEdge, AdminStaff, OperatorOnboarding,
// OperatorOnboardingEvent all CASCADE from User or Operator — no need to delete manually.
// Similarly: Seat, TripSeat, TripStop, RouteWaypoint, ScheduleWaypoint,
// ServiceCalendar, ServiceException all CASCADE from their parents.

const targetEmail = process.argv[2]?.trim();

if (!targetEmail) {
  console.error("❌ Error: Please provide an email to purge.");
  console.error(
    "Usage: pnpm --filter @moja/db tsx scripts/purge-operator.ts <email>"
  );
  process.exit(1);
}

const prisma = getPrismaClient();

async function purgeOperator() {
  console.log(`🔍 Searching for user with email: ${targetEmail}...`);

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    include: {
      operatorProfiles: {
        select: { id: true, companyId: true },
      },
    },
  });

  if (!user) {
    console.log(
      `ℹ️  No user found with email "${targetEmail}". Nothing to delete.`
    );
    return;
  }

  const companyIds = user.operatorProfiles.map((op) => op.companyId);
  console.log(`\n✅ Found user: ${user.id} (${user.fullName || "No name"})`);
  console.log(
    `   Role: ${user.role} | Companies: ${companyIds.length > 0 ? companyIds.join(", ") : "none"}\n`
  );

  await prisma.$transaction(
    async (tx) => {
      if (companyIds.length > 0) {
        console.log(
          "🗑️  Step 1/3 — Purging company commercial & booking data..."
        );

        // Booking children (WalletReservation, DiscountRedemption, Refund cascade from Booking)
        await tx.booking.deleteMany({ where: { companyId: { in: companyIds } } });
        console.log("   ✓ bookings (+ wallet_reservations, discount_redemptions, refunds via cascade)");

        // HoldGroup (booking cascade already covers hold via cascade on booking)
        await tx.holdGroup.deleteMany({ where: { userId: user.id } });
        console.log("   ✓ hold_groups");

        // Trip children cascade (TripSeat, TripStop, CampaignTripScope cascade from Trip)
        // Note: Review.tripId is onDelete: SetNull — reviews are NOT deleted here;
        //       they are deleted by the Company cascade (line ~173) or by the explicit
        //       authorId delete in Step 3.
        await tx.trip.deleteMany({ where: { companyId: { in: companyIds } } });
        console.log("   ✓ trips (+ trip_seats, trip_stops, campaign_trip_scopes via cascade)");

        // Schedule children cascade (ScheduleWaypoint, ServiceCalendar, ServiceException,
        //   CampaignScheduleScope cascade from Schedule)
        await tx.schedule.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ schedules (+ schedule_waypoints, service_calendar, service_exception, campaign_schedule_scopes via cascade)");

        // Route children cascade (RouteWaypoint, Fare, PricingSnapshot, CampaignRouteScope
        //   cascade from Route)
        await tx.route.deleteMany({ where: { companyId: { in: companyIds } } });
        console.log("   ✓ routes (+ route_waypoints, fares, pricing_snapshots, campaign_route_scopes via cascade)");

        // Bus children (Seat cascades from Bus)
        await tx.bus.deleteMany({ where: { companyId: { in: companyIds } } });
        console.log("   ✓ buses (+ seats via cascade)");

        console.log(
          "\n🗑️  Step 2/3 — Purging company financial & compliance data..."
        );

        // Financial transactions cascade from FinancialAccount (LedgerEntry too)
        await tx.financialAccount.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ financial_accounts (+ ledger_entries, financial_transactions, snapshots via cascade)");

        // Discount campaigns (CouponCode, CampaignCompanyOptIn, DiscountRedemption cascade)
        await tx.discountCampaign.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ discount_campaigns (+ coupon_codes, campaign_opt_ins via cascade)");

        // PromoAbuseEvent
        await tx.promoAbuseEvent.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ promo_abuse_events");

        // Compliance & documents
        await tx.companyDocument.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        await tx.companyVerification.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ company_documents, company_verifications");

        // Bank accounts & access logs
        await tx.bankAccount.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        await tx.bankAccessLog.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ bank_accounts, bank_access_logs");

        // Staff invitations & activity logs
        await tx.staffInvitation.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        await tx.activityLog.deleteMany({ where: { userId: user.id } });
        console.log("   ✓ staff_invitations, activity_logs");

        // Company locations (LocationCapture cascades from CompanyLocation)
        await tx.companyLocation.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ company_locations (+ location_captures via cascade)");

        // SettlementPolicy
        await tx.settlementPolicy.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ settlement_policies");

        // WithdrawalTwoFactorChallenge
        await tx.withdrawalTwoFactorChallenge.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ withdrawal_2fa_challenges");

        // OutboxMessages tied to company (iterate all — JSON path filter doesn't support `in`)
        for (const cid of companyIds) {
          await tx.outboxMessage
            .deleteMany({ where: { payload: { path: ["companyId"], equals: cid } } })
            .catch(() => null);
        }

        // Operator rows (OperatorOnboarding + OperatorOnboardingEvent cascade from Operator)
        await tx.operator.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ operators (+ operator_onboarding, operator_onboarding_events via cascade)");

        // Now safe to delete company
        await tx.company.deleteMany({ where: { id: { in: companyIds } } });
        console.log("   ✓ companies");
      }

      console.log("\n🗑️  Step 3/3 — Purging user account & personal data...");

      // PendingOperatorSignup
      await tx.pendingOperatorSignup.deleteMany({
        where: { email: user.email },
      });
      console.log("   ✓ pending_operator_signups");

      // AdminStaff & its invitations/activity logs
      await tx.adminStaffInvitation
        .deleteMany({
          where: {
            OR: [{ invitedById: user.id }, { acceptedById: user.id }],
          },
        })
        .catch(() => null);
      await tx.adminStaff.deleteMany({ where: { userId: user.id } });
      console.log("   ✓ admin_staff (+ admin_staff_activity_logs via cascade)");

      // User bookings (as traveler)
      await tx.booking.deleteMany({ where: { userId: user.id } });
      console.log("   ✓ traveler bookings");

      // CreditLots, ReferralCode, ReferralEdge — cascade from User but delete explicitly for safety
      await tx.creditLot.deleteMany({ where: { userId: user.id } });
      await tx.referralEdge
        .deleteMany({
          where: {
            OR: [{ referrerUserId: user.id }, { refereeUserId: user.id }],
          },
        })
        .catch(() => null);
      await tx.referralCode
        .deleteMany({ where: { userId: user.id } })
        .catch(() => null);
      console.log("   ✓ credit_lots, referral_code, referral_edges");

      // User reviews (as traveler)
      await tx.review.deleteMany({ where: { authorId: user.id } });
      console.log("   ✓ traveler reviews");

      // ContactInquiries (as author or resolver)
      await tx.contactInquiry
        .deleteMany({
          where: {
            OR: [{ userId: user.id }, { resolvedById: user.id }],
          },
        })
        .catch(() => null);
      console.log("   ✓ contact_inquiries");

      // Finally delete the user — cascades: Session, Account, RefreshToken,
      // PassengerProfile (+ SavedPassenger), DiscountRedemption, HoldGroup
      await tx.user.delete({ where: { id: user.id } });
      console.log(
        "   ✓ user (+ sessions, accounts, refreshTokens, passengerProfile, savedPassengers via cascade)"
      );
    },
    { timeout: 60_000 }
  );

  console.log(
    `\n🎉 Successfully purged ALL records for: ${targetEmail}\n`
  );
}

purgeOperator()
  .catch((err) => {
    console.error("\n❌ Purge failed:", err?.message ?? err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
