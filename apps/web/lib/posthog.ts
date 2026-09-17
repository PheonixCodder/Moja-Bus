import posthog from "posthog-js";
import type { AnalyticsEvents, EventName } from "@moja/analytics";

/**
 * Client-side type-safe event capture helper for web.
 * Fails open silently if PostHog is disabled or missing credentials.
 */
export function captureWebAnalyticsEvent<K extends EventName>(
  event: K,
  properties: AnalyticsEvents[K],
): void {
  if (typeof window === "undefined" || !posthog.__loaded) return;
  try {
    posthog.capture(event, properties as Record<string, unknown>);
  } catch {
    // Fail open silently
  }
}
