import { createHmac, timingSafeEqual } from "crypto";

/**
 * Phase 16 (P1-4) — short-lived dispatch tokens for telemetry ingest.
 *
 * Stateless HMAC design: `base64url(claims).base64url(sig)` where claims bind
 * the token to one driverProfileId + optional tripId with a hard expiry. No DB
 * round-trip on the hot path; forgery and expiry are both rejected locally.
 *
 * Enforcement semantics mirror cron-auth: fail-open only when no secret is
 * configured AND we are not in production (dev convenience); production without
 * a secret rejects everything so misconfiguration is loud, never silent.
 */

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function getSecret(): string | null {
  const secret =
    process.env["TELEMETRY_TOKEN_SECRET"] ??
    process.env["BETTER_AUTH_SECRET"] ??
    null;
  return secret && secret.length > 0 ? secret : null;
}

export function isTelemetryAuthEnforced(): boolean {
  return !!getSecret() || process.env.NODE_ENV === "production";
}

export interface TelemetryDispatchClaims {
  /** driverProfileId subject */
  d: string;
  /** bound tripId */
  t?: string;
  /**
   * Phase 11 (F-TM-02) — company owning the bound trip, resolved at mint.
   * Derives the operator fleet channel (`operator:{c}:fleet`) and room ACL
   * from signed claims instead of client-supplied query params. Optional for
   * backward compatibility with pre-Phase-11 tokens (24 h TTL).
   */
  c?: string;
  /** expiry epoch ms */
  exp: number;
}

/** Rooms a dispatch-token holder may ever see. Pure + unit-tested. */
export function isRoomAllowedForClaims(
  room: string,
  claims: Pick<TelemetryDispatchClaims, "t"> | null,
): boolean {
  if (!claims?.t) return false;
  return room === `trip:${claims.t}`;
}

export function mintTelemetryDispatchTokenWithCompany(
  driverProfileId: string,
  args: { tripId?: string | null; companyId?: string | null; ttlMs?: number },
): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error(
      "Telemetry token secret is not configured (TELEMETRY_TOKEN_SECRET or BETTER_AUTH_SECRET).",
    );
  }
  const claims: TelemetryDispatchClaims = {
    d: driverProfileId,
    ...(args.tripId ? { t: args.tripId } : {}),
    ...(args.companyId ? { c: args.companyId } : {}),
    exp: Date.now() + (args.ttlMs ?? TOKEN_TTL_MS),
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyTelemetryDispatchToken(
  token: string | null | undefined,
): TelemetryDispatchClaims | null {
  const secret = getSecret();
  if (!secret || !token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const payload = parts[0];
  const sig = parts[1];
  if (!payload || !sig) return null;

  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  const given = Buffer.from(sig);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return null;
  }

  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as TelemetryDispatchClaims;
    if (typeof claims.d !== "string" || typeof claims.exp !== "number")
      return null;
    if (Date.now() > claims.exp) return null;
    if (claims.t !== undefined && typeof claims.t !== "string") return null;
    // Phase 11 — legacy tokens legitimately lack `c`; a present one must be
    // well-formed or the token is rejected outright.
    if (claims.c !== undefined && typeof claims.c !== "string") return null;
    return claims;
  } catch {
    return null;
  }
}
