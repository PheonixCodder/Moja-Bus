# Moja Ride Design & Design-Engineering Audit
## 05. Typography System

### 1. Typography Hierarchy & Font Loading Architecture

The Moja Ride ecosystem relies on **Montserrat** as its primary brand display and body typeface across both web and mobile:
- **Web (`apps/web`)**: Loaded via `next/font/google` in `apps/web/app/layout.tsx` (`Montserrat({ subsets: ["latin"], variable: "--font-montserrat" })`).
- **Traveler Mobile (`apps/traveler-app`)**: Loaded via `@expo-google-fonts/montserrat` with a custom font hook (`useLoadFonts`).
- **Driver Mobile (`apps/driver-app`)**: Loaded via `@expo-google-fonts/montserrat` with weights: `Montserrat`, `Montserrat-Medium`, `Montserrat-SemiBold`, `Montserrat-Bold`.

---

### 2. The Web vs Mobile Typography Schism

#### 2.1 Web Typography Stack
In `packages/theme/global.css`:
```css
--font-display-base:
  var(--font-montserrat), Montserrat, Inter, ui-sans-serif, system-ui,
  sans-serif;
--font-mono-base:
  ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
  "Courier New", monospace;
```
In `packages/ui/src/styles/globals.css`:
```css
@layer base {
  body {
    @apply bg-background text-foreground font-sans;
  }
}
```
Web relies primarily on standard Tailwind utility classes (`text-sm`, `text-base`, `text-lg`, `text-2xl`, `text-3xl`). However, there is **no formal typography component or scale constraint**. Headings are inconsistently sized across views:
- Passenger Dashboard Title: `text-2xl font-semibold tracking-tight lg:text-3xl`
- Operator Dashboard Title: `text-2xl md:text-3xl font-extrabold font-display tracking-tight`
- Admin Dashboard Title: `text-2xl font-bold font-display tracking-tight text-slate-900`
- Section Subheadings: Alternating between `text-sm font-semibold`, `text-base font-bold`, and `text-xs font-bold uppercase tracking-wider`.

#### 2.2 Mobile Typographic Chaos: The Two Competing Approaches

```
Mobile Typography Comparison
┌───────────────────────────────────────────────────────────────┐
│ DRIVER APP (Intentional In-Cab Scale)                         │
│  - h1: 28px / 34px line-height (bold)                         │
│  - h2: 22px / 28px line-height (bold)                         │
│  - h3: 18px / 24px line-height (semibold)                     │
│  - h4: 15px / 20px line-height (medium)                       │
│  - body-lg: 16px / 24px line-height (regular)                 │
│  - body-md: 14px / 20px line-height (regular)                 │
│  - body-sm: 12px / 18px line-height (regular)                 │
│  - caption: 11px / 15px line-height (regular)                 │
├───────────────────────────────────────────────────────────────┤
│ TRAVELER APP (Copy-pasted Desktop Web Markdown Scale)         │
│  - h1: 36px (text-4xl) centered extabold                      │
│  - h2: 30px (text-3xl) with "border-b pb-2" horizontal rule!  │
│  - h3: 24px (text-2xl) semibold                               │
│  - h4: 20px (text-xl) semibold                                │
│  - p:  "mt-3 leading-7 sm:mt-6" (prose paragraph margins)     │
└───────────────────────────────────────────────────────────────┘
```

#### Why Traveler Mobile's Typography is Flawed
In `apps/traveler-app/components/ui/text.tsx`:
```tsx
const textVariants = cva(
  "text-foreground text-base",
  {
    variants: {
      variant: {
        h1: "text-center text-4xl font-extrabold tracking-tight",
        h2: "border-border border-b pb-2 text-3xl font-semibold tracking-tight",
        h3: "text-2xl font-semibold tracking-tight",
        h4: "text-xl font-semibold tracking-tight",
        p: "mt-3 leading-7 sm:mt-6",
        blockquote: "mt-4 border-l-2 pl-3 italic sm:mt-6 sm:pl-6",
        code: "bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
      }
    }
  }
);
```
- **The Issue**: This file was copied verbatim from a web documentation or blog markdown starter template.
- **The Impact**: On mobile screens (375px–414px width), an `h1` at 36px (`text-4xl`) occupies 3 lines of text for a simple screen title. An `h2` at 30px (`text-3xl`) renders a bottom border (`border-b pb-2`), which looks bizarre inside modal sheets, booking cards, and settings lists.
- **The Driver Contrast**: Driver App's `global.css` utilities (`h1` = 28px, `h2` = 22px, `h3` = 18px, `h4` = 15px) are far more mature and appropriate for mobile touchscreens.

---

### 3. Financial, Timestamps & Operational Typography

Transportation and booking platforms require exceptional typographical clarity for **times, prices, seat numbers, and license plates**.

#### 3.1 Tabular Numerals (`tabular-nums`)
When timers tick down (e.g. hold expiration in checkout) or currency numbers change in financial tables, monospace/tabular numbers prevent jitter.
- **Pass**:
  - `passenger-dashboard-view.tsx` line 198: `<div className="font-bold text-2xl tabular-nums leading-none tracking-tight text-foreground">`
  - `admin-kpi-cards.tsx` line 76: `<span className="text-3xl leading-none tracking-tight font-semibold tabular-nums">`
- **Fail**:
  - `operator-dashboard-view.tsx` line 171: Uses `font-mono tracking-tight text-text-primary`. Monospace font (`Courier New`/`ui-monospace`) is used instead of Montserrat with `tabular-nums`, resulting in an awkward programming-code aesthetic for financial numbers.
  - `operator-bookings-view.tsx`: Booking card references and departure times omit `tabular-nums`.
  - Traveler App ticket sheets and seat prices omit `tabular-nums`, causing visual jumping during count downs.

#### 3.2 Uppercase & Letter Spacing Abuse
Across `apps/web`:
- Badges and labels frequently use: `text-[9px] uppercase tracking-widest font-extrabold` or `text-[10px] uppercase font-bold tracking-wider`.
- When text drops below `11px`, aggressive uppercase letter-spacing with bold weights degrades legibility on standard displays (especially non-retina Windows monitors).
- Examples:
  - `passenger-tickets-view.tsx` line 482: `text-[10px] font-bold text-text-muted font-mono tracking-tight`
  - `operator-dashboard-view.tsx` line 119: `text-[10px] font-bold uppercase tracking-wider`
  - `operator-bookings-view.tsx` line 33: `text-xs font-semibold text-text-muted uppercase tracking-wide`

---

### 4. Typography System Recommendations

1. **Establish Canonical Typography Scale in `@moja/theme`**:
   - `display`: 32px / 40px line-height / -0.02em tracking / Bold
   - `heading-1`: 24px / 32px line-height / -0.015em tracking / Bold
   - `heading-2`: 20px / 28px line-height / -0.01em tracking / SemiBold
   - `heading-3`: 16px / 24px line-height / 0 tracking / SemiBold
   - `body-lg`: 16px / 24px line-height / Regular & Medium
   - `body-default`: 14px / 20px line-height / Regular & Medium
   - `caption`: 12px / 16px line-height / Regular & Medium
   - `micro`: 11px / 14px line-height / Medium (never below 11px)
2. **Replace Traveler Mobile's `text.tsx`**:
   Replace the web markdown variants (`h1`, `h2` with border) with the canonical mobile scale matching `driver-app/constants/theme.ts`.
3. **Enforce `tabular-nums` for Financial Values & Timers**:
   Ensure all currency displays, seat counts, and countdown timers consistently apply `tabular-nums font-sans`.
