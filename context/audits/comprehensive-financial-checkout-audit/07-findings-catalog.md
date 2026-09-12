# 07 — Severity-Ranked Findings Catalog

All findings are classified according to Moja Ride context audit standards:
- **P0 (Blocker):** Data loss, double-entry ledger crash, direct financial drain.
- **P1 (Critical):** Broken core checkout, security issue, cash arbitrage.
- **P2 (Major):** High-impact operational flaw, reconciliation drift, cross-platform divergence.
- **P3 (Polish):** Minor UI/UX confusion, display rounding discrepancy.

---

## Catalog of Identified Findings

| ID | Title | Severity | Impact Area | File / Location |
| :--- | :--- | :---: | :--- | :--- |
| **FINDING-01** | Double-Entry Ledger Crash on Free Booking (`Σ Debit != Σ Credit`) | **P0** | Checkout / Ledger | `booking-confirmation-service.ts:525`, `auto-apply.ts:108` |
| **FINDING-02** | Promo Credits Illegally Subsidize Gateway Convenience Fees | **P0** | Discounts / Marketing | `auto-apply.ts:101-109`, `evaluate.ts:163` |
| **FINDING-03** | Silent Platform Treasury Drain on Operator-Funded Discounts | **P0** | Finance / Escrow | `booking-confirmation-service.ts:288`, `quote-service.ts:213` |
| **FINDING-04** | Mobile App Blocks Zero-Cash Bookings for Empty Wallets | **P1** | Traveler Mobile App | `apps/traveler-app/features/search/components/passenger-form-sheet.tsx:266` |
| **FINDING-05** | Paystack Sub-100 XOF Micro-Charge Rejection on Partial Promo | **P1** | Payments / Gateway | `payment-service.ts:144`, `booking-checkout-form.tsx:351` |
| **FINDING-06** | Asymmetric Convenience Fee Waiving Between Quote & Confirmation | **P1** | TRPC Payments Router | `payments.ts:56`, `booking-confirmation-service.ts:561` |
| **FINDING-07** | Pending Bookings Dashboard Refreeze Mismatch | **P1** | Passenger Dashboard | `passenger-bookings-view.tsx:129` |
| **FINDING-08** | Long-Haul Schedule Conflict Guard Fallback to 120 Minutes | **P2** | Operator Schedules | `schedules.ts:301, 707` |
| **FINDING-09** | Offline Station Refund Liability Accumulation without Payout Audit | **P2** | Accounting / Operations | `cancellation-service.ts:399-430` |
| **FINDING-10** | Phantom Promo Credit Creation on Booking Cancellation | **P2** | Cancellation Policy | `cancellation-policy.ts:107, 120` |
| **FINDING-11** | Missing Currency Isolation on Schedule Fares | **P2** | Database / Schema | `packages/db/prisma/schema.prisma:1578` |
| **FINDING-12** | Ambiguous Button Copy when Trip is Partially Covered by Credits | **P3** | Web UI / Checkout | `booking-checkout-form.tsx:808` |
| **FINDING-13** | Inconsistent Fee Display between Web Drawer and Mobile Sheet | **P3** | UI / Cross-Platform | `offer-card.tsx`, `passenger-form-sheet.tsx` |
| **FINDING-14** | Missing Automated Sweep for Depleted Promo Lots | **P3** | Cron / Discounts | `incentive-status-sweep.ts` |
