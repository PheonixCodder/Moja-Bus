# Moja Ride Design & Design-Engineering Audit
## 20. Tables & Data-Dense UI

### 1. Data Density as an Operational Core Requirement

In transportation management platforms (dispatch, fleet tracking, passenger manifest reconciliation, settlement ledgering), data density is a **functional requirement**, not an aesthetic choice:
- A terminal manager during peak departure hours must scan 20–30 passenger rows simultaneously without excessive scrolling.
- An administrator reconciling carrier payouts must see Gross Fare, Platform Commission, Net Payable, and Escrow Status side-by-side in aligned tabular format.
- Adding arbitrary whitespace, huge card borders, and oversized padding to operational lists degrades operational velocity.

---

### 2. Table Implementation Audit: The `@tanstack/react-table` Divide

Only **5 views** in the entire web monorepo leverage `@tanstack/react-table`:
1. `apps/web/features/admin/views/admin-ledger-view.tsx`
2. `apps/web/features/admin/views/admin-verifications-view.tsx`
3. `apps/web/features/admin/components/withdrawals-table.tsx`
4. `apps/web/features/admin/components/travelers.tsx`
5. `apps/web/features/admin/components/operators.tsx`

Every other data-dense interface in the repository uses one of two inferior patterns:
- **Raw HTML `<table>` elements** without sorting, virtual scrolling, or keyboard accessibility (e.g. `saved-passengers-view.tsx`, `transaction-history.tsx`, `campaign-redemptions-table.tsx`).
- **Stacked `<Card>` elements ("Card Soup")** (e.g. `operator-bookings-view.tsx`, `operator-trips-view.tsx`, `dispatch-trip-list.tsx`).

---

### 3. Deep-Dive: Operator Bookings View ("Card Soup")

In `apps/web/features/operator/views/operator-bookings-view.tsx`:
- Fetches 50 bookings per page.
- Renders each booking as an expansive `<Card>` containing 4 paragraphs of text, badges, and action buttons.
- **Row Height**: ~140px per item.
- **Total Vertical Height**: ~7,000px for a single page.
- **Ergonomic Comparison**:

```
OPERATIONAL VIEW: CARDS VS DATA TABLE (50 Bookings)

[CARD STACK PATTERN] (Current Moja Operator)
┌────────────────────────────────────────────────────────┐
│ REF-001   CONFIRMED                       [Details]   │
│ Koffi Kouassi                             [Manifest]  │
│ Abidjan → Yamoussoukro · Seat 14A         [Check In]  │
│ Friday, 12 Oct · 08:30 · +225 0700000000              │
└────────────────────────────────────────────────────────┘
  ... (Requires 7,000px vertical scroll to see 50 items) ...

[COMPACT TABLE PATTERN] (Benchmark: Linear / Stripe)
┌───────┬────────────┬───────────────┬────────────────┬──────┬─────────┬──────────┐
│ Status│ Reference  │ Passenger     │ Route          │ Seat │ Departs │ Actions  │
├───────┼────────────┼───────────────┼────────────────┼──────┼─────────┼──────────┤
│ Conf. │ REF-001    │ Koffi Kouassi │ Abidjan→Yamous.│ 14A  │ 08:30   │ [CheckIn]│
│ Conf. │ REF-002    │ Aya Traoré    │ Abidjan→Yamous.│ 14B  │ 08:30   │ [CheckIn]│
│ Pend. │ REF-003    │ Jean Bamba    │ Abidjan→Bouaké │ 02A  │ 09:00   │ [Details]│
└───────┴────────────┴───────────────┴────────────────┴──────┴─────────┴──────────┘
  ... (Fits 20-25 visible items above the fold on desktop) ...
```

#### Why This Matters for Moja Ride:
At a busy station in Treichville or Adjamé, a bus conductor or station agent has 5 minutes before departure to verify 40 boarding passengers. Asking that agent to scroll through 7,000 pixels of cards creates lines at the bus door and delays departure schedules.

---

### 4. Numeric Alignment & Financial Columns

In financial tables (`withdrawals-table.tsx`, `ledger-table.tsx`, `transaction-ledger-table.tsx`):
- **Right Alignment**: Financial amounts (e.g. `12,500 XOF`) must be **right-aligned** so decimal and thousand positions align visually, allowing fast column scanning.
- **Current State**: Several tables left-align currency amounts or center them, making it impossible to visually scan for large vs small numbers at a glance.
- **Tabular Numerals**: Many numeric cells omit `tabular-nums`, causing columns to shift slightly when values update.

---

### 5. Table Architecture Recommendations

1. **Standardize on `@tanstack/react-table` for All Operational Views**:
   - Convert `operator-bookings-view.tsx`, `operator-trips-view.tsx`, and `dispatch-trip-list.tsx` to high-density React Tables.
2. **Implement Standard Density Levels**:
   - Provide a density switcher or default to `compact` (row height: 40px–44px) for Operator and Admin interfaces.
3. **Enforce Financial Formatting Invariants**:
   - Right-align all currency, count, and percentage columns.
   - Enforce `font-sans tabular-nums` on all numeric data cells.
4. **Add Column Pinning**:
   - Pin the selection checkbox and Reference column on the left; pin action buttons on the right during horizontal scrolling.
