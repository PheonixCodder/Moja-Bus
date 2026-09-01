# Subphase 3E: Multi-Operator Earnings Breakdown & Rates

## 1. Problem Statement & Findings Addressed

* **Findings Addressed**: `DRV-P2-10 (Multi-Operator Earnings Breakdown)` & `DRV-P2-04 (Legacy Pay Model Fallbacks)`.
* **Current Defect**: Urban contractors affiliated with multiple operators see an aggregated weekly total on mobile without an itemized breakdown of earnings earned per operator.

---

## 2. Architecture & Scope of Changes

1. In `apps/web/lib/driver-earnings.ts`, group completed shifts by `companyId` and calculate per-operator earnings.
2. In `apps/driver-app/features/earnings/screens/earnings-view.tsx`, render individual carrier cards showing company name, employment type, pay model, completed trips, and total XOF payout for the week.

---

## 3. Implementation Steps & File Checklist

- [ ] Update `drivers.getMyEarnings` response to return `breakdownByCompany: Array<{ companyId, companyName, trips, minutes, amountXOF }>`.
- [ ] Update `earnings-view.tsx` in `apps/driver-app` to render a carrier breakdown section.
- [ ] Add migration/seed to ensure all active affiliations configure explicit `payRateXOF` values.

---

## 4. Verification & Testing Criteria

* [ ] Log in as an urban contractor affiliated with Company A (Hourly) and Company B (Per Trip).
* [ ] Open Earnings tab.
* [ ] Verify the screen renders separate earnings summary cards for Company A and Company B with correct rate models and amounts.
