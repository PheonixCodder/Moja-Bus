# 10 — Types, Dependencies, and Build Audit

## TypeScript

### Package setup

- `@moja/ui` uses workspace `@moja/typescript`, `tsc --noEmit`
- Exports point at `.tsx` source (no emit) — fine for internal TS project references / bundler

### Type-safety findings

| ID | Severity | Finding |
|----|----------|---------|
| SHADCN-005 | HIGH | `dropdown-menu.tsx`: `as any` on primitive + props |
| SHADCN-018 | MEDIUM | `tooltip.tsx`: `as any` cast |
| SHADCN-019 | MEDIUM | `phone-input.tsx`: multiple `as any` on country/flag props |
| SHADCN-020 | LOW | `sidebar.tsx`: `onClick?.(event as any)` |

These are the main hidden API risks — runtime may work while types lie.

### Patterns that look healthy

- `Button` uses `ButtonPrimitive.Props & VariantProps<…>` — correct Base UI typing
- Field/Label use `React.ComponentProps<"…">` appropriately

---

## Dependencies (`@moja/ui`)

### Keep

`@base-ui/react`, `@moja/theme`, `class-variance-authority`, `clsx`, `tailwind-merge` (until cn migrate), `lucide-react`, `cmdk`, `vaul` (if drawer kept), `recharts`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `sonner`, `date-fns`, phone libs, `tailwindcss`, `@tailwindcss/typography`

### Remove or justify (SHADCN-004)

| Dep | Why |
|-----|-----|
| `radix-ui` | No imports |
| `@radix-ui/react-slot` | No imports |
| `@shadcn/react` | No imports in src — **not a substitute for `shadcn@4.21.0`** |
| `next-themes` | Likely unused given no dark mode product path — verify then remove |

### Add (foundation — SHADCN-027 / 028)

| Dep | Why |
|-----|-----|
| `shadcn@4.21.0` | CLI + `@import "shadcn/tailwind.css"` (or run `shadcn eject` and drop dep after inlining) |
| `tw-animate-css` | `@import "tw-animate-css"` — replaces incomplete hand-rolled animate utilities |

### Version notes

| Package | Moja | Reference | Note |
|---------|------|-----------|------|
| `shadcn` | **absent** | **4.21.0** | **SHADCN-027 CRITICAL** — not interchangeable with `@shadcn/react` |
| `tw-animate-css` | **absent** | ^1.4.0 | **SHADCN-028** |
| `cn` | local utils | ^0.2.2 | SHADCN-007 |
| `@base-ui/react` | ^1.6.0 | 1.6.0 | Aligned |
| `recharts` | 3.8.0 | 3.8.0 | Aligned |
| `react-day-picker` | **^10.0.1** | **^9.7.0** | SHADCN-024 major skew |
| `lucide-react` | ^0.561.0 | 0.474.0 | Ahead — OK if verified |
| `embla-carousel-react` | ^8.6.0 | 8.5.2 | Minor ahead |
| `@tanstack/react-table` (web) | ^8.21.3 | ^9.0.0 | Behind ref major |
| `@hookform/resolvers` (web) | ^5.4.0 | ^3.10.0 | Major ahead — verify peers |

Full matrix: `18-reaudit-css-packages-charts.md` §E.

---

## Server / client boundaries

- 42/62 UI components are `"use client"` — expected for interactive primitives
- Stateless presentational pieces (skeleton, kbd, etc.) can stay server-friendly
- Web app correctly imports UI into client feature components; no evidence of importing browser-only UI into pure RSC without client boundaries **beyond normal Next patterns**

**NOT VERIFIED:** bundle size / client weight metrics this session.

---

## Build / tooling

| Check | This session |
|-------|--------------|
| `pnpm --filter @moja/ui typecheck` | **NOT VERIFIED** |
| `pnpm --filter web typecheck` | **NOT VERIFIED** |
| Production Next build | **NOT VERIFIED** |
| Prior memory claims typecheck green | Historical only — re-run after remediation |

Scripts in `@moja/ui`:

- `build`: echo no-op — package is source-consumed
- `lint`: biome on `src` + configs
- `typecheck`: `tsc --noEmit`

---

## Performance concerns (static)

- Dead Radix packages increase install size / confusion
- `@shadcn/react` unused
- Large client charts (recharts) — expected; already dynamically used in dashboards
- No evidence of duplicate Button implementations in web (good)
