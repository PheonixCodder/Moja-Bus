# 02 — Architecture Audit

## Actual architecture

```text
apps/web
  ├── app/globals.css          @import "@moja/ui/globals.css"
  ├── postcss.config.mjs       @tailwindcss/postcss (v4)
  ├── features/**, components/**  consumers of @moja/ui
  └── package.json             depends on @moja/ui, @moja/theme
         │
         ▼
packages/ui (@moja/ui)
  ├── components.json          style: "radix-nova"  ← MISLABELED
  ├── src/components/ui/*      mostly @base-ui/react
  ├── src/lib/utils.ts         local cn() via clsx + tailwind-merge
  ├── src/styles/globals.css   Tailwind + theme import + Base data-* variants
  └── package.json             exports ./components/*, ./lib/*, ./hooks/*, ./globals.css
         │
         ▼
packages/theme (@moja/theme)
  ├── global.css               :root (+ unused .dark) tokens + @theme inline
  └── tokens.ts                JS palette / Colors for web + RN
```

## Recommended architecture (after remediation)

```text
apps/web
  └── (optional) components.json   only if installing blocks into the app
         │
packages/ui
  ├── components.json          style: "base-nova"   ← align with code
  ├── aliases.components       "#components"
  ├── cn                       either local utils OR `cn` package re-export
  ├── styles                   either keep inline-CVA OR adopt style-nova `cn-*` tokens
  └── primitives               @base-ui/react only (Radix deps removed unless drawer kept on Vaul intentionally)
         │
packages/theme                 unchanged ownership of brand tokens
```

---

## Package boundary verdict

| Check | Result |
|-------|--------|
| `web → ui → theme` direction | **PASS** |
| ui imports from apps/web | **PASS** (none found) |
| App-specific composites in ui | **ACCEPTABLE** (`carrier-avatar`, `user-avatar`, `phone-input`, date/time pickers, `action-drawer`) — document as Moja extensions |
| Theme logic inside ui | **PASS** (ui imports `@moja/theme/global.css`) |
| Business logic in ui | **PASS** (no domain services) |

---

## `@packages/ui` as design-system package

### What belongs

- shadcn primitives under `src/components/ui/`
- Shared hooks (`use-mobile`, `use-media-query`)
- `cn` / utils
- Package-level globals that wire Tailwind sources for the package

### What is present and OK as Moja extensions

| File | Role |
|------|------|
| `carrier-avatar.tsx` | Brand carrier logo/initials |
| `user-avatar.tsx` | DiceBear + photo cascade |
| `phone-input.tsx` | Phone UX for CI/phone markets |
| `date-picker.tsx` / `date-time-picker.tsx` / `time-picker.tsx` | Composites |
| `action-drawer.tsx` | App drawer pattern |

### What does not belong (or is questionable)

| Item | Issue |
|------|-------|
| Unused `radix-ui` / `@radix-ui/react-slot` | Dead weight; confuses CLI |
| Unused `@shadcn/react` | Present in node_modules/deps; **no src imports** |
| `next-themes` | Dark-mode oriented; product is light-only (INFO — low harm if unused) |

### Exports

```json
"./globals.css": "./src/styles/globals.css",
"./components/*": "./src/components/*.tsx",
"./hooks/*": "./src/hooks/*.ts",
"./lib/*": "./src/lib/*.ts"
```

Consumers correctly use deep imports: `@moja/ui/components/ui/button`. Tree-shaking depends on bundler resolving those paths — acceptable for internal workspace package. No barrel `index.ts` (good for avoiding mega-bundles).

### Package-local imports (`#…`)

```json
"imports": {
  "#components/*": "./src/components/*.tsx",
  "#hooks/*": "./src/hooks/*.ts",
  "#lib/*": "./src/lib/*.ts"
}
```

Aligned with modern Node subpath imports for shadcn monorepo packages. **Issue:** `components.json` aliases `components` → `#components/ui` instead of `#components` (SHADCN-008).

---

## `@packages/theme`

| Aspect | Assessment |
|--------|------------|
| Ownership of brand colors | Correct |
| CSS variables for shadcn semantic tokens | Present (`--primary`, `--background`, charts, sidebar, …) |
| `@theme inline` mapping | Correct for Tailwind v4 |
| Dual export (`global.css` + `tokens.ts`) | Sound for web + RN |
| `peerDependencies.react-native` | Odd for a shared web CSS package but intentional for RN token consumers — **INFO** |
| Dark tokens | Present, unused by product — **INFO, not a defect** |

---

## Circular / reverse dependencies

None found between web/ui/theme for UI code.

---

## Score for this area

| Area | Status | Severity |
|------|--------|----------|
| Monorepo boundaries | PASS | — |
| UI package coherence | PASS WITH ISSUES | MEDIUM (dead deps, mislabeled config) |
| Theme separation | PASS | — |
| Upgradeability | FAIL until config fixed | HIGH |
