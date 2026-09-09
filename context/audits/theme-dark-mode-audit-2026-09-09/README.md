# Theme & Dark Mode Audit — 2026-09-09

> **Scope:** `packages/theme`, `apps/driver-app`, `apps/traveler-app`
> **Goal:** Driver-app permanently dark · Traveler-app permanently light · Fix border-radius regression · Centralise all colour tokens

## Audit Files

| File | What It Covers |
|------|---------------|
| [01-packages-theme.md](./01-packages-theme.md) | `@moja/theme` package — tokens, global CSS, exports, structural issues |
| [02-driver-app.md](./02-driver-app.md) | Driver-app dark-mode setup, NativeWind wiring, missing/broken stylings |
| [02-booth-app.md](./02-booth-app.md) | Booth-app light-mode setup, tablet UI tokens, hardcoded hex & icon audit |
| [03-traveler-app.md](./03-traveler-app.md) | Traveler-app light-mode setup, border-radius regression, uncentralised tokens |
| [04-fixes.md](./04-fixes.md) | Prioritised, actionable fix list with exact code changes |
| [05-comprehensive-theme-and-fonts-audit.md](./05-comprehensive-theme-and-fonts-audit.md) | Complete Monorepo Theme & Fonts Audit (all 6 surfaces, light & dark) |

## Critical Summary (TL;DR)

### Driver App — Dark Mode Broken

The `NAV_THEME` correctly spreads `DarkTheme` and points all JS colours at `Colors.dark.*`.
However **NativeWind never receives a `colorScheme` override**, so it never injects the `.dark`
CSS class onto the root view. The `@theme inline` block in `packages/theme/global.css` always
resolves against `:root` (light) at runtime — meaning every semantic class
(`bg-background`, `text-foreground`, `border-border`, etc.) renders the *light* palette.

The typography `@utility` helpers (`h1`, `h2`, …`body-sm`, `caption`) have their text colours
**hardcoded as hex** (`#fafafa`, `#a1a1aa`) — correct for dark mode but bypassing the token
system entirely, so they cannot adapt if the theme is ever changed.

### Traveler App — Border Radius Regression

`packages/theme/global.css` ships `--radius: 0.625rem` (10 px).
The `@theme inline` block derives:

| Token | Value |
|-------|-------|
| `--radius-sm` | 6 px |
| `--radius-md` | 8 px |
| `--radius-lg` | 10 px (= `var(--radius)`) |
| `--radius-xl` | 14 px |
| `--radius-2xl` | 18 px |
| `--radius-3xl` | 22 px |

Feature screens use `rounded-[20px]` and `rounded-[18px]` arbitraries that previously matched
a larger base radius. After the theme was tightened, the `rounded-xl` / `rounded-2xl` *semantic*
classes now produce smaller values than those arbitrary overrides, causing visual inconsistency
("boxed" look) across cards, inputs, auth fields, and search form.

The shadcn-ui primitive `Card` uses `rounded-xl` (14 px). Custom feature cards use `rounded-[20px]`.
These now clash visually.

### Shared Root Cause — Two Parallel Theme Systems

`apps/traveler-app/lib/theme.ts` defines its own full `THEME` / `NAV_THEME` object using raw
HSL strings that have **no connection to `@moja/theme/tokens`**. This is a second, competing
source of truth. Meanwhile `apps/driver-app/lib/theme.ts` correctly pulls from `@moja/theme`.
