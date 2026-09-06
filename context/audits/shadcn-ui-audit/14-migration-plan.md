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

## Phase 4 — Forms (Moderate) — ✅ DONE (2026-09-06)

1. ~~Codify Field/FieldGroup in web UI standards~~ — noted in `context/code-standards.md`
2. ~~Migrate priority forms~~ — contact, saved passengers, operator onboarding (`company` / `profile` / `bank`). Checkout has no dedicated Label form stack. Remaining admin dialogs / `terms-step` can follow opportunistically.
3. ~~Prefer `flex flex-col gap-*` over `space-y` on migrated form stacks~~
4. ~~Rename local `FieldLabel` in blog-edit-view (SHADCN-033)~~ → `BlogFormLabel`

---

## Phase 4b — Charts consumers (Moderate) — ✅ DONE (2026-09-06)

1. ~~Migrate raw Recharts dashboards to `ChartContainer` (SHADCN-031)~~ — admin dashboard revenue, operator revenue analytics, driver analytics charts
2. ~~Standardize ChartConfig colors on `var(--chart-N)` / `var(--color-*)` (SHADCN-032)~~ — no remaining `hsl(var(--` in `apps/web`; chart series use `var(--color-*)` from ChartConfig

**Exit criteria:** `@moja/ui` + `web` typecheck green (verified 2026-09-06)

---

## Phase 5 — Types / calendar / phone polish (Safe–Moderate) — ✅ DONE (2026-09-06)

- ~~phone-input typing (SHADCN-019)~~ — removed all `as any`; proper `RPNInput.Props`; Flag uses `title={countryName}`; Moja `country` lock prop is not forwarded as undocumented library `country`
- ~~day-picker v10 verification vs calendar (SHADCN-024)~~ — confirmed on `react-day-picker@10.0.1` with v10 APIs (`getDefaultClassNames`, `DayButton`, Root); aligned missing `cn-calendar-*` / `cn-rtl-flip` classes with pinned base calendar. Bracket access for modifiers kept (web `noPropertyAccessFromIndexSignature`)
- ~~sidebar event typing (SHADCN-020)~~ — already clean (`onClick?.(event)` with no cast; fixed in earlier sync)

**Exit criteria:** `@moja/ui` + `web` typecheck green (verified 2026-09-06)

---

## Phase 6 — Optional cn package (Safe) — ✅ DONE in Phase 3

`shadcn migrate cn` already applied; `packages/ui/src/lib/utils.ts` re-exports `cn` from the `cn` package.

---

## Phase 7 — Validation — ✅ DONE (automated) / manual checklist below (2026-09-06)

- ~~`pnpm --filter @moja/ui typecheck`~~ — green
- ~~`pnpm --filter web typecheck`~~ — green
- ~~Biome lint on remedia­tion-touched files~~ — format/imports fixed; calendar modifiers keep bracket access (TS index signature)
- **Manual keyboard pass** (operator/dev, before calling remedia­tion closed):
  - [ ] Dialog — Tab cycle, Esc dismiss, focus return
  - [ ] Select / Combobox — arrow keys, Enter, Esc
  - [ ] DropdownMenu — keyboard open/nav (Base UI `render`)
  - [ ] Drawer / ActionDrawer — swipe/Esc/outside-press; dirty-form cancel
- **Visual spot-check** under `.style-maia`:
  - [ ] Admin dashboard revenue chart + blog forms
  - [ ] Operator revenue / driver analytics charts
  - [ ] Contact form, saved passengers, onboarding company/profile/bank
  - [ ] Phone input locked + unlocked country UX
  - [ ] Drawer inset chrome (maia rounded-4xl) + Moja `modal={false}` / overlay

---

## Phase 8 — Cleanup — ✅ DONE (2026-09-06)

- ~~Unused `next-themes`~~ — removed from `@moja/ui`; `sonner` Toaster hardcodes `theme="light"` (product is light-only; web still imports raw `sonner` in layouts — optional follow-up to switch to `@moja/ui` Toaster)
- ~~Document Moja extensions in ui-registry~~ — `apps/web/context/ui-registry.md`
- ~~`graphify update`~~ after code changes

---

## Phase 9 — Preset `b20te54eby` (maia + taupe) — ✅ DONE (2026-09-06)

Decoded: style **maia**, baseColor **taupe**, theme pink (overridden), chartColor **rose**, fonts Outfit/Raleway, radius medium `0.625rem`.

1. ~~Adopt `style-maia.css`~~ — Moja patches: `cn-drawer-content-base`, `cn-font-heading`; switch globals import + `<html class="style-maia">`
2. ~~`components.json`~~ — `"style": "base-maia"`, `"baseColor": "taupe"`
3. ~~Theme tokens~~ — taupe neutrals + rose charts; **KEEP** Moja `--primary` / hover / dark / ring / sidebar-primary / selection `#ee237c`
4. ~~Fonts~~ — Outfit (sans) + Raleway (heading); legacy `font-montserrat` → Outfit
5. ~~Did not~~ mass-regenerate KEEP components or run blind `shadcn apply` (would overwrite Moja pink)

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
