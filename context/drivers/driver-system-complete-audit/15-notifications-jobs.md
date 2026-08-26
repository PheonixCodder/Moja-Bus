# 15 — Notifications, Jobs & Platform Integrations

> Audit date: 2026-08-26 · Sources: `apps/web/app/api/cron/*`, `apps/web/vercel.json`, outbox helpers under `features/notifications/outbox/*`, Novu workflow registry, `lib/driver-scoring.ts` reconcile.

## 1. Notification fabric

ALL driver-domain notices ride the durable `OutboxMessage` queue (idempotencyKey unique, attempts/maxAttempts/backoff, stale-PROCESSING reclaim >15 min) — direct `novu.trigger` calls were systematically replaced during remediation. Enqueues happen INSIDE the mutating transaction (rollback can never strand a notice).

Driver-relevant outbox types (workflow identifiers): offers family (`driver-offer-received/-countered/-counter-resolved×3/-withdrawn/-expiring-soon/-expired` both audiences), roster (`driver-roster-removed`, `driver-affiliation-ended`), dispatch (`driver-trip-assigned` urgent variant, `driver-trip-unassigned`, `operator-driver-assignment-conflict`), verification (`DRIVER_VERIFICATION_OUTCOME`), marketplace (`driver-marketplace-featured/-suspended`), passenger trip surfaces shared with drivers (`TRIP_DELAYED` hourly-bucketed, cancellation family, `passenger-review-request` — this last still triggers directly from finalizeTripArrival with idempotent transactionIds rather than the outbox).

Subscriber identity is unified on `user.id` platform-wide (P0-3 unification); guests fall back to synthetic email subscriber keys. Push tap-routing uses client-side identifier→route maps per surface (F-NF-15) — web paths never followed by mobile and vice-versa.

## 2. Scheduled jobs (vercel.json crontab — non-prod reference; prod runs its own every-minute crontab for outbox cadence)

| Path | Schedule | Driver relevance |
|---|---|---|
| `/api/cron/expire-offers` | daily 05:00 UTC | PENDING/COUNTERED → EXPIRED + audit events + both-side notices (lazy sweeps make the cadence a safety net, not the mechanism) |
| `/api/cron/reconcile-driver-stats` | daily 02:30 UTC | nightly authoritative recompute of safetyScore/rating/trips/distance from source pings+reviews (segment-fair city-chain distance ratio; clean-trip credit; first-run backfill) |
| `/api/cron/expire-driver-licenses` | daily 02:15 UTC | VERIFIED→EXPIRED flips past `licenseExpiryDate` + month-bucketed 30-day warning notices |
| `/api/cron/process-outbox` | daily 04:00 UTC (prod: every-minute) | drains the notification queue |
| `/api/cron/release-escrow` | daily 01:00 UTC | booking.completedAt-driven funds release (driver-completed trips feed eligibility) |
| others (holds/reservations/payments/trip-gen/captures…) | various | adjacent platform jobs |

All cron routes use the unified cron-auth helper (P3-10). Telemetry flush needs no cron (serverless-safe synchronous persistence + long-lived-process buffer on WS revival).

## 3. Scoring/analytics integrations

- Ping flush applies intraday capped safety penalties transactionally with sorted FOR UPDATE locks.
- Reconcile job self-heals drift; rating aggregation keys on driverRating-only.
- `getMarketplaceHealth` computes time-to-hire / response-time / counter-rate analytics directly over offer tables.
- Activity/audit trails: `AdminStaffActivityLog` rows for admin verify + marketplace actions; NO equivalent log on the operator-side verify path (asymmetry noted in 03).

## 4. External dependencies

Novu (push/email/inbox; workflows registered code-first with fr-first copy + expo.data overrides matching handler maps), Cloudflare R2 (private doc objects), Mapbox Directions (driver navigation corridor + honest ETA; token fail-loud), OSM/CARTO tiles (web Leaflet surfaces w/ attribution compliance), Paystack (passenger money — no driver payouts exist yet).

## 5. Gaps

1. `passenger-review-request` bypasses the outbox (direct trigger w/ .catch swallow) — inconsistent with the fabric everything else migrated to.
2. Offer-expiry warnings ("expiring soon") exist as workflow ids in route maps; confirm actual scheduling of the warning variant (cron handles hard expiry; warning emission point not verified in cron body).
3. No DLQ/alerting surface for dead outbox messages beyond status column.
4. vercel.json vs prod-crontab drift is documented but relies on ops discipline; the cadence-guard test locks only the test-file line, not infra reality.
