# 06 — Forms Audit

## Canonical form architecture (reference)

From `content/docs/forms` + component docs + skills:

- Prefer **`Field` / `FieldGroup` / `FieldSet` / `FieldLabel` / `FieldDescription` / `FieldError`**
- Validation: `data-invalid` on `Field`, `aria-invalid` on control
- Legacy shadcn **`Form`** (react-hook-form FormField wrappers) is **not** in current base/radix registries (`form.tsx` MISSING in both)
- Examples use Field composition; RHF/TanStack Form integrate **around** Field, not replace it

Moja has `field.tsx` (~218 lines vs reference ~204) — **primitives exist**.

---

## Moja form primitive status

| Primitive | In `@moja/ui` | Notes |
|-----------|---------------|-------|
| Field / FieldGroup / FieldSet / FieldLabel / FieldError / FieldDescription | Yes | Usable |
| Label / Input / Textarea / Select / Checkbox / Switch / Radio | Yes | Base UI where applicable |
| InputGroup | Yes | |
| Combobox | Yes | |
| PhoneInput | Yes (custom) | |
| Form (old RHF Form*) | **No** | Correct vs current reference |

---

## Application usage — hybrid / half-migrated (SHADCN-006)

**Count (reaudit):** **7** web files import `@moja/ui/components/ui/field`.

### Good (Field composition)

- `apps/web/features/auth/components/passenger-auth-flow.tsx` — `FieldGroup` + Field imports
- Operator settings: `banking-view`, `bank-drawer`, `personal-profile-view`, `company-profile-view`, `profile-drawer`, `personal-profile-drawer`

### Legacy / incomplete patterns

Examples:

- `apps/web/features/passenger/views/saved-passengers-view.tsx` — `Label` + `Input` + `space-y-*` stacks; no Field; manual state; ghost `text-text-*` classes
- `apps/web/features/contact/components/contact-form.tsx` — RHF + `aria-invalid` on inputs (better) but not Field/`data-invalid`
- Admin blog/banner/redirect dialogs — RHF `Controller` without consistent Field shell
- Widespread `space-y-*` on forms/layouts (conflicts with current shadcn skill guidance preferring `flex` + `gap-*`)

### SHADCN-033 — LOW — Local `FieldLabel` shadow

`blog-edit-view.tsx` defines a local `function FieldLabel` — not the design-system Field. Confusing for migration searches; rename or adopt `@moja/ui` Field.

### react-hook-form

Still used in multiple admin/operator surfaces. **Acceptable** if composed with Field. Problematic when it recreates Label+div layout and skips error association.

---

## Accessibility (forms)

| Concern | Status |
|---------|--------|
| Error ↔ control association via Field | Only on migrated surfaces |
| `aria-invalid` | Present in some (contact); missing in many legacy forms |
| `data-invalid` on Field | Underused |
| Required fields | Often HTML `required` only |
| Dialog forms with Title | Often present (e.g. saved passengers) |

Runtime screen-reader QA: **NOT VERIFIED**.

---

## Verdict

| Question | Answer |
|----------|--------|
| Are form **primitives** current? | **Mostly yes** |
| Are forms **used** per current architecture? | **No — mixed / half-migrated** |
| Blocker for foundation? | **MEDIUM** — not as urgent as config/Base UI labeling, but blocks a11y consistency |

### Recommendation

1. Adopt Field as the only approved form layout in `apps/web` UI registry / code standards.  
2. Migrate high-traffic forms first: auth (done-ish), checkout, saved passengers, contact, operator onboarding.  
3. Keep RHF/zod; wrap controls in Field.  
4. Ban new `space-y-*` form stacks in review.
