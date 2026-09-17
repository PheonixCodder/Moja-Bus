import PostHog from "posthog-react-native";
import { POSTHOG_EU_HOST, type AnalyticsEvents, type EventName } from "@moja/analytics";

const API_KEY = process.env["EXPO_PUBLIC_POSTHOG_KEY"];
const HOST = process.env["EXPO_PUBLIC_POSTHOG_HOST"] || POSTHOG_EU_HOST;

export const posthog =
	API_KEY ? new PostHog(API_KEY, { host: HOST }) : null;

/**
 * Type-safe event capture helper conforming to @moja/analytics taxonomy.
 * Fails open silently if PostHog is disabled or missing credentials.
 */
export function captureAnalyticsEvent<K extends EventName>(
	event: K,
	properties: AnalyticsEvents[K],
): void {
	if (!posthog) return;
	try {
		posthog.capture(event, properties as unknown as Record<string, any>);
	} catch {
		// Fail open silently in non-telemetry/offline states
	}
}

/**
 * Screen tracking helper for Expo Router
 */
export function trackScreenView(screenName: string): void {
	if (!posthog) return;
	try {
		posthog.screen(screenName);
	} catch {}
}
