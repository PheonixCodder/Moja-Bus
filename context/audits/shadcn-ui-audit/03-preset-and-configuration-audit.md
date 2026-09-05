# 03 — Preset and Configuration Audit

## Classification

### **C — Hybrid / mixed implementation**

Not a clean new preset init (A). Not merely a legacy new-york install (B). Not fully incompatible (D).

Evidence:

1. Components use `@base-ui/react` → runtime = **base** base.
2. `components.json` `"style": "radix-nova"` → config = **radix** + **nova**.
3. Styling = inline Tailwind in `cva` (pre–`cn-*` style CSS generation).
4. Reference consumer components use `import { cn } from "cn"` + `cn-button-*` classes from `style-nova.css`.

---

## How presets work in the reference

From create/init + `registry/config` patterns:

- **Style names:** nova, vega, maia, lyra, mira, luma, rhea, sera, …
- **Bases:** `base` (Base UI), `radix` (Radix), `aria` (React Aria)
- **Encoded style field:** `` `${base}-${style}` `` → e.g. `base-nova`, `radix-nova`
- Preset codes pack colors/fonts/radius/icons; **base** is selected via `--base` / Base picker and is preserved on `apply` in many flows

Moja should be **`base-nova`** given current source.

---

## `packages/ui/components.json` field audit

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "#components/ui",
    "utils": "#lib/utils",
    "hooks": "#hooks",
    "lib": "#lib",
    "ui": "#components/ui"
  }
}
```

| Field | Current | Expected for Moja | Verdict |
|-------|---------|-------------------|---------|
| style | `radix-nova` | `base-nova` | **CRITICAL mismatch** SHADCN-001 |
| rsc / tsx | true | true | OK |
| tailwind.config | `""` | `""` (v4) | OK |
| tailwind.css | package-local | OK | OK |
| baseColor | neutral | neutral (brand overrides in theme) | OK (brand via CSS vars) |
| cssVariables | true | true | OK |
| iconLibrary | lucide | lucide | OK |
| aliases.components | `#components/ui` | `#components` | **MEDIUM** SHADCN-008 |
| aliases.ui | `#components/ui` | `#components/ui` | OK |
| aliases.utils | `#lib/utils` | OK (or re-export `cn`) | OK |

---

## `apps/web` components.json

**Absent.** Intentional if all primitives live in `@moja/ui`.

Official monorepo docs often use **two** configs (app + UI package) so blocks install into the app. Moja’s single-package approach is valid but:

```bash
# Correct today
cd packages/ui
pnpm dlx shadcn@latest add <component>

# Unsafe until style fixed — would install Radix variants
```

---

## CSS / init wiring

```text
apps/web/app/globals.css
  → @import "@moja/ui/globals.css"
  → @source features + app

packages/ui/src/styles/globals.css
  → @import "tailwindcss"
  → @plugin "@tailwindcss/typography"
  → @import "@moja/theme/global.css"
  → @source components/hooks/lib
  → Base UI @custom-variant data-*
  → accordion keyframes still --radix-*   ← leftover SHADCN-009
```

PostCSS: `@tailwindcss/postcss` — correct for Tailwind v4.

---

## Why the divergence matters

| If you… | What happens |
|---------|--------------|
| `shadcn add dialog` now | CLI thinks project is **radix-nova** → may write Radix dialog into a Base UI tree |
| `shadcn apply <preset>` | May rewrite CSS/components assuming Radix |
| Agent skills read `components.json` | Agents generate Radix `asChild` patterns against Base UI APIs |

---

## Fix (config-only phase)

1. Set `"style": "base-nova"`.
2. Set `"components": "#components"`.
3. Run `npx shadcn@latest info --json` from `packages/ui` and confirm `base: base`.
4. Do **not** mass-regenerate until styling strategy decided (see SHADCN-002).

**Migration impact:** LOW for config edit; HIGH if CLI regenerates all components afterward.  
**Can be fixed independently?** YES (config) / NO (full generation alignment).
