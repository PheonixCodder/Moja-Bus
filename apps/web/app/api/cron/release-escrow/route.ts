import { NextResponse } from "next/server";
import {
  getPrismaClient,
  FinancialAccountService,
  AccountingEngine,
  Prisma,
} from "@moja/db";
import { computeEscrowReleaseNet } from "@/lib/escrow-release";
import { getNovuClient } from "@/lib/novu";

export const runtime = "nodejs";

function assertCronAuth(request: Request): NextResponse | null {
  const secret = process.env["CRON_SECRET"];
  const authHeader = request.headers.get("authorization");
  // Fail closed whenever a secret is configured (all deployed envs).
  if (secret) {
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return null;
  }
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  return null;
}

export async function GET(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  const prisma = getPrismaClient();
  const now = new Date();
  const cutoff24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const cutoff48 = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // Platform commission is used only as a best-effort fallback when a
  // pricing snapshot is missing (see H3 below).
  const settings = await prisma.platformSettings.findUnique({
    where: { id: "default" },
  });
  const commissionBps = settings?.defaultCommissionBps ?? 500;

  // H2: include trips that are ARRIVED but never had `actualArrival` written
  // (e.g. a fast ARRIVED click that skipped the timestamp). Fall back to
  // `updatedAt` — the moment the status flipped to ARRIVED — once 48h have
  // passed, so the escrow is not locked forever.
  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      clearedAt: null,
      trip: {
        status: "ARRIVED",
        OR: [
          { actualArrival: { lt: cutoff24 } },
          { actualArrival: null, updatedAt: { lt: cutoff48 } },
        ],
      },
    },
    include: {
      holdGroup: {
        include: { pricingSnapshot: true },
      },
      trip: {
        select: {
          id: true,
          status: true,
          actualArrival: true,
          updatedAt: true,
        },
      },
    },
    take: 500,
  });

  if (bookings.length === 0) {
    return NextResponse.json({ success: true, releasedCount: 0, skipped: 0 });
  }

  const accountService = new FinancialAccountService(prisma);
  let releasedCount = 0;
  let skipped = 0;
  // Bookings released via the H3 fallback path (snapshot missing) — ops should review.
  let fallbackCount = 0;

  type HgBucket = {
    companyId: string;
    bookingIds: string[];
    snapshot: { operatorNetXOF: number; seatCount: number } | null;
    farePaidSum: number;
  };

  const byHoldGroup = new Map<string, HgBucket>();
  // trips whose actualArrival is null and must be backfilled to updatedAt (H2)
  const tripsToFix = new Map<string, Date>();

  for (const booking of bookings) {
    const hgId = booking.holdGroupId ?? booking.id;
    const existing = byHoldGroup.get(hgId) ?? {
      companyId: booking.companyId,
      bookingIds: [],
      snapshot: booking.holdGroup?.pricingSnapshot
        ? {
            operatorNetXOF: booking.holdGroup.pricingSnapshot.operatorNetXOF,
            seatCount: booking.holdGroup.pricingSnapshot.seatCount,
          }
        : null,
      farePaidSum: 0,
    };
    existing.bookingIds.push(booking.id);
    existing.farePaidSum += booking.farePaid;
    if (!existing.snapshot && booking.holdGroup?.pricingSnapshot) {
      existing.snapshot = {
        operatorNetXOF: booking.holdGroup.pricingSnapshot.operatorNetXOF,
        seatCount: booking.holdGroup.pricingSnapshot.seatCount,
      };
    }
    byHoldGroup.set(hgId, existing);

    const trip = booking.trip;
    if (trip && trip.actualArrival == null) {
      tripsToFix.set(trip.id, trip.updatedAt);
    }
  }

  // H2: backfill actualArrival = updatedAt for any ARRIVED trip missing it.
  // Idempotent — guarded by `actualArrival: null`.
  if (tripsToFix.size > 0) {
    await Promise.all(
      Array.from(tripsToFix.entries()).map(([tripId, ts]) =>
        prisma.trip.updateMany({
          where: { id: tripId, actualArrival: null },
          data: { actualArrival: ts },
        }),
      ),
    );
  }

  for (const [hgId, hg] of byHoldGroup.entries()) {
    try {
      const cancelledCount = hg.snapshot
        ? await prisma.booking.count({
            where: { holdGroupId: hgId, status: "CANCELLED" },
          })
        : 0;

      let net: number | null;
      if (hg.snapshot) {
        net = computeEscrowReleaseNet({
          seatCountReleasing: hg.bookingIds.length,
          cancelledCount,
          snapshot: hg.snapshot,
        });
      } else {
        // H3: no pricing snapshot. Best-effort net from the fares actually
        // paid, applying the platform commission rate. This keeps operator
        // money moving instead of stranding it in escrow forever. Flagged for
        // ops review below.
        const gross = hg.farePaidSum;
        net =
          gross > 0
            ? Math.max(
                0,
                Math.round((gross * (10000 - commissionBps)) / 10000),
              )
            : null;
        if (net !== null) fallbackCount += hg.bookingIds.length;
      }

      if (net === null) {
        console.error(
          `[release-escrow] Skipping hold group ${hgId}: missing pricing snapshot and no fares to derive a net`,
        );
        skipped += hg.bookingIds.length;
        continue;
      }

      if (net === 0) {
        // Still mark cleared so we do not retry forever
        const cleared = await prisma.booking.updateMany({
          where: { id: { in: hg.bookingIds }, clearedAt: null },
          data: { clearedAt: now },
        });
        releasedCount += cleared.count;
        continue;
      }

      const operatorAcct =
        await accountService.getOperatorReceivableAccount(hg.companyId);

      await prisma.$transaction(async (tx) => {
        // Advisory lock per company to prevent concurrent escrow releases for the same tenant
        // Uses a hash of the companyId to generate a 64-bit bigint for the lock
        const hashStr = hg.companyId.replace(/[^0-9a-f]/gi, "").slice(0, 15);
        const lockId = parseInt(hashStr, 16) || 1;
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockId})`;

        // Lock candidate rows still uncleared
        const stillOpen = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM "booking"
          WHERE id IN (${Prisma.join(hg.bookingIds)}) AND "clearedAt" IS NULL
          FOR UPDATE
        `;

        if (stillOpen.length === 0) {
          return;
        }

        const openIds = stillOpen.map((b) => b.id);
        const effectiveNet =
          openIds.length === hg.bookingIds.length
            ? net
            : Math.round((net * openIds.length) / hg.bookingIds.length);

        if (effectiveNet > 0) {
          const engine = new AccountingEngine("ESCROW_RELEASE", {
            description: `Escrow release for hold group ${hgId}`,
            idempotencyKey: `ESCROW_RELEASE_${hgId}_${[...openIds].sort().join(",")}`,
            metadata: {
              holdGroupId: hgId,
              bookingIds: openIds,
              clearedCount: openIds.length,
              amountXOF: effectiveNet,
              snapshotFallback: !hg.snapshot,
            },
          });

          engine.addDebit({
            accountId: operatorAcct.id,
            amount: effectiveNet,
            sequenceNumber: 1,
            releaseFromReserve: true,
            referenceType: "HOLD_GROUP",
            referenceId: hgId,
            description: "Release operator escrow from reserved",
          });
          engine.addCredit({
            accountId: operatorAcct.id,
            amount: effectiveNet,
            sequenceNumber: 2,
            referenceType: "HOLD_GROUP",
            referenceId: hgId,
            description: "Operator escrow now available",
          });

          engine.validate();
          await engine.commit(tx as any);
        }

        const cleared = await tx.booking.updateMany({
          where: { id: { in: openIds }, clearedAt: null },
          data: { clearedAt: now },
        });
        releasedCount += cleared.count;
      });
    } catch (err) {
      console.error(`[release-escrow] Failed for hold group ${hgId}:`, err);
    }
  }

  // H3: alert ops whenever we had to fall back (missing snapshots) or skipped.
  const novu = getNovuClient();
  if ((skipped > 0 || fallbackCount > 0) && novu) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { email: true, id: true },
      });
      await Promise.all(
        admins
          .filter((a) => a.email)
          .map((a) =>
            novu
              .trigger({
                workflowId: "admin-treasury-network-failure",
                to: {
                  subscriberId: a.email,
                  email: a.email,
                },
                payload: {
                  email: a.email,
                  companyId: "platform",
                  amountXOF: fallbackCount,
                  transactionId: "release-escrow-cron",
                  reason: `Escrow release ran with ${fallbackCount} booking(s) released via missing-snapshot fallback and ${skipped} skipped (no fares). Review pricing snapshots.`,
                },
                transactionId: `admin-treasury-network-failure-cron-${Date.now()}-${a.id}`,
              })
              .catch(() => {}),
          ),
      );
    } catch (err) {
      console.error("[release-escrow] Failed to alert ops:", err);
    }
  }

  return NextResponse.json({
    success: true,
    releasedCount,
    skipped,
    fallbackCount,
  });
}
