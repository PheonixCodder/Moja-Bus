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

        // Find all hold groups and bookings tied to these companies (and the user)
        const holdGroups = await tx.holdGroup.findMany({
          where: {
            OR: [
              { companyId: { in: companyIds } },
              { userId: user.id },
            ],
          },
          select: { id: true },
        });
        const holdGroupIds = holdGroups.map((h) => h.id);

        const companyBookings = await tx.booking.findMany({
          where: {
            OR: [
              { companyId: { in: companyIds } },
              { userId: user.id },
            ],
          },
          select: { id: true },
        });
        const bookingIds = companyBookings.map((b) => b.id);

        // 1. Refunds (holdGroup relation has onDelete: Restrict)
        if (holdGroupIds.length > 0 || bookingIds.length > 0) {
          await tx.refund.deleteMany({
            where: {
              OR: [
                ...(holdGroupIds.length > 0 ? [{ holdGroupId: { in: holdGroupIds } }] : []),
                ...(bookingIds.length > 0 ? [{ bookingId: { in: bookingIds } }] : []),
              ],
            },
          });
          console.log("   ✓ refunds");
        }

        // 2. External Payments (holdGroup relation has onDelete: Restrict)
        if (holdGroupIds.length > 0) {
          await tx.externalPayment.deleteMany({
            where: { holdGroupId: { in: holdGroupIds } },
          });
          console.log("   ✓ external_payments (+ payment_attempts, payment_events via cascade)");
        }

        // 3. Bookings
        await tx.booking.deleteMany({ where: { companyId: { in: companyIds } } });
        console.log("   ✓ company bookings");

        // 4. HoldGroups (now safe to delete since refunds & payments are removed)
        if (holdGroupIds.length > 0) {
          await tx.holdGroup.deleteMany({ where: { id: { in: holdGroupIds } } });
          console.log("   ✓ hold_groups (+ pricing_snapshots, discount_redemptions via cascade)");
        }

        // 5. Trips (+ TripSeat, TripStop, CampaignTripScope, TripDriverAssignment via cascade)
        await tx.trip.deleteMany({ where: { companyId: { in: companyIds } } });
        console.log("   ✓ trips (+ trip_seats, trip_stops, campaign_trip_scopes, driver_assignments via cascade)");

        // 6. Schedules (+ ScheduleWaypoint, ServiceCalendar, ServiceException, CampaignScheduleScope via cascade)
        await tx.schedule.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ schedules (+ schedule_waypoints, service_calendar, service_exception, campaign_schedule_scopes via cascade)");

        // 7. Routes (+ RouteWaypoint, Fare, CampaignRouteScope via cascade)
        await tx.route.deleteMany({ where: { companyId: { in: companyIds } } });
        console.log("   ✓ routes (+ route_waypoints, fares, campaign_route_scopes via cascade)");

        // 8. Buses (+ seats via cascade)
        await tx.bus.deleteMany({ where: { companyId: { in: companyIds } } });
        console.log("   ✓ buses (+ seats via cascade)");

        // 9. Custom SeatLayoutTemplates (+ SeatTemplate via cascade) and BusTypes for company
        await tx.seatLayoutTemplate.deleteMany({ where: { companyId: { in: companyIds } } }).catch(() => null);
        await tx.busType.deleteMany({ where: { companyId: { in: companyIds } } }).catch(() => null);
        console.log("   ✓ custom seat_layout_templates, bus_types");

        console.log(
          "\n🗑️  Step 2/3 — Purging company financial & compliance data..."
        );

        // Financial Accounts (FinancialAccount uses polymorphic ownerType + ownerId)
        const companyAccounts = await tx.financialAccount.findMany({
          where: {
            ownerType: "COMPANY",
            ownerId: { in: companyIds },
          },
          select: { id: true },
        });
        const companyAccountIds = companyAccounts.map((a) => a.id);

        if (companyAccountIds.length > 0) {
          const ledgerEntries = await tx.ledgerEntry.findMany({
            where: { accountId: { in: companyAccountIds } },
            select: { transactionId: true },
          });
          const txIds = [...new Set(ledgerEntries.map((le) => le.transactionId))];

          await tx.walletReservation.deleteMany({
            where: { accountId: { in: companyAccountIds } },
          });
          await tx.financialAccountSnapshot.deleteMany({
            where: { accountId: { in: companyAccountIds } },
          });
          await tx.ledgerEntry.deleteMany({
            where: { accountId: { in: companyAccountIds } },
          });
          if (txIds.length > 0) {
            await tx.financialTransaction
              .deleteMany({ where: { id: { in: txIds } } })
              .catch(() => null);
          }
          await tx.financialAccount.deleteMany({
            where: { id: { in: companyAccountIds } },
          });
          console.log("   ✓ financial_accounts (+ ledger_entries, wallet_reservations, snapshots, transactions)");
        }

        // Discount campaigns
        const companyCampaigns = await tx.discountCampaign.findMany({
          where: { companyId: { in: companyIds } },
          select: { id: true },
        });
        const campaignIds = companyCampaigns.map((c) => c.id);

        // PromoAbuseEvents (filter by campaignId or userId)
        await tx.promoAbuseEvent.deleteMany({
          where: {
            OR: [
              ...(campaignIds.length > 0 ? [{ campaignId: { in: campaignIds } }] : []),
              { userId: user.id },
              { assigneeUserId: user.id },
              { resolvedByUserId: user.id },
            ],
          },
        }).catch(() => null);
        console.log("   ✓ promo_abuse_events");

        await tx.discountCampaign.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ discount_campaigns (+ coupon_codes, campaign_opt_ins, campaign_scopes via cascade)");

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
          where: {
            OR: [
              { companyId: { in: companyIds } },
              { invitedById: user.id },
              { acceptedById: user.id },
            ],
          },
        }).catch(() => null);
        await tx.activityLog.deleteMany({
          where: {
            OR: [
              { companyId: { in: companyIds } },
              { userId: user.id },
            ],
          },
        });
        console.log("   ✓ staff_invitations, activity_logs");

        // Company locations (LocationCapture cascades from CompanyLocation)
        await tx.companyLocation.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ company_locations (+ location_captures via cascade)");

        // WithdrawalTwoFactorChallenge
        await tx.withdrawalTwoFactorChallenge.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ withdrawal_2fa_challenges");

        // Driver affiliations & shifts for this company
        await tx.driverCompanyAffiliation.deleteMany({
          where: { companyId: { in: companyIds } },
        }).catch(() => null);
        await tx.driverShift.deleteMany({
          where: { companyId: { in: companyIds } },
        }).catch(() => null);
        console.log("   ✓ driver_company_affiliations, driver_shifts");

        // Reviews for this company
        await tx.review.deleteMany({
          where: { companyId: { in: companyIds } },
        }).catch(() => null);
        console.log("   ✓ company reviews");

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
      await tx.platformSettingsAudit.deleteMany({ where: { changedById: user.id } }).catch(() => null);
      console.log("   ✓ admin_staff (+ admin_staff_activity_logs, platform_settings_audits)");

      // Blog posts authored by user
      await tx.blogRevision.deleteMany({ where: { changedById: user.id } }).catch(() => null);
      await tx.blogEvent.deleteMany({ where: { userId: user.id } }).catch(() => null);
      await tx.blogPost.deleteMany({ where: { authorId: user.id } }).catch(() => null);
      await tx.blogPost.updateMany({
        where: { lastReviewedById: user.id },
        data: { lastReviewedById: null },
      }).catch(() => null);

      // User financial accounts (passenger wallet, etc.)
      const userAccounts = await tx.financialAccount.findMany({
        where: {
          ownerType: "USER",
          ownerId: user.id,
        },
        select: { id: true },
      });
      const userAccountIds = userAccounts.map((a) => a.id);
      if (userAccountIds.length > 0) {
        await tx.walletReservation.deleteMany({
          where: { accountId: { in: userAccountIds } },
        });
        await tx.financialAccountSnapshot.deleteMany({
          where: { accountId: { in: userAccountIds } },
        });
        await tx.ledgerEntry.deleteMany({
          where: { accountId: { in: userAccountIds } },
        });
        await tx.financialAccount.deleteMany({
          where: { id: { in: userAccountIds } },
        });
        console.log("   ✓ user financial_accounts");
      }

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
      // PassengerProfile (+ SavedPassenger), DiscountRedemption, DriverProfile
      await tx.user.delete({ where: { id: user.id } });
      console.log(
        "   ✓ user (+ sessions, accounts, refreshTokens, passengerProfile, savedPassengers, driverProfile via cascade)"
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
