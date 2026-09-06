# 09 — Accessibility and UX Audit

## Scope note

This is a **static** a11y audit. Keyboard/focus/SR behavior was **NOT VERIFIED** in a browser.

---

## Strengths

- Most overlays (Dialog, Sheet, AlertDialog, Select, Combobox) use Base UI primitives with built-in a11y
- Many dialogs include `DialogTitle` / `SheetTitle`
- Icon-only controls often use `sr-only` text (e.g. admin tables pagination / open menu)
- Button includes `focus-visible` ring + `aria-invalid` styles
- Field primitive supports structured labeling when used

---

## Findings

### SHADCN-013 — MEDIUM — Forms without Field / aria association

**Confidence:** HIGH  
**Examples:** `saved-passengers-view.tsx`, many admin RHF dialogs  
**Issue:** Labels via `<Label>` + layout `div`/`space-y`; errors may not wire `aria-describedby` / `data-invalid`  
**Rec:** Migrate to Field composition

### SHADCN-014 — HIGH — DropdownMenu / Tooltip type erasure

**Confidence:** HIGH  
**Files:** `dropdown-menu.tsx`, `tooltip.tsx`  
**Issue:** `as any` removes compile-time guarantees for ARIA/props; `asChild` shim may pass invalid `render` children  
**Rec:** Restore typed Base UI APIs; migrate consumers to `render`

### SHADCN-015 — MEDIUM — Non-modal Vaul drawer default

**Confidence:** MEDIUM  
**File:** `drawer.tsx` (`modal={false}`)  
**Issue:** Focus management / inert backdrop behavior differs from modal dialogs; easy to create keyboard traps or background interaction bugs  
**Rec:** Document intentional behavior; audit all Drawer usages; prefer Base drawer with explicit `modal` prop

### SHADCN-016 — LOW — space-y layouts vs focus/readability

**Confidence:** MEDIUM  
**Issue:** Not an a11y bug by itself; correlates with non-Field forms and denser inconsistent spacing  
**Rec:** Prefer `flex flex-col gap-*` per current shadcn rules

### SHADCN-017 — INFO — Chart a11y

Recharts charts lack native SR tables; rely on adjacent KPI text. Acceptable if KPIs always present.

---

## State matrix (interactive primitives — static)

| State | Button | Input | Dialog | Select | Drawer |
|-------|--------|-------|--------|--------|--------|
| default | OK | OK | OK | OK | Vaul |
| hover | OK (CSS) | OK | — | OK | — |
| focus-visible | OK | OK | OK | OK | Unclear |
| disabled | OK | OK | — | OK | — |
| invalid | Styled | Needs Field | — | Needs Field | — |
| open/closed | — | — | data-open | data-open | Vaul data |
| loading | Compose Spinner (no isLoading prop — correct) | — | — | — | — |

---

## UX / composition notes

- Button has **no** `isPending` — correct vs current shadcn; compose `Spinner` + `disabled`
- Icons: button CSS sizes SVGs without `size-*` — consumers should avoid redundant icon size classes
- Novu inbox z-index `!important` overrides in UI globals — pragmatic; document as KEEP
