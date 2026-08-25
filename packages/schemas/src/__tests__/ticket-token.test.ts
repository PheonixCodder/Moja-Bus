import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  driverBatchSyncCheckInsSchema,
  driverCheckInPassengerSchema,
} from "../drivers";
import { parseTicketToken } from "../ticket-token";

// Phase 02 (F-PS-03 ≡ F-DV-02) — scanned-QR → durable-ticket-token contract.
// Passenger QRs encode `${APP_URL}/tickets/{token}`; the parser must reduce
// every shipped form to the bare token, never throw, and stay host-agnostic
// (APP_URL drift must not break gate scans).

describe("parseTicketToken", () => {
  it("returns raw token when input is a plain token", () => {
    const token = "clxyz123abc";
    assert.equal(parseTicketToken(token), token);
  });

  it("extracts token from public ticket URL", () => {
    const token = "clxyz123abc";
    assert.equal(parseTicketToken(`https://moja.app/tickets/${token}`), token);
  });

  it("is host-agnostic: localhost fallback URL (APP_URL drift)", () => {
    assert.equal(
      parseTicketToken("http://localhost:3000/tickets/tok_abc123"),
      "tok_abc123",
    );
  });

  it("is host-agnostic: arbitrary production host and IP host", () => {
    assert.equal(
      parseTicketToken("https://tickets.mojaride.ci/tickets/tok_abc123"),
      "tok_abc123",
    );
    assert.equal(
      parseTicketToken("http://10.0.0.4:3000/tickets/tok_abc123"),
      "tok_abc123",
    );
  });

  it("extracts encoded token from legacy verify URL query", () => {
    assert.equal(
      parseTicketToken(
        `https://moja.app/api/tickets/verify?token=${encodeURIComponent("ab cd")}`,
      ),
      "ab cd",
    );
  });

  it("extracts token from relative ticket path", () => {
    assert.equal(parseTicketToken("/tickets/my-token-value"), "my-token-value");
  });

  it("passes /tickets/verify through for downstream rejection", () => {
    assert.equal(
      parseTicketToken("https://moja.app/tickets/verify"),
      "https://moja.app/tickets/verify",
    );
    assert.equal(
      parseTicketToken("/tickets/verify?source=share"),
      "/tickets/verify?source=share",
    );
  });

  it("unwraps legacy JSON payload with ticketToken key", () => {
    assert.equal(
      parseTicketToken('{"ticketToken":"tok_json123"}'),
      "tok_json123",
    );
  });

  it("unwraps legacy JSON payload with generic token key", () => {
    assert.equal(parseTicketToken('{"token":"tok_json456"}'), "tok_json456");
  });

  it("ignores JSON without a usable token field", () => {
    assert.equal(parseTicketToken('{"other":"x"}'), '{"other":"x"}');
  });

  it("passes pt. presentation tokens through verbatim", () => {
    const pt = "pt.cGF5bG9hZA.aGVsbG8";
    assert.equal(parseTicketToken(pt), pt);
  });

  it("extracts URL-wrapped pt. presentation tokens", () => {
    assert.equal(
      parseTicketToken("https://moja.app/tickets/pt.cGF5bG9hZA.aGVsbG8"),
      "pt.cGF5bG9hZA.aGVsbG8",
    );
  });

  it("trims whitespace around any form", () => {
    assert.equal(parseTicketToken("  abc123  "), "abc123");
    assert.equal(
      parseTicketToken("\nhttps://moja.app/tickets/tok_x99\n"),
      "tok_x99",
    );
  });

  it("returns garbage as-is so lookups reject it cleanly", () => {
    assert.equal(parseTicketToken("not-a-ticket"), "not-a-ticket");
  });

  it("never throws on malformed percent-encoding", () => {
    assert.equal(parseTicketToken("%zz"), "%zz");
    assert.equal(parseTicketToken("https://moja.app/tickets/a%zzb"), "a%zzb");
  });

  it("returns empty string for empty input", () => {
    assert.equal(parseTicketToken(""), "");
    assert.equal(parseTicketToken("   "), "");
  });
});

describe("check-in schema preprocess (scan-input contract)", () => {
  it("driverCheckInPassengerSchema normalizes a full ticket URL", () => {
    const parsed = driverCheckInPassengerSchema.parse({
      ticketToken: "https://moja.app/tickets/tok_url789",
    });
    assert.equal(parsed.ticketToken, "tok_url789");
  });

  it("driverCheckInPassengerSchema still accepts bare tokens", () => {
    const parsed = driverCheckInPassengerSchema.parse({
      ticketToken: "tok_bare",
    });
    assert.equal(parsed.ticketToken, "tok_bare");
  });

  it("driverCheckInPassengerSchema rejects empty input after parsing", () => {
    assert.throws(() =>
      driverCheckInPassengerSchema.parse({ ticketToken: "" }),
    );
  });

  it("batch sync items normalize each scanned value independently", () => {
    const when = new Date("2026-01-01T00:00:00Z");
    const parsed = driverBatchSyncCheckInsSchema.parse({
      checkIns: [
        { ticketToken: "https://moja.app/tickets/tok_a1", scannedAt: when },
        { ticketToken: '{"ticketToken":"tok_b2"}', scannedAt: when },
        { ticketToken: "tok_c3", scannedAt: when },
      ],
    });
    assert.deepEqual(
      parsed.checkIns.map((c) => c.ticketToken),
      ["tok_a1", "tok_b2", "tok_c3"],
    );
  });
});
