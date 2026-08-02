import {
  isSupportedCountry,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
} from "libphonenumber-js/max";
import type { CountryCode } from "libphonenumber-js/max";

export type PhoneValidationErrorCode =
  | "TOO_SHORT"
  | "TOO_LONG"
  | "INVALID_LENGTH"
  | "INVALID_COUNTRY"
  | "NOT_A_NUMBER"
  | "INVALID";

export type PhoneValidationError = {
  code: PhoneValidationErrorCode;
  country?: string;
};

export function isSupportedCountryCode(
  code: string | null | undefined,
): code is string {
  return (
    typeof code === "string" &&
    /^[A-Za-z]{2}$/.test(code) &&
    isSupportedCountry(code.toUpperCase())
  );
}

export function resolveCountryCode(
  code: string | null | undefined,
): CountryCode | undefined {
  if (!isSupportedCountryCode(code)) return undefined;
  return code.toUpperCase() as CountryCode;
}

/**
 * Strict per-country phone validation backed by Google's libphonenumber rules
 * (max metadata). Returns `null` when the value is structurally valid.
 * For national-format input the caller should pass `defaultCountry`; numbers
 * typed in international format are validated independently of it.
 */
export function getPhoneValidationError(
  phone: string | null | undefined,
  defaultCountry?: string | null,
): PhoneValidationError | null {
  const value = phone?.trim();
  if (!value) return null;

  const country = resolveCountryCode(defaultCountry);

  let lengthError: ReturnType<typeof validatePhoneNumberLength>;
  try {
    lengthError = validatePhoneNumberLength(value, country);
  } catch {
    return { code: "INVALID" };
  }

  if (lengthError) {
    if (lengthError === "INVALID_COUNTRY") {
      return { code: "INVALID_COUNTRY" };
    }
    return country
      ? { code: lengthError as PhoneValidationErrorCode, country }
      : { code: lengthError as PhoneValidationErrorCode };
  }

  let valid = false;
  try {
    valid = isValidPhoneNumber(value, country);
  } catch {
    return country ? { code: "INVALID", country } : { code: "INVALID" };
  }

  if (valid) return null;
  return country ? { code: "INVALID", country } : { code: "INVALID" };
}

/**
 * Parses and normalizes a phone number to E.164 (e.g. "+2250712345678").
 * Returns `null` when the value cannot be parsed into a valid number.
 */
export function toE164(
  phone: string | null | undefined,
  defaultCountry?: string | null,
): string | null {
  const value = phone?.trim();
  if (!value) return null;

  const country = resolveCountryCode(defaultCountry);
  let parsed: ReturnType<typeof parsePhoneNumberFromString>;
  try {
    parsed = parsePhoneNumberFromString(value, country);
  } catch {
    return null;
  }
  if (!parsed) return null;

  const e164 = parsed.format("E.164");
  if (!e164) return null;

  try {
    return isValidPhoneNumber(e164, parsed.country) ? e164 : null;
  } catch {
    return null;
  }
}

export function getCountryDisplayName(
  countryCode: string | undefined,
  locale = "en",
): string | undefined {
  if (!countryCode || !isSupportedCountryCode(countryCode)) return undefined;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(
      countryCode.toUpperCase(),
    );
  } catch {
    return countryCode.toUpperCase();
  }
}

/**
 * Country code associated with a (preferably E.164) phone number, or
 * `undefined` when the number can't be parsed.
 */
export function getParsedCountry(
  phone: string | null | undefined,
): string | undefined {
  const value = phone?.trim();
  if (!value) return undefined;

  let parsed: ReturnType<typeof parsePhoneNumberFromString>;
  try {
    parsed = parsePhoneNumberFromString(value);
  } catch {
    return undefined;
  }
  return parsed?.country;
}
