/**
 * Canonical ticket-token parser (Phase 02, F-PS-03 ≡ F-DV-02).
 *
 * Passenger QR codes encode a URL (`${APP_URL}/tickets/{token}`), so raw
 * camera output must be reduced to the durable token before any exact-match
 * lookup. Accepts every form that has shipped:
 *  - bare durable token
 *  - public ticket URL on ANY host (`/tickets/{token}`) — host-agnostic by
 *    design, APP_URL drift must not break gate scans
 *  - legacy verify URL (`?token=…`, path or relative)
 *  - JSON-wrapped client payloads ({"ticketToken":…} / {"token":…})
 *  - `pt.` presentation tokens — passed through verbatim; HMAC resolution is
 *    server-side (signed-access-tokens)
 * Never throws: malformed input falls back to the trimmed raw string, which
 * downstream lookups reject as NOT_FOUND.
 */
export function parseTicketToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed) as {
        ticketToken?: unknown;
        token?: unknown;
      };
      const inner = parsed.ticketToken ?? parsed.token;
      if (typeof inner === "string" && inner.trim()) {
        return inner.trim();
      }
    } catch {
      // Not valid JSON — fall through to token extraction
    }
  }

  const queryMatch = trimmed.match(/[?&]token=([^&]+)/);
  if (queryMatch?.[1]) {
    return safeDecode(queryMatch[1]);
  }

  // Host-agnostic path extraction via regex only — this package compiles
  // without DOM libs (`lib: ["ES2023"]`) and runs under Hermes, which has no
  // global URL constructor. The regex covers exactly what URL.pathname did:
  // `/tickets/{token}` on any host, excluding the legacy `/tickets/verify`.
  const ticketPathMatch = trimmed.match(
    /\/tickets\/(?!verify(?:\?|$))([^/?#]+)/,
  );
  if (ticketPathMatch?.[1]) {
    return safeDecode(ticketPathMatch[1]);
  }

  return trimmed;
}

/** decodeURIComponent that never throws on malformed percent-encoding. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
