# Moja Ride Design & Design-Engineering Audit
## 21. Forms & Input UX

### 1. Form Experience & Cognitive Load

Forms are the transactional backbone of Moja Ride:
- Passenger ticket checkout and mobile money payment details.
- Carrier onboarding (submitting RCCM trade numbers, company tax IDs, carrier licenses).
- Fleet vehicle registration and seat layout generation.
- Schedule creation (setting multi-segment departure windows and pricing).

A well-designed form architecture minimizes cognitive friction, prevents input errors, and provides instant inline recovery feedback.

---

### 2. Form Architecture & Technology Stack

- **Web**: Form state is handled via `react-hook-form` with `@hookform/resolvers` and Zod validation schemas (`@moja/schemas`).
- **Primitives**: Form controls in `packages/ui` use `@base-ui/react` and `field.tsx` (`Field`, `FieldLabel`, `FieldError`, `FieldDescription`).
- **Mobile**:
  - Traveler app uses bare React Native state or minimal form controllers.
  - Driver app uses custom compound inputs with integrated error slots.

---

### 3. Critical Form UX Defects

#### 3.1 Decoupled Error Feedback on Web
In `packages/ui`, `Input` is a completely uncoupled HTML `<input>` primitive. It knows nothing about labels, helper descriptions, or error messages.
- Developers are expected to compose:
  ```tsx
  <Field name="phoneNumber">
    <FieldLabel>{t("phone")}</FieldLabel>
    <Input {...register("phoneNumber")} />
    <FieldError />
  </Field>
  ```
- **The Defect in Practice**:
  In many views (e.g. `apps/web/features/contact/components/contact-form.tsx`, `passenger-auth-flow.tsx`, `campaign-settings-editor.tsx`), developers skip `Field` entirely. They write raw `<label>` tags, raw `<input>` elements, and custom `<p className="text-red-500 text-xs">` error messages.
- **The Inconsistency**:
  - Error messages appear in different positions (sometimes above the input, sometimes below, sometimes as floating tooltips).
  - Error text colors alternate between `text-red-500`, `text-red-600`, and `text-destructive`.
  - Required asterisks (`*`) are manually typed in some forms and missing in others.

#### 3.2 Phone Number Formatting Friction
In Côte d'Ivoire and West Africa, phone numbers follow strict regional conventions (e.g. 10 digits in Côte d'Ivoire since 2021: `+225 07 XX XX XX XX`).
- While `packages/ui/src/components/ui/phone-input.tsx` exists based on `react-phone-number-input`, several forms still use plain unmasked text inputs for phone numbers.
- When an unmasked input is used, users enter spaces, dashes, or omit country codes, resulting in validation errors only after pressing "Submit".

#### 3.3 Multi-Step Wizard Recovery & Draft Persistence
In `apps/web/app/[locale]/dashboard/operator/onboarding/page.tsx`:
- The multi-step onboarding wizard collects company legal documents and banking coordinates.
- If an operator accidentally refreshes or navigates away mid-wizard, unsaved form state is lost because step progress is not synchronized to local storage or draft backend state.

---

### 4. Form UX Scorecard

| Dimension | Score | Comments |
| :--- | :---: | :--- |
| **Validation Architecture** | `7.8 / 10` | Solid Zod schemas from `@moja/schemas` ensuring type safety. |
| **Inline Error Placement** | `4.8 / 10` | Fragmented between `Field` component and ad-hoc `<p>` tags. |
| **Keyboard Accessibility** | `7.0 / 10` | Base UI inputs handle tab order properly. |
| **Input Masking** | `5.5 / 10` | Phone input exists but is bypassed on several booking views. |
| **Submit State Protection** | `4.2 / 10` | Buttons lack native `loading` state, risking double-submission on slow 3G networks. |

---

### 5. Form & Input Recommendations

1. **Provide a Unified `<FormTextField>` Component**:
   Create a standard compound form field combining Label, Input, Error, and Helper Text in one accessible, consistent component for both web and mobile.
2. **Mandate Phone Input Masking**:
   Enforce `phone-input.tsx` for every phone input in the repository with automatic `+225` prefixing.
3. **Automate Button Loading Protection**:
   Integrate `isSubmitting` directly into form submit buttons to disable repeat clicks and display an inline spinner automatically.
