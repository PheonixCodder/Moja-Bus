/**
 * Extract ticket token from a raw QR value, public ticket URL, or legacy verify URL.
 */
export function parseTicketToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return trimmed;
  }

  const queryMatch = trimmed.match(/[?&]token=([^&]+)/);
  if (queryMatch?.[1]) {
    return decodeURIComponent(queryMatch[1]);
  }

  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get("token");
    if (fromQuery) {
      return fromQuery;
    }
    const pathToken = url.pathname.match(/\/tickets\/([^/?#]+)/)?.[1];
    if (pathToken && pathToken !== "verify") {
      return decodeURIComponent(pathToken);
    }
  } catch {
    // Not a full URL — fall through
  }

  const ticketPathMatch = trimmed.match(/\/tickets\/(?!verify(?:\?|$))([^/?#]+)/);
  if (ticketPathMatch?.[1]) {
    return decodeURIComponent(ticketPathMatch[1]);
  }

  return trimmed;
}
