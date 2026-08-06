/**
 * OSM Nominatim reverse geocoder (used by the capture flow).
 *
 * Maps a GPS point → a street address string. The address is a best-effort
 * enrichment: every failure path (network error, timeout, non-200, rate limit,
 * malformed payload) returns `null` so the capture flow can fall back to the
 * offline hierarchy label (`formatLocationLabel`). The capture submit must
 * never fail because of this provider.
 *
 * Policy compliance (openstreetmap.org/copyright + usage policy):
 *  - A valid `User-Agent` with contact info is always sent.
 *  - Requests are throttled to 1 req/s via a shared in-memory limiter.
 *  - Responses are cached by rounded coordinates (4dp ≈ 11 m) for the TTL.
 *
 * `REVERSE_GEOCODE_BASE_URL` overrides the endpoint so we can swap in a
 * self-hosted/paid Nominatim instance later without code changes.
 */

import { createRateLimiter } from "@/lib/rate-limit";

export interface ReverseGeocodeInput {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeDeps {
  baseUrl?: string;
  userAgent?: string;
  timeoutMs?: number;
  now?: () => number;
  fetch?: typeof fetch;
  /** Shared 1 req/s throttle. Injected for tests. */
  limiter?: (key: string) => { ok: boolean; retryAfterMs: number };
}

const DEFAULT_BASE_URL = "https://nominatim.openstreetmap.org";
const DEFAULT_USER_AGENT = "MojaRide/1.0 (support@mojaride.com)";
const DEFAULT_TIMEOUT_MS = 4000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface NominatimResponse {
  display_name?: string;
  address?: {
    house_number?: string;
    road?: string;
    pedestrian?: string;
    neighbourhood?: string;
    suburb?: string;
    quarter?: string;
    city?: string;
    town?: string;
    municipality?: string;
  };
  error?: string;
}

/** Build a short street address from Nominatim's structured parts. */
export function formatNominatimAddress(data: NominatimResponse): string | null {
  const address = data.address;
  if (!address) {
    return data.display_name ? data.display_name.trim() : null;
  }
  const parts: string[] = [];
  const road = address.road ?? address.pedestrian;
  if (road) {
    parts.push([address.house_number, road].filter(Boolean).join(" ").trim());
  }
  const locality =
    address.neighbourhood ??
    address.suburb ??
    address.quarter ??
    address.city ??
    address.town ??
    address.municipality;
  if (locality) parts.push(locality);
  if (parts.length === 0) {
    return data.display_name ? data.display_name.trim() : null;
  }
  return parts.join(", ");
}

export function createReverseGeocoder(deps: ReverseGeocodeDeps = {}) {
  const baseUrl =
    deps.baseUrl ??
    process.env["REVERSE_GEOCODE_BASE_URL"] ??
    DEFAULT_BASE_URL;
  const userAgent = deps.userAgent ?? DEFAULT_USER_AGENT;
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const now = deps.now ?? Date.now;
  const fetchImpl = deps.fetch ?? fetch;
  const limiter =
    deps.limiter ??
    createRateLimiter({ windowMs: 1000, max: 1, now: () => now() });

  // Cache keyed by rounded coords (4dp ≈ 11 m); never grows unbounded beyond
  // the distinct rounded points we see (bounded by capture volume).
  const cache = new Map<string, { value: string; at: number }>();

  return async function reverseGeocode(
    input: ReverseGeocodeInput,
  ): Promise<string | null> {
    const key = `${input.latitude.toFixed(4)},${input.longitude.toFixed(4)}`;
    const cached = cache.get(key);
    if (cached && now() - cached.at < CACHE_TTL_MS) {
      return cached.value;
    }

    const limited = limiter(key);
    if (!limited.ok) {
      return null;
    }

    const url = new URL("/reverse", baseUrl);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(input.latitude));
    url.searchParams.set("lon", String(input.longitude));
    url.searchParams.set("zoom", "18");
    url.searchParams.set("accept-language", "fr");

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetchImpl(url, {
        headers: { "User-Agent": userAgent },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) return null;

      const data = (await response.json()) as NominatimResponse;
      const address = formatNominatimAddress(data);
      if (!address) return null;

      cache.set(key, { value: address, at: now() });
      return address;
    } catch {
      return null;
    }
  };
}

export type ReverseGeocoder = ReturnType<typeof createReverseGeocoder>;
