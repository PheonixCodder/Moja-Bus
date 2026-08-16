import { createHmac, timingSafeEqual } from "node:crypto";
import { getOptionalEnv } from "@moja/config";

const TICKET_PRESENTATION_TTL_MS = 60 * 60 * 1000; // 1 hour
const CHECKOUT_SESSION_TTL_MS = 30 * 60 * 1000; // 30 min
const VERSION = 1 as const;

function secret(): string {
  const s =
    getOptionalEnv("BETTER_AUTH_SECRET") ??
    getOptionalEnv("CHECKOUT_QUOTE_SECRET");
  if (!s) {
    throw new Error(
      "BETTER_AUTH_SECRET or CHECKOUT_QUOTE_SECRET required for signed tokens",
    );
  }
  return s;
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function signBody(body: string): string {
  return b64url(createHmac("sha256", secret()).update(body).digest());
}

function verifySig(body: string, sig: string): boolean {
  try {
    const expected = createHmac("sha256", secret()).update(body).digest();
    const actual = fromB64url(sig);
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
}

export type TicketPresentationPayload = {
  v: typeof VERSION;
  /** Durable ticket bearer — never put this in a long-lived URL alone. */
  ticketToken: string;
  exp: number;
};

/** Short-lived signed token for success pages / shared QR grace links (P1-9). */
export function signTicketPresentationToken(
  ticketToken: string,
  ttlMs = TICKET_PRESENTATION_TTL_MS,
): string {
  const payload: TicketPresentationPayload = {
    v: VERSION,
    ticketToken,
    exp: Date.now() + ttlMs,
  };
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  return `pt.${body}.${signBody(body)}`;
}

/**
 * Resolve a presentation token, or accept a raw durable ticketToken during
 * grace period (existing shared QR links). Returns null if invalid/expired.
 */
export function resolveTicketAccessToken(
  raw: string,
): { ticketToken: string; presentation: boolean } | null {
  if (raw.startsWith("pt.")) {
    const parts = raw.split(".");
    if (parts.length !== 3 || !parts[1] || !parts[2]) return null;
    if (!verifySig(parts[1], parts[2])) return null;
    try {
      const payload = JSON.parse(
        fromB64url(parts[1]).toString("utf8"),
      ) as TicketPresentationPayload;
      if (payload.v !== VERSION || typeof payload.ticketToken !== "string") {
        return null;
      }
      if (Date.now() > payload.exp) return null;
      return { ticketToken: payload.ticketToken, presentation: true };
    } catch {
      return null;
    }
  }
  // Grace: raw durable token still works for operator scanners / old links.
  if (raw.length >= 16) {
    return { ticketToken: raw, presentation: false };
  }
  return null;
}

export type CheckoutSessionPayload = {
  v: typeof VERSION;
  holdGroupId: string;
  userId: string;
  locale?: string;
  exp: number;
};

export function signCheckoutSession(input: {
  holdGroupId: string;
  userId: string;
  locale?: string;
  ttlMs?: number;
}): string {
  const payload: CheckoutSessionPayload = {
    v: VERSION,
    holdGroupId: input.holdGroupId,
    userId: input.userId,
    ...(input.locale ? { locale: input.locale } : {}),
    exp: Date.now() + (input.ttlMs ?? CHECKOUT_SESSION_TTL_MS),
  };
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  return `${body}.${signBody(body)}`;
}

export function checkoutSessionCookieValue(token: string): string {
  const maxAge = Math.floor(CHECKOUT_SESSION_TTL_MS / 1000);
  const secure =
    process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${CHECKOUT_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function verifyCheckoutSession(
  token: string | undefined | null,
  holdGroupId: string,
): CheckoutSessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  if (!verifySig(parts[0], parts[1])) return null;
  try {
    const payload = JSON.parse(
      fromB64url(parts[0]).toString("utf8"),
    ) as CheckoutSessionPayload;
    if (payload.v !== VERSION) return null;
    if (Date.now() > payload.exp) return null;
    if (payload.holdGroupId !== holdGroupId) return null;
    return payload;
  } catch {
    return null;
  }
}

export const CHECKOUT_SESSION_COOKIE = "moja_checkout_session";
