import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizePhone, phonesMatch } from "@/features/booking/lib/normalize-phone";

describe("normalizePhone", () => {
  it("strips non-digit characters", () => {
    assert.equal(normalizePhone("+225 07 12 34 56 78"), "2250712345678");
    assert.equal(normalizePhone("07-12-34-56-78"), "0712345678");
  });
});

describe("phonesMatch", () => {
  it("matches identical normalized numbers", () => {
    assert.equal(phonesMatch("0712345678", "0712345678"), true);
  });

  it("matches when formatting differs", () => {
    assert.equal(phonesMatch("+225 07 12 34 56 78", "0712345678"), true);
  });

  it("matches last 10 digits when country code differs", () => {
    assert.equal(phonesMatch("2250712345678", "0712345678"), true);
  });

  it("returns false for empty or too-short numbers", () => {
    assert.equal(phonesMatch("", "0712345678"), false);
    assert.equal(phonesMatch("123", "456"), false);
  });

  it("returns false for clearly different numbers", () => {
    assert.equal(phonesMatch("0712345678", "0798765432"), false);
  });
});
