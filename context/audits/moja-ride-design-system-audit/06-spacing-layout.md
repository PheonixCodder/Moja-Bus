# Moja Ride Design & Design-Engineering Audit
## 06. Spacing & Layout System

### 1. The Mathematical Spacing Grid

Modern design systems adhere to a strict **4px or 8px base rhythm**:
- 4px (`0.25rem` / `1`)
- 8px (`0.5rem` / `2`)
- 12px (`0.75rem` / `3`)
- 16px (`1rem` / `4`)
- 20px (`1.25rem` / `5`)
- 24px (`1.5rem` / `6`)
- 32px (`2rem` / `8`)
- 48px (`3rem` / `12`)
- 64px (`4rem` / `16`)

#### Spacing Violations & Arbitrary Values
Across the Moja Ride repository, developers frequently bypass the standard grid in favor of fractional or arbitrary values:
- `gap-1.5` (6px) and `gap-2.5` (10px) appear over 80 times across `apps/web`.
- `p-3.5` (14px) and `p-5` (20px) alternate randomly with `p-4` (16px) and `p-6` (24px) within the same card hierarchies.
- `h-8.5` (34px) in `admin-staff-filters-toolbar.tsx` line 65:
  `<SelectTrigger className="h-8.5 w-[130px] border-border bg-bg-base text-xs">`
  An arbitrary non-standard control height that exists nowhere else.

---

### 2. Dashboard Container Widths & Page Margins

Across the three web dashboards, page container constraints are completely unaligned:

| Dashboard | File | Container Constraint | Page Padding | Behavior on Ultrawide Displays (>1800px) |
| :--- | :--- | :--- | :--- | :--- |
| **Passenger Web** | `passenger-dashboard-view.tsx` | **No max-width** (`w-full`) | `p-4 lg:p-6` | Stretches endlessly. Cards and search inputs stretch across the entire screen, causing extreme horizontal eye travel. |
| **Operator Web** | `operator-dashboard-view.tsx` | `max-w-[1400px] mx-auto` | `px-6 py-5 pb-10` | Centered with maximum 1400px width. Controlled layout. |
| **Admin Web** | `apps/web/app/.../admin/page.tsx` | `max-w-7xl mx-auto` (1280px) | `p-6 md:p-8` | Centered with maximum 1280px width. Narrower than operator dashboard. |

#### Analysis:
The consumer-facing Passenger Dashboard—which should feel the most curated and human-scaled—is the one surface that lacks any container constraint (`max-w-7xl` or `max-w-6xl`). It balloons uncontrollably on desktop monitors.

---

### 3. Card Padding & Internal Rhythm

A mature interface maintains a consistent padding grammar based on component scale:
- Small card / list item: 12px padding (`p-3`)
- Standard dashboard card: 16px or 20px padding (`p-4` or `p-5`)
- Major section panel: 24px padding (`p-6`)

#### Inconsistencies Found:
1. `apps/web/features/dashboard/views/passenger-dashboard-view.tsx`:
   - Quick Search banner: `p-6` (24px)
   - KPI cards: `p-6` (via CardContent defaults)
   - Recent Bookings card: `pb-4` header, `pt-6` content, `p-4` internal booking item
   - Nested cards inside card: Card (`p-6`) → Booking Row (`p-4`) → Badge/Actions. Good hierarchy.
2. `apps/web/features/admin/components/withdrawals-kpi-cards.tsx` lines 22–23:
   ```tsx
   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-border rounded-xl bg-bg-base/50 p-1">
     <div className="flex flex-col gap-1 p-5 border border-border/50 rounded-lg bg-bg-base shadow-sm">
   ```
   Nested cards with `p-1` (4px) outer shell padding and `p-5` (20px) inner card padding. Unconventional and visually cramped.
3. `apps/web/features/operator/components/bookings/booking-row.tsx`:
   `CardContent className="p-4 space-y-3"`. In an operational list of 50 bookings, `p-4` with `space-y-3` produces excessive vertical height per row (approx. 140px per booking). A standard operational data row is 40px–48px high. The vertical sprawl forces 7,000px of scrolling for 50 items.

---

### 4. Mobile Spacing: Insets & Content Max-Widths

#### 4.1 Driver App ScreenShell Disciplined Layout
In `apps/driver-app/components/ui/ScreenShell.tsx`:
```ts
contentWrap: {
  width: "100%",
  maxWidth: 480,
  alignSelf: "center",
  gap: 20,
}
```
- **The Good**: Enforces a strict `maxWidth: 480` so that when the driver app is run on an Android tablet or mounted terminal in a bus cockpit, forms and buttons do not stretch into unergonomic wide bars.
- **The Spacing**: Consistent `gap: 20` between vertical form sections.

#### 4.2 Traveler App Spacing Incoherence
In `apps/traveler-app`:
- `constants/theme.ts`: defines `MaxContentWidth = 800`.
- However, individual screens fail to use a shared wrapper. Some screens implement `paddingHorizontal: 16`, others `paddingHorizontal: 20`, and others `px-4`.
- Modal sheets manually compute: `style={{ paddingBottom: insets.bottom + 16 }}` or `paddingBottom: insets.bottom + 24`.

---

### 5. Spacing System Recommendations

1. **Codify Unified Dashboard Container Scale**:
   - Web App Standard: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` for Passenger and Admin.
   - Operator Density Standard: `max-w-[1440px] mx-auto px-6` to allow high-density multi-column data views.
2. **Eradicate Fractional Spacing**:
   - Standardize on `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), and `gap-6` (24px).
   - Eliminate all instances of `h-8.5`, `gap-1.5`, and `gap-2.5`.
3. **Formalize Mobile Screen Wrapper for Traveler App**:
   - Create a `ScreenContainer` in `apps/traveler-app` with built-in safe area handling and standard 16px/20px horizontal padding.
