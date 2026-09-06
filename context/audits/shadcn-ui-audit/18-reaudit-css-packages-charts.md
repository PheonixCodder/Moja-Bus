# 18 — Incremental Reaudit: CSS Foundation, Packages, Charts, Fields

**Reaudit date:** 2026-09-05 (same session, continued)  
**Trigger:** Confirm `shadcn@4.21.0`, consumer-critical CSS from reference `app/globals.css`, package currency, charts/fields usage, missed issues.  
**Still audit-only** — no code changes.

---

## A. Is `shadcn@4.21.0` installed?

| Location | Result |
|----------|--------|
| `context/services/shadcn/package.json` | `"shadcn": "4.21.0"` (reference only) |
| `packages/ui/package.json` | **MISSING** |
| `apps/web/package.json` | **MISSING** |
| Root `package.json` | **MISSING** |
| `pnpm-lock.yaml` | **No `shadcn@` / `tw-animate-css@` entries** |
| `packages/ui/node_modules` | Has unused `@shadcn/react@0.1.0`; **no** `shadcn` CLI package |

**Verdict:** **FAIL.** The CLI + `shadcn/tailwind.css` package is **not** a Moja dependency.

Pinned reference / manual install docs require:

```bash
npm install shadcn class-variance-authority cn lucide-react tw-animate-css
```

`shadcn@4.21.0` exports `./tailwind.css` (see package `"exports"."./tailwind.css"`). Without it, consumers cannot `@import "shadcn/tailwind.css"` and cannot run a pinned local CLI workflow aligned to the reference.

→ **SHADCN-027 (CRITICAL)**

---

## B. Reference `app/globals.css` vs Moja CSS (consumer-critical only)

### Required by init / manual install (NOT docs-site fluff)

Reference starts with:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
```

| Import / capability | Reference | Moja `@moja/ui` globals | Moja theme |
|---------------------|-----------|-------------------------|------------|
| `tailwindcss` | Yes | Yes | — |
| `tw-animate-css` | Yes | **NO** (package not installed) | — |
| `shadcn/tailwind.css` | Yes | **NO** (`shadcn` not installed) | — |
| Hand-rolled enter/exit `@utility` subset | — | Yes (10 utilities) | — |
| Hand-rolled `@custom-variant data-*` (subset) | Via shadcn CSS | Partial local copy | — |
| Accordion keyframes with Base+Radix fallback | In `shadcn/tailwind.css` | Broken/radix-only | — |
| Docs `@source` for all style previews | Docs-only | N/A — **do not copy** | — |
| rehype / Arabic / typeset blocks | Docs-only | N/A — **do not copy** | — |

### What `shadcn/tailwind.css` (4.21.0) actually provides

Verified from `https://unpkg.com/shadcn@4.21.0/dist/tailwind.css`:

1. Accordion keyframes using  
   `var(--radix-accordion-content-height, var(--accordion-panel-height, auto))`
2. Dual-stack `@custom-variant` for `data-open|closed|checked|unchecked|selected|disabled|active|horizontal|vertical` (Radix `data-state` **and** Base UI attributes)
3. Utilities: `no-scrollbar`, `scroll-fade*`, `shimmer*`

Moja reinvents (1)+(2) incompletely and omits (3).

→ **SHADCN-028 (HIGH)**

### Token gaps (`:root` / `@theme inline`)

| Token / mapping | Reference | Moja theme | Notes |
|-----------------|-----------|------------|-------|
| `--surface` / `--surface-foreground` | Yes | **Missing** | Apps use ghost `bg-bg-surface` instead |
| `--selection` / `--selection-foreground` | Yes | **Missing** | No `::selection` base rule |
| `--code*` (code, foreground, highlight, number) | Yes | **Missing** | Docs-oriented but part of preset theme |
| `--font-heading` → `@theme` | Yes | **Missing** | Used in `empty.tsx`, `drawer.tsx` |
| Radius `2xl` / `3xl` / `4xl` | `calc(var(--radius) * 1.8/2.2/2.6)` | Only through `xl`; formula uses ±px | Scale drift |
| Radius formula | multiplicative | additive (±4px) | Intentional? Document if KEEP |
| Brand `--success*` / `--warning*` / `--info*` / `--primary-hover` / `--card-elevated` | Not in ref defaults | Present | **KEEP** (SHADCN-010) |
| Hex vs oklch color format | oklch | hex | Design customization — OK if consistent |
| `::selection { @apply bg-selection … }` | Yes | **Missing** | |

→ **SHADCN-029 (MEDIUM)** for missing surface/selection/code/font-heading/radius scale  
→ Ghost app classes escalate separately (**SHADCN-034**)

---

## C. Hand-rolled animations vs `tw-animate-css`

Moja defines only:

- `animate-in` / `animate-out`
- `fade-in-0` / `fade-out-0`
- `zoom-in-95` / `zoom-out-95`
- `slide-in-from-{top,bottom,left,right}-2`

**Used in components but NOT defined in Moja globals:**

| Class / pattern | Where | Effect |
|-----------------|-------|--------|
| `slide-in-from-left-52` / `slide-in-from-right-52` | `navigation-menu.tsx` | Motion likely no-op |
| `slide-out-to-left-52` / `slide-out-to-right-52` | `navigation-menu.tsx` | Motion likely no-op |
| bare `fade-in` / `fade-out` (no `-0`) | `navigation-menu.tsx` | Incomplete vs `fade-in-0` |

Official path: `@import "tw-animate-css"` generates the full animate utility family.

→ **SHADCN-030 (MEDIUM–HIGH)** for incomplete animation surface

---

## D. Accordion CSS variable mismatch (elevates SHADCN-009)

| Layer | Variable |
|-------|----------|
| Base UI runtime | `--accordion-panel-height` |
| Moja accordion panel class | `h-(--accordion-panel-height)` ✅ |
| Moja `@keyframes accordion-down/up` | **only** `--radix-accordion-content-height` ❌ |
| Official `shadcn/tailwind.css` | radix var **with fallback** to `--accordion-panel-height` |

Moja also applies `data-open:animate-accordion-down` on the Base panel. Height animation may fail or snap because the keyframe target var is never set by Base UI.

→ Strengthen **SHADCN-009** / related **SHADCN-035**

---

## E. Package currency matrix (Moja vs pinned reference)

| Package | `@moja/ui` | `apps/web` | Reference pin | Assessment |
|---------|------------|------------|---------------|------------|
| `shadcn` | — | — | **4.21.0** | **MISSING — SHADCN-027** |
| `tw-animate-css` | — | — | ^1.4.0 | **MISSING — SHADCN-028** |
| `cn` | — (local utils) | — | ^0.2.2 | Optional migrate — SHADCN-007 |
| `@base-ui/react` | ^1.6.0 | — | 1.6.0 | Aligned |
| `recharts` | 3.8.0 | 3.8.0 | 3.8.0 | Aligned |
| `cmdk` | ^1.1.1 | — | ^1.1.1 | Aligned |
| `input-otp` | ^1.4.2 | — | ^1.4.2 | Aligned |
| `vaul` | ^1.1.2 | — | 1.1.2 | Present (drawer KEEP/migrate) |
| `sonner` | ^2.0.7 | ^2.0.7 | ^2.0.0 | Compatible newer |
| `embla-carousel-react` | ^8.6.0 | — | 8.5.2 | Minor ahead |
| `lucide-react` | ^0.561.0 | ^0.561.0 | 0.474.0 | Ahead — OK if icons stable |
| `react-day-picker` | **^10.0.1** | — | **^9.7.0** | Major skew — SHADCN-024 |
| `radix-ui` | ^1.4.4 (dead) | — | ^1.4.3 | Remove — SHADCN-004 |
| `@radix-ui/react-slot` | ^1.2.4 (dead) | — | — | Remove |
| `@shadcn/react` | ^0.1.0 (unused) | — | — | Remove — not a substitute for `shadcn` |
| `@tanstack/react-table` | — | ^8.21.3 | ^9.0.0 | Web behind ref major (product dep) |
| `react-hook-form` | — | ^7.80.0 | ^7.62.0 | Fine |
| `@hookform/resolvers` | — | ^5.4.0 | ^3.10.0 | Major ahead — verify Zod peer |

**Note:** “Latest on npm” is **not** the audit target. Alignment is to **pinned reference** first; newer Moja pins are OK when intentional and verified.

---

## F. Charts usage vs architecture

### Primitive (`chart.tsx`)

Still near reference line-count (~336 vs ~333). Recharts 3.8.0 matched. Styling still inline-CVA (SHADCN-002/011).

### App consumers

| File | Uses `@moja/ui` Chart* | Pattern |
|------|------------------------|---------|
| `travel-insights-chart.tsx` | Yes | `ChartContainer` + `ChartTooltipContent` |
| `blog-views-chart.tsx` | Yes | Custom tooltip render prop (bypasses `ChartTooltipContent`) |
| `blog-read-depth-chart.tsx` | Yes | `ChartTooltipContent` |
| `driver-analytics-charts.tsx` | **No** | Raw `ResponsiveContainer` + recharts |
| `revenue-analytics-chart.tsx` | **No** | Raw recharts |
| `dashboard-revenue-chart.tsx` | **No** | Raw recharts |

→ **SHADCN-031 (MEDIUM)** — half the chart surfaces bypass the design-system wrapper.

### Invalid color function with hex tokens

Theme sets `--primary: #ee237c` (and other hex). Multiple charts/maps use:

```ts
"hsl(var(--primary))"
"hsl(var(--chart-1))"
"hsl(var(--success))"
```

`hsl(#ee237c)` is **invalid CSS**. Correct patterns for Moja tokens:

- `var(--primary)` / `var(--color-primary)`
- or ChartConfig `color: "var(--chart-1)"` (as blog charts partially do with `var(--color-views)`)

→ **SHADCN-032 (HIGH)** — broken/unreliable chart & map stroke fills

---

## G. Field / forms (usage sample)

Field imports from `@moja/ui/components/ui/field` exist in **7** web files (operator settings + passenger auth). Rest of app still Label/`space-y` stacks. Local `FieldLabel` helper in `blog-edit-view.tsx` **shadows** the design-system name without importing Field.

SHADCN-006 remains accurate; add:

→ **SHADCN-033 (LOW)** — naming collision: local `FieldLabel` in blog edit ≠ `@moja/ui` Field

---

## H. Ghost Tailwind classes (pre-token-system leftovers)

Widespread in `apps/web`:

- `bg-bg-surface`, `bg-bg-base`
- `text-text-primary`, `text-text-secondary`, `text-text-muted`

**Not defined** in `@moja/theme/global.css` `@theme inline` (no `--color-bg-surface`, etc.). These compile to **no background/text color** under Tailwind v4 unless somehow injected elsewhere (not found in theme/ui CSS).

Meanwhile reference provides real `--surface` → `--color-surface` → `bg-surface`.

→ **SHADCN-034 (HIGH)** — ghost utilities undermine visual consistency; related to missing `--surface` (SHADCN-029)

Also: `font-heading` used in UI components without `--font-heading` theme mapping → falls back unpredictably.

---

## I. Docs-site CSS explicitly out of scope

Do **not** require Moja to import:

- Multi-style `@source` trees (`base-nova`, `radix-*`, …)
- Style preview `@custom-variant style-*`
- `legacy-themes.css`, rehype pretty-code, Arabic/Hebrew font stacks, typeset helpers

Those are **shadcn docs app** concerns. Consumer-critical path is only:

1. `shadcn` + `tw-animate-css` packages  
2. Their CSS imports (or `shadcn eject` inlined equivalent)  
3. Semantic token parity needed by components/utilities (`surface`, selection, heading font, radius scale)  
4. Honest accordion/animation CSS for Base UI  

---

## J. Updated readiness impact

| Prior claim | After reaudit |
|-------------|----------------|
| Tailwind/CSS architecture “mostly OK” | **Downgrade** — missing foundation CSS packages/imports |
| Charts “among healthiest” | **Downgrade** — wrapper OK; half of apps bypass + `hsl(var(--hex))` bug |
| Upgradeability blocked mainly by preset | Still true **plus** missing `shadcn@4.21.0` / CSS imports |
| Theme “PASS / intentional brand” | Brand KEEP still valid; **gaps** in surface/selection/heading/radius + ghost app classes |

Overall classification remains **C — Hybrid**, with **stronger CRITICAL/HIGH foundation gaps** than the first pass alone suggested.
