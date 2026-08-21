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
// IMPORTANT — NO .catch() INSIDE $transaction:
// In PostgreSQL, once any statement in a transaction throws (even if caught at
// the JS level), the tx enters "aborted" state (error 25P02) and every
// subsequent command fails regardless. Therefore: NO .catch() inside
// $transaction. Genuinely optional operations (OutboxMessage) are run
// BEFORE the transaction starts.

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

  // ── Pre-transaction: best-effort cleanup outside the atomic tx ───────────
  // OutboxMessage uses a JSON path filter that can throw on some Postgres
  // setups. Running it outside prevents poisoning the main transaction.
  if (companyIds.length > 0) {
    for (const cid of companyIds) {
      await prisma.outboxMessage
        .deleteMany({
          where: { payload: { path: ["companyId"], equals: cid } },
        })
        .catch(() => null);
    }
  }
  await prisma.outboxMessage
    .deleteMany({
      where: { payload: { path: ["userId"], equals: user.id } },
    })
    .catch(() => null);
  console.log("🧹 Pre-cleanup: outbox_messages done\n");

  // ── Main transaction ──────────────────────────────────────────────────────
  await prisma.$transaction(
    async (tx) => {
      if (companyIds.length > 0) {
        console.log(
          "🗑️  Step 1/3 — Purging company commercial & booking data..."
        );

        // Collect IDs upfront to unblock onDelete:Restrict FK constraints
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

        // 1. Refunds — onDelete:Restrict from HoldGroup & Booking
        if (holdGroupIds.length > 0 || bookingIds.length > 0) {
          await tx.refund.deleteMany({
            where: {
              OR: [
                ...(holdGroupIds.length > 0
                  ? [{ holdGroupId: { in: holdGroupIds } }]
                  : []),
                ...(bookingIds.length > 0
                  ? [{ bookingId: { in: bookingIds } }]
                  : []),
              ],
            },
          });
          console.log("   ✓ refunds");
        }

        // 2. ExternalPayments — onDelete:Restrict from HoldGroup
        if (holdGroupIds.length > 0) {
          await tx.externalPayment.deleteMany({
            where: { holdGroupId: { in: holdGroupIds } },
          });
          console.log(
            "   ✓ external_payments (+ payment_attempts, payment_events via cascade)"
          );
        }

        // 3. Bookings
        await tx.booking.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ company bookings");

        // 4. HoldGroups (Restrict blockers cleared above)
        if (holdGroupIds.length > 0) {
          await tx.holdGroup.deleteMany({
            where: { id: { in: holdGroupIds } },
          });
          console.log(
            "   ✓ hold_groups (+ pricing_snapshots, discount_redemptions via cascade)"
          );
        }

        // 5. Trips (+ TripSeat, TripStop, CampaignTripScope, TripDriverAssignment via cascade)
        await tx.trip.deleteMany({ where: { companyId: { in: companyIds } } });
        console.log(
          "   ✓ trips (+ trip_seats, trip_stops, campaign_trip_scopes, driver_assignments via cascade)"
        );

        // 6. Schedules (+ ScheduleWaypoint, ServiceCalendar, ServiceException, CampaignScheduleScope)
        await tx.schedule.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log(
          "   ✓ schedules (+ schedule_waypoints, service_calendar, service_exception, campaign_schedule_scopes via cascade)"
        );

        // 7. Routes (+ RouteWaypoint, Fare, CampaignRouteScope via cascade)
        await tx.route.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log(
          "   ✓ routes (+ route_waypoints, fares, campaign_route_scopes via cascade)"
        );

        // 8. Buses (+ seats via cascade)
        await tx.bus.deleteMany({ where: { companyId: { in: companyIds } } });
        console.log("   ✓ buses (+ seats via cascade)");

        // 9. Custom SeatLayoutTemplates and BusTypes scoped to this company
        await tx.seatLayoutTemplate.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        await tx.busType.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ custom seat_layout_templates, bus_types");

        console.log(
          "\n🗑️  Step 2/3 — Purging company financial & compliance data..."
        );

        // 10. Financial Accounts (polymorphic: ownerType + ownerId, no companyId column)
        const companyAccounts = await tx.financialAccount.findMany({
          where: { ownerType: "COMPANY", ownerId: { in: companyIds } },
          select: { id: true },
        });
        const companyAccountIds = companyAccounts.map((a) => a.id);

        if (companyAccountIds.length > 0) {
          const ledgerRows = await tx.ledgerEntry.findMany({
            where: { accountId: { in: companyAccountIds } },
            select: { transactionId: true },
          });
          const financialTxIds = [
            ...new Set(ledgerRows.map((le) => le.transactionId)),
          ];

          await tx.walletReservation.deleteMany({
            where: { accountId: { in: companyAccountIds } },
          });
          await tx.financialAccountSnapshot.deleteMany({
            where: { accountId: { in: companyAccountIds } },
          });
          await tx.ledgerEntry.deleteMany({
            where: { accountId: { in: companyAccountIds } },
          });
          if (financialTxIds.length > 0) {
            await tx.financialTransaction.deleteMany({
              where: { id: { in: financialTxIds } },
            });
          }
          await tx.financialAccount.deleteMany({
            where: { id: { in: companyAccountIds } },
          });
          console.log(
            "   ✓ financial_accounts (+ ledger_entries, wallet_reservations, snapshots, transactions)"
          );
        }

        // 11. PromoAbuseEvent — no companyId column; filter by campaign or user
        const companyCampaigns = await tx.discountCampaign.findMany({
          where: { companyId: { in: companyIds } },
          select: { id: true },
        });
        const campaignIds = companyCampaigns.map((c) => c.id);

        await tx.promoAbuseEvent.deleteMany({
          where: {
            OR: [
              ...(campaignIds.length > 0
                ? [{ campaignId: { in: campaignIds } }]
                : []),
              { userId: user.id },
            ],
          },
        });
        console.log("   ✓ promo_abuse_events");

        // 12. DiscountCampaigns (cascade: CouponCode, CampaignCompanyOptIn,
        //     DiscountRedemption, CampaignRouteScope, CampaignTripScope, CampaignScheduleScope)
        await tx.discountCampaign.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log(
          "   ✓ discount_campaigns (+ coupon_codes, campaign_opt_ins, campaign_scopes via cascade)"
        );

        // 13. Compliance & documents
        await tx.companyDocument.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        await tx.companyVerification.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ company_documents, company_verifications");

        // 14. Bank accounts & access logs
        await tx.bankAccount.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        await tx.bankAccessLog.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ bank_accounts, bank_access_logs");

        // 15. Staff invitations & activity logs
        await tx.staffInvitation.deleteMany({
          where: {
            OR: [
              { companyId: { in: companyIds } },
              { invitedById: user.id },
              { acceptedById: user.id },
            ],
          },
        });
        await tx.activityLog.deleteMany({
          where: {
            OR: [
              { companyId: { in: companyIds } },
              { userId: user.id },
            ],
          },
        });
        console.log("   ✓ staff_invitations, activity_logs");

        // 16. Company locations (LocationCapture cascades from CompanyLocation)
        await tx.companyLocation.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log(
          "   ✓ company_locations (+ location_captures via cascade)"
        );

        // 17. WithdrawalTwoFactorChallenge
        await tx.withdrawalTwoFactorChallenge.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ withdrawal_2fa_challenges");

        // 18. Driver affiliations & shifts
        await tx.driverCompanyAffiliation.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        await tx.driverShift.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ driver_company_affiliations, driver_shifts");

        // 19. Company reviews
        await tx.review.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log("   ✓ company reviews");

        // 20. Operator rows (cascade: OperatorOnboarding, OperatorOnboardingEvent)
        await tx.operator.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        console.log(
          "   ✓ operators (+ operator_onboarding, operator_onboarding_events via cascade)"
        );

        // 21. Company itself
        await tx.company.deleteMany({ where: { id: { in: companyIds } } });
        console.log("   ✓ companies");
      }

      console.log("\n🗑️  Step 3/3 — Purging user account & personal data...");

      // 22. PendingOperatorSignup
      await tx.pendingOperatorSignup.deleteMany({
        where: { email: user.email },
      });
      console.log("   ✓ pending_operator_signups");

      // 23. AdminStaff & invitations (cascade: AdminStaffActivityLog)
      await tx.adminStaffInvitation.deleteMany({
        where: {
          OR: [{ invitedById: user.id }, { acceptedById: user.id }],
        },
      });
      await tx.adminStaff.deleteMany({ where: { userId: user.id } });
      await tx.platformSettingsAudit.deleteMany({
        where: { changedById: user.id },
      });
      console.log(
        "   ✓ admin_staff (+ admin_staff_activity_logs, platform_settings_audits)"
      );

      // 24. Blog content authored by user
      await tx.blogRevision.deleteMany({ where: { changedById: user.id } });
      await tx.blogEvent.deleteMany({ where: { userId: user.id } });
      await tx.blogPost.updateMany({
        where: { lastReviewedById: user.id },
        data: { lastReviewedById: null },
      });
      await tx.blogPost.deleteMany({ where: { authorId: user.id } });
      console.log(
        "   ✓ blog_revisions, blog_events, blog_posts (reviewer nulled)"
      );

      // 25. User financial accounts (passenger wallet, loyalty points, etc.)
      const userAccounts = await tx.financialAccount.findMany({
        where: { ownerType: "USER", ownerId: user.id },
        select: { id: true },
      });
      const userAccountIds = userAccounts.map((a) => a.id);
      if (userAccountIds.length > 0) {
        const userLedgerRows = await tx.ledgerEntry.findMany({
          where: { accountId: { in: userAccountIds } },
          select: { transactionId: true },
        });
        const userFinancialTxIds = [
          ...new Set(userLedgerRows.map((le) => le.transactionId)),
        ];

        await tx.walletReservation.deleteMany({
          where: { accountId: { in: userAccountIds } },
        });
        await tx.financialAccountSnapshot.deleteMany({
          where: { accountId: { in: userAccountIds } },
        });
        await tx.ledgerEntry.deleteMany({
          where: { accountId: { in: userAccountIds } },
        });
        if (userFinancialTxIds.length > 0) {
          await tx.financialTransaction.deleteMany({
            where: { id: { in: userFinancialTxIds } },
          });
        }
        await tx.financialAccount.deleteMany({
          where: { id: { in: userAccountIds } },
        });
        console.log("   ✓ user financial_accounts");
      }

      // 26. Traveler bookings (for trips on other companies)
      await tx.booking.deleteMany({ where: { userId: user.id } });
      console.log("   ✓ traveler bookings");

      // 27. CreditLots, ReferralCode, ReferralEdge
      await tx.creditLot.deleteMany({ where: { userId: user.id } });
      await tx.referralEdge.deleteMany({
        where: {
          OR: [{ referrerUserId: user.id }, { refereeUserId: user.id }],
        },
      });
      await tx.referralCode.deleteMany({ where: { userId: user.id } });
      console.log("   ✓ credit_lots, referral_code, referral_edges");

      // 28. Traveler reviews (as author)
      await tx.review.deleteMany({ where: { authorId: user.id } });
      console.log("   ✓ traveler reviews");

      // 29. ContactInquiries
      await tx.contactInquiry.deleteMany({
        where: {
          OR: [{ userId: user.id }, { resolvedById: user.id }],
        },
      });
      console.log("   ✓ contact_inquiries");

      // 30. User — cascades: Session, Account, RefreshToken,
      //     PassengerProfile (+ SavedPassenger), DiscountRedemption, DriverProfile,
      //     HoldGroup (any remaining), bankAccessLogs
      await tx.user.delete({ where: { id: user.id } });
      console.log(
        "   ✓ user (+ sessions, accounts, refreshTokens, passengerProfile, savedPassengers, driverProfile via cascade)"
      );
    },
    { timeout: 90_000 }
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
