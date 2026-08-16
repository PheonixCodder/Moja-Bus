import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveTicketAccessToken,
  signCheckoutSession,
  signTicketPresentationToken,
  verifyCheckoutSession,
} from "../signed-access-tokens";

describe("signed-access-tokens", () => {
  it("round-trips presentation ticket token", () => {
    process.env["BETTER_AUTH_SECRET"] = "test-phase06-secret";
    const pt = signTicketPresentationToken("durable-ticket-abc12345");
    const resolved = resolveTicketAccessToken(pt);
    assert.equal(resolved?.ticketToken, "durable-ticket-abc12345");
    assert.equal(resolved?.presentation, true);
  });

  it("accepts raw durable token as grace", () => {
    process.env["BETTER_AUTH_SECRET"] = "test-phase06-secret";
    const resolved = resolveTicketAccessToken("durable-ticket-abc12345");
    assert.equal(resolved?.ticketToken, "durable-ticket-abc12345");
    assert.equal(resolved?.presentation, false);
  });

  it("binds checkout session to hold", () => {
    process.env["BETTER_AUTH_SECRET"] = "test-phase06-secret";
    const token = signCheckoutSession({
      holdGroupId: "hold_1",
      userId: "user_1",
    });
    assert.ok(verifyCheckoutSession(token, "hold_1"));
    assert.equal(verifyCheckoutSession(token, "hold_other"), null);
  });
});
