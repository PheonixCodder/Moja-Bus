# 08 — Styling, Theme, and CSS Audit

## Tailwind version

| Location | Setup |
|----------|-------|
| `apps/web/postcss.config.mjs` | `@tailwindcss/postcss` |
| `packages/ui` dep | `tailwindcss` ^4 |
| Reference | Tailwind ^4.3 + `@tailwindcss/postcss` |

**Verdict:** Tailwind v4 CSS-first — aligned with changelog 2025-02.

---

## CSS pipeline

```text
apps/web/app/globals.css
  @import "@moja/ui/globals.css"
  @source "../features"; @source "../app"

packages/ui/src/styles/globals.css
  @import "tailwindcss"
  @plugin "@tailwindcss/typography"
  @import "@moja/theme/global.css"
  ❌ MISSING @import "tw-animate-css"          ← SHADCN-028
  ❌ MISSING @import "shadcn/tailwind.css"     ← SHADCN-027/028
  @source "../components"; @source "../hooks"; @source "../lib"
  @custom-variant dark (&:is(.dark *))     ← present; product unused (INFO)
  @custom-variant data-open|closed|…        ← partial local copy (weaker than shadcn/tailwind.css)
  hand-rolled enter/exit @utility (10 only) ← incomplete vs tw-animate-css (SHADCN-030)
  leftover --radix-*-height keyframes      ← SHADCN-009/035 (no --accordion-panel-height fallback)

packages/theme/global.css
  :root semantic tokens (Moja brand) — KEEP brand
  ❌ missing --surface / --selection / --code* / --font-heading (SHADCN-029)
  .dark tokens (unused — INFO only)
  @theme inline color/radius mappings (radius only through xl; additive formula)
```

### Foundation CSS packages (reaudit)

| Package | Required by reference init/manual | Moja |
|---------|-----------------------------------|------|
| `shadcn@4.21.0` | Yes (CLI + `./tailwind.css`) | **Not installed** — SHADCN-027 |
| `tw-animate-css` | Yes | **Not installed** — SHADCN-028 |

Docs-site-only CSS in reference `app/globals.css` (multi-style `@source`, style preview variants, rehype, Arabic fonts) is **out of scope** — do not copy. See `18-reaudit-css-packages-charts.md`.

### Monorepo source scanning

`@source` in UI package + web globals correctly includes package components and app features. **PASS** for class detection of `@moja/ui` utilities.

---

## Theme package

| Token domain | Status |
|--------------|--------|
| Brand primary `#ee237c` | Intentional KEEP |
| Semantic success/warning/destructive/info | Present (Moja extension KEEP) |
| Sidebar / chart tokens | Present |
| Radius `--radius: 0.625rem` | Present; scale only sm–xl; formula ±px vs ref multiplicative |
| `--surface` / `--selection` / `--code*` | **Missing** — SHADCN-029 |
| `--font-heading` in `@theme` | **Missing** (used by `empty`/`drawer`) — SHADCN-029 |
| Typography CSS vars (`--font-display`, mono) | Present as Moja stacks |
| Color format | Hex (vs ref oklch) — OK if consistent; breaks `hsl(var(--*))` consumers — SHADCN-032 |

Dark mode tokens: **INFO only** — do not flag as missing product feature.

### Ghost app utilities (SHADCN-034)

`apps/web` widely uses `bg-bg-surface`, `bg-bg-base`, `text-text-primary|secondary|muted` — **not mapped** in `@moja/theme` `@theme inline`. Likely no-op colors under Tailwind v4. Reference equivalent would be `bg-surface` / semantic foreground tokens.

---

## `cn` utility (SHADCN-007)

| Location | Implementation |
|----------|----------------|
| `packages/ui/src/lib/utils.ts` | `twMerge(clsx(...))` |
| Reference (2026-09) | `import { cn } from "cn"`; utils re-exports |
| Duplicates in web | Consumers use `@moja/ui/lib/utils` — good |
| RN apps | Own utils (out of scope) |

**Verdict:** Compatible, pre-migration. Optional: `npx shadcn migrate cn`. Not blocking if local helper stays consistent.

**No** `import { cn } from "cn"` in Moja UI today.

---

## CVA / variants

- Widely used (`button`, `badge`, `field`, …)
- Moja embeds full utility strings in `cva`
- Reference nova embeds **token class names** (`cn-button-variant-default`) with real utilities in `registry/styles/style-nova.css`

### SHADCN-002 — styling generation gap (HIGH)

This is the main maintainability cliff:

- CLI updates from current reference will rewrite components toward `cn-*` + expect style CSS
- Moja’s globals do **not** include `.style-nova { .cn-button-… }` rules
- Mixing one regenerated component into Moja would look unstyled or wrong

**Decision required:**

1. **Stay inline-CVA** — fix `components.json` only; treat style CSS as non-goal; carefully review every `shadcn add`  
2. **Adopt style tokens** — import/adapt `style-nova.css` (with Moja tokens), regenerate components, use `cn` package  

---

## Data attributes

- `data-slot` present on most primitives — good  
- Base UI `data-open` / `data-closed` custom variants declared locally — partial  
- Official `shadcn/tailwind.css` variants also cover Radix `data-state` + `data-unchecked|horizontal|vertical` — Moja omits these (OK for Base-only **if** package is ejected/inlined equivalently)  
- Avoid Radix `data-[state=open]` assumptions on Base components without the dual variants  

---

## Animation utilities (SHADCN-030)

Hand-rolled subset covers common popover/dialog enters. **Gaps:**

- `navigation-menu.tsx` uses `slide-in-from-*-52` / `slide-out-to-*-52` and bare `fade-in`/`fade-out` — **not defined** in Moja globals  
- Fix path: install `tw-animate-css` **or** expand `@utility` set to cover used classes  

---

## Accordion keyframes (SHADCN-009 / SHADCN-035)

Base UI sets `--accordion-panel-height`. Moja keyframes only read `--radix-accordion-content-height`. Official `shadcn/tailwind.css` uses radix-with-fallback. **Severity raised from LOW → MEDIUM.**

---

## Visual consistency

Brand tokens produce a coherent Moja look **when utilities resolve**. Inconsistencies also come from:

- Ghost `bg-bg-*` / `text-text-*` classes (SHADCN-034)
- Missing `surface` / `font-heading` mappings (SHADCN-029)
- App-level `className` overrides (`rounded-xl`, `h-10`, `font-extrabold`)
- `space-y-*` stacks
- Half-migrated forms
- Invalid `hsl(var(--hex-token))` in charts/maps (SHADCN-032)
