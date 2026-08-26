# 06 — Employment Offer Board (offers, counter-offers, acceptance)

> Audit date: 2026-08-26 · Sources: `drivers.ts` Phase-11 sections, `packages/db/prisma/schema.prisma:2480-2547`, outbox helpers `features/notifications/outbox/driver-offers.ts`, cron `expire-offers`.

## 1. Purpose

Replaces informal WhatsApp hiring with a structured, auditable negotiation: operator discovers a driver on the marketplace → sends a formal offer → driver accepts / declines / counters → operator resolves counters → acceptance atomically creates the `DriverCompanyAffiliation`. No in-app chat by design (locked decision, project-overview §1).

## 2. Data model recap

`DriverEmploymentOffer`: immutable `initial{SalaryCFA,StartDate,Note}` + mutable effective `current*`; `status PENDING|COUNTERED|ACCEPTED|DECLINED|EXPIRED|WITHDRAWN`; rolling `expiresAt` (+7 days on every counter — OFFER_EXPIRY_DAYS); trust signals firstViewedAt/respondedAt/resolvedAt; createdById audit. `DriverOfferEvent`: append-only, eventType per DriverOfferEventType enum, actorType COMPANY|DRIVER|SYSTEM, terms snapshot per event. One ACTIVE offer per (company, driver) via DB partial unique index + app checks.

## 3. Full state machine

```
operator sendEmploymentOffer ──▶ PENDING ──driver views──▶ (firstViewedAt + VIEWED event)
   │                                │  ├──▶ DECLINED (driver respondToOffer DECLINE)
   │                                │  ├──▶ WITHDRAWN (operator withdrawOffer)
   │                                │  ├──▶ EXPIRED (cron expire-offers OR lazy expireOfferIfDue on read paths)
   │                                │  └──▶ COUNTERED (driver COUNTER; terms replaced; expiresAt=now+7d)
   │                                            │
   │                                            ├── operator ACCEPT_COUNTER ──▶ ACCEPTED
   │                                            ├── operator DECLINE_COUNTER ─▶ DECLINED
   │                                            ├── operator COUNTER_BACK ────▶ COUNTERED (+7d)
   │                                            └── EXPIRED as above
   └─────────────── driver ACCEPT (on PENDING) ──────────────────────────────▶ ACCEPTED
```

Every transition writes a `DriverOfferEvent` and enqueues durable outbox notifications INSIDE the transaction (driver ↔ operator pairs: received, countered, counter-resolved ×3 outcomes, withdrawn, expired both sides, affiliation-ended to displaced operators).

## 4. Acceptance resolution (`resolveAcceptance`, drivers.ts:210-327)

1. If employmentType = EXCLUSIVE_INTERCITY: find other active exclusives → terminate each (`isActive:false`, terminatedAt) + `EXCLUSIVE_ENDED` event + `enqueueDriverAffiliationEnded` to every displaced company ("driver left you for X" transparency).
2. Affiliation upsert (create or re-hire: clears terminatedAt, refreshes hiredAt, notes "via/re-hired via Moja offer …").
3. Offer → ACCEPTED (respondedAt+resolvedAt) + AFFILIATION_CREATED event.
4. Notify hiring company operators (`companyOperatorRecipients`).

Driver-side consent gate BEFORE this: server throws `EXCLUSIVE_CONFLICT_REQUIRED::Company A|Company B` unless `confirmExclusiveSwitch:true` (`respondToOffer`, :3462-3480); client shows confirm dialog then re-sends (Phase 16 P0-4 retry loop).

## 5. Guards & anti-abuse

- Sender must hold `drivers:create`; counter-resolution `drivers:update`.
- Target must be VERIFIED + isAvailableForHire + not suspended; not already actively affiliated with sender.
- Caps: MAX_ACTIVE_SENT_OFFERS_PER_COMPANY (sender-side), MAX_ACTIVE_RECEIVED_OFFERS_PER_DRIVER (target-side).
- Start date cannot be >24 h in the past.
- Expiry is enforced THREE ways: hourly cron (`api/cron/expire-offers`), lazy sweep on `getMyOffers` AND `listSentOffers` AND inside respond mutations (`expireOfferIfDue`) — all produce identical side effects (P3-2 parity).
- View tracking: `markMyOffersSeen` batches unseen live offers → firstViewedAt + VIEWED events (powers Seen chips operator-side).

## 6. UI surfaces

- Operator: marketplace card/profile-sheet Send-Offer dialog (disabled when `isOnMyRoster`, F-OP-06/P3-1), `/dashboard/operator/drivers/offers` Sent Offers dashboard (Seen chips, accept/decline/counter-back actions, pagination accumulation).
- Driver app: `(tabs)/offers.tsx` inbox with live badge, offer detail + counter sheet (salary/start/note inputs), exclusive-conflict consent dialog, expiry countdown. Notifications route via Novu push → notification-routes map.

## 7. Strengths

- Negotiation history is dispute-grade (immutable originals + append-only events with actor + terms snapshots).
- Expiry semantics are consistent across cron and lazy paths; notifications never ride outside transactions.
- Exclusive-switch consent is server-enforced, not client-honour-system.

## 8. Gaps

1. No cap on total counter ROUNDS (only the 7-day window bounds duration) — an infinite counter ping-pong is possible between two parties; harmless but unbounded.
2. `respondedAt` set on WITHDRAWN too (semantically odd; used only for analytics).
3. Offer does not snapshot required license category vs bus fleet of company — operator must eyeball fit; no warning when offering an intercity contract to a category-B licence holder.
4. Accepted offer's salary/start-date feed NOTHING downstream (no payroll model yet; pay rate remains platform placeholder — see 09-shifts-earnings).
