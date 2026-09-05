# Moja Ride Design & Design-Engineering Audit
## 15. Operator Dashboard

### 1. B2B SaaS Operational Archetype

The Operator Dashboard (`apps/web/app/[locale]/dashboard/operator`) is a **mission-critical operational SaaS platform** for bus company dispatchers, station managers, and fleet owners.
Key user goals:
- **Rapid Passenger Check-in**: Scanning tickets or checking off names in seconds during rush-hour boarding.
- **Fleet & Schedule Visibility**: Monitoring departures, delays, seat occupancy, and active buses.
- **Revenue & Withdrawals**: Tracking daily cash-flow, ticket sales, and requesting payouts.
- **High Information Density**: The interface must prioritize fast visual scanning, compact rows, keyboard efficiency, and status recognition over decorative whitespace.

---

### 2. Deep-Dive: Operator Dashboard Overview

In `apps/web/features/operator/views/operator-dashboard-view.tsx`:

#### 2.1 The Pitch-Black Hero Card Anti-Pattern
Lines 110–156:
```tsx
<div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 text-white shadow-lg">
  <div className="absolute right-0 bottom-0 translate-y-8 translate-x-8 text-white/5 pointer-events-none">
    <Bus className="w-80 h-80" />
  </div>
  ...
</div>
```
- **The Issue**: In a light-mode dashboard, this giant pitch-black card visually dominates the screen, drawing the dispatcher's attention away from the real-time departure list and operational metrics below.
- **The Rationale**: Likely created to look "cool" or "modern", but it breaks the visual rhythm of enterprise SaaS (benchmarked against Stripe or Shopify).

#### 2.2 KPI Stats Grid
Lines 159–250:
- Four metric cards: Today's Revenue, Today's Bookings, Occupancy Rate, and Active Fleet.
- **Positive**: Direct mapping to core transportation metrics; includes progress bar for seat occupancy target.
- **Deficiency**: Cards use `bg-bg-surface`, `text-text-primary`, and `text-text-muted` (ghost classes), rendering without background depth in standard builds.

#### 2.3 Today's Departures Panel
Lines 254–350:
- Renders live departures with departure time, route stops, assigned bus, driver, and passenger booking count.
- Integrates a quick-action "Scan Ticket" button launching `TicketScanner`.

---

### 3. The "Card Soup" Failure in Bookings View

In `apps/web/features/operator/views/operator-bookings-view.tsx` and `components/bookings/bookings-list.tsx`:

#### The Architectural Failure
`BookingsList` loads up to **50 bookings per page** (`const PAGE_SIZE = 50`).
Instead of rendering these bookings in a **compact operational table**, it renders **50 stacked `<Card>` components** (`BookingRow`):

```tsx
// apps/web/features/operator/components/bookings/booking-row.tsx
<Card className="border-border bg-bg-surface">
  <CardContent className="p-4 space-y-3">
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
        {booking.bookingReference}
      </p>
      <h3 className="text-base font-bold text-text-primary truncate">
        {booking.passengerName}
      </h3>
      <p className="text-xs text-text-secondary mt-0.5">
        {booking.originCityName} → {booking.destinationCityName} · {t("card.seat", { seat: booking.seatLabel })}
      </p>
      <p className="text-xs text-text-muted mt-0.5">
        {formatDateWithWeekday(booking.departureTime)} · {formatDepartureTime(booking.departureTime)} · {booking.passengerPhone}
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
      <Button size="sm" variant="ghost">Details</Button>
      <Link href="...">Manifest</Link>
      <Button size="sm">Check In</Button>
    </div>
  </CardContent>
</Card>
```

#### The User Impact on Dispatchers:
1. **Excessive Vertical Scroll**: Each card is ~140px tall. Scrolling through 50 items requires scrolling through **7,000 vertical pixels**.
2. **Low Scanning Speed**: Finding a passenger by name or seat number is agonizingly slow because eyes must zig-zag across multiple lines of text per card.
3. **No Sorting or Column Filtering**: Unlike a real data table, dispatchers cannot click column headers to sort by Seat Number, Departure Time, or Check-In Status.

---

### 4. Operator Dashboard Scorecard

| Dimension | Score | Comments |
| :--- | :---: | :--- |
| **Operational Efficiency** | `4.5 / 10` | Crippled by 50-card booking list; lacks column sorting and keyboard navigation. |
| **Information Density** | `5.0 / 10` | Too much whitespace in lists; lacks density required for terminal operations. |
| **Visual Coherence** | `5.2 / 10` | Jarring contrast between black hero card and light-mode dashboard; ghost class pollution. |
| **Perceived Performance** | `4.0 / 10` | `loading.tsx` blanks out the entire screen on tab changes with a bare spinner. |
| **Role & Permission UX** | `7.8 / 10` | Strong IAM permission gating (`useStaffPermissions`) cleanly disabling unauthorized actions. |

---

### 5. Operator Dashboard Remediation Roadmap

1. **Re-engineer Bookings View as a High-Density Table**:
   - Replace `bookings-list.tsx` with a `@tanstack/react-table` implementation.
   - Rows should be 44px tall with columns: Checkbox, Status Badge, Reference, Passenger Name & Phone, Route, Seat, Departure Time, Check-In Action.
   - Include quick keyboard shortcuts (e.g. `/` to focus search, Space to check-in selected row).
2. **Refactor Hero Card in Overview View**:
   - Align the hero banner with light-mode styling (`bg-card border-border text-foreground`) using subtle brand accent borders rather than a pitch-black box.
3. **Replace Full-Page Spinner in `loading.tsx`**:
   - Provide layout-matched skeletons to prevent screen flashing during route transitions.
