import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPhoneValidationError,
  resolvePhoneForSave,
  toE164,
} from "@/lib/phone/phone-number";
import { phoneErrorMessage } from "@/lib/phone/phone-error-message";
import type { PhoneValidationError } from "@/lib/phone/phone-number";

// Stub `t` that maps keys and appends interpolated values as "(value)" so
// tests can assert which message key (and interpolation) an error maps to.
const keys: Record<string, string> = {
  validationPhone: "generic",
  validationPhoneTooShort: "too-short",
  validationPhoneTooLong: "too-long",
  validationPhoneInvalidLength: "invalid-length",
  validationPhoneInvalidCountry: "invalid-country",
  validationPhoneNotANumber: "not-a-number",
  validationPhoneInvalid: "invalid",
};

const t = (key: string, values?: Record<string, string>) => {
  const country = values?.["country"];
  return `${keys[key] ?? key}${country ? `(${country})` : ""}`;
};

describe("user-reported scenario: settings save behavior", () => {
  it("rejects a bare country code like +255 (incomplete)", () => {
    // A lone country code is not a phone number — it must never be accepted.
    const error = getPhoneValidationError("+255", "CI");
    assert.ok(error);
    assert.equal(error.code, "TOO_SHORT");

    const result = resolvePhoneForSave("+255", "CI");
    assert.equal(result.ok, false);
  });

  it("rejects +255 2342342432 (too long for Tanzania)", () => {
    // Tanzania (+255) national numbers have 9 digits; this has 10.
    const error = getPhoneValidationError("+255 2342342432", "CI");
    assert.ok(error);
    assert.equal(error.code, "TOO_LONG");
    // The error names the number's real country (TZ), not the default country.
    assert.equal(error.country, "TZ");

    const result = resolvePhoneForSave("+255 2342342432", "CI");
    assert.equal(result.ok, false);
  });

  it("accepts a valid Tanzanian number", () => {
    const result = resolvePhoneForSave("+255 712 345 678", "CI");
    assert.ok(result.ok);
    if (result.ok) assert.equal(result.phone, "+255712345678");
  });

  it("rejects an invalid Tanzanian number that starts with +255", () => {
    assert.ok(getPhoneValidationError("+2552342342432", "CI"));
    assert.equal(resolvePhoneForSave("+2552342342432", "CI").ok, false);
  });
});

describe("resolvePhoneForSave", () => {
  it("returns ok with undefined phone when no phone is provided", () => {
    const result = resolvePhoneForSave("", "CI");
    assert.ok(result.ok);
    if (result.ok) assert.equal(result.phone, undefined);
  });

  it("treats whitespace-only input as 'no phone'", () => {
    const result = resolvePhoneForSave("   ", "CI");
    assert.ok(result.ok);
    if (result.ok) assert.equal(result.phone, undefined);
  });

  it("normalizes Ivorian national numbers to E.164", () => {
    const result = resolvePhoneForSave("07 12 34 56 78", "CI");
    assert.ok(result.ok);
    if (result.ok) assert.equal(result.phone, "+2250712345678");
  });

  it("normalizes Tanzanian national numbers using the TZ default", () => {
    const result = resolvePhoneForSave("712 345 678", "TZ");
    assert.ok(result.ok);
    if (result.ok) assert.equal(result.phone, "+255712345678");
  });

  it("normalizes international numbers independently of default country", () => {
    const result = resolvePhoneForSave("+33 6 12 34 56 78", "CI");
    assert.ok(result.ok);
    if (result.ok) assert.equal(result.phone, "+33612345678");
  });

  it("rejects an incomplete national number", () => {
    const result = resolvePhoneForSave("1234", "CI");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "TOO_SHORT");
  });

  it("rejects a too-long national number", () => {
    const result = resolvePhoneForSave("07123456789012345", "CI");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "TOO_LONG");
  });

  it("rejects non-numeric input", () => {
    const result = resolvePhoneForSave("not-a-number", "CI");
    assert.equal(result.ok, false);
  });

  it("rejects an unknown country code prefix", () => {
    const result = resolvePhoneForSave("+999123456789", "CI");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "INVALID_COUNTRY");
  });
});

describe("getPhoneValidationError country context", () => {
  it("reports the number's own country for international input", () => {
    const error = getPhoneValidationError("+255 2342342432", "CI");
    assert.ok(error);
    assert.equal(error.country, "TZ");

    const errorFr = getPhoneValidationError("+33 2342342432", "CI");
    assert.ok(errorFr);
    assert.equal(errorFr.country, "FR");
  });

  it("reports the default country for national-format input", () => {
    const error = getPhoneValidationError("1234", "CI");
    assert.ok(error);
    assert.equal(error.country, "CI");
  });

  it("does not attach a country for unknown calling codes", () => {
    const error = getPhoneValidationError("+999123456789", "CI");
    assert.ok(error);
    assert.equal(error.code, "INVALID_COUNTRY");
  });
});

describe("phoneErrorMessage", () => {
  const err = (code: PhoneValidationError["code"], country?: string) => ({
    code,
    ...(country ? { country } : {}),
  });

  it("maps TOO_SHORT to the incomplete-number message", () => {
    assert.equal(phoneErrorMessage(t, err("TOO_SHORT")), "too-short");
  });

  it("maps TOO_LONG to the country-specific message", () => {
    assert.equal(
      phoneErrorMessage(t, err("TOO_LONG", "TZ")),
      "too-long(Tanzania)",
    );
  });

  it("maps INVALID_LENGTH to the country-specific message", () => {
    const msg = phoneErrorMessage(t, err("INVALID_LENGTH", "CI"));
    assert.ok(msg.startsWith("invalid-length("));
    assert.ok(msg.includes("Côte"));
    assert.ok(msg.endsWith(")"));
  });

  it("maps INVALID_COUNTRY to the unknown-code message", () => {
    assert.equal(phoneErrorMessage(t, err("INVALID_COUNTRY")), "invalid-country");
  });

  it("maps NOT_A_NUMBER to the not-a-number message", () => {
    assert.equal(phoneErrorMessage(t, err("NOT_A_NUMBER")), "not-a-number");
  });

  it("maps INVALID with a country to the country-specific message", () => {
    assert.equal(phoneErrorMessage(t, err("INVALID", "FR")), "invalid(France)");
  });

  it("falls back to the generic message when no country is known", () => {
    assert.equal(phoneErrorMessage(t, err("INVALID")), "generic");
    assert.equal(phoneErrorMessage(t, err("TOO_LONG")), "generic");
  });
});

describe("toE164 regression guards", () => {
  it("keeps valid E.164 numbers intact", () => {
    assert.equal(toE164("+2250712345678"), "+2250712345678");
    assert.equal(toE164("+255712345678"), "+255712345678");
  });

  it("returns null for the user-reported invalid inputs", () => {
    assert.equal(toE164("+255"), null);
    assert.equal(toE164("+255 2342342432"), null);
    assert.equal(toE164("+2552342342432"), null);
  });
});
