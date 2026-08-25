import { NextResponse } from "next/server";
import { getPrismaClient } from "@moja/db";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { companyOperatorRecipients } from "@/features/notifications/company-recipients";
import {
  enqueueOfferExpired,
  enqueueOfferExpiringSoon,
} from "@/features/notifications/outbox/driver-offers";

export const runtime = "nodejs";

/**
 * Phase 11 — Employment offer lifecycle cron.
 * 1. Expires due PENDING/COUNTERED offers (+ authoritative EXPIRED audit events).
 * 2. Notifies both parties of expirations (outbox-deduped by idempotency key).
 * 3. 24h "expiring soon" lookahead for still-live offers.
 */
export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const prisma = getPrismaClient();
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // ------------------------------------------------------------------
    // 1 + 2. Expire due offers and notify both sides exactly once
    // ------------------------------------------------------------------
    const dueOffers = await prisma.driverEmploymentOffer.findMany({
      where: {
        status: { in: ["PENDING", "COUNTERED"] },
        expiresAt: { lt: now },
      },
      include: {
        company: { select: { name: true } },
        driverProfile: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
      take: 100,
    });

    let expiredCount = 0;
    for (const offer of dueOffers) {
      const flipped = await prisma.$transaction(async (tx: any) => {
        // Claim-style guard: only flip if still live
        const claimed = await tx.driverEmploymentOffer.updateMany({
          where: {
            id: offer.id,
            status: { in: ["PENDING", "COUNTERED"] },
            expiresAt: { lt: now },
          },
          data: { status: "EXPIRED", resolvedAt: now },
        });
        if (claimed.count === 0) return false;

        await tx.driverOfferEvent.create({
          data: {
            offerId: offer.id,
            eventType: "EXPIRED",
            actorType: "SYSTEM",
            salaryCFA: offer.currentSalaryCFA,
          },
        });

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

        const operatorRecipients = await companyOperatorRecipients(tx, offer.companyId);
        for (const to of operatorRecipients) {
          await enqueueOfferExpired(tx as never, {
            offerId: offer.id,
            role: "OPERATOR",
            to,
            counterpartyName: driverUser.fullName ?? "",
          });
        }

        return true;
      });
      if (flipped) expiredCount += 1;
    }

    // ------------------------------------------------------------------
    // 3. Expiring-soon lookahead (deduped by outbox idempotency keys)
    // ------------------------------------------------------------------
    const soonOffers = await prisma.driverEmploymentOffer.findMany({
      where: {
        status: { in: ["PENDING", "COUNTERED"] },
        expiresAt: { gte: now, lte: in24h },
      },
      include: {
        company: { select: { name: true } },
        driverProfile: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
      take: 200,
    });

    let remindedCount = 0;
    for (const offer of soonOffers) {
      const hoursLeft = Math.max(
        1,
        Math.ceil((offer.expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000)),
      );
      const dUser = offer.driverProfile.user;
      await enqueueOfferExpiringSoon(prisma as never, {
        offerId: offer.id,
        role: "DRIVER",
        to: {
          subscriberId: dUser.id,
          ...(dUser.email ? { email: dUser.email } : {}),
          ...(dUser.fullName ? { firstName: dUser.fullName.split(" ")[0] } : {}),
        },
        counterpartyName: offer.company.name,
        hoursLeft,
      });

      const operatorRecipients = await companyOperatorRecipients(prisma, offer.companyId);
      for (const to of operatorRecipients) {
        await enqueueOfferExpiringSoon(prisma as never, {
          offerId: offer.id,
          role: "OPERATOR",
          to,
          counterpartyName: dUser.fullName ?? "",
          hoursLeft,
        });
      }
      remindedCount += 1;
    }

    return NextResponse.json({
      success: true,
      expired: expiredCount,
      expiringSoonReminders: remindedCount,
    });
  } catch (error) {
    console.error("expire-offers cron failed:", error);
    return NextResponse.json({ error: "expire-offers failed" }, { status: 500 });
  }
}
