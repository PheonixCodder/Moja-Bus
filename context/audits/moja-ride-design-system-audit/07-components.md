# Moja Ride Design & Design-Engineering Audit
## 07. Component System Audit

### 1. Monorepo Component Inventory

Across the monorepo, components are distributed across three separate packages and directories:

| Component Library | Location | Base Technology | Component Count | Completeness / Polish |
| :--- | :--- | :--- | :---: | :---: |
| **`@moja/ui`** | `packages/ui/src/components/ui/` | `@base-ui/react`, Radix, CVA | **60 components** | High technical capability, but missing critical states and domain variants. |
| **`traveler-app/ui`** | `apps/traveler-app/components/ui/` | `@rn-primitives`, NativeWind, CVA | **32 components** | Good primitive coverage; lacks domain composites. |
| **`driver-app/ui`** | `apps/driver-app/components/ui/` | React Native primitives, StyleSheet | **6 components** | Minimalist set (`Badge`, `Button`, `Card`, `Input`, `PageHeader`, `ScreenShell`). |

---

### 2. Deep-Dive: Core Primitive Components

#### 2.1 The `Button` Component Across Surfaces

```
Button Comparison Across Platforms
┌────────────────────────────────────────────────────────────────────────┐
│ WEB (@moja/ui/src/components/ui/button.tsx)                            │
│  - Primitives:  @base-ui/react/button + cva                            │
│  - Variants:    default, outline, secondary, ghost, destructive, link │
│  - Sizes:       default (h-8), xs (h-6), sm (h-7), lg (h-9), icon...   │
│  - Deficiencies: h-8 is too short (32px); no loading prop; no success/ │
│                 warning variants.                                      │
├────────────────────────────────────────────────────────────────────────┤
│ TRAVELER APP (apps/traveler-app/components/ui/button.tsx)              │
│  - Primitives:  Pressable + TextClassContext + cva                     │
│  - Variants:    default, destructive, outline, secondary, ghost, link │
│  - Sizes:       default (h-10), sm (h-9), lg (h-11), icon              │
│  - Deficiencies: No loading prop; no icon prop; relies on React        │
│                 Context for text color.                                │
├────────────────────────────────────────────────────────────────────────┤
│ DRIVER APP (apps/driver-app/components/ui/Button.tsx)                  │
│  - Primitives:  TouchableOpacity + ActivityIndicator + Haptics        │
│  - Variants:    primary, secondary, outline, ghost, destructive,       │
│                 success, warning                                       │
│  - Sizes:       sm (h-10 = 40px), md (h-13 = 52px), lg (h-15 = 60px)   │
│  - Strengths:   Has loading prop; has icon/iconPosition; has haptics.  │
│  - Deficiencies: Hardcoded hex colors; disconnected from @moja/ui.     │
└────────────────────────────────────────────────────────────────────────┘
```

#### Key Findings on `Button`:
1. **Missing `loading` prop in Web**: Because `@moja/ui/button.tsx` does not have a `loading` or `isLoading` prop, developers must manually compose spinners:
   ```tsx
   <Button disabled={isLoading} className="gap-2">
     {isLoading && <Spinner className="size-3.5" />}
     {t("submit")}
   </Button>
   ```
   This pattern is repeated across more than 40 form components, resulting in inconsistent spinner sizes (`size-3`, `size-3.5`, `size-4`) and mismatched alignment.
2. **Size Ladder Mismatch**:
   Web `default` is `32px` (`h-8`), while Traveler `default` is `40px` (`h-10`), and Driver `md` is `52px` (`h-13`).
3. **PascalCase vs kebab-case Inconsistency**:
   Driver app uses `Button.tsx`, `Badge.tsx`, `Card.tsx`, `Input.tsx` (PascalCase).
   Traveler app uses `button.tsx`, `badge.tsx`, `card.tsx`, `input.tsx` (kebab-case).
   Web uses kebab-case.

---

#### 2.2 The `Input` Component Across Surfaces

1. **Web (`packages/ui/src/components/ui/input.tsx`)**:
   ```tsx
   function Input({ className, type, ...props }: React.ComponentProps<"input">) {
     return (
       <InputPrimitive
         type={type}
         data-slot="input"
         className={cn(
           "h-8 w-full min-w-0 box-border rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors ...",
           className
         )}
         {...props}
       />
     );
   }
   ```
   - Bare primitive with `h-8` (32px) height.
   - To show a label, description, or error, developers must wrap it in `field.tsx` (`Field`, `FieldLabel`, `FieldError`).
   - However, many views bypass `Field` and write raw `<label>` tags with custom `<p className="text-red-500 text-xs">`.
2. **Traveler App (`apps/traveler-app/components/ui/input.tsx`)**:
   - A bare `TextInput` wrapper styled with Tailwind classes (`h-10 sm:h-9 rounded-md border`).
   - Does not integrate labels, error messages, or clear buttons.
3. **Driver App (`apps/driver-app/components/ui/Input.tsx`)**:
   - An opinionated compound component that handles:
     - `label` (uppercase `text-xs font-bold text-[#d4d4d8]`)
     - `leftIcon` and `rightIcon` slots
     - `error` and `hint` messaging
     - Built-in focus state tracking (`isFocused ? "border-[#ee237c]" : ...`)
     - Generous `h-14` (56px) touch target for quick in-vehicle data entry.

---

#### 2.3 The `Badge` Component & Variant Omissions

In `packages/ui/src/components/ui/badge.tsx`:
```tsx
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border-border text-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
  }
);
```
- **The Core Problem**: No `success`, `warning`, `info`, or `neutral` variants exist.
- **The Fallout**: Every domain view in the repository implements its own ad-hoc badge:
  - `apps/web/features/operator/lib/trips/status-config.ts`: `text-green-600 bg-green-50 border-green-200`
  - `apps/web/features/admin/components/dispatch-trip-list.tsx`: `bg-purple-100 text-purple-700 border-purple-200`
  - `apps/web/features/booking/components/booking-card.tsx`: `bg-emerald-500/10 text-emerald-600 border-emerald-500/20`
  - `apps/driver-app/components/ui/Badge.tsx`: Defines its own variants: `success`, `warning`, `error`, `info`, `neutral`, `streak`.

---

### 3. Component Duplication & Fragmented Implementations

| Component | Implementations Found in Repo | Duplication Severity | Recommendation |
| :--- | :--- | :---: | :--- |
| **Status Badge** | 15 separate declarations (`status-config.ts`, `dispatch-trip-list.tsx`, `staff.ts`, `admin-staff.ts`, `booking-card.tsx`, etc.) | **CRITICAL** | Consolidate into `@moja/ui/components/domain/status-badge.tsx`. |
| **Page Header** | 4 separate patterns: Passenger Header, Operator Header, Admin per-page Header, Traveler `page-header.tsx`, Driver `PageHeader.tsx` | **HIGH** | Unify layout headers in web layouts; create shared mobile `ScreenHeader`. |
| **Empty State** | `@moja/ui/empty.tsx` vs ~25 ad-hoc empty `div` implementations | **HIGH** | Enforce `@moja/ui/empty` monorepo-wide. |
| **Date Range Picker** | `dashboard-date-range-picker.tsx` (Passenger) vs `dashboard-date-picker.tsx` (Admin) vs `withdrawals-filter-bar.tsx` inline popover | **MEDIUM** | Centralize into `@moja/ui/components/ui/date-range-picker.tsx`. |
| **Ticket Scanner** | `operator/components/ticket-scanner.tsx` vs `driver-app/app/(tabs)/scanner.tsx` | **MEDIUM** | Retain separate camera implementations (web HTML5-QRCode vs Expo Camera), but unify result card UI. |

---

### 4. Summary of Component System Recommendations

1. **Upgrade `@moja/ui/button.tsx`**:
   - Set standard size to `h-9` (36px) or `h-10` (40px).
   - Add built-in `loading` prop (`loading?: boolean`) rendering a centralized `<Spinner>`.
   - Add `icon` and `iconPosition` props.
2. **Expand `@moja/ui/badge.tsx`**:
   - Add `success`, `warning`, and `info` variants with subtle backgrounds and borders.
3. **Build Compound `Input` Wrapper**:
   - Provide an optional compound `<TextInput label="..." error="..." hint="..." />` for rapid form assembly on web and mobile.
4. **Enforce Component Governance**:
   - Add ESLint / Biome rules prohibiting raw inline status badges when `<StatusBadge>` is available.
