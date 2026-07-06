import type { ConfirmedBookingResult } from "@moja/types";

export function buildBookingSuccessUrl(
  offerId: string,
  confirmed: ConfirmedBookingResult,
  passengerCount?: number,
): string {
  const params = new URLSearchParams({
    refs: confirmed.bookingReferences.join(","),
    tokens: confirmed.ticketTokens.join(","),
    total: String(confirmed.totalAmountXOF),
    passengers: String(
      passengerCount ?? confirmed.bookingReferences.length,
    ),
  });

  return `/book/${encodeURIComponent(offerId)}/success?${params.toString()}`;
}
