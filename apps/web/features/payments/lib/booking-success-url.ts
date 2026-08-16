import type { ConfirmedBookingResult } from "@moja/types";
import { signTicketPresentationToken } from "./signed-access-tokens";

export function buildBookingSuccessUrl(
  offerId: string,
  confirmed: ConfirmedBookingResult,
  passengerCount?: number,
  locale?: string,
): string {
  // P1-9: never put durable ticketToken in the URL — short-lived presentation only.
  const presentationTokens = confirmed.ticketTokens.map((t) =>
    signTicketPresentationToken(t),
  );
  const params = new URLSearchParams({
    refs: confirmed.bookingReferences.join(","),
    pt: presentationTokens.join(","),
    total: String(confirmed.totalAmountXOF),
    passengers: String(
      passengerCount ?? confirmed.bookingReferences.length,
    ),
  });

  const path = `/book/${encodeURIComponent(offerId)}/success?${params.toString()}`;
  if (locale && locale !== "en") {
    return `/${locale}${path}`;
  }
  return path;
}
