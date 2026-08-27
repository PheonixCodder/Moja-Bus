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
  role?: "driver";
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

export interface OperatorSubscriptionClaims {
  role: "operator";
  /** userId subject */
  sub: string;
  /** companyId */
  c: string;
  /** expiry epoch ms */
  exp: number;
}

export interface PassengerTrackingClaims {
  role: "passenger";
  /** userId subject */
  u: string;
  /** bound tripId */
  t: string;
  /** expiry epoch ms */
  exp: number;
}

export type TelemetryTokenClaims =
  | TelemetryDispatchClaims
  | OperatorSubscriptionClaims
  | PassengerTrackingClaims;

/** Rooms a token holder may subscribe to. Pure + unit-tested. */
export function isRoomAllowedForClaims(
  room: string,
  claims:
    | TelemetryTokenClaims
    | Pick<TelemetryDispatchClaims, "t">
    | null
    | undefined,
): boolean {
  if (!claims) return false;

  // Passenger can only subscribe to their own bound trip room
  if ("role" in claims && claims.role === "passenger") {
    return room === `trip:${claims.t}`;
  }

  // Operator fleet rooms are granted server-side on connect; client subscribe is rejected
  if ("role" in claims && claims.role === "operator") {
    return false;
  }

  // Driver (explicit role or legacy dispatch claims with t)
  if ("t" in claims && typeof claims.t === "string" && claims.t.length > 0) {
    return room === `trip:${claims.t}`;
  }

  return false;
}

function signHmacPayload(payloadObj: object): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error(
      "Telemetry token secret is not configured (TELEMETRY_TOKEN_SECRET or BETTER_AUTH_SECRET).",
    );
  }
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyRawHmac(
  token: string | null | undefined,
): Record<string, unknown> | null {
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
    const raw = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as Record<string, unknown>;
    if (typeof raw !== "object" || raw === null) return null;
    if (typeof raw["exp"] !== "number" || Date.now() > (raw["exp"] as number))
      return null;
    return raw;
  } catch {
    return null;
  }
}

export function mintTelemetryDispatchTokenWithCompany(
  driverProfileId: string,
  args: { tripId?: string | null; companyId?: string | null; ttlMs?: number },
): string {
  const claims: TelemetryDispatchClaims = {
    role: "driver",
    d: driverProfileId,
    ...(args.tripId ? { t: args.tripId } : {}),
    ...(args.companyId ? { c: args.companyId } : {}),
    exp: Date.now() + (args.ttlMs ?? TOKEN_TTL_MS),
  };
  return signHmacPayload(claims);
}

const OPERATOR_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 mins

export function mintOperatorSubscriptionToken(
  userId: string,
  companyId: string,
  ttlMs: number = OPERATOR_TOKEN_TTL_MS,
): string {
  const claims: OperatorSubscriptionClaims = {
    role: "operator",
    sub: userId,
    c: companyId,
    exp: Date.now() + ttlMs,
  };
  return signHmacPayload(claims);
}

const PASSENGER_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 mins

export function mintPassengerTrackingToken(
  userId: string,
  tripId: string,
  ttlMs: number = PASSENGER_TOKEN_TTL_MS,
): string {
  const claims: PassengerTrackingClaims = {
    role: "passenger",
    u: userId,
    t: tripId,
    exp: Date.now() + ttlMs,
  };
  return signHmacPayload(claims);
}

export function verifyTelemetryDispatchToken(
  token: string | null | undefined,
): TelemetryDispatchClaims | null {
  const raw = verifyRawHmac(token);
  if (!raw) return null;

  // Role check: must be undefined (legacy) or "driver"
  if (raw["role"] !== undefined && raw["role"] !== "driver") return null;
  if (typeof raw["d"] !== "string") return null;
  if (raw["t"] !== undefined && typeof raw["t"] !== "string") return null;
  if (raw["c"] !== undefined && typeof raw["c"] !== "string") return null;

  return {
    ...(raw["role"] === "driver" ? { role: "driver" as const } : {}),
    d: raw["d"] as string,
    ...(typeof raw["t"] === "string" ? { t: raw["t"] } : {}),
    ...(typeof raw["c"] === "string" ? { c: raw["c"] } : {}),
    exp: raw["exp"] as number,
  };
}

export function verifyOperatorSubscriptionToken(
  token: string | null | undefined,
): OperatorSubscriptionClaims | null {
  const raw = verifyRawHmac(token);
  if (!raw) return null;

  if (raw["role"] !== "operator") return null;
  if (typeof raw["sub"] !== "string" || typeof raw["c"] !== "string")
    return null;

  return {
    role: "operator",
    sub: raw["sub"] as string,
    c: raw["c"] as string,
    exp: raw["exp"] as number,
  };
}

export function verifyPassengerTrackingToken(
  token: string | null | undefined,
): PassengerTrackingClaims | null {
  const raw = verifyRawHmac(token);
  if (!raw) return null;

  if (raw["role"] !== "passenger") return null;
  if (typeof raw["u"] !== "string" || typeof raw["t"] !== "string") return null;

  return {
    role: "passenger",
    u: raw["u"] as string,
    t: raw["t"] as string,
    exp: raw["exp"] as number,
  };
}

export function verifyAnyTelemetryToken(
  token: string | null | undefined,
): TelemetryTokenClaims | null {
  const raw = verifyRawHmac(token);
  if (!raw) return null;

  if (raw["role"] === "operator") {
    return verifyOperatorSubscriptionToken(token);
  }
  if (raw["role"] === "passenger") {
    return verifyPassengerTrackingToken(token);
  }
  return verifyTelemetryDispatchToken(token);
}
