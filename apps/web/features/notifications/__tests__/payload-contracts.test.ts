import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { operatorAccountRestoredPayloadSchema } from "@/features/notifications/workflows/admin/account-restored";
import { operatorAccountSuspendedPayloadSchema } from "@/features/notifications/workflows/admin/account-suspended";
import { adminTreasuryNetworkFailurePayloadSchema } from "@/features/notifications/workflows/admin/admin-treasury-network-failure";
import { adminPayoutFailedPayloadSchema } from "@/features/notifications/workflows/admin/payout-failed";
import { userRoleUpdatedPayloadSchema } from "@/features/notifications/workflows/admin/user-role-updated";
import { operatorWithdrawalResolvedPayloadSchema } from "@/features/notifications/workflows/admin/withdrawal-resolved";
import { driverVerificationOutcomePayloadSchema } from "@/features/notifications/workflows/driver/verification-outcome";
import { operatorDriverAssignmentConflictPayloadSchema } from "@/features/notifications/workflows/operator/driver-conflict";
import { operatorCampaignPausedPayloadSchema } from "@/features/notifications/workflows/operator/promo-campaigns";
import { passengerReviewRequestPayloadSchema } from "@/features/notifications/workflows/operator/review-request";
import { passengerTripCancelledPayloadSchema } from "@/features/notifications/workflows/operator/trip-cancelled";
import { passengerTripDelayedPayloadSchema } from "@/features/notifications/workflows/operator/trip-delayed";
import { passengerProfileUpdatedPayloadSchema } from "@/features/notifications/workflows/passenger/profile-updated";
import { passengerRebookedPayloadSchema } from "@/features/notifications/workflows/passenger/rebooked";
import { passengerReviewSubmittedPayloadSchema } from "@/features/notifications/workflows/passenger/review-submitted";
import { staffAcceptanceAlertPayloadSchema } from "@/features/notifications/workflows/staff/staff-acceptance-alert";

/**
 * Phase 07 (D6) — enqueue↔payloadSchema contract harness.
 *
 * F-NF-01/F-NF-02 shipped because producer payloads and workflow schemas
 * diverged invisibly: Novu accepts the trigger, marks the outbox row SENT,
 * and only fails later during bridge execution — so no runtime signal ever
 * surfaces. This suite is the CI guard: every row pairs a workflow's schema
 * with representative payloads copied from its REAL producer call sites.
 *
 * Adding a workflow: export its payloadSchema as a named const next to the
 * workflow, then add a contract row here mirroring the enqueue site exactly.
 */

type ContractRow = {
  workflowId: string;
  schema: { parse: (p: unknown) => unknown };
  samples: Array<{ name: string; payload: Record<string, unknown> }>;
};

/** Mirrors lib/cancel-trip-with-refunds.ts (Phase 07 payload shape). */
const tripCancelledSamples = [
  {
    name: "wallet refund succeeded",
    payload: {
      email: "passenger@example.com",
      passengerName: "Awa Koné",
      originCity: "Abidjan",
      destinationCity: "Bouaké",
      departureTime: "8/30/2026, 8:00:00 AM",
      cancelReason: "Vehicle breakdown",
      refundStatus: "success",
      refundChannel: "WALLET",
      refundAmountXOF: 12500,
      phone: "+2250700000000",
      bookingReference: "MR-ABC123",
    },
  },
  {
    name: "cash settlement succeeded (guest, no user record)",
    payload: {
      email: "guest@example.com",
      passengerName: "Fatou Traoré",
      originCity: "Abidjan",
      destinationCity: "Yamoussoukro",
      departureTime: "8/30/2026, 14:30:00",
      cancelReason: "Operator cancelled schedule",
      refundStatus: "success",
      refundChannel: "CASH",
      refundAmountXOF: 5000,
      bookingReference: "MR-GST777",
    },
  },
  {
    name: "refund FAILED (the case that used to omit the required amount)",
    payload: {
      email: "passenger@example.com",
      passengerName: "Ibrahim Ouattara",
      originCity: "Abidjan",
      destinationCity: "Korhogo",
      departureTime: "8/31/2026, 6:15:00 AM",
      cancelReason: "Trip cancelled by operator",
      refundStatus: "failed",
      refundChannel: "WALLET",
      refundAmountXOF: 0,
      bookingReference: "MR-FAIL01",
    },
  },
];

/** Mirrors trpc/routers/trips.ts (OPERATOR) and drivers.ts (DRIVER). */
const tripDelayedSamples = [
  {
    name: "operator-formalized delay",
    payload: {
      email: "passenger@example.com",
      passengerName: "Awa Koné",
      originCity: "Abidjan",
      destinationCity: "Bouaké",
      originMunicipality: "Cocody",
      destinationMunicipality: null,
      originalTime: "8/30/2026, 8:00:00 AM",
      newTime: "8/30/2026, 9:45:00 AM",
      delayMinutes: 105,
      gate: undefined,
      phone: "+2250700000000",
      bookingReference: "MR-ABC123",
      reportedBy: "OPERATOR",
    },
  },
  {
    name: "driver-reported delay (gate present)",
    payload: {
      email: "guest@example.com",
      passengerName: "Fatou Traoré",
      originCity: "Abidjan",
      destinationCity: "Yamoussoukro",
      originMunicipality: null,
      destinationMunicipality: null,
      originalTime: "8/30/2026, 14:30:00",
      newTime: "8/30/2026, 15:00:00",
      delayMinutes: 30,
      gate: "B2",
      bookingReference: "MR-GST777",
      reportedBy: "DRIVER",
    },
  },
  {
    name: "minimal operator delay (reportedBy defaults to OPERATOR)",
    payload: {
      email: "p@example.com",
      passengerName: "Jean Kouassi",
      originCity: "Abidjan",
      destinationCity: "San-Pédro",
      originalTime: "x",
      newTime: "y",
      delayMinutes: 10,
      gate: null,
      bookingReference: "MR-MIN001",
    },
  },
];

/** Mirrors trpc/routers/invitation.ts + admin-staff.ts (Phase 08). */
const staffAcceptanceSamples = [
  {
    name: "inviter with user record (user.id keyed at trigger)",
    payload: {
      staffName: "Ibrahim Ouattara",
      staffEmail: "staff@example.com",
      role: "DISPATCHER",
    },
  },
];

/** Mirrors passenger.ts updateProfile / submitReview (Phase 08). */
const profileUpdatedSamples = [
  {
    name: "critical settings changed (email+phone)",
    payload: {
      email: "passenger@example.com",
      passengerName: "Awa Koné",
      changedFields: ["email", "phoneNumber"],
      phone: "+2250700000000",
    },
  },
];
const reviewSubmittedSamples = [
  {
    name: "5-star review without comment",
    payload: {
      email: "passenger@example.com",
      passengerName: "Awa Koné",
      companyName: "Probe Transport",
      rating: 5,
    },
  },
];

/** Mirrors admin.ts role-update / suspend / restore paths (Phase 08). */
const userRoleUpdatedSamples = [
  {
    name: "promoted to OPERATOR",
    payload: {
      email: "user@example.com",
      userName: "Jean Kouassi",
      newRole: "OPERATOR",
    },
  },
];
const accountSuspendedSamples = [
  {
    name: "company suspended, all operator staff notified",
    payload: {
      email: "op-staff@example.com",
      operatorName: "Operator Staff",
      companyName: "Probe Transport",
      phone: "+2250100000001",
    },
  },
];
const accountRestoredSamples = [
  {
    name: "owner notified on reactivation",
    payload: {
      email: "owner@example.com",
      ownerName: "Fatou Traoré",
      companyName: "Probe Transport",
    },
  },
];

/** Mirrors admin.ts withdrawal resolution + FORCE_FAIL fan-out (Phase 08). */
const withdrawalResolvedSamples = [
  {
    name: "settled payout",
    payload: {
      email: "owner@example.com",
      ownerName: "Fatou Traoré",
      companyName: "Probe Transport",
      transactionId: "WD-12345",
      amountXOF: 250000,
      status: "SETTLED",
      reason: "Bank transfer confirmed",
    },
  },
  {
    name: "failed payout (funds returned to receivable)",
    payload: {
      email: "owner@example.com",
      ownerName: "Fatou Traoré",
      companyName: "Probe Transport",
      transactionId: "WD-12346",
      amountXOF: 90000,
      status: "FAILED",
      reason: "Transfer rejected by bank",
    },
  },
];
const payoutFailedSamples = [
  {
    name: "FORCE_FAIL broadcast to platform admins",
    payload: {
      adminEmail: "admin@example.com",
      transactionId: "WD-12346",
      companyName: "Probe Transport",
      amountXOF: 90000,
      errorCode: "FORCE_FAIL",
      errorMessage: "Manually failed by super admin",
    },
  },
];

/** Mirrors release-escrow cron ops alert + operator.ts treasury alert (Phase 08). */
const treasuryFailureSamples = [
  {
    name: "escrow cron fallback/skip alert (platform-wide)",
    payload: {
      email: "admin@example.com",
      companyId: "platform",
      amountXOF: 3,
      transactionId: "release-escrow-cron",
      reason:
        "Escrow release ran with 2 booking(s) released via missing-snapshot fallback and 1 skipped (no fares). Review pricing snapshots.",
    },
  },
];

/** Mirrors lib/trip-arrival.ts (Phase 19 — CTA + schema now guarded). */
const reviewRequestSamples = [
  {
    name: "post-trip completion fan-out",
    payload: {
      email: "passenger@example.com",
      passengerName: "Awa Koné",
      companyName: "Probe Transport",
      originCity: "Abidjan",
      destinationCity: "Bouaké",
      originMunicipality: "Cocody",
      destinationMunicipality: null,
      tripId: "trip-1",
      bookingReference: "MR-ABC123",
    },
  },
];

/**
 * Mirrors enqueueDriverVerificationOutcome (outbox/driver-compliance.ts,
 * Phase 25 F-OP-09) — fired from admin.verifyDriver inside the flip tx.
 */
const verificationOutcomeSamples = [
  {
    name: "approve (no reason)",
    payload: {
      kind: "APPROVE",
      driverName: "Ibrahim Ouattara",
      email: "driver@example.com",
    },
  },
  {
    name: "reject with reason",
    payload: {
      kind: "REJECT",
      driverName: "Ibrahim Ouattara",
      reason: "License document illegible.",
      email: "driver@example.com",
    },
  },
  {
    name: "suspend with reason (email-less driver, in-app still delivers)",
    payload: {
      kind: "SUSPEND",
      driverName: "Awa Koné",
      reason: "Repeated safety complaints.",
    },
  },
];

/**
 * Phase 34 — mirrors discounts-admin.ts pauseCampaign →
 * notifyOperatorCampaignPaused (F-NF-12: the payload key is `pauseReason`;
 * the old `reason` key was Zod-stripped, delivering notices without the
 * reason line).
 */
const campaignPausedSamples = [
  {
    name: "admin pause with reason",
    payload: {
      campaignId: "camp-1",
      campaignName: "Weekend -10%",
      pauseReason: "Campaign paused by administrator",
    },
  },
  {
    name: "pause without reason (nullable optional)",
    payload: {
      campaignId: "camp-2",
      campaignName: "Referral boost",
    },
  },
];

/**
 * Phase 34 — mirrors trips.ts / drivers.ts → enqueueOperatorDriverAssignmentConflict
 * (F-NF-14: email omitted when absent; busyUntil now travels as ISO).
 */
const driverAssignmentConflictSamples = [
  {
    name: "operator with email",
    payload: {
      email: "dispatcher@utb.ci",
      firstName: "Awa",
      driverName: "Ibrahim Ouattara",
      delayedRoute: "Abidjan → Bouaké",
      conflictRoute: "Abidjan → Yamoussoukro",
      conflictCompany: "UTB Intercity",
      busyUntilIso: "2026-08-25T14:30:00.000Z",
      tripId: "trip-1",
    },
  },
  {
    name: "email-less operator (alert must still fire)",
    payload: {
      firstName: "Fatou",
      driverName: "Ibrahim Ouattara",
      delayedRoute: "Abidjan → Bouaké",
      conflictRoute: "Abidjan → Yamoussoukro",
      conflictCompany: null,
      busyUntilIso: "2026-08-25T14:30:00.000Z",
      tripId: "trip-2",
    },
  },
];

/**
 * Mirrors rebooking-service.ts (Phase 33 producer shape — the old
 * console.log stub's data, now routed through the outbox).
 */
const rebookedSamples = [
  {
    name: "operator rebooked onto next departure",
    payload: {
      email: "passenger@example.com",
      passengerName: "Awa Koné",
      oldBookingReference: "MB-8X2K4Q",
      newBookingReference: "MB-9Z3L7R",
      companyName: "Moja Express",
      departureTime: "mercredi 26 août 2026, 08:30",
      seatLabel: "12A",
    },
  },
  {
    name: "rebooking after delay with long names",
    payload: {
      email: "other@example.com",
      passengerName: "Marie-France Adjoua Kouamé-N'Guessan",
      oldBookingReference: "MB-1A2B3C",
      newBookingReference: "MB-4D5E6F",
      companyName: "Transport La Paillote",
      departureTime: "jeudi 27 août 2026, 18:45",
      seatLabel: "3B",
    },
  },
];

const CONTRACTS: ContractRow[] = [
  {
    workflowId: "passenger-rebooked",
    schema: passengerRebookedPayloadSchema,
    samples: rebookedSamples,
  },
  {
    workflowId: "passenger-review-request",
    schema: passengerReviewRequestPayloadSchema,
    samples: reviewRequestSamples,
  },
  {
    workflowId: "passenger-trip-cancelled",
    schema: passengerTripCancelledPayloadSchema,
    samples: tripCancelledSamples,
  },
  {
    workflowId: "passenger-trip-delayed",
    schema: passengerTripDelayedPayloadSchema,
    samples: tripDelayedSamples,
  },
  {
    workflowId: "staff-acceptance-alert",
    schema: staffAcceptanceAlertPayloadSchema,
    samples: staffAcceptanceSamples,
  },
  {
    workflowId: "passenger-profile-updated",
    schema: passengerProfileUpdatedPayloadSchema,
    samples: profileUpdatedSamples,
  },
  {
    workflowId: "passenger-review-submitted",
    schema: passengerReviewSubmittedPayloadSchema,
    samples: reviewSubmittedSamples,
  },
  {
    workflowId: "user-role-updated",
    schema: userRoleUpdatedPayloadSchema,
    samples: userRoleUpdatedSamples,
  },
  {
    workflowId: "operator-account-suspended",
    schema: operatorAccountSuspendedPayloadSchema,
    samples: accountSuspendedSamples,
  },
  {
    workflowId: "operator-account-restored",
    schema: operatorAccountRestoredPayloadSchema,
    samples: accountRestoredSamples,
  },
  {
    workflowId: "operator-withdrawal-resolved",
    schema: operatorWithdrawalResolvedPayloadSchema,
    samples: withdrawalResolvedSamples,
  },
  {
    workflowId: "admin-payout-failed",
    schema: adminPayoutFailedPayloadSchema,
    samples: payoutFailedSamples,
  },
  {
    workflowId: "admin-treasury-network-failure",
    schema: adminTreasuryNetworkFailurePayloadSchema,
    samples: treasuryFailureSamples,
  },
  {
    workflowId: "driver-verification-outcome",
    schema: driverVerificationOutcomePayloadSchema,
    samples: verificationOutcomeSamples,
  },
  {
    workflowId: "operator-campaign-paused",
    schema: operatorCampaignPausedPayloadSchema,
    samples: campaignPausedSamples,
  },
  {
    workflowId: "operator-driver-assignment-conflict",
    schema: operatorDriverAssignmentConflictPayloadSchema,
    samples: driverAssignmentConflictSamples,
  },
];

describe("notification payload contracts (enqueue ↔ payloadSchema)", () => {
  for (const contract of CONTRACTS) {
    describe(contract.workflowId, () => {
      for (const sample of contract.samples) {
        it(`accepts real producer payload: ${sample.name}`, () => {
          assert.doesNotThrow(() => contract.schema.parse(sample.payload));
        });
      }
    });
  }

  // Regression tripwires — the exact defect shapes from the v2 audit must
  // NEVER validate again.
  describe("audit-defect regression tripwires", () => {
    it("F-NF-01: cancelled payload without bookingReference is rejected", () => {
      const defective = {
        ...(tripCancelledSamples[0]?.payload ?? {}),
      } as Record<string, unknown>;
      defective["refundStatus"] = "success";
      delete defective["bookingReference"];
      delete defective["refundChannel"];
      assert.throws(() => passengerTripCancelledPayloadSchema.parse(defective));
    });

    it("F-NF-01: failed refund without numeric refundAmountXOF is rejected", () => {
      const defective = {
        ...(tripCancelledSamples[2]?.payload ?? {}),
      } as Record<string, unknown>;
      delete defective["refundAmountXOF"];
      delete defective["refundStatus"];
      assert.throws(() => passengerTripCancelledPayloadSchema.parse(defective));
    });

    it("F-NF-02: delayed payload without bookingReference is rejected", () => {
      const defective = {
        ...(tripDelayedSamples[0]?.payload ?? {}),
      } as Record<string, unknown>;
      delete defective["bookingReference"];
      assert.throws(() => passengerTripDelayedPayloadSchema.parse(defective));
    });
  });
});
