# Moja Ride Design & Design-Engineering Audit
## 23. Financial Trust & Transaction UX

### 1. Financial Stakes in the Moja Ride Ecosystem

Moja Ride processes significant financial value:
- Passengers purchase intercity bus tickets via Mobile Money (Wave, Orange Money, MTN, Moov) and Cards.
- Carriers accumulate balances from passenger fares held in platform escrow.
- Operators request multi-million XOF carrier payouts and settlements.
- Drivers negotiate and accept monthly employment contracts.

In any fintech or marketplace platform, **ambiguity in financial presentation destroys trust**.

---

### 2. The Currency Notation Drift: `XOF` vs `FCFA` vs `CFA`

Across the monorepo, the currency of Côte d'Ivoire and the WAEMU zone is referred to using four conflicting nomenclatures:

```
Currency Terminology Fragmentation
┌─────────────────────────────────────────────────────────────┐
│ 1. "XOF" (ISO 4217 Currency Code)                           │
│    - Passenger overview: `${walletBalance} XOF`             │
│    - Operator overview:  `formatCurrency(..., "XOF")`       │
│    - Traveler app lib:   `formatPriceXOF`                   │
├─────────────────────────────────────────────────────────────┤
│ 2. "FCFA" (Popular Colloquial French Abbreviation)          │
│    - Driver offers:      `Proposed monthly salary (FCFA)`   │
│    - Operator fares:     `Tarif (FCFA)`, `Prix (FCFA)`      │
│    - Terms & FAQ:        `500 FCFA service fee`             │
│    - Wallet schema:      `Minimum top-up is 500 FCFA`       │
├─────────────────────────────────────────────────────────────┤
│ 3. "CFA" (Shorthand)                                        │
│    - Driver app:         `cfaMonthly: "FCFA / mois"`        │
│    - Admin marketplace:  `offer.currentSalaryCFA`           │
├─────────────────────────────────────────────────────────────┤
│ 4. "FCFA / XOF" (Double notation)                           │
│    - FAQ section:        `FCFA / XOF`                       │
└─────────────────────────────────────────────────────────────┘
```

#### Why This Matters
For an international traveler or first-time user booking a ticket from Abidjan to Yamoussoukro:
- Seeing "12,500 XOF" on the search results, "12 500 FCFA" on the checkout page, and "12500 CFA" in the confirmation SMS creates cognitive doubt as to whether they are looking at the same currency or whether extra conversion fees apply.

---

### 3. Number Formatting & Thousand Separators

Even when currency is labeled, the numeric formatting differs by view:
1. `traveler-app/features/booking/lib/format-time.ts`:
   `amount.toLocaleString('fr-FR')} XOF` → Produces non-breaking space separators: `12 500 XOF`.
2. `operator-dashboard-view.tsx`:
   `new Intl.NumberFormat("en-US", { style: "currency", currency: "XOF", maximumFractionDigits: 0 })` → Produces comma separators: `XOF 12,500`.
3. `admin-dashboard-view.tsx`:
   `gmv.toLocaleString()` → Depends on browser default locale. If an admin is in France, it produces spaces; in the US, it produces commas; in Germany, it produces periods.

---

### 4. Fee Transparency & Hold Countdown Timers

#### 4.1 Positive: The Hold Countdown Timer
In `apps/web/features/booking/lib/hold-countdown.ts` and `apps/traveler-app/features/booking/hooks/use-hold-countdown.ts`:
- When a traveler initiates checkout, the platform reserves their seat for 10 minutes.
- A live countdown timer is displayed (`useHoldCountdown`).
- When the hold expires, the UI clearly displays "Expired" with a prompt to re-select seats.
- **Evaluation**: Exemplary fintech booking UX (benchmarked against Airbnb and Ticketmaster). Prevents double-booking and communicates urgency honestly.

#### 4.2 Defect: Service Fee Disclosure
In `apps/web/features/home/data/terms.ts` line 186:
"A service fee of 500 FCFA will be charged per booking. Service fees are non-refundable."
- However, during the interactive seat selection and checkout steps, the 500 FCFA platform fee is not broken down itemized in the price card until the final payment step.
- Displaying a surprise 500 FCFA fee on the final payment button causes cart abandonment.

---

### 5. Financial Trust Scorecard

| Dimension | Score | Comments |
| :--- | :---: | :--- |
| **Seat Reservation Trust** | `8.5 / 10` | Hold timer countdown is robust, clear, and reassuring. |
| **Currency Consistency** | `3.5 / 10` | Chaotic mixing of XOF, FCFA, and CFA with conflicting separators. |
| **Fee Transparency** | `6.0 / 10` | 500 FCFA platform fee should be itemized earlier in checkout flow. |
| **Payout & Settlement UI**| `7.8 / 10` | Strong treasury balance sheets and ledger auditing. |

---

### 6. Recommendations for Financial UX

1. **Standardize Currency Notation Monorepo-Wide**:
   - Adopt **"FCFA"** as the primary consumer display label across French and English interfaces in West Africa, or establish **"XOF"** universally. Do not mix them.
2. **Create `<CurrencyAmount>` Component**:
   ```tsx
   <CurrencyAmount amount={12500} format="compact" />
   ```
   Centralize formatting with locale-aware thousand separators and non-breaking spaces.
3. **Itemize Fees Early in the Checkout Flow**:
   Display the fare breakdown (Base Seat Fare + 500 FCFA Platform Fee = Total Payable) in the seat selection sheet before the user reaches the payment gateway.
