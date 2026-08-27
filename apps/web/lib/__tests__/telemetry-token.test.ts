import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  isRoomAllowedForClaims,
  mintOperatorSubscriptionToken,
  mintPassengerTrackingToken,
  mintTelemetryDispatchTokenWithCompany,
  type OperatorSubscriptionClaims,
  type PassengerTrackingClaims,
  verifyAnyTelemetryToken,
  verifyOperatorSubscriptionToken,
  verifyPassengerTrackingToken,
  verifyTelemetryDispatchToken,
} from "@/lib/telemetry-token";

/**
 * Phase 11 (F-TM-02/F-TM-03) & Phase 6 — dispatch-token claims + room-ACL contracts.
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

describe("operator subscription tokens (Phase 6 D3)", () => {
  it("round-trips operator claims", () => {
    const tok = mintOperatorSubscriptionToken("user_op_1", "co_abc");
    const claims = verifyOperatorSubscriptionToken(tok);
    assert.ok(claims);
    assert.equal(claims.role, "operator");
    assert.equal(claims.sub, "user_op_1");
    assert.equal(claims.c, "co_abc");
    assert.ok(claims.exp > Date.now());
  });

  it("driver verifier rejects operator tokens", () => {
    const tok = mintOperatorSubscriptionToken("user_op_1", "co_abc");
    assert.equal(verifyTelemetryDispatchToken(tok), null);
  });

  it("verifyAnyTelemetryToken returns operator claims", () => {
    const tok = mintOperatorSubscriptionToken("user_op_1", "co_abc");
    const claims = verifyAnyTelemetryToken(tok) as OperatorSubscriptionClaims;
    assert.ok(claims);
    assert.equal(claims.role, "operator");
    assert.equal(claims.c, "co_abc");
  });
});

describe("passenger tracking tokens (Phase 6 D4)", () => {
  it("round-trips passenger claims", () => {
    const tok = mintPassengerTrackingToken("user_p_1", "trip_xyz");
    const claims = verifyPassengerTrackingToken(tok);
    assert.ok(claims);
    assert.equal(claims.role, "passenger");
    assert.equal(claims.u, "user_p_1");
    assert.equal(claims.t, "trip_xyz");
    assert.ok(claims.exp > Date.now());
  });

  it("driver verifier rejects passenger tokens", () => {
    const tok = mintPassengerTrackingToken("user_p_1", "trip_xyz");
    assert.equal(verifyTelemetryDispatchToken(tok), null);
  });

  it("verifyAnyTelemetryToken returns passenger claims", () => {
    const tok = mintPassengerTrackingToken("user_p_1", "trip_xyz");
    const claims = verifyAnyTelemetryToken(tok) as PassengerTrackingClaims;
    assert.ok(claims);
    assert.equal(claims.role, "passenger");
    assert.equal(claims.t, "trip_xyz");
  });
});

describe("isRoomAllowedForClaims (F-TM-03 subscribe ACL)", () => {
  const driverClaims = { t: "trip_abc" };
  const passengerClaims: PassengerTrackingClaims = {
    role: "passenger",
    u: "user_1",
    t: "trip_pass",
    exp: Date.now() + 60_000,
  };
  const operatorClaims: OperatorSubscriptionClaims = {
    role: "operator",
    sub: "user_op",
    c: "co_1",
    exp: Date.now() + 60_000,
  };

  it("allows exactly the claim-derived trip room for drivers", () => {
    assert.equal(isRoomAllowedForClaims("trip:trip_abc", driverClaims), true);
    assert.equal(
      isRoomAllowedForClaims("trip:other_trip", driverClaims),
      false,
    );
    assert.equal(isRoomAllowedForClaims("company:co_1", driverClaims), false);
    assert.equal(isRoomAllowedForClaims("company:", driverClaims), false);
  });

  it("allows exactly the claim-derived trip room for passengers", () => {
    assert.equal(
      isRoomAllowedForClaims("trip:trip_pass", passengerClaims),
      true,
    );
    assert.equal(
      isRoomAllowedForClaims("trip:other_trip", passengerClaims),
      false,
    );
    assert.equal(
      isRoomAllowedForClaims("company:co_1", passengerClaims),
      false,
    );
  });

  it("rejects client subscribe for operators (company fleet room is server-granted)", () => {
    assert.equal(isRoomAllowedForClaims("company:co_1", operatorClaims), false);
    assert.equal(isRoomAllowedForClaims("trip:any", operatorClaims), false);
  });

  it("rejects everything for a claimless token", () => {
    assert.equal(isRoomAllowedForClaims("trip:trip_abc", null), false);
    assert.equal(isRoomAllowedForClaims("trip:anything", {} as any), false);
  });
});
