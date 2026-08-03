import { getCountryDisplayName } from "./phone-number";
import type { PhoneValidationError } from "./phone-number";

export type TranslateFn = (
  key: string,
  values?: Record<string, string>,
) => string;

/**
 * Maps a phone validation error to the most specific i18n message key,
 * interpolating the number's country name where relevant. Falls back to the
 * generic `validationPhone` key when no country context is available.
 */
export function phoneErrorMessage(
  t: TranslateFn,
  error: PhoneValidationError,
): string {
  const country = getCountryDisplayName(error.country);
  switch (error.code) {
    case "TOO_SHORT":
      return t("validationPhoneTooShort");
    case "TOO_LONG":
      return country
        ? t("validationPhoneTooLong", { country })
        : t("validationPhone");
    case "INVALID_LENGTH":
      return country
        ? t("validationPhoneInvalidLength", { country })
        : t("validationPhone");
    case "INVALID_COUNTRY":
      return t("validationPhoneInvalidCountry");
    case "NOT_A_NUMBER":
      return t("validationPhoneNotANumber");
    case "INVALID":
    default:
      return country
        ? t("validationPhoneInvalid", { country })
        : t("validationPhone");
  }
}
