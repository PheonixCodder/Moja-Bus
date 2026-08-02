import { isSupportedCountryCode } from "./phone-number";

const COUNTRY_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-geo-country",
  "x-country-code",
] as const;

/**
 * Best-effort server-side country detection from reverse-proxy geolocation
 * headers (Vercel, Cloudflare, etc.). Returns an uppercase ISO-3166 alpha-2
 * code when a supported one is found, otherwise `undefined`.
 */
export function detectCountryFromHeaders(headers: Headers): string | undefined {
  for (const header of COUNTRY_HEADERS) {
    const value = headers.get(header);
    if (value && isSupportedCountryCode(value)) return value.toUpperCase();
  }
  return undefined;
}

/**
 * Client-side fallback using the browser locale (e.g. `fr-CI` -> "CI").
 * Used when the server could not supply a country hint.
 */
export function detectCountryFromClient(): string | undefined {
  if (typeof navigator === "undefined" || typeof Intl === "undefined") {
    return undefined;
  }
  try {
    const region = new Intl.Locale(navigator.language).region;
    if (region && isSupportedCountryCode(region)) return region.toUpperCase();
  } catch {
    // Malformed/unsupported locale — fall through.
  }
  return undefined;
}

/**
 * Prefers a validated server-detected country, falling back to the browser
 * locale region.
 */
export function resolveDefaultCountry(
  serverCountry?: string | null,
): string | undefined {
  if (serverCountry && isSupportedCountryCode(serverCountry)) {
    return serverCountry.toUpperCase();
  }
  return detectCountryFromClient();
}
