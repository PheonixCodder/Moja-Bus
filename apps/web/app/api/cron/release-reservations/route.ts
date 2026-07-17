import { NextResponse } from "next/server";
import { getPrismaClient } from "@moja/db";

export async function GET(request: Request) {
  // Verify cron secret if in production
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env["CRON_SECRET"]}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();

  try {
    const expiredReservations = await prisma.walletReservation.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: new Date() },
      },
    });

    if (expiredReservations.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const { count } = await prisma.walletReservation.updateMany({
      where: {
        id: { in: expiredReservations.map((r: { id: string }) => r.id) },
        status: "ACTIVE",
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Release the reserved balance back to available for each expired reservation
    if (expiredReservations.length > 0) {
      await prisma.$transaction(
        expiredReservations.map((r) =>
          prisma.financialAccount.update({
            where: { id: r.accountId },
            data: {
              reservedBalance: { decrement: r.amount },
              availableBalance: { increment: r.amount },
            },
          })
        )
      );
    }

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Failed to release expired reservations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
