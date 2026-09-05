# 13 — Complete Findings Registry

## Scorecard

| Area | Status | Severity | Notes |
|------|--------|----------|-------|
| Presets | FAIL | CRITICAL | Config says radix-nova; code is Base |
| components.json | FAIL | CRITICAL | Same + alias issue |
| `shadcn@4.21.0` CLI/CSS pkg | **FAIL** | **CRITICAL** | Not installed — SHADCN-027 |
| CSS foundation imports | **FAIL** | **HIGH** | Missing tw-animate + shadcn/tailwind — SHADCN-028 |
| @packages/ui architecture | PASS WITH ISSUES | MEDIUM | Boundaries good; dead deps |
| cn utility | PASS (legacy) | LOW–MED | Local helper OK; not `cn` pkg |
| Base UI | PASS WITH ISSUES | HIGH | Correct stack; drawer/types |
| Radix | FAIL (residual) | HIGH | Unused deps + leftover CSS/API |
| Components | MIXED | HIGH | Gen gap + few bad apples |
| Forms | HALF | MEDIUM | ~7 Field files; rest legacy |
| Charts | **MIXED** | **HIGH** | Primitive OK; hsl(hex) + raw recharts |
| Theme | PASS WITH GAPS | MEDIUM | Brand KEEP; surface/selection/heading missing; ghost classes |
| Tailwind/CSS | FAIL foundation | HIGH | v4 OK; missing init CSS stack |
| Accessibility | MIXED | MEDIUM | Static concerns |
| TypeScript | MIXED | HIGH | `as any` hotspots |
| Server/client | PASS | LOW | Expected client primitives |
| Monorepo boundaries | PASS | — | web→ui→theme |
| Dependencies | FAIL cleanup + missing | HIGH | Dead Radix/@shadcn/react; missing shadcn/tw-animate |
| Actual usage | MIXED | HIGH | asChild + forms + ghosts + charts |
| Upgradeability | FAIL | CRITICAL | Unsafe CLI until config + CSS foundation fixed |
| Build/tooling | NOT VERIFIED | — | Re-run typecheck |

---

## Finding details

### SHADCN-001 — CRITICAL — Preset/style mismatch

**Confidence:** HIGH · **Area:** Presets / components.json  
**Files:** `packages/ui/components.json`, all Base UI components  
**Reference:** preset encoding `base-nova` / `radix-nova`; changelog 2026-07 Base UI default  
**Current:** `style: "radix-nova"`; code imports `@base-ui/react`  
**Expected:** `style: "base-nova"`  
**Why it matters:** CLI/`apply`/agents install wrong primitive family  
**Root cause:** Partial migration / mislabeled init  
**Rec:** Change to `base-nova` immediately; verify with `shadcn info`  
**Migration impact:** LOW (config) / HIGH if regenerating · **Independent:** YES (config) · **Related:** 002, 003, 004

### SHADCN-002 — HIGH — Styling generation gap (`cn-*` vs inline CVA)

**Confidence:** HIGH · **Area:** CSS / Components  
**Files:** e.g. `button.tsx` vs `registry/bases/base/ui/button.tsx` + `registry/styles/style-nova.css`  
**Current:** Tailwind utilities inside `cva`  
**Expected (pinned ref):** `cn-button-variant-*` classes defined in style CSS  
**Why it matters:** Regenerated components won’t match CSS; upgrades diverge  
**Rec:** Explicitly choose Stay-inline vs Adopt-style-tokens  
**Migration impact:** HIGH if adopting · **Independent:** NO · **Related:** 001, 007

### SHADCN-003 — HIGH — Drawer on Vaul while stack is Base UI

**Confidence:** HIGH · **Area:** Base UI / Components  
**Files:** `drawer.tsx`, `action-drawer.tsx`  
**Reference:** `registry/bases/base/ui/drawer.tsx` uses `@base-ui/react/drawer`  
**Current:** `vaul`; Root forces `modal={false}`  
**Rec:** Migrate to Base drawer **or** document Vaul KEEP + fix asChild  
**Migration impact:** MEDIUM · **Independent:** PARTIAL · **Related:** 001, 005, 015

### SHADCN-004 — HIGH — Dead Radix / unused `@shadcn/react`

**Confidence:** HIGH · **Area:** Dependencies  
**Files:** `packages/ui/package.json`  
**Rec:** Remove unused deps after confirming no transitive need  
**Migration impact:** LOW · **Independent:** YES · **Related:** 001

### SHADCN-005 — HIGH — asChild shim + `as any` on dropdown-menu

**Confidence:** HIGH · **Area:** Base UI / Types / A11y  
**Files:** `dropdown-menu.tsx`; consumers SHADCN-021  
**Rec:** Remove shim; type with Base UI props; migrate consumers to `render`  
**Migration impact:** MEDIUM · **Independent:** NO · **Related:** 014, 021

### SHADCN-006 — MEDIUM — Forms half-migrated

**Confidence:** HIGH · **Area:** Forms  
**Files:** Field underused; e.g. `saved-passengers-view.tsx`  
**Rec:** Standardize on Field; migrate high-traffic forms  
**Migration impact:** MEDIUM · **Independent:** YES · **Related:** 013

### SHADCN-007 — MEDIUM — Local cn vs `cn` package

**Confidence:** HIGH · **Area:** cn utility  
**Files:** `packages/ui/src/lib/utils.ts`  
**Reference:** changelog 2026-09-cn  
**Rec:** Optional `shadcn migrate cn`  
**Migration impact:** LOW · **Independent:** YES · **Related:** 002

### SHADCN-008 — MEDIUM — aliases.components → `#components/ui`

**Confidence:** HIGH · **Area:** components.json  
**Rec:** Set to `#components`  
**Migration impact:** LOW · **Independent:** YES · **Related:** 001

### SHADCN-009 — MEDIUM — Radix height keyframes in UI globals (raised)

**Confidence:** HIGH · **Area:** CSS  
**Files:** `packages/ui/src/styles/globals.css`, `accordion.tsx`  
**Detail:** Keyframes only use `--radix-accordion-content-height`; Base UI sets `--accordion-panel-height`. Official `shadcn/tailwind.css` includes fallback. Severity raised from LOW (reaudit).  
**Rec:** Import `shadcn/tailwind.css` **or** mirror fallback; drop dead radix-only keyframes  
**Migration impact:** LOW · **Independent:** YES · **Related:** 027, 028, 035

### SHADCN-010 — INFO — Brand theme intentional

**Area:** Theme · **Rec:** KEEP · Do not “fix” Moja colors to shadcn defaults

### SHADCN-011 — LOW — Chart near parity

**Area:** Charts · KEEP primitive; see 031/032 for app usage

### SHADCN-012 — INFO — Chart brand colors

**KEEP** hex brand chart tokens; fix consumption pattern (032)

### SHADCN-013 — MEDIUM — Form a11y association gaps

**Related:** 006

### SHADCN-014 — HIGH — Tooltip `as any`

**Files:** `tooltip.tsx` · **Related:** 005

### SHADCN-015 — MEDIUM — Non-modal drawer focus model

**Related:** 003

### SHADCN-016 — LOW — space-y usage

**Area:** Usage / UX

### SHADCN-017 — INFO — Chart SR limitations

### SHADCN-018 — MEDIUM — tooltip types (alias of 014 detail)

### SHADCN-019 — MEDIUM — phone-input `as any`

### SHADCN-020 — LOW — sidebar event cast

### SHADCN-021 — MEDIUM — App still passes asChild

**Related:** 005 · Must migrate with shim removal

### SHADCN-022 — LOW — Repeated className overrides

### SHADCN-023 — LOW — space-y ubiquity (usage)

### SHADCN-024 — MEDIUM — react-day-picker major version skew vs reference

**Confidence:** MEDIUM · Verify calendar against day-picker v10 docs

### SHADCN-025 — INFO — No apps/web components.json

Intentional single-package UI ownership; document CLI workflow

### SHADCN-026 — INFO — Missing chat/attachment registry components

Not required unless product needs them

### SHADCN-027 — CRITICAL — `shadcn@4.21.0` not installed

**Confidence:** HIGH · **Area:** Dependencies / CSS foundation  
**Evidence:** Present only in `context/services/shadcn/package.json`; absent from `packages/ui`, `apps/web`, root, lockfile. `@shadcn/react@0.1.0` is **not** a substitute.  
**Expected:** Pin `shadcn@4.21.0` (or eject CSS then optionally remove) per reference manual install / CLI docs  
**Why it matters:** No `shadcn/tailwind.css` export path; no pinned CLI for `add`/`info`/`migrate` aligned to audit reference  
**Rec:** `pnpm add -D shadcn@4.21.0` in `@moja/ui` (or workspace) then import CSS; alternatively `shadcn eject` after install  
**Migration impact:** LOW–MEDIUM · **Independent:** YES · **Related:** 001, 028, 009

### SHADCN-028 — HIGH — Missing `tw-animate-css` + `shadcn/tailwind.css` imports

**Confidence:** HIGH · **Area:** CSS  
**Files:** `packages/ui/src/styles/globals.css` vs reference `app/globals.css` + `content/docs/installation/manual.mdx`  
**Current:** Only `tailwindcss` + typography + theme  
**Expected:** `@import "tw-animate-css";` + `@import "shadcn/tailwind.css";` (unless ejected/inlined equivalently)  
**Rec:** Install packages; add imports at top of UI globals; remove redundant incomplete hand-rolled variants carefully  
**Migration impact:** MEDIUM · **Independent:** NO (needs 027 or eject) · **Related:** 027, 030, 009

### SHADCN-029 — MEDIUM — Missing surface / selection / code / font-heading / radius 2xl–4xl

**Confidence:** HIGH · **Area:** Theme  
**Files:** `packages/theme/global.css` vs reference `:root` / `@theme inline`  
**KEEP:** Moja brand + success/warning/info extensions  
**Rec:** Add consumer tokens needed by components (`font-heading`, optionally `surface`/`selection`) OR stop using those utilities; expand radius scale if product needs `rounded-2xl` theme tokens  
**Related:** 034, 010

### SHADCN-030 — MEDIUM — Incomplete animate utility set

**Confidence:** HIGH · **Area:** CSS / Components  
**Evidence:** `navigation-menu.tsx` uses `slide-*-52` and bare `fade-in`/`fade-out` not defined in Moja `@utility` block  
**Rec:** Prefer `tw-animate-css` (028) over expanding hand-roll forever  
**Related:** 028

### SHADCN-031 — MEDIUM — Chart surfaces bypass ChartContainer

**Confidence:** HIGH · **Area:** Charts / Usage  
**Files:** `driver-analytics-charts.tsx`, `revenue-analytics-chart.tsx`, `dashboard-revenue-chart.tsx`  
**Rec:** Migrate to `ChartContainer` + `ChartConfig` for theme CSS variable injection  
**Related:** 011, 032

### SHADCN-032 — HIGH — `hsl(var(--token))` with hex theme values

**Confidence:** HIGH · **Area:** Charts / Maps / Theme consumption  
**Evidence:** `--primary: #ee237c` etc.; consumers use `hsl(var(--primary))` in travel-insights, blog charts config, revenue/driver analytics, fleet maps  
**Expected:** `var(--primary)` or `var(--color-primary)` (or HSL-channel tokens if keeping hsl())  
**Why it matters:** Invalid CSS → wrong/missing chart colors in production  
**Rec:** Sweep replace; prefer ChartConfig colors as plain `var(--chart-N)`  
**Related:** 010, 012, 031

### SHADCN-033 — LOW — Local FieldLabel name collision

**Files:** `blog-edit-view.tsx`  
**Related:** 006

### SHADCN-034 — HIGH — Ghost `bg-bg-*` / `text-text-*` utilities

**Confidence:** HIGH · **Area:** Usage / Theme  
**Evidence:** Many passenger/operator views; no `@theme` color tokens for these names in `@moja/theme`  
**Rec:** Map to real tokens (`bg-card`, `bg-muted`, `bg-surface` after 029) or define legacy aliases intentionally  
**Related:** 029

### SHADCN-035 — MEDIUM — Accordion animate vs Base panel height var

**Confidence:** HIGH · **Area:** CSS / Accordion  
**Detail:** Complements 009; panel uses `h-(--accordion-panel-height)` while `animate-accordion-*` keyframes ignore that var  
**Related:** 009, 028

---

## Root-cause chains

```text
SHADCN-001 mislabeled preset
  → CLI would install Radix (risk)
  → agents emit asChild (SHADCN-021)
  → shims added (SHADCN-005)
  → types erased (SHADCN-014)
  → upgradeability fails

Never adopted post-2026 CSS foundation (SHADCN-027/028)
  → hand-rolled incomplete animate (SHADCN-030)
  → radix-only accordion keyframes (SHADCN-009/035)
  → missing official variants/utilities (scroll-fade, shimmer, dual data-*)

Partial Base migration
  → drawer left on Vaul (SHADCN-003)
  → radix CSS leftovers (SHADCN-009)
  → dead radix deps (SHADCN-004)
  → unused @shadcn/react mistaken for shadcn CLI

Style generation not updated to cn-* era (SHADCN-002)
  → future add/diff painful
  → cn package optional (SHADCN-007)

Theme brand KEEP (SHADCN-010) without consumer token parity
  → missing surface/heading (SHADCN-029)
  → ghost bg-bg-* classes (SHADCN-034)
  → hsl(var(--hex)) chart bug (SHADCN-032)

Field introduced but apps not migrated (SHADCN-006)
  → a11y gaps (SHADCN-013)
  → local FieldLabel shadow (SHADCN-033)

Charts primitive OK; apps half-adopted (SHADCN-031)
```

**Full reaudit narrative:** [18-reaudit-css-packages-charts.md](./18-reaudit-css-packages-charts.md)