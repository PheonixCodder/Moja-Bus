# 06 — Notifications: Novu Workflows & Outbox Inventory

> 59 registered workflows × trigger sites × channels · subscriber identity crisis · outbox mechanics

---

## Subscriber Identity — **P0 SPLIT-BRAIN**

| Side | Identity | Where |
|---|---|---|
| **Clients** (web Inbox, traveler NovuProvider, driver bell/push registration) | `subscriberId = ctx.user.email` | `public.ts:17` (getNotificationToken HMAC), `public.ts:42` (registerPushToken) |
| **Servers** (nearly all direct triggers + outbox payloads, post-Phase-11 migration) | `subscriberId = user.id` | `trips.ts:1220/1238/1335`, `cancel-trip-with-refunds.ts:273`, `booking-receipt-email.ts:86`, `payment-service.ts:648`, `booking-confirmation-service.ts:631`, all offer/dispatch/marketplace helpers |

Consequence: email steps still deliver (address carried in payload), but **in-app steps land on phantom `user.id` subscribers no client reads, and push steps hit subscribers with zero registered devices**. Only the legacy email-keyed triggers (review-submitted, profile-updated, ticket-shared, OTPs, staff invites) fully work in-app/push today.

Fix options (decide one):
1. **Finish the migration**: point `getNotificationToken`/`registerPushToken` at `user.id` (one-line change each; traveler/driver/web clients re-register automatically on next launch). Legacy email-keyed triggers stay valid as separate subscribers for their audiences. *(Recommended — Phase 11 already chose `user.id` as the canonical scheme.)*
2. Re-key server triggers back to email (regression for email-less drivers).

## Workflow Inventory — 59 registered (`workflows/index.ts`)

Legend: ✅ OK wired · 👻 GHOST triggered-but-unregistered · 🏝️ ORPHAN registered-never-triggered.

### Auth & Staff
| Workflow | Channels | Status |
|---|---|---|
| auth-otp | email+SMS(gated) | ✅ auth-email/staff/admin-staff |
| operator-signup-otp | email | ✅ |
| operator-welcome | email+inApp | ✅ |
| operator-staff-invite / admin-staff-invite | email | ✅ |
| staff-acceptance-alert | inApp | ✅ invitation.ts:262 |
| **admin-staff-acceptance-alert** | — | 👻 admin-staff.ts:345 triggers an unregistered ID → admin inviters never alerted |

### Passenger commerce
| Workflow | Channels | Status |
|---|---|---|
| passenger-booking-confirmed | email+inApp+push | ✅ outbox ← receipt service |
| passenger-hold-created | inApp+email+push | ✅ outbox ← booking.ts |
| passenger-trip-delayed / boarding / gate-updated / review-request | mixed | ✅ trips.ts direct triggers |
| passenger-trip-cancelled | email+inApp+push | ✅ outbox ← cancel-trip-with-refunds |
| **passenger-booking-refunded** | email+inApp+push | 🏝️ helper defined, ZERO callers — self-cancels are silent (P1) |
| passenger-wallet-topup | email+inApp+push | ✅ payment-service |
| passenger-wallet-low-balance | inApp+push | ⚠️ fires only on rare ledger branch (P2) |
| **passenger-ticket-shared** | email | 👻-in-practice: mutation exists, no UI calls it; template hardcodes mojaride.com |
| passenger-review-submitted / profile-updated | mixed | ✅ (legacy email-keyed) |
| referral attributed/reward, credit-expiring, campaign-starting, operator-campaign-paused, campaign-budget-exhausted | mixed | ✅ discounts/referral services + crons |

### Operator lifecycle
withdrawal requested/settled/failed/resolved · verification approved/rejected · account suspended/restored · bank verified/rejected · signup pending · payout failed · user-role-updated — mostly ✅ via admin/operator routers.
🧹 **ORPHANS: `admin-bank-account-pending`, `operator-bank-verified`, `operator-bank-rejected` registered with no trigger sites.**

### Driver marketplace & dispatch (Phases 11–14)
driver-offer-received/countered/counter-accepted/counter-declined/withdrawn/expiring-soon/expired · operator-offer-countered/accepted/declined/expiring-soon/expired · driver-affiliation-ended · driver-trip-assigned · driver-dispatch-urgent · driver-trip-unassigned · driver-marketplace-featured/suspended — **all ✅ Outbox-delivered with idempotent keys**, trigger sites in drivers.ts / expire-offers cron / trips.ts / admin.ts.
⚠️ `operator-bus-assigned` is a direct fire-and-forget bypassing the outbox (P3).

## Outbox Mechanics — **WIRED** (two ops hazards)

- Idempotency: unique semantic keys per event+recipient (`booking-receipt-{holdGroupId}`, `driver-trip-assigned-{tripId}-{subscriberId}`, `offer-expired-{offerId}-{role}` …); P2002 race tolerated.
- Delivery worker: claim-guarded on `(id,status,attempts)`; exponential backoff 30s→1h cap; malformed payload → immediate DEAD; ops retry endpoint + admin dead-letter UI exist.
- **Hazard 1 (P2)**: crash between Novu trigger and SENT strands rows in PROCESSING forever (picker only takes PENDING/FAILED). Add a stale-PROCESSING reclaim (e.g., >15 min).
- **Hazard 2 (P2)**: `process-outbox` scheduled once daily while retry floor is 30s → worst-case notification latency ≈ 24h. Schedule hourly (or */5).

## Delivery Config

Novu bridge `serve({workflows})` with prod warning when key missing · HMAC inbox tokens (`subscriberHash`) · Expo push credentials registered per subscriber · env templates carry `NOVU_SECRET_KEY` + `NEXT_PUBLIC_NOVU_APP_ID` ✓ · push tap-routing map covers booking/review/wallet types on traveler; offer/trip types on driver.
