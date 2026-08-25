import { getPrismaClient } from "@moja/db";
import { NextResponse } from "next/server";
import { companyOperatorRecipients } from "@/features/notifications/company-recipients";
import { enqueueDriverLicenseStatus } from "@/features/notifications/outbox/driver-compliance";
import { assertCronAuthorized } from "@/lib/cron-auth";

export const runtime = "nodejs";

const WARNING_WINDOW_DAYS = 30;

/**
 * Phase 14 (F-OP-03/F-DV-12) — nightly licence compliance lifecycle:
 *   1. Flip VERIFIED → EXPIRED for lapsed licences (one-way transition, so
 *      the EXPIRED notice fires exactly once per lapse).
 *   2. Warn drivers + active-roster operators at ≤30 days out. Dedupe is the
 *      monthly bucket in the transactionId — no warned-state column needed.
 *
 * Notices ride the OUTBOX (not direct Novu triggers) so a Novu hiccup at
 * 02:45 retries with backoff instead of silently losing a compliance alert.
 *
 * Gates consuming these states live in assignDriver / listAssignableDrivers /
 * getMyUrgentDispatches / startTrip / toggleShift (Phase 14).
 */
export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const prisma = getPrismaClient();
  const now = new Date();
  const soonCutoff = new Date(
    now.getTime() + WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  let flipped = 0;
  let notified = 0;

  // ---- 1. Expire lapsed licences (VERIFIED → EXPIRED only) ----
  const lapsed = await prisma.driverProfile.findMany({
    where: {
      verificationStatus: "VERIFIED",
      licenseExpiryDate: { lt: now },
    },
    select: {
      id: true,
      licenseExpiryDate: true,
      user: { select: { id: true, fullName: true, email: true } },
      companyAffiliations: {
        where: { isActive: true },
        include: { company: { select: { name: true } } },
      },
    },
  });

  if (lapsed.length > 0) {
    await prisma.driverProfile.updateMany({
      where: {
        id: { in: lapsed.map((d) => d.id) },
        verificationStatus: "VERIFIED", // re-guard: single flip even under races
      },
      data: { verificationStatus: "EXPIRED" },
    });
    flipped = lapsed.length;
  }

  // ---- 2. Expiring-soon warnings (monthly-bucket dedupe) ----
  const expiringSoon = await prisma.driverProfile.findMany({
    where: {
      verificationStatus: "VERIFIED",
      licenseExpiryDate: { gte: now, lt: soonCutoff },
    },
    select: {
      id: true,
      licenseExpiryDate: true,
      user: { select: { id: true, fullName: true, email: true } },
      companyAffiliations: {
        where: { isActive: true },
        include: { company: { select: { name: true } } },
      },
    },
  });

  type Notice = {
    kind: "EXPIRING_SOON" | "EXPIRED";
    to: { subscriberId: string; email?: string };
    driverName: string;
    expiryDateIso: string;
    companyName?: string | null;
  };

  const notices: Array<Notice & { driverId: string }> = [];

  for (const d of [...lapsed, ...expiringSoon]) {
    const kind =
      d.licenseExpiryDate && d.licenseExpiryDate < now
        ? "EXPIRED"
        : "EXPIRING_SOON";
    const expiryIso = (d.licenseExpiryDate ?? now).toISOString().slice(0, 10);
    notices.push({
      driverId: d.id,
      kind,
      to: {
        subscriberId: d.user.id,
        ...(d.user.email ? { email: d.user.email } : {}),
      },
      driverName: d.user.fullName ?? "Driver",
      expiryDateIso: expiryIso,
    });
    for (const aff of d.companyAffiliations) {
      try {
        const operators = await companyOperatorRecipients(
          prisma,
          aff.companyId,
        );
        for (const op of operators) {
          notices.push({
            driverId: d.id,
            kind,
            to: op,
            driverName: d.user.fullName ?? "Driver",
            expiryDateIso: expiryIso,
            companyName: aff.company?.name ?? null,
          });
        }
      } catch (err) {
        console.error("[expire-driver-licenses] operator lookup failed:", err);
      }
    }
  }

  for (const n of notices) {
    try {
      await enqueueDriverLicenseStatus(prisma, {
        driverId: n.driverId,
        kind: n.kind,
        to: n.to,
        driverName: n.driverName,
        expiryDateIso: n.expiryDateIso,
        companyName: n.companyName ?? null,
        now,
      });
      notified += 1;
    } catch (err) {
      console.error("[expire-driver-licenses] enqueue failed:", err);
    }
  }

  return NextResponse.json({
    success: true,
    flipped,
    notified,
  });
}
