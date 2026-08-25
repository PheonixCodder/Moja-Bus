import { getCsvEnv } from "@moja/config";

/**
 * Phase 35 (F-IN-08, D35-1) — pure origin policy for tRPC mutations.
 *
 * Posture: Better Auth uses SameSite=Lax cookies; this check is the second
 * layer against cross-site request forgery on state-mutating procedures.
 *
 * Rules:
 * - No Origin header → ALLOW. Native apps (driver/traveler) send none by
 *   design; same-origin browser POSTs may omit it. Documented deliberately —
 *   do not "fix" without revisiting mobile auth.
 * - Malformed Origin → FORBIDDEN (was an unguarded `new URL()` that blew up
 *   as INTERNAL — leaking a 500 where a rejection is meant).
 * - Cross-origin → allowed only if explicitly listed in ALLOWED_ORIGINS
 *   (comma-separated). In production the scheme is pinned: an origin whose
 *   host matches but scheme differs (http:// vs https://) does NOT pass —
 *   prod sits behind Caddy with HTTPS-only traffic.
 * - Non-production additionally allows any scheme of the same host, so local
 *   dev (http://localhost:3000) keeps working without env configuration.
 */
export function isMutationOriginAllowed(input: {
  origin: string | null;
  host: string | null;
  env?: NodeJS.ProcessEnv;
}): boolean {
  const { origin, host } = input;
  const env = input.env ?? process.env;

  // Native clients and same-origin fetches may omit Origin entirely.
  if (!origin) return true;

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false; // malformed Origin → FORBIDDEN
  }

  if (!host) return false;

  const isProd = env.NODE_ENV === "production";
  const explicit = getCsvEnv("ALLOWED_ORIGINS", env);

  if (explicit.includes(originUrl.origin)) return true;

  if (isProd) {
    return originUrl.origin === `https://${host}`;
  }

  // Dev/test: same-host equality in either scheme (localhost http).
  return originUrl.host === host;
}
