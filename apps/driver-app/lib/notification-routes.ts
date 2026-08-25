/**
 * Phase 34 (F-NF-15, D34-5) — client-side templateIdentifier → route map for
 * in-app notification tap navigation.
 *
 * Why a client map instead of per-workflow redirect fields: most audiences
 * read their notices on more than one surface, and a single server-side
 * `redirect.url` cannot serve two apps at once. The map wins; the workflow's
 * stored `redirect.url` is kept only as a fallback for identifiers not yet
 * mapped (and only when it targets THIS app — web paths like /dashboard are
 * never followed here). Unmapped + no fallback → tap marks read and stays
 * put: graceful degradation, never a crash.
 */

export type NotificationRouteData = Record<string, unknown> | undefined;

type RouteEntry = string | ((data: NotificationRouteData) => string);

/** Driver-audience workflows (features/notifications/workflows/driver/*). */
const DRIVER_ROUTES: Record<string, RouteEntry> = {
	// Offers — every offer lifecycle notice lands on the offers board.
	"driver-offer-received": "/(tabs)/offers",
	"driver-offer-countered": "/(tabs)/offers",
	"driver-offer-counter-accepted": "/(tabs)/offers",
	"driver-offer-counter-declined": "/(tabs)/offers",
	"driver-offer-withdrawn": "/(tabs)/offers",
	"driver-offer-expiring-soon": "/(tabs)/offers",
	"driver-offer-expired": "/(tabs)/offers",
	// Operator-side offer decisions surface on the same board.
	"operator-offer-countered": "/(tabs)/offers",
	"operator-offer-accepted": "/(tabs)/offers",
	"operator-offer-declined": "/(tabs)/offers",
	"operator-offer-expiring-soon": "/(tabs)/offers",
	"operator-offer-expired": "/(tabs)/offers",
	"driver-affiliation-ended": "/(tabs)/offers",

	// Dispatch — assignments live on the trips tab.
	"driver-trip-assigned": "/(tabs)/trips",
	"driver-trip-unassigned": "/(tabs)/trips",
	"driver-dispatch-urgent": "/(tabs)/trips",

	// Career passport — verification, licence, marketplace visibility.
	"driver-verification-outcome": "/(tabs)/profile",
	"driver-license-status": "/(tabs)/profile",
	"driver-marketplace-featured": "/(tabs)/profile",
	"driver-marketplace-suspended": "/(tabs)/profile",

	// Roster removal returns the driver to the app entry point.
	"driver-roster-removed": "/",
};

/** Only follow a stored redirect if it targets this app (not the web ERP). */
function isLocalPath(url: string): boolean {
	return url.startsWith("/") && !url.startsWith("/dashboard");
}

function firstString(data: NotificationRouteData, key: string): string | null {
	const value = data?.[key];
	return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Resolve where an in-app notification should navigate.
 *
 * Precedence (D34-5): identifier map → stored redirect (same-surface only).
 * Parameterized routes read the trigger payload off `notification.data`
 * (bookingReference etc.) and degrade to the static screen when absent.
 */
export function resolveNotificationRoute(input: {
	identifier?: string;
	data?: NotificationRouteData;
	redirectUrl?: string;
}): string | null {
	const { identifier, data, redirectUrl } = input;

	if (identifier) {
		const entry = DRIVER_ROUTES[identifier];
		if (entry) {
			return typeof entry === "function" ? entry(data) : entry;
		}
	}

	if (redirectUrl && isLocalPath(redirectUrl)) return redirectUrl;

	return null;
}
