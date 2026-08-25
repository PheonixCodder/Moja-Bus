/**
 * Phase 35 (F-IN-16, D35-5) — Better Auth trustedOrigins policy.
 *
 * Production must trust only: the API's own origin, EXPLICITLY configured
 * ALLOWED_ORIGINS, and the two store-build app schemes. The six localhost
 * defaults and the Expo Go origins (`exp://`, Metro `:8081`) are development
 * conveniences — previously they were trusted unconditionally, meaning a
 * misconfigured production deploy silently fell back to accepting
 * localhost cross-origin auth posts.
 *
 * Recovery path (documented, ratified): if anyone ever needs Expo Go against
 * production again, add that origin to ALLOWED_ORIGINS explicitly — no code
 * change. Store releases use driver-app:///traveler-app://, so gating exp://
 * costs nothing for shipped builds.
 */

/** Localhost fallbacks apply ONLY outside production. */
export const DEV_FALLBACK_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:19006",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:19006",
] as const;

/** Expo Go / Metro dev origins — same production gate as the fallbacks. */
const DEV_EXPO_ORIGINS = [
  "exp://",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
] as const;

/** Shipped mobile builds register these custom schemes on every platform. */
export const APP_SCHEMES = ["traveler-app://", "driver-app://"] as const;

export function buildTrustedOrigins(input: {
  baseUrl: string;
  explicitAllowedOrigins: string[];
  isProd: boolean;
  expoDevOrigin?: string | null | undefined;
}): string[] {
  const origins = new Set<string>([
    new URL(input.baseUrl).origin,
    ...input.explicitAllowedOrigins,
    ...(input.isProd ? [] : DEV_FALLBACK_ORIGINS),
    ...(input.isProd ? [] : DEV_EXPO_ORIGINS),
    ...APP_SCHEMES,
  ]);

  // Explicit env opt-in — deliberate configuration is honored in any
  // environment (this IS the documented recovery path).
  if (input.expoDevOrigin) {
    origins.add(input.expoDevOrigin);
  }

  return [...origins];
}
