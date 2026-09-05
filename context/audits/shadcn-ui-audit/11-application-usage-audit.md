# 11 — Application Usage Audit

## Consumption model

`apps/web` depends on `@moja/ui` and imports deeply:

```ts
import { Button } from "@moja/ui/components/ui/button"
```

**Hundreds of files** import from `@moja/ui` — this is the correct boundary. No parallel `apps/web/components/ui` shadcn tree was found.

Also depends on `@moja/theme` for tokens where needed.

---

## What consumers do well

- Consistent package imports (not relative into `packages/ui/src`)
- Dialog/Sheet titles frequently present
- **Some** charts use `ChartContainer` + `ChartConfig` (3 files)
- Avatars standardized on `UserAvatar` / `CarrierAvatar` (prior audit)
- Auth flow + operator settings use Field / `FieldGroup`

---

## Anti-patterns and issues

### SHADCN-006 / usage — Field underused

Only **7** files import Field. Most forms use Label+Input+`space-y-*`.

### SHADCN-031 / 032 — Charts

Three dashboards use raw Recharts. Multiple files use `hsl(var(--primary))` etc. against **hex** theme tokens → invalid CSS colors.

### SHADCN-034 — Ghost design tokens in classNames

Widespread `bg-bg-surface`, `bg-bg-base`, `text-text-primary|secondary|muted` with **no** `@theme` mapping in `@moja/theme`. Visual styles may silently no-op.

### SHADCN-021 — MEDIUM — `asChild` still used in app

Files (non-exhaustive; grep hits):

- `features/operator/views/operator-drivers-view.tsx`
- `features/operator/views/operator-fleet-view.tsx`
- `features/operator/components/terminals/terminal-editor-sheet.tsx`
- `features/operator/components/schedules/schedule-edit-drawer.tsx`
- `features/operator/components/routes/route-form-drawer.tsx`
- `features/operator/components/promotions/operator-promotion-drawer.tsx`
- `features/operator/components/add-bus-modal.tsx`
- `features/admin/components/travelers-grid.tsx`
- `features/admin/views/admin-banners-view.tsx`
- `features/admin/components/content/redirects-table.tsx`
- `features/admin/components/campaigns/admin-campaign-drawer.tsx`
- `components/locale-switcher.tsx`

These depend on the dropdown/drawer **shim**. Removing the shim without migrating consumers will break builds.

### SHADCN-022 — LOW — Heavy className overrides

Examples repeatedly override radius/height/typography on Input/Button (`rounded-xl`, `h-10`, `font-extrabold`). Acceptable brand polish if intentional; becomes a problem when every screen re-implements the same overrides → should become variants.

### SHADCN-023 — LOW — `space-y-*` ubiquity

Widespread in operator/admin/passenger views. Conflicts with current shadcn composition guidance (`flex` + `gap-*`). Not a runtime break.

### No evidence of

- Importing `@radix-ui` directly in apps/web for UI (good)
- Duplicate local Button/Input shadcn copies in web (good)
- Using obsolete `Form` / `FormField` from old shadcn (good — not present)
- Installing `shadcn@4.21.0` or `tw-animate-css` (bad — foundation gap)

---

## Attached / inventory note

The prompt listed the entire monorepo TS/TSX tree including RN. Per scope, RN files were **not** audited for shadcn conformance. Web feature TSX files were sampled via grep across all `@moja/ui` consumers and deep-reviewed for forms/asChild/charts/dialogs.

A literal line-by-line read of every web TSX file is impractical in one pass; coverage method:

1. Full primitive inventory in `@moja/ui` (100%)
2. Import graph of `@moja/ui` in web (grep count across all feature files)
3. Targeted deep reads for forms, overlays, charts, known anti-patterns

---

## Verdict

Usage is **architecturally correct at the package boundary** and **inconsistent at the composition pattern level** (forms, asChild, spacing). Fixing UI package foundations without a consumer migration for `asChild` will cause breakage — couple SHADCN-005 with SHADCN-021.
