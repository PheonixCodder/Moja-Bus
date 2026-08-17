# Moja Ride — Commercial System Comprehensive Audit Report

**Audit Date:** 2026-08-17  
**Scope:** Complete End-to-End Deep Architectural Audit of Discounts, Pricing Engine, Checkout, Payments, Double-Entry Accounting Ledger, Trips, Schedules, Multi-Seat Holds, Cancellations, Refunds, Welcome Bonus, Referral Engine, and Anti-Abuse Fraud Controls.  
**Location:** `C:\dev\moja-buss\docs\plans\commercial-system-deep-audit-2026-08-17`

---

## Audit Document Suite

This comprehensive audit is structured into 8 modular, in-depth technical documents:

| Document | Title & Focus | Primary Files & Subsystems Audited |
|:---:|---|---|
| [**01**](file:///C:/dev/moja-buss/docs/plans/commercial-system-deep-audit-2026-08-17/01-executive-summary-and-system-map.md) | **Executive Summary & System Map** | Overall architecture topography, system map, core domain models, and global commercial invariants. |
| [**02**](file:///C:/dev/moja-buss/docs/plans/commercial-system-deep-audit-2026-08-17/02-discount-engine-and-promotions-audit.md) | **Discount Engine & Promotions Audit** | Pricing calculation pipeline, discount benefits, coupon codes, monetary vouchers (`scheduleId` scope), promo credit lots, promotional ceilings, and budget guards (`evaluate.ts`, `eligibility.ts`, `quote-service.ts`). |
| [**03**](file:///C:/dev/moja-buss/docs/plans/commercial-system-deep-audit-2026-08-17/03-checkout-payments-and-ledger-audit.md) | **Checkout, Payments & Ledger Audit** | Payable resolution (`checkout-payable.ts`), Paystack integration, Wallet checkout, `ZERO_CASH` confirm, double-entry accounting ledger (`AccountingEngine`), and double-spend safeguards (`booking-confirmation-service.ts`, `promo-ledger.ts`). |
| [**04**](file:///C:/dev/moja-buss/docs/plans/commercial-system-deep-audit-2026-08-17/04-trips-schedules-and-hold-expiry-audit.md) | **Trips, Schedules & Hold Expiry Audit** | Schedule definitions, trip generation, seat segment occupancy (`segmentsOverlap`), multi-seat hold groups, 15m hold TTL, hold expiry cron, and un-reservation workflows (`expire-or-release-hold.ts`). |
| [**05**](file:///C:/dev/moja-buss/docs/plans/commercial-system-deep-audit-2026-08-17/05-cancellations-refunds-and-clawbacks-audit.md) | **Cancellations, Refunds & Clawbacks Audit** | Single booking cancel, bulk cancel, whole-trip cancel (`cancelTripWithRefunds`), refund channel routing (`CASH`, `WALLET`, `VOUCHER`), checked-in gating, operator balance clawback, and offline refund fulfillment (`cancellation-service.ts`, `offline-refund-fulfilment.ts`). |
| [**06**](file:///C:/dev/moja-buss/docs/plans/commercial-system-deep-audit-2026-08-17/06-referral-welcome-bonus-and-abuse-prevention-audit.md) | **Referral, Welcome Bonus & Abuse Prevention Audit** | Referral program lifecycle, welcome coupon issuance, referrer reward qualification, reward delay maturation, device fingerprinting (`deviceHash`), and admin abuse queue (`referral-service.ts`, `claim-credit-grant-service.ts`, `PromoAbuseEvent`). |
| [**07**](file:///C:/dev/moja-buss/docs/plans/commercial-system-deep-audit-2026-08-17/07-admin-and-operator-management-surfaces-audit.md) | **Admin & Operator Management Surfaces Audit** | Search & checkout UI, passenger bookings view, operator promotions view, operator trip manifest, admin marketing campaigns, and admin abuse queue (`booking-checkout-form.tsx`, `passenger-bookings-view.tsx`, `operator-promotions-view.tsx`, `manifest-drawer.tsx`, `admin-campaigns-view.tsx`). |
| [**08**](file:///C:/dev/moja-buss/docs/plans/commercial-system-deep-audit-2026-08-17/08-comprehensive-findings-catalog-and-recommendations.md) | **Comprehensive Findings Catalog & Recommendations** | System assessment ratings, edge case analysis, zero-cash verification, orphan payment rescue, whole-trip cancel security, invariant checklist, and maintenance guidelines. |

---

## Core Invariants Summary

1. **Deterministic Stacking Order:** Ticket promo/coupon $\rightarrow$ Monetary voucher $\rightarrow$ Credit lots.
2. **Zero-Cash Payable Confirmation:** When payable $= 0$, payment mode resolves to `ZERO_CASH` (waiving fees and skipping cash balance checks while recording exact promo liability drawdowns).
3. **Schedule-Scoped Cancellation Vouchers:** Monetary vouchers with `source = CANCELLATION` are strictly bound to `scheduleId` and `companyId`, soft-failing if redeemed on a different schedule.
4. **Checked-In Gating:** Bookings with `checkedInAt != null` cannot be cancelled individually, and whole-trip cancellation is blocked when any checked-in passenger exists (`checkedInCount > 0`).
5. **Atomic Dual-State Reservations:** Campaign budget, vouchers, and credit lots use `reservedAmountXOF` / `remainingAmountXOF` during holds, committed on confirm or released on expiration.
