# 04 — Base UI and Radix Audit

## Summary

| Question | Answer |
|----------|--------|
| Is Base UI integrated correctly at the primitive level? | **Mostly yes** for interactive components |
| Is Radix integrated correctly? | **No active Radix component implementations**; deps are leftover |
| Are Base UI and Radix mixed inside single components? | **Partially** — drawer/Vaul + asChild shims; not root+trigger from different libraries in most files |
| Does config match primitives? | **No** — config `radix-nova`, code Base UI |

---

## Reference bases

From `registry/bases.ts`:

| Name | Package |
|------|---------|
| `base` | `@base-ui/react` |
| `radix` | `radix-ui` |
| `aria` | `react-aria-components` |

Composition rule (skills + docs):

- Radix → `asChild` / `Slot`
- Base UI → `render` / `useRender`

---

## Dependency inventory (`packages/ui/package.json`)

| Package | Present | Used in src? | Verdict |
|---------|---------|--------------|---------|
| `@base-ui/react` ^1.6.0 | Yes | **Yes** (majority) | KEEP — versions match reference 1.6.0 |
| `radix-ui` ^1.4.4 | Yes | **No** | REMOVE (unless regenerating to radix) |
| `@radix-ui/react-slot` ^1.2.4 | Yes | **No** | REMOVE |
| `@shadcn/react` ^0.1.0 | Yes | **No** | REMOVE or justify |
| `vaul` | Yes | **Yes** (drawer) | KEEP only if Vaul drawer retained |
| `cmdk`, `recharts`, `embla`, `input-otp`, `react-day-picker` | Yes | Yes | Shared across bases — OK |

---

## Primitive map (condensed)

Full matrix in `15-component-conformance-matrix.md`.

| Category | Components | Our primitive |
|----------|------------|---------------|
| Base UI | accordion, alert-dialog, avatar, badge*, breadcrumb*, button, button-group*, checkbox, collapsible, combobox, context-menu, dialog, direction, dropdown-menu, hover-card, input, item*, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, sheet, sidebar*, slider, switch, tabs, toggle, toggle-group, tooltip | `@base-ui/react` |
| Vaul | drawer, action-drawer | `vaul` |
| Shared 3p | calendar, carousel, chart, command, input-otp, resizable, sonner | day-picker / embla / recharts / cmdk / panels / sonner |
| None / HTML | alert, card, empty, field, input-group, kbd, label, native-select, pagination, skeleton, spinner, table, textarea | — |
| Moja custom | carrier-avatar, user-avatar, phone-input, date-*, time-picker, action-drawer | composites |

\* uses `useRender` / `mergeProps` from Base UI

**Zero** files under `packages/ui/src` import `radix-ui` or `@radix-ui/*`.

---

## Critical mixed / half-migration cases

### 1. Config vs code (SHADCN-001)

System-wide. See `03-preset-and-configuration-audit.md`.

### 2. Drawer: Vaul vs Base UI Drawer (SHADCN-003)

| | Ours | base-nova reference |
|--|------|---------------------|
| Import | `vaul` | `@base-ui/react/drawer` |
| Lines | ~121 | ~207 |
| Defaults | `modal={false}` hardcoded on Root | `modal = true`, snap points, swipe handle context |

**Impact:** Docs for base drawer describe migration off Vaul. Keeping Vaul is a valid product choice but must be documented as intentional and config must not imply pure base-nova for drawer.

**Also:** `action-drawer.tsx` uses `<DrawerClose asChild>` — Radix-era API on Vaul.

### 3. DropdownMenu asChild shim + `as any` (SHADCN-005)

```tsx
const MenuPrimitive = MenuPrimitiveRaw as any;
function DropdownMenuTrigger({ asChild, children, ...props }: any) {
  if (asChild) {
    return <MenuPrimitive.Trigger render={children} {...props} />;
  }
  ...
}
```

**Problems:**

- Hides Base UI types
- `asChild` is not the Base UI public API
- ~12 app files still pass `asChild` (locale-switcher, drawers, tables, etc.)

**Same pattern:** `tooltip.tsx` casts primitive `as any`.

### 4. CSS keyframes still Radix-named (SHADCN-009)

`packages/ui/src/styles/globals.css` accordion/collapsible keyframes use `--radix-accordion-content-height` while Base accordion uses different CSS variable naming in current reference. Dead/wrong animation vars risk silent animation failure.

---

## Radix verdict

Radix is **not** the active primitive layer. It is **residual dependency + residual CSS + residual consumer API (asChild)**.

Do not “fix Radix integration” by adding more Radix — either:

- **Path A (recommended):** Commit to Base UI → `base-nova`, remove Radix deps, migrate drawer, replace asChild with `render`.
- **Path B:** Regenerate all components from radix-nova (expensive; contradicts Base UI default and current code).

---

## Accessibility note (static)

Base UI primitives generally preserve a11y if APIs are used correctly. Risk areas:

- `as any` menus/tooltips — props may not map to correct ARIA
- `Drawer modal={false}` — focus trap / outside interaction differs from modal drawers
- Forms without Field/`aria-invalid` association (see forms audit)

Runtime keyboard QA: **NOT VERIFIED**.
