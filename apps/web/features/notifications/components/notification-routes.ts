/**
 * Phase 34 (F-NF-15, D34-5) — client-side templateIdentifier → route map for
 * in-app notification tap navigation on the web dashboard.
 *
 * Why a client map instead of per-workflow redirect fields: most audiences
 * read their notices on more than one surface (passenger notices land here
 * AND in the traveler app; a single server-side `redirect.url` cannot serve
 * both). The map wins; the stored `redirect.url` is kept as a fallback for
 * identifiers not yet mapped. Unmapped + no fallback → tap marks read and
 * stays put: graceful degradation, never a crash.
 */

export type NotificationRouteData = Record<string, unknown> | undefined;

/**
 * RouteEntry: a static path, a payload-derived path builder, or explicit
 * `null` to pin "no navigation" for an identifier that would otherwise fall
 * through to its stored redirect (e.g. account-suspension notices must not
 * push a suspended operator into the dashboard).
 */
type RouteEntry = string | ((data: NotificationRouteData) => string) | null;

/**
 * All workflows whose in-app messages render inside this dashboard —
 * passenger-audience (read here + traveler app), operator-audience and
 * platform-admin-audience (web-only).
 */
const WEB_ROUTES: Record<string, RouteEntry> = {
  // ── Passenger audience ────────────────────────────────────────────────
  "passenger-hold-created": "/dashboard/bookings",
  "passenger-booking-confirmed": "/dashboard/bookings",
  "passenger-trip-delayed": "/dashboard/bookings",
  "passenger-trip-gate-updated": "/dashboard/bookings",
  "passenger-trip-boarding": "/dashboard/bookings",
  "passenger-trip-cancelled": "/dashboard/bookings",
  "passenger-booking-refunded": "/dashboard/bookings",
  "passenger-rebooked": "/dashboard/bookings",
  "passenger-ticket-shared": "/dashboard/tickets",
  "passenger-review-request": "/dashboard/bookings?tab=past",
  "passenger-review-submitted": "/dashboard/bookings",
  "passenger-wallet-topup": "/dashboard/wallet",
  "passenger-wallet-low-balance": "/dashboard/wallet",
  "passenger-credit-expiring": "/dashboard/wallet",
  "passenger-referral-attributed": "/dashboard/referrals",
  "passenger-referral-reward": "/dashboard/referrals",
  "passenger-campaign-starting": "/",
  "passenger-profile-updated": "/dashboard/settings",

  // ── Operator audience ────────────────────────────────────────────────
  "operator-driver-assignment-conflict": "/dashboard/operator/trips",
  "operator-bus-assigned": "/dashboard/operator/fleet",
  "driver-trip-assigned": "/dashboard/operator/trips",
  "driver-trip-unassigned": "/dashboard/operator/trips",
  "driver-dispatch-urgent": "/dashboard/operator/trips",
  "operator-offer-countered": "/dashboard/operator/drivers/offers",
  "operator-offer-accepted": "/dashboard/operator/drivers/offers",
  "operator-offer-declined": "/dashboard/operator/drivers/offers",
  "operator-offer-expiring-soon": "/dashboard/operator/drivers/offers",
  "operator-offer-expired": "/dashboard/operator/drivers/offers",
  "driver-affiliation-ended": "/dashboard/operator/drivers",
  "driver-roster-removed": "/dashboard/operator/drivers",
  "driver-license-status": "/dashboard/operator/drivers",
  "driver-verification-outcome": "/dashboard/operator/drivers",
  "driver-marketplace-featured": "/dashboard/operator/drivers/marketplace",
  "driver-marketplace-suspended": "/dashboard/operator/drivers/marketplace",
  "operator-withdrawal-requested": "/dashboard/withdraw",
  "operator-withdrawal-settled": "/dashboard/withdraw",
  "operator-withdrawal-failed": "/dashboard/withdraw",
  "operator-bank-verified": "/dashboard/operator/settings/banking",
  "operator-bank-rejected": "/dashboard/operator/settings/banking",
  "operator-campaign-paused": "/dashboard/operator/promotions",
  "campaign-budget-exhausted": "/dashboard/operator/promotions",
  // Suspended operators must not be pushed into the dashboard — pin no-nav.
  "operator-account-suspended": null,
  "operator-welcome": "/dashboard/operator",
  // Verification outcomes point at the company settings surface.
  "operator-verification-approved": "/dashboard/operator/settings/company",
  "operator-verification-rejected": "/dashboard/operator/settings/company",

  // ── Platform-admin audience ──────────────────────────────────────────
  "admin-payout-failed": "/dashboard/admin/financials/settlements",
  "admin-treasury-network-failure": "/dashboard/admin/financials/settlements",
  "admin-operator-signup-pending": "/dashboard/admin/users/operators",
  "user-role-updated": "/dashboard/admin/staff",
  "staff-acceptance-alert": "/dashboard/admin/staff",
};

/** Only follow a stored redirect when it is an in-app path of THIS surface. */
function isLocalPath(url: string): boolean {
  return url.startsWith("/");
}

export function resolveWebNotificationRoute(input: {
  identifier?: string | undefined;
  data?: NotificationRouteData | undefined;
  redirectUrl?: string | undefined;
}): string | null {
  const { identifier, data, redirectUrl } = input;

  if (identifier) {
    // noUncheckedIndexedAccess — indexed reads may be undefined.
    const entry: RouteEntry | undefined = WEB_ROUTES[identifier];
    if (entry === null) return null; // pinned "stay put"
    if (typeof entry === "function") return entry(data);
    if (typeof entry === "string") return entry;
  }

  if (redirectUrl && isLocalPath(redirectUrl)) return redirectUrl;

  return null;
}
