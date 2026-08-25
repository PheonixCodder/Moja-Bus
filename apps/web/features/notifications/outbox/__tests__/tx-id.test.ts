import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { recipientTag, txIdWithRecipient } from "../tx-id";

/**
 * Phase 14/20 (F-NF-04) — the literal audit bug, encoded: two recipients of
 * the SAME logical event must never share an idempotency key.
 */
describe("recipient-scoped transaction ids", () => {
  it("tags are deterministic and 8 chars", () => {
    assert.equal(recipientTag("user-a"), recipientTag("user-a"));
    assert.equal(recipientTag("user-a").length, 8);
  });

  it("distinct recipients of the same event get distinct keys", () => {
    const base = "offer-expiring-soon-offer1-driver";
    const k1 = txIdWithRecipient(base, { subscriberId: "user-a" });
    const k2 = txIdWithRecipient(base, { subscriberId: "user-b" });
    assert.notEqual(k1, k2);
    assert.ok(k1.startsWith(base));
  });

  it("same recipient retried keeps the same key (dedupe intact)", () => {
    const a = txIdWithRecipient(base(), { subscriberId: "user-a" });
    const b = txIdWithRecipient(base(), { subscriberId: "user-a" });
    assert.equal(a, b);
    function base() {
      return "operator-offer-countered-offer1-45000";
    }
  });

  it("omitting the recipient yields the bare base key", () => {
    assert.equal(txIdWithRecipient("base", undefined), "base");
    assert.equal(txIdWithRecipient("base", {}), "base");
  });
});
