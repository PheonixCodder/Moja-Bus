/**
 * Phase 34 (F-NF-15, D34-5) — client-side templateIdentifier → route map for
 * in-app notification tap navigation.
 *
 * Why a client map instead of per-workflow redirect flags: passenger notices
 * are read on TWO surfaces (this app and the web dashboard), and a single
 * server-side `redirect.url` cannot serve both. The map wins; the workflow's
 * stored `redirect.url` is kept only as a fallback for identifiers not yet
 * mapped (and only when it targets THIS app — web paths like /dashboard are
 * never followed here). Unmapped + no fallback → tap marks read and stays
 * put: graceful degradation, never a crash.
 */

export type NotificationRouteData = Record<string, unknown> | undefined;

type RouteEntry = string | ((data: NotificationRouteData) => string);

/** Booking-scoped notices deep-link to the booking detail when the trigger
 * payload carries a reference (it does on every producer today); otherwise
 * they degrade to the bookings list. Rebooking prefers the NEW reference. */
function bookingDetail(data: NotificationRouteData, key = "bookingReference") {
	const reference = typeof data?.[key] === "string" ? (data[key] as string) : null;
	return reference
		? `/booking/${reference}`
		: "/(tabs)/bookings";
}

/** Passenger-audience workflows (features/notifications/workflows/{passenger,payments,operator}/*). */
const TRAVELER_ROUTES: Record<string, RouteEntry> = {
	// Booking lifecycle.
	"passenger-hold-created": bookingDetail,
	"passenger-booking-confirmed": bookingDetail,
	"passenger-trip-delayed": bookingDetail,
	"passenger-trip-gate-updated": bookingDetail,
	"passenger-trip-boarding": bookingDetail,
	"passenger-trip-cancelled": "/(tabs)/bookings",
	"passenger-booking-refunded": "/(tabs)/bookings",
	"passenger-rebooked": (data) => bookingDetail(data, "newBookingReference"),
	"passenger-ticket-shared": bookingDetail,
	"passenger-review-request": "/(tabs)/bookings",
	"passenger-review-submitted": "/(tabs)/bookings",

	// Money & incentives.
	"passenger-wallet-topup": "/wallet",
	"passenger-wallet-low-balance": "/wallet",
	"passenger-credit-expiring": "/wallet",
	"passenger-referral-attributed": "/referrals",
	"passenger-referral-reward": "/referrals",
	"passenger-campaign-starting": "/(tabs)",

	// Profile.
	"passenger-profile-updated": "/(tabs)/settings",
};

/** Only follow a stored redirect if it targets this app (not the web ERP). */
function isLocalPath(url: string): boolean {
	return url.startsWith("/") && !url.startsWith("/dashboard");
}

/**
 * Resolve where an in-app notification should navigate.
 *
 * Precedence (D34-5): identifier map → stored redirect (same-surface only).
 */
export function resolveNotificationRoute(input: {
	identifier?: string;
	data?: NotificationRouteData;
	redirectUrl?: string;
}): string | null {
	const { identifier, data, redirectUrl } = input;

	if (identifier) {
		const entry = TRAVELER_ROUTES[identifier];
		if (entry) {
			return typeof entry === "function" ? entry(data) : entry;
		}
	}

	if (redirectUrl && isLocalPath(redirectUrl)) return redirectUrl;

	return null;
}
