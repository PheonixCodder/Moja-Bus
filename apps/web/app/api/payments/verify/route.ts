import { getPrismaClient } from "@moja/db";
import { PaymentService } from "@/features/payments/payment-service";
import { buildBookingSuccessUrl } from "@/features/payments/lib/booking-success-url";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");
  const holdGroupId = searchParams.get("holdGroupId");

  if (!reference) {
    return Response.json({ message: "Missing payment reference" }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const paymentService = new PaymentService(prisma);

  try {
    const confirmed = await paymentService.verifyAndConfirm(reference);
    const holdGroup = await prisma.holdGroup.findUnique({
      where: { id: holdGroupId ?? confirmed.holdId },
      select: { offerId: true, seatCount: true },
    });

    const redirectPath = holdGroup?.offerId
      ? buildBookingSuccessUrl(holdGroup.offerId, confirmed, holdGroup.seatCount)
      : `/dashboard/bookings?paid=1`;

    return Response.redirect(new URL(redirectPath, request.url));
  } catch (error) {
    console.error("Payment verify error:", error);
    const message =
      error instanceof Error ? error.message : "Payment verification failed";
    const failurePath = `/dashboard/bookings?payment=failed&message=${encodeURIComponent(message)}`;
    return Response.redirect(new URL(failurePath, request.url));
  }
}
