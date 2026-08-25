import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  isRoomAllowedForClaims,
  mintTelemetryDispatchTokenWithCompany,
  verifyTelemetryDispatchToken,
} from "@/lib/telemetry-token";

/**
 * Phase 11 (F-TM-02/F-TM-03) — dispatch-token claims + room-ACL contracts.
 * Pure layer: no sockets, no DB. Secret is read lazily by the module, so
 * setting it here (before any call) configures every case below.
 */

process.env["TELEMETRY_TOKEN_SECRET"] ??= "test-secret-telemetry-phase11";
const SECRET = process.env["TELEMETRY_TOKEN_SECRET"];

function legacyToken(claims: object): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const sig = createHmac("sha256", SECRET as string)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

describe("dispatch token company claim", () => {
  it("round-trips driver + trip + company claims", () => {
    const tok = mintTelemetryDispatchTokenWithCompany("drv_1", {
      tripId: "trip_1",
      companyId: "co_1",
    });
    const claims = verifyTelemetryDispatchToken(tok);
    assert.ok(claims);
    assert.equal(claims.d, "drv_1");
    assert.equal(claims.t, "trip_1");
    assert.equal(claims.c, "co_1");
    assert.ok(claims.exp > Date.now());
  });

  it("verifies LEGACY tokens without c (backward compatibility)", () => {
    const claims = verifyTelemetryDispatchToken(
      legacyToken({ d: "drv_old", t: "trip_old", exp: Date.now() + 60_000 }),
    );
    assert.ok(claims);
    assert.equal(claims.c, undefined);
  });

  it("rejects a malformed c type", () => {
    const tok = legacyToken({
      d: "drv_x",
      exp: Date.now() + 60_000,
      c: 12345,
    });
    assert.equal(verifyTelemetryDispatchToken(tok), null);
  });

  it("rejects tampered signatures", () => {
    const tok = mintTelemetryDispatchTokenWithCompany("drv_2", {
      tripId: "trip_2",
      companyId: "co_2",
    });
    const [payload, sig] = tok.split(".");
    if (!payload || !sig) throw new Error("unexpected token shape");
    const forged = `${payload}.${sig.slice(0, -2)}aa`;
    assert.equal(verifyTelemetryDispatchToken(forged), null);
  });

  it("rejects expired tokens", async () => {
    const short = mintTelemetryDispatchTokenWithCompany("drv_3", {
      tripId: "t",
      companyId: "c",
      ttlMs: 1,
    });
    await new Promise((r) => setTimeout(r, 5));
    assert.equal(verifyTelemetryDispatchToken(short), null);
  });
});

describe("isRoomAllowedForClaims (F-TM-03 subscribe ACL)", () => {
  const claims = { t: "trip_abc" };

  it("allows exactly the claim-derived trip room", () => {
    assert.equal(isRoomAllowedForClaims("trip:trip_abc", claims), true);
  });

  it("rejects foreign trip rooms and ALL company rooms", () => {
    assert.equal(isRoomAllowedForClaims("trip:other_trip", claims), false);
    assert.equal(isRoomAllowedForClaims("company:co_1", claims), false);
    assert.equal(isRoomAllowedForClaims("company:", claims), false);
  });

  it("rejects everything for a claimless token", () => {
    assert.equal(isRoomAllowedForClaims("trip:trip_abc", null), false);
    assert.equal(isRoomAllowedForClaims("trip:anything", {}), false);
  });
});
