# 00 — Executive Summary

**Audit date:** 2026-09-05 (initial + incremental reaudit same day)  
**Scope:** `@apps/web`, `@packages/ui` (`@moja/ui`), `@packages/theme` (`@moja/theme`)  
**Reference:** `context/services/shadcn` (shadcn-ui/ui @ `7c9eaba1c0a6404c990c144a654792e3313c650d`, apps/v4)  
**RN apps:** Explicitly excluded  
**Reaudit addendum:** [18-reaudit-css-packages-charts.md](./18-reaudit-css-packages-charts.md)

---

## Overall verdict

**NOT READY as a long-term shadcn foundation without remediation.**

The system is a **hybrid (Classification C)**:

- Runtime components are largely modern **Base UI** (aligned with July 2026 “Base UI as default”).
- `components.json` claims **`radix-nova`** (Radix + Nova) — **wrong for the installed code**.
- **`shadcn@4.21.0` and `tw-animate-css` are not installed**; Moja globals omit `@import "shadcn/tailwind.css"` and `@import "tw-animate-css"` required by init/manual install.
- Component styling is an **older generation** (Tailwind utilities embedded in `cva`) while the pinned reference uses **CSS class tokens** (`cn-button-*` from `style-nova.css`) + the `cn` package.
- Forms, drawer, menus, charts consumers, and theme tokens (`surface` / selection / `font-heading`) are **half-migrated** or incomplete.
- Package boundaries (`web → ui → theme`) are **directionally sound** and consumption via `@moja/ui` is widespread and mostly correct.

The app can ship features today. It **cannot safely** keep adding/updating shadcn components via CLI without first fixing config + CSS foundation + generation alignment.

---

## Overall severity

| Dimension | Rating |
|-----------|--------|
| Architecture health | **MEDIUM–HIGH risk** |
| Runtime correctness (static) | **MOSTLY OK** |
| CLI / upgradeability | **HIGH risk** |
| Conformance to pinned reference | **MODERATE divergence** |
| Migration risk | **HIGH** if CLI used before fix; **MEDIUM** if remediating in place |

---

## Top findings (must fix before treating UI as foundation)

| ID | Severity | Title |
|----|----------|-------|
| SHADCN-001 | **CRITICAL** | `components.json` style `radix-nova` but components are Base UI (`base-nova`) |
| SHADCN-027 | **CRITICAL** | `shadcn@4.21.0` not installed in monorepo (CLI + `shadcn/tailwind.css` missing) |
| SHADCN-028 | **HIGH** | Missing `@import "tw-animate-css"` + `@import "shadcn/tailwind.css"` (and `tw-animate-css` package) |
| SHADCN-002 | **HIGH** | Styling generation mismatch: inline CVA utilities vs reference `cn-*` + `style-nova.css` |
| SHADCN-003 | **HIGH** | Drawer still on Vaul; base-nova uses `@base-ui/react/drawer` |
| SHADCN-004 | **HIGH** | Dead Radix deps (`radix-ui`, `@radix-ui/react-slot`) + unused `@shadcn/react` (≠ `shadcn` CLI) |
| SHADCN-005 | **HIGH** | `asChild` shims + `as any` on Base UI menus/tooltips |
| SHADCN-032 | **HIGH** | Charts/maps use `hsl(var(--token))` while theme tokens are hex — invalid CSS |
| SHADCN-034 | **HIGH** | Ghost classes (`bg-bg-surface`, `text-text-*`) used widely; not in theme |
| SHADCN-006 | **MEDIUM** | Forms half-migrated: Field in ~7 files; most forms still Label+div+`space-y-*` |
| SHADCN-029 | **MEDIUM** | Missing `--surface` / `--selection` / `--code*` / `--font-heading` / radius 2xl–4xl |
| SHADCN-030 | **MEDIUM** | Incomplete hand-rolled animate utilities vs `tw-animate-css` (nav menu slides broken) |
| SHADCN-031 | **MEDIUM** | 3/6 chart surfaces bypass `ChartContainer` (raw Recharts) |
| SHADCN-007 | **MEDIUM** | Local `cn()` (`clsx`+`tailwind-merge`) vs reference `cn` package (2026-09) |
| SHADCN-008 | **MEDIUM** | `aliases.components` points at `#components/ui` (should be `#components`) |
| SHADCN-009 / 035 | **MEDIUM** | Accordion keyframes radix-only; Base UI sets `--accordion-panel-height` (official CSS has fallback) |
| SHADCN-010 | **INFO** | Theme brand colors intentional Moja design — keep |

---

## Architecture health (one paragraph)

```text
apps/web  →  @moja/ui (shadcn primitives + app composites)
                ↓
            @moja/theme (tokens + global.css)
```

Dependency direction is correct. There is no `apps/web/components.json` (intentional single-package UI ownership). Tailwind v4 CSS-first pipeline via `@moja/ui/globals.css` → `@moja/theme/global.css` works as a **custom** stack, but it is **not** the shadcn init foundation (missing `shadcn` + `tw-animate-css` imports). The break is **config + CSS foundation + primitive honesty + styling generation**, not monorepo layout.

---

## Migration risk

| Action | Risk |
|--------|------|
| Continue coding app features on current components | LOW–MEDIUM |
| Run `shadcn add` / `apply` with current `components.json` | **HIGH** (would pull Radix sources) |
| Align config to `base-nova` without regenerating styles | MEDIUM |
| Full regenerate to `cn-*` style tokens | HIGH (touches every component + CSS) |
| Adopt `cn` package via `migrate cn` | LOW |

---

## Readiness assessment

| Question | Answer |
|----------|--------|
| Can we keep shipping product UI? | **Yes**, with discipline |
| Can we treat `@moja/ui` as the upgradeable shadcn package? | **Not yet** |
| Must we rebuild everything? | **No** — fix config, drawer, types, then decide on style-token migration |
| Safe to add new shadcn components today? | **No** until SHADCN-001 fixed |

---

## Recommended immediate order

1. Change `style` → `base-nova`; fix aliases; remove dead Radix/`@shadcn/react` deps.  
2. Add pinned `shadcn@4.21.0` + `tw-animate-css` to `@moja/ui` (or `shadcn eject` equivalent); import both in UI globals; fix accordion keyframes fallback.  
3. Add missing theme tokens (`surface`, selection, `font-heading`, radius scale) **or** map ghost `bg-bg-*` / `text-text-*` to real utilities; fix `hsl(var(--hex))` chart colors.  
4. Remove `asChild` shims; type Base UI menus; migrate drawer (or document Vaul KEEP).  
5. Standardize forms on `Field`; migrate remaining charts to `ChartContainer`.  
6. Decide: stay on inline-CVA **or** adopt `cn-*` + style CSS; optionally `shadcn migrate cn`.  

See `14-migration-plan.md`, `16-final-verdict.md`, and `18-reaudit-css-packages-charts.md`.
