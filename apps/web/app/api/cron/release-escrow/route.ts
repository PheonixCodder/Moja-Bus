import { NextResponse } from "next/server";
import { getPrismaClient } from "@moja/db";
import { FinancialAccountService } from "@moja/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env["CRON_SECRET"]}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();
  const now = new Date();

  // Find all confirmed bookings whose trip has departed and escrow not yet released
  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      clearedAt: null,
      trip: { departureDate: { lt: now } },
    },
    include: {
      holdGroup: {
        include: { pricingSnapshot: true },
      },
    },
    take: 500, // Process in batches to avoid timeout
  });

  if (bookings.length === 0) {
    return NextResponse.json({ success: true, releasedCount: 0 });
  }

  const accountService = new FinancialAccountService(prisma);
  let releasedCount = 0;

  // Group by holdGroup to calculate exact remainders correctly without multiplier bugs
  const byHoldGroup = new Map<string, { companyId: string, bookingIds: string[], snapshot: any, farePaidSum: number }>();
  
  for (const booking of bookings) {
    const hgId = booking.holdGroupId ?? booking.id;
    const existing = byHoldGroup.get(hgId) ?? {
      companyId: booking.companyId,
      bookingIds: [],
      snapshot: booking.holdGroup?.pricingSnapshot,
      farePaidSum: 0
    };
    existing.bookingIds.push(booking.id);
    existing.farePaidSum += booking.farePaid;
    byHoldGroup.set(hgId, existing);
  }

  // Group by companyId to batch account lookups
  const byCompany = new Map<string, { bookingIds: string[]; totalNet: number }>();

  for (const [hgId, hg] of byHoldGroup.entries()) {
    let netForTheseBookings = hg.farePaidSum;
    
    if (hg.snapshot) {
       // We are clearing `hg.bookingIds.length` seats.
       // How many seats are CANCELLED? (they were already refunded)
       const cancelledCount = await prisma.booking.count({
          where: { holdGroupId: hgId, status: "CANCELLED" }
       });
       const standardNet = Math.round(hg.snapshot.operatorNetXOF / hg.snapshot.seatCount);
       
       const isReleasingLastSeat = (cancelledCount + hg.bookingIds.length) === hg.snapshot.seatCount;
       
       if (isReleasingLastSeat) {
          // The total net to release for these bookings is the total group net MINUS what was already refunded
          netForTheseBookings = hg.snapshot.operatorNetXOF - (cancelledCount * standardNet);
       } else {
          // Just release the standard cut for each of these bookings
          netForTheseBookings = hg.bookingIds.length * standardNet;
       }
    }

    const existing = byCompany.get(hg.companyId) ?? { bookingIds: [], totalNet: 0 };
    existing.bookingIds.push(...hg.bookingIds);
    existing.totalNet += netForTheseBookings;
    byCompany.set(hg.companyId, existing);
  }

  for (const [companyId, { bookingIds, totalNet }] of byCompany.entries()) {
    try {
      const operatorAcct = await accountService.getOperatorReceivableAccount(companyId);
      await prisma.$transaction([
        prisma.financialAccount.update({
          where: { id: operatorAcct.id },
          data: {
            reservedBalance: { decrement: totalNet },
            availableBalance: { increment: totalNet },
          },
        }),
        prisma.booking.updateMany({
          where: { id: { in: bookingIds } },
          data: { clearedAt: now },
        }),
      ]);
      releasedCount += bookingIds.length;
    } catch (err) {
      console.error(`[release-escrow] Failed for company ${companyId}:`, err);
    }
  }

  return NextResponse.json({ success: true, releasedCount });
}
