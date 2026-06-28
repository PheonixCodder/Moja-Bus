import crypto from "node:crypto";
import type { UserRole } from "@moja/schemas/auth";
import jwt, { type JwtPayload } from "jsonwebtoken";

export interface TokenSecrets {
  accessTokenSecret: string;
  refreshTokenSecret: string;
}

export interface TokenDurations {
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
}

export interface AccessTokenClaims {
  userId: string;
  role: UserRole;
}

export interface RefreshTokenClaims extends AccessTokenClaims {
  tokenKind: "refresh";
}

function assertJwtPayload(
  payload: string | JwtPayload,
): asserts payload is JwtPayload {
  if (typeof payload === "string") {
    throw new Error("Unexpected JWT payload shape.");
  }
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function issueAccessToken(
  claims: AccessTokenClaims,
  secrets: TokenSecrets,
  durations: TokenDurations,
): string {
  return jwt.sign({ role: claims.role }, secrets.accessTokenSecret, {
    subject: claims.userId,
    expiresIn: durations.accessTokenTtlSeconds,
  });
}

export function issueRefreshToken(
  claims: AccessTokenClaims,
  secrets: TokenSecrets,
  durations: TokenDurations,
): string {
  return jwt.sign(
    {
      role: claims.role,
      jti: crypto.randomUUID(),
      tokenKind: "refresh" as const,
    },
    secrets.refreshTokenSecret,
    {
      subject: claims.userId,
      expiresIn: durations.refreshTokenTtlSeconds,
    },
  );
}

export function verifyAccessToken(
  token: string,
  secret: string,
): AccessTokenClaims {
  const payload = jwt.verify(token, secret);
  assertJwtPayload(payload);

  if (typeof payload.sub !== "string" || typeof payload.role !== "string") {
    throw new Error("Invalid access token payload.");
  }

  return {
    userId: payload.sub,
    role: payload.role as UserRole,
  };
}

export function verifyRefreshToken(
  token: string,
  secret: string,
): RefreshTokenClaims {
  const payload = jwt.verify(token, secret);
  assertJwtPayload(payload);

  if (
    typeof payload.sub !== "string" ||
    typeof payload.role !== "string" ||
    payload.tokenKind !== "refresh"
  ) {
    throw new Error("Invalid refresh token payload.");
  }

  return {
    userId: payload.sub,
    role: payload.role as UserRole,
    tokenKind: "refresh",
  };
}
