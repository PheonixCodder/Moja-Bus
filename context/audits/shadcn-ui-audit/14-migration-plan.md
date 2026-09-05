# 14 — Migration Plan

Do **not** fix everything at once. Order by dependency.

---

## Phase 0 — Freeze unsafe CLI (migration-critical)

**Risk:** High if ignored  
**Actions:**

- Do not run `shadcn add` / `apply` / `init --preset` until Phase 1 lands
- Document in team notes: CLI only from `packages/ui` after config fix

---

## Phase 1 — Configuration truth (Safe → Moderate) — **DONE 2026-09-05**

1. ~~Edit `packages/ui/components.json`:~~ `"style": "base-nova"`, `"components": "#components"`
2. ~~Add foundation packages~~ `shadcn@4.21.0` + `tw-animate-css` (devDependencies on `@moja/ui`)
3. ~~Update globals.css~~ imports + removed incomplete hand-rolled animate/variants (kept Novu z-index + `data-popup-open`/`data-inset`)
4. ~~`shadcn info`~~ confirms `base: "base"`, `style: "base-nova"`
5. ~~Remove unused deps~~ `radix-ui`, `@radix-ui/react-slot`, `@shadcn/react` (kept `next-themes` for Sonner)
6. Eject optional — not done; package kept for CSS imports

**Exit criteria:** met (`typecheck` green)

---

## Phase 1b — Theme token + ghost class cleanup (Safe → Moderate) — **DONE 2026-09-05**

1. ~~Add `--font-heading`, `--surface*`, `--selection*`, `--code*`~~
2. ~~Radius 2xl–4xl~~ (additive Moja formula documented as KEEP)
3. ~~Replace ghost `bg-bg-*` / `text-text-*`~~ → `bg-surface` / `bg-muted` / `bg-card-elevated` / `text-foreground` / `text-muted-foreground`
4. ~~Sweep `hsl(var(--*))`~~ → `var(--*)` / `color-mix(...)` in charts/maps

**Exit criteria:** met

---

## Phase 2 — Primitive honesty (Moderate → High-risk for consumers) — **DONE 2026-09-05**

1. ~~**DropdownMenu:**~~ removed `asChild` shim + `as any`; typed from `@base-ui/react/menu`
2. ~~**Tooltip:**~~ removed `as any`; typed from `@base-ui/react/tooltip`
3. ~~Migrate web `asChild` call sites~~ for DropdownMenuTrigger/Item → `render={...}` (locale-switcher, drivers, travelers-grid, banners, redirects)
4. ~~**Drawer:**~~ migrated Vaul → `@base-ui/react/drawer`; removed `vaul` dep; `direction` → `swipeDirection`; `DrawerClose asChild` → `render={...}`; default `modal={false}` retained

**Exit criteria:** met (`@moja/ui` + `web` typecheck green)

---

## Phase 3 — Styling strategy decision (High-risk if regenerating) — **DONE 2026-09-05 (Adopt-tokens)**

Chose **Adopt-tokens**:

1. ~~Port `style-nova.css`~~ into `packages/ui/src/styles/style-nova.css`; import in UI globals; add `style-nova` on web `<html>`
2. ~~Sync primitives~~ from pinned `context/services/shadcn/registry/bases/base/ui` (`cn-*` classes); `IconPlaceholder` → `lucide-react`
3. ~~Adopt `cn` package~~ via `shadcn migrate cn` (`utils.ts` re-exports `cn`)
4. ~~Drawer~~ cn-* tokens + Moja KEEP (`modal={false}`, always overlay, swipe-handle default for down)
5. ~~KEEP customs~~ action-drawer, carrier/user-avatar, phone-input, date/time pickers
6. Moja style patches: `cn-font-heading`, `cn-drawer-content-base`, swipe-direction (not vaul) on drawer content CSS

**Exit criteria:** `@moja/ui` + `web` typecheck green; visual spot-check still recommended (Phase 7)

---

## Phase 4 — Forms (Moderate)

1. Codify Field/FieldGroup in web UI standards
2. Migrate: saved passengers, contact, checkout-related, operator onboarding, remaining admin dialogs
3. Replace new `space-y` form stacks with `flex flex-col gap-*`
4. Rename local `FieldLabel` in blog-edit-view (SHADCN-033)

---

## Phase 4b — Charts consumers (Moderate)

1. Migrate raw Recharts dashboards to `ChartContainer` (SHADCN-031)
2. Standardize ChartConfig colors on `var(--chart-N)` / `var(--color-*)` (SHADCN-032)

---

## Phase 5 — Types / calendar / phone polish (Safe–Moderate)

- phone-input typing
- day-picker v10 verification vs calendar
- sidebar event typing

---

## Phase 6 — Optional cn package (Safe)

```bash
cd packages/ui
pnpm dlx shadcn@latest migrate cn
```

---

## Phase 7 — Validation

- `pnpm --filter @moja/ui typecheck`
- `pnpm --filter web typecheck`
- Biome lint on touched files
- Manual keyboard pass: dialog, select, dropdown, drawer, combobox
- Spot-check charts

---

## Phase 8 — Cleanup

- Dead exports / unused next-themes
- Document Moja extensions in ui-registry
- Update graphify after code changes: `graphify update .`

---

## Safe vs risky change classes

| Class | Examples |
|-------|----------|
| Safe | components.json style/aliases; remove dead deps; CSS keyframe var names; docs |
| Moderate | Form migrations; asChild→render in app; phone types |
| High-risk | Drawer rewrite; mass component regenerate; style-nova adoption |
| Migration-critical | Phase 0–1 before any new shadcn installs |

---

## What NOT to do

- Do not rebuild all components by default
- Do not force Radix to match mislabeled config
- Do not “fix” Moja brand colors to shadcn zinc defaults
- Do not add dark mode
- Do not regenerate while `style` still says `radix-nova`
