# Moja Ride Design & Design-Engineering Audit
## 04. Color System Audit

### 1. Brand Color & Palette Spectrum

The core brand identity of Moja Ride is anchored by its vibrant magenta/rose accent: `#ee237c`.
However, across the codebase, this color is applied inconsistently and diluted by competing brand colors, raw CSS hues, and rogue styling.

```
Moja Ride Color Spectrum (Detected in Codebase)
┌────────────────────────────────────────────────────────────────────────┐
│ PRIMARY BRAND ACCENT                                                   │
│  - Standard:        #ee237c (OKLCH oklch(0.628 0.258 29.234))          │
│  - Active/Pressed:  #be123c (Driver/Traveler), #d01867 (Home)          │
│  - Mismatched Pink: pink-100, pink-300, pink-400 (Seat Map)            │
├────────────────────────────────────────────────────────────────────────┤
│ ROGUE BRAND INTRUSIONS                                                 │
│  - Neon Lime Green: bg-neon, rgba(57,255,20,1) (Dashboard Header)     │
│  - Pure Pitch Black: bg-slate-900 (Operator Hero in Light Mode)        │
├────────────────────────────────────────────────────────────────────────┤
│ COMPETING NEUTRAL SYSTEMS (Coexisting in Web)                          │
│  - OKLCH Semantics: --background, --foreground, --card, --muted        │
│  - Tailwind Slate:  slate-900, slate-800, slate-700, slate-500, etc.   │
│  - Tailwind Zinc:   zinc-900, zinc-500, zinc-200                       │
│  - Ghost Classes:   text-text-primary, bg-bg-base, bg-bg-surface       │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Deep-Dive: Color Anti-Patterns & Violations

#### 2.1 The "Radioactive Green" Button in Passenger Header
In `apps/web/features/dashboard/components/dashboard-header.tsx` line 36:
```tsx
<Link
  href="/"
  className="inline-flex items-center gap-1.5 rounded-md bg-neon px-3 py-1.5 text-sm font-semibold text-black shadow-[0_0_12px_rgba(57,255,20,0.15),0_0_2px_rgba(57,255,20,1)] transition-shadow duration-150 hover:bg-neon/90"
>
  <Search className="size-4" />
  {t("findBus")}
</Link>
```
- **The Issue**: On a platform where all primary calls to action are magenta (`#ee237c`), this primary action button is rendered with an electric lime-green glow (`rgba(57,255,20,1)`).
- **The Impact**: Severely degrades brand authority, makes the product look like a template kit with leftover experimental styles, and violates visual hierarchy.
- **Remediation**: Use `bg-primary text-primary-foreground hover:bg-primary/90` with standard focus rings.

#### 2.2 Inverted Hero Card in Operator Dashboard (Light Mode)
In `apps/web/features/operator/views/operator-dashboard-view.tsx` line 110:
```tsx
<div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 text-white shadow-lg">
  <div className="absolute right-0 bottom-0 translate-y-8 translate-x-8 text-white/5 pointer-events-none">
    <Bus className="w-80 h-80" />
  </div>
  <h1 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-white">
    {company?.name || t("portalFallback")}
  </h1>
  <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed">
    {statusDesc}
  </p>
</div>
```
- **The Issue**: The page is rendered on an off-white background (`oklch(1 0 0)`), but the top card is forced into dark mode with hardcoded `bg-slate-900`, `text-white`, and `text-slate-400`.
- **The Impact**: High visual shock, poor information hierarchy (the hero card visually overwhelms the actual operational metrics below it), and breaks theme consistency.

#### 2.3 Pastel Pink Dilution in Passenger Seat Map
In `apps/web/features/booking/components/passenger-seat-map.tsx` line 205:
```tsx
isSelected
  ? "border-pink-400 bg-pink-100 text-pink-800 ring-2 ring-pink-300"
  : style.className
```
- **The Issue**: When a traveler selects a seat on the web app, the seat turns a muted pastel pink (`bg-pink-100`, `text-pink-800`). On the mobile app (`passenger-seat-map.tsx` line 85), the selected seat turns bright solid magenta (`bg-[#ee237c] text-white`).
- **The Impact**: Inconsistent visual feedback between web and mobile; pastel pink has weak contrast and fails to feel decisive.

---

### 3. Semantic State Colors (Success, Warning, Destructive, Info)

Semantic colors must communicate state reliably. In Moja Ride, semantic colors are overloaded, hardcoded, and unstandardized:

| Semantic State | Canonical Role | Current Implementations across Monorepo | Coherence Rating |
| :--- | :--- | :--- | :---: |
| **Destructive / Error** | Cancellations, failed payments, clawbacks, deletions | `oklch(0.577 0.245 27.325)` (`packages/theme`), `#ef4444` (`driver-app`), `text-red-600 bg-red-50` (`status-config.ts`), `bg-rose-500/10` (`booking-card.tsx`) | `3/10` |
| **Success** | Confirmed bookings, settled withdrawals, active fleet | **Missing in `@moja/ui`**! Implemented ad-hoc as `emerald-500`, `emerald-600`, `green-600`, `bg-green-500/10`, `#10b981` | `2/10` |
| **Warning** | Pending payments, hold timeouts, review alerts | **Missing in `@moja/ui`**! Implemented ad-hoc as `amber-500`, `amber-600`, `orange-500`, `amber-100`, `#f59e0b` | `2/10` |
| **Informational** | Scheduled departures, vehicle tracking, notes | **Missing in `@moja/ui`**! Implemented ad-hoc as `blue-600`, `blue-500`, `purple-700`, `#3b82f6` | `2/10` |

#### Why `@moja/ui` is Responsible
Because `@moja/ui/src/components/ui/badge.tsx` only defines:
`default` (primary pink), `secondary` (muted gray), `destructive` (red), `outline`, `ghost`, `link`.
It has **no `success` variant**, **no `warning` variant**, and **no `info` variant**.
Developers wanting to render a "Confirmed" booking or "Verified" company cannot use `<Badge variant="success">`. They are forced to write raw utility strings or custom inline components.

---

### 4. Accessibility & Contrast Failures

#### 4.1 Light Mode Text Contrast
1. In `apps/web/features/booking/views/passenger-tickets-view.tsx` line 529:
   `text-[10px] font-bold text-text-muted uppercase tracking-wider`
   Because `text-text-muted` does not exist in CSS, it defaults to whatever color is inherited. In many contexts, this yields low-contrast gray text on light backgrounds.
2. In `apps/web/features/admin/components/withdrawals-filter-bar.tsx` line 55:
   `<ListFilter className="size-4 text-text-muted" />`
   The icon fails WCAG AA 3:1 non-text contrast requirement if the inherited color is faint.

#### 4.2 Dark Mode Text Inversion Failures
In `apps/web/app/[locale]/dashboard/admin/page.tsx` line 64:
```tsx
<h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
  {t("systemOverview")}
</h1>
<p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
  {t("monitorText")}
</p>
```
If `.dark` mode is ever applied to `<html>`, `text-slate-900` remains `#0f172a` (nearly pure black) against a dark gray background (`oklch(0.145 0 0)` = `#171717`). The text becomes completely invisible.

---

### 5. Color System Remediation Strategy

1. **Formalize Semantic Functional Tokens in `@moja/theme/global.css`**:
   ```css
   :root {
     /* Status Tokens - Light */
     --success: oklch(0.627 0.194 149.214);
     --success-foreground: #ffffff;
     --success-subtle: oklch(0.96 0.04 149.214);
     
     --warning: oklch(0.769 0.188 70.08);
     --warning-foreground: #171717;
     --warning-subtle: oklch(0.97 0.05 70.08);
     
     --info: oklch(0.6 0.118 227.392);
     --info-foreground: #ffffff;
     --info-subtle: oklch(0.96 0.03 227.392);
   }
   ```
2. **Add Variants to `@moja/ui/src/components/ui/badge.tsx`**:
   Add `success`, `warning`, and `info` badge variants with corresponding subtle backgrounds and borders.
3. **Audit and Eradicate Hardcoded Palettes**:
   Replace all `slate-900` headings with `text-foreground`, and all `slate-500` descriptions with `text-muted-foreground`.
4. **Remove Rogue Color Classes**:
   Eradicate `bg-neon` and `rgba(57,255,20,1)` from `dashboard-header.tsx`.
