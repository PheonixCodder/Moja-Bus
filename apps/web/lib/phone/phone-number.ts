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
 *
 * When the number itself carries a country (international format) that country
 * is reported in the error so callers can show a specific message (e.g. "too
 * long for Tanzania").
 */
export function getPhoneValidationError(
  phone: string | null | undefined,
  defaultCountry?: string | null,
): PhoneValidationError | null {
  const value = phone?.trim();
  if (!value) return null;

  const country = resolveCountryCode(defaultCountry);

  // Determine the country the number actually belongs to (when typed in
  // international format) so error messages can name the right country.
  let parsedCountry: CountryCode | undefined;
  try {
    parsedCountry = parsePhoneNumberFromString(value, country)?.country;
  } catch {
    parsedCountry = undefined;
  }
  const errorCountry = parsedCountry || country;

  let lengthError: ReturnType<typeof validatePhoneNumberLength>;
  try {
    lengthError = validatePhoneNumberLength(value, country);
  } catch {
    return errorCountry
      ? { code: "INVALID", country: errorCountry }
      : { code: "INVALID" };
  }

  if (lengthError) {
    if (lengthError === "INVALID_COUNTRY") {
      return { code: "INVALID_COUNTRY" };
    }
    const code = lengthError as PhoneValidationErrorCode;
    return errorCountry ? { code, country: errorCountry } : { code };
  }

  let valid = false;
  try {
    valid = isValidPhoneNumber(value, country);
  } catch {
    return errorCountry
      ? { code: "INVALID", country: errorCountry }
      : { code: "INVALID" };
  }

  if (valid) return null;
  return errorCountry
    ? { code: "INVALID", country: errorCountry }
    : { code: "INVALID" };
}

export type PhoneSaveResult =
  | {
      ok: true;
      /** Normalized E.164 value, or `undefined` when no phone was provided. */
      phone: string | undefined;
    }
  | {
      ok: false;
      error: PhoneValidationError;
    };

/**
 * Single source of truth for the "should this phone save?" decision used by
 * form handlers. An empty value means "leave the phone unchanged" (`ok: true`,
 * `phone: undefined`); anything non-empty must be a valid, fully-entered number
 * (normalized to E.164) or the result is `ok: false` with the specific error.
 */
export function resolvePhoneForSave(
  phone: string | null | undefined,
  defaultCountry?: string | null,
): PhoneSaveResult {
  const value = phone?.trim();
  if (!value) {
    return { ok: true, phone: undefined };
  }

  const error = getPhoneValidationError(value, defaultCountry);
  const e164 = toE164(value, defaultCountry);
  if (error || !e164) {
    const country = resolveCountryCode(defaultCountry);
    return {
      ok: false,
      error:
        error ?? (country ? { code: "INVALID", country } : { code: "INVALID" }),
    };
  }

  return { ok: true, phone: e164 };
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
