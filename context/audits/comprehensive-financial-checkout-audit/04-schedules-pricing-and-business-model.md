# 04 — Schedules, Pricing & Business Model Economics

**Scope:** Operator Schedule Creation, Fare Construction, Distance Tiers, Commission Rules, and Platform Take-Rate Economics.

---

## 1. How Operator Schedules and Fares are Created

In `apps/web/app/[locale]/dashboard/operator/(dashboard)/schedules/page.tsx` and `apps/web/trpc/routers/schedules.ts`:
1. When an operator creates a schedule, they select an active `Route` (e.g. Abidjan $\rightarrow$ Bouake).
2. The route contains an origin terminal (Stop 0), intermediate waypoints (Stop 1, Stop 2...), and a destination terminal (Stop N).
3. The operator inputs a list of `Fare` objects specifying `priceXOF` for each segment:
   - Full Route: `fromStopOrder: 0, toStopOrder: N, priceXOF: 5000`
   - Intermediate Segment: `fromStopOrder: 0, toStopOrder: 1, priceXOF: 2000`
4. **The Price set by the Operator is the Gross Base Fare (`baseFareXOF`)**.
   - The operator specifies the price the passenger must pay for the seat.
   - The operator does NOT configure platform commission or convenience fees; those are dynamically enforced by platform policies.

---

## 2. Platform Commission & Convenience Fee Economics

When a ticket is sold on that schedule, the financial breakdown is computed by `PricingResolver.resolvePricing()` (`apps/web/features/payments/lib/pricing-resolver.ts`).

### A. Distance-Based Commission Tiers (`CommissionDistanceTier`)
The platform charges operators a commission based on route distance (`distanceKm`):
- `0 - 50 km` (Urban / Suburbs): e.g. 800 BPS (8%)
- `50 - 200 km` (Regional): e.g. 600 BPS (6%)
- `200+ km` (Long Haul Intercity, e.g. Abidjan $\rightarrow$ Bouake, ~350 km): e.g. 500 BPS (5%)
- Fallback Default: `PlatformSettings.defaultCommissionBps` (Default: 500 BPS / 5%).

### B. Mathematical Formulas
$$\text{SubtotalBaseXOF} = \text{baseFareXOF} \times \text{seatCount}$$
$$\text{CommissionXOF} = \text{round}\left(\frac{\text{SubtotalBaseXOF} \times \text{commissionBps}}{10,000}\right)$$
$$\text{ConvenienceFeeXOF} = \text{round}\left(\frac{\text{SubtotalBaseXOF} \times \text{convenienceFeeBps}}{10,000}\right) \quad (\text{if card/Paystack})$$
$$\text{OperatorNetXOF} = \text{SubtotalBaseXOF} - \text{CommissionXOF}$$
$$\text{ChargeAmountXOF} = \text{SubtotalBaseXOF} + \text{ConvenienceFeeXOF}$$

### C. Example: Abidjan to Bouake (350 km, Base Fare = 6,000 XOF, 5% Comm, 2.5% Fee)
* **Passenger Pays:**
  * Base Fare: 6,000 XOF
  * Convenience Fee: 150 XOF
  * Total Charge: **6,150 XOF**
* **Operator Receives:**
  * Base Fare: 6,000 XOF
  * Less Platform Commission (5%): -300 XOF
  * Operator Net: **5,700 XOF** (Escrowed until 24 hours after arrival)
* **Platform Takes:**
  * Commission Revenue: 300 XOF
  * Convenience Fee Revenue: 150 XOF
  * Gross Platform Take: **450 XOF** (~7.3%)
  * Less Paystack Processing Fee (~1.5% = ~92 XOF):
  * **Net Platform Profit:** **358 XOF**

---

## 3. Critical Business Model Vulnerabilities Identified

### Flaw 1: Operator-Funded Discounts Absorb Platform Working Capital
If an operator runs a promotion (e.g. 20% off Bouake weekend promo) where `fundingType = "OPERATOR"`:
* `ticketDiscountXOF` = 1,200 XOF
* `Subtotal` becomes 4,800 XOF.
* When paid via Paystack, Paystack collects $4,800 + \text{fee} = 4,920 \text{ XOF}$.
* In `BookingConfirmationService.confirmFromPayment()`:
  * The ledger adds a credit to `operatorAcct` for `snapshot.operatorNetXOF`.
  * BUT because `postOperatorContra` is hardcoded to `false` in `confirmFromPayment()`:
    ```typescript
    postOperatorContra: false
    ```
  * The operator is credited their normal receivable while Paystack collected discounted cash!
  * **Moja Ride's clearing bank account pays for the operator's discount!**

### Flaw 2: Schedule Fares Stored as Int without Currency Guard
The `Fare` model in `schema.prisma` stores `priceXOF: Int`. The system assumes all fares in the database are Franc CFA (`XOF`). However, if Moja Ride expands into Ghana (`GHS`) or Nigeria (`NGN`), which have 2-decimal minor units, the entire integer ledger engine will suffer 100x decimal truncation errors. A currency field must be explicitly associated with every schedule and fare.

### Flaw 3: Bus Scheduling Overlap Conflict Window
In `schedules.ts`, `checkBusScheduleConflict()` verifies if a preferred bus is scheduled for overlapping times. However, it assumes a fixed 120-minute fallback duration if the full-route fare record is missing, allowing bus over-allocation on long-haul routes (e.g. Abidjan to Korhogo, which takes 9 hours!).
