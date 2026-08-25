import { getAppOrigin } from "@/lib/app-origin";

/**
 * Phase 14/20 (F-NF-09) — single builder for email/in-app CTAs so templates
 * can never hardcode a host (mojaride.com / admin.mojaride.com froze staging
 * and production to whatever was deployed when the template was written).
 * Locale is resolved by next-intl middleware from the bare path.
 */
export function dashboardUrl(path: string): string {
  return `${getAppOrigin()}${path}`;
}
