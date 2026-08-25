import { getPrismaClient } from "@moja/db";
import { buildBookingSuccessUrl } from "@/features/payments/lib/booking-success-url";
import {
  CHECKOUT_SESSION_COOKIE,
  verifyCheckoutSession,
} from "@/features/payments/lib/signed-access-tokens";
import { PaymentService } from "@/features/payments/payment-service";
import { getAppOrigin } from "@/lib/app-origin";

export const runtime = "nodejs";

function localePrefix(locale: string | null | undefined): string {
  return locale && locale !== "en" ? `/${locale}` : "";
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=") || null;
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");
  const holdGroupIdParam = searchParams.get("holdGroupId");
  const localeParam = searchParams.get("locale");

  if (!reference) {
    return Response.json(
      { message: "Missing payment reference" },
      { status: 400 },
    );
  }

  const prisma = getPrismaClient();
  const paymentService = new PaymentService(prisma);

  // Resolve hold early so we can validate the checkout session (P1-20).
  const payment = await prisma.externalPayment.findFirst({
    where: { paystackReference: reference },
    select: { holdGroupId: true },
  });
  const holdGroupId = holdGroupIdParam ?? payment?.holdGroupId ?? null;

  const sessionCookie = readCookie(request, CHECKOUT_SESSION_COOKIE);
  const session = holdGroupId
    ? verifyCheckoutSession(sessionCookie, holdGroupId)
    : null;

  const locale = session?.locale ?? localeParam ?? "en";
  const prefix = localePrefix(locale);
  const appOrigin = getAppOrigin(new URL(request.url).origin);

  if (!holdGroupId || !session) {
    const failurePath = `${prefix}/dashboard/bookings?payment=failed&message=${encodeURIComponent(
      "Checkout session expired or invalid. Open your bookings to retry.",
    )}`;
    return Response.redirect(new URL(failurePath, appOrigin));
  }

  try {
    const confirmed = await paymentService.verifyAndConfirmForUser(
      reference,
      session.userId,
    );
    const holdGroup = await prisma.holdGroup.findUnique({
      where: { id: holdGroupId },
      select: { offerId: true, seatCount: true },
    });

    const redirectPath = holdGroup?.offerId
      ? buildBookingSuccessUrl(
          holdGroup.offerId,
          confirmed,
          holdGroup.seatCount,
          locale,
        )
      : `${prefix}/dashboard/bookings?paid=1`;

    return Response.redirect(new URL(redirectPath, appOrigin));
  } catch (error) {
    console.error("Payment verify error:", error);
    const message =
      error instanceof Error ? error.message : "Payment verification failed";
    const failurePath = `${prefix}/dashboard/bookings?payment=failed&message=${encodeURIComponent(message)}`;
    return Response.redirect(new URL(failurePath, appOrigin));
  }
}
