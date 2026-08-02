import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPhoneValidationError,
  toE164,
  resolveCountryCode,
  getParsedCountry,
  getCountryDisplayName,
} from "@/lib/phone/phone-number";

describe("resolveCountryCode", () => {
  it("uppercases supported country codes", () => {
    assert.equal(resolveCountryCode("ci"), "CI");
    assert.equal(resolveCountryCode("fr"), "FR");
  });

  it("returns undefined for unsupported input", () => {
    assert.equal(resolveCountryCode("XX"), undefined);
    assert.equal(resolveCountryCode("C"), undefined);
    assert.equal(resolveCountryCode(""), undefined);
    assert.equal(resolveCountryCode(null), undefined);
    assert.equal(resolveCountryCode(undefined), undefined);
  });
});

describe("toE164", () => {
  it("normalizes Ivorian national numbers using the CI default", () => {
    assert.equal(toE164("07 12 34 56 78", "CI"), "+2250712345678");
    assert.equal(toE164("0712345678", "CI"), "+2250712345678");
  });

  it("normalizes international numbers independently of default country", () => {
    assert.equal(toE164("+33 6 12 34 56 78", "CI"), "+33612345678");
    assert.equal(toE164("+1 415 555 2671"), "+14155552671");
  });

  it("returns null for numbers that fail validation", () => {
    assert.equal(toE164("1234", "CI"), null);
    assert.equal(toE164("not-a-number"), null);
    assert.equal(toE164(""), null);
    assert.equal(toE164(null), null);
    assert.equal(toE164(undefined), null);
  });

  it("returns null for an invalid country code prefix", () => {
    assert.equal(toE164("+999123456789"), null);
  });
});

describe("getPhoneValidationError", () => {
  it("returns null for a valid Ivorian number", () => {
    assert.equal(getPhoneValidationError("07 12 34 56 78", "CI"), null);
    assert.equal(getPhoneValidationError("+2250712345678"), null);
  });

  it("returns null for a valid international number", () => {
    assert.equal(getPhoneValidationError("+1 415 555 2671"), null);
    assert.equal(getPhoneValidationError("+33612345678"), null);
  });

  it("rejects a too-short national number", () => {
    const error = getPhoneValidationError("1234", "CI");
    assert.ok(error);
    assert.equal(error.code, "TOO_SHORT");
  });

  it("rejects a too-long number", () => {
    const error = getPhoneValidationError("07123456789012345", "CI");
    assert.ok(error);
    assert.equal(error.code, "TOO_LONG");
  });

  it("rejects a structurally invalid number", () => {
    const error = getPhoneValidationError("+2251234567890", "CI");
    assert.ok(error);
    assert.equal(error.code, "INVALID");
  });

  it("rejects an unsupported country code", () => {
    const error = getPhoneValidationError("+999123456789", "CI");
    assert.ok(error);
    assert.equal(error.code, "INVALID_COUNTRY");
  });

  it("rejects non-numeric input", () => {
    const error = getPhoneValidationError("hello world", "CI");
    assert.ok(error);
  });

  it("returns null for empty input", () => {
    assert.equal(getPhoneValidationError(""), null);
    assert.equal(getPhoneValidationError(null), null);
    assert.equal(getPhoneValidationError(undefined), null);
  });
});

describe("getParsedCountry", () => {
  it("extracts the country from an E.164 number", () => {
    assert.equal(getParsedCountry("+2250712345678"), "CI");
    assert.equal(getParsedCountry("+33612345678"), "FR");
  });

  it("returns undefined for unparseable values", () => {
    assert.equal(getParsedCountry(""), undefined);
    assert.equal(getParsedCountry("not-a-number"), undefined);
  });
});

describe("getCountryDisplayName", () => {
  it("returns a region display name for a supported country", () => {
    const name = getCountryDisplayName("CI", "en");
    assert.ok(name);
    assert.ok(name.includes("Côte"));
  });

  it("returns undefined for an unsupported country", () => {
    assert.equal(getCountryDisplayName("XX"), undefined);
  });
});
