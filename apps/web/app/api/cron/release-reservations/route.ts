import { NextResponse } from "next/server";
import { getPrismaClient } from "@moja/db";
import { assertCronAuthorized } from "@/lib/cron-auth";

export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const prisma = getPrismaClient();

  try {
    // 1) Flip newly-expired ACTIVE reservations to EXPIRED (idempotent — guarded
    //    by `status: "ACTIVE"`, so concurrent runs don't double-flip).
    await prisma.walletReservation.updateMany({
      where: { status: "ACTIVE", expiresAt: { lt: new Date() } },
      data: { status: "EXPIRED" },
    });

    // 2) Collect EXPIRED reservations whose balance has NOT yet been released.
    //    This also covers the crash-recovery case: a reservation left EXPIRED but
    //    releasedAt: null by a prior run that died before releasing is retried here.
    const toRelease = await prisma.walletReservation.findMany({
      where: { status: "EXPIRED", releasedAt: null },
      select: { id: true, accountId: true, amount: true },
    });

    if (toRelease.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // 3) Exactly-once release. For each reservation, atomically claim it via the
    //    `releasedAt: null` guard. Only the run that wins the claim (count === 1)
    //    releases the balance. Prisma's increment/decrement emit atomic SQL
    //    (`SET x = x + ?`), so concurrent releases on the SAME account from
    //    different reservations cannot lose updates. No FOR UPDATE needed.
    const now = new Date();
    let released = 0;
    await prisma.$transaction(async (tx) => {
      for (const r of toRelease) {
        const claimed = await tx.walletReservation.updateMany({
          where: { id: r.id, releasedAt: null },
          data: { releasedAt: now },
        });

        if (claimed.count === 1) {
          await tx.financialAccount.update({
            where: { id: r.accountId },
            data: {
              reservedBalance: { decrement: r.amount },
              availableBalance: { increment: r.amount },
            },
          });
          released++;
        }
      }
    });

    return NextResponse.json({ success: true, count: released });
  } catch (error) {
    console.error("Failed to release expired reservations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
