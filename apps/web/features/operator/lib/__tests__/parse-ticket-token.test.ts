import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseTicketToken } from "@/features/operator/lib/parse-ticket-token";

describe("parseTicketToken", () => {
  it("returns raw token when input is a plain cuid", () => {
    const token = "clxyz123abc";
    assert.equal(parseTicketToken(token), token);
  });

  it("extracts token from public ticket URL path", () => {
    const token = "clxyz123abc";
    assert.equal(parseTicketToken(`https://moja.app/tickets/${token}`), token);
  });

  it("extracts token from full verify URL", () => {
    const token = "clxyz123abc";
    const url = `https://moja.app/api/tickets/verify?token=${encodeURIComponent(token)}`;
    assert.equal(parseTicketToken(url), token);
  });

  it("extracts token from relative path with query", () => {
    const token = "my-token-value";
    assert.equal(
      parseTicketToken(`/api/tickets/verify?token=${token}`),
      token,
    );
  });

  it("trims whitespace around input", () => {
    assert.equal(parseTicketToken("  abc123  "), "abc123");
  });
});
