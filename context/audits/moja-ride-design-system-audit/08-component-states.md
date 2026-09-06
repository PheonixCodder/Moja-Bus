# Moja Ride Design & Design-Engineering Audit
## 08. Component State Completeness

### 1. The Full Interaction State Model

In modern enterprise and consumer design systems (benchmarked against Linear, Stripe, and Base UI), interactive components must define an exhaustive, unambiguous state machine:
- **Rest / Default**
- **Hover**
- **Active / Pressed**
- **Focus / Focus-Visible**
- **Disabled**
- **Loading / Busy**
- **Invalid / Error**
- **Success / Validated**

#### Moja Ride State Completeness Matrix

| Component | Default | Hover | Active | Focus-Visible | Disabled | Loading | Error | Success | Completeness Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Web Button** (`@moja/ui`) | Yes | Yes | Yes | Yes | Yes | **NO** | N/A | N/A | `7/10` |
| **Traveler Button** | Yes | Yes | Yes | Yes | Yes | **NO** | N/A | N/A | `6/10` |
| **Driver Button** | Yes | N/A | Yes | N/A | Yes | **YES** | N/A | N/A | `8/10` |
| **Web Input** (`@moja/ui`) | Yes | Yes | N/A | Yes | Yes | **NO** | Yes (via aria) | **NO** | `6/10` |
| **Traveler Input** | Yes | N/A | N/A | Yes | Yes | **NO** | **NO** | **NO** | `4/10` |
| **Driver Input** | Yes | N/A | N/A | Yes | Yes | **NO** | **YES** | **NO** | `8/10` |
| **Async Views / Pages** | Yes | N/A | N/A | N/A | N/A | Partial (Spinner) | Partial | N/A | `5/10` |

---

### 2. State Gaps by Component

#### 2.1 The Missing Button Loading State
In `@moja/ui/src/components/ui/button.tsx`:
- The component exposes no `loading` prop.
- When an action is pending (e.g. creating a booking, saving route schedules, approving a withdrawal), developers must manually toggle `disabled={mutation.isPending}` and manually inject a `<Spinner />`.
- **UX Problem**:
  - The button content shifts abruptly when the spinner icon is inserted.
  - In many forms, the button text is replaced entirely by a spinner without preserving the button width, causing layout shift in dialog footers and action bars.
  - In some views, developers disable the button but forget to show a spinner, leaving users uncertain whether their click was registered.

#### 2.2 Form Input Error & Validation States
1. **Web `Input`**:
   - Relies strictly on `aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20`.
   - If a developer uses raw React Hook Form without setting `aria-invalid`, the input renders normally even when invalid.
   - Helper text and error messages are not coupled to the input; they require manual placement of `<FieldError>` from `field.tsx`.
2. **Traveler Mobile `Input`**:
   - Completely lacks an error state. When a validation error occurs, the input border remains neutral. Errors must be displayed via external `<Text className="text-red-500">` tags.
3. **Driver Mobile `Input`**:
   - Properly couples the error state: `isFocused ? "border-[#ee237c]" : error ? "border-[#ef4444]" : "border-[#27272a]"`, and automatically renders `{error ? <Text className="text-[11px] font-medium text-[#ef4444]">{error}</Text> : null}`.

---

### 3. Async Content State Coverage (Loading, Empty, Error, Partial)

A production-grade interface requires a clear pattern for the four fundamental async states:
1. **Loading State**: Progressive skeletons matching the target content structure.
2. **Empty State**: Clear visual signpost, title, description, and primary recovery action.
3. **Error State**: Informative explanation, error severity indication, and retry mechanism.
4. **Partial / Degraded State**: Graceful fallback when sub-queries fail.

#### Current Repository Reality

#### Loading States: Spinner vs Skeleton
- **Operator Dashboard Navigation**: In `apps/web/app/[locale]/dashboard/operator/(dashboard)/loading.tsx`:
  Renders a single bare `<Spinner className="size-6" />` centered in the entire viewport. Every time an operator switches tabs (e.g. from Fleet to Schedules), the entire screen empties and flashes a spinner.
- **Admin Dashboard**: Has no `loading.tsx` at the layout level. Individual views implement `StatsSkeleton()` (e.g. `admin-dashboard-view.tsx` lines 17–32). This is much better, but unstandardized.

#### Empty States: Ad-hoc Sprawl
While `@moja/ui/src/components/ui/empty.tsx` exists, over 25 screens build custom ad-hoc empty states:
- `passenger-dashboard-view.tsx` line 235: Custom empty state with ticket icon.
- `operator-bookings-view.tsx` line 53: Custom empty state with calendar icon.
- `operator-dashboard-view.tsx` line 275: Custom empty state with calendar icon.
- `search-empty-state.tsx`: Custom empty state with illustration and filter reset.

#### Error States: Missing Route Boundaries
- **Passenger Dashboard**: **Zero** `error.tsx` boundary files exist in `apps/web/app/[locale]/dashboard/(passenger)`.
- **Admin Dashboard**: **Zero** `error.tsx` boundary files exist in `apps/web/app/[locale]/dashboard/admin`.
- If any tRPC query fails with a network error or 500 in either dashboard, Next.js cascades the failure to the root error boundary, tearing down the sidebar and navigation shell.
- Only the Operator dashboard has an `error.tsx` (`apps/web/app/[locale]/dashboard/operator/(dashboard)/error.tsx`), which gracefully preserves the sidebar shell and provides a `<Button onClick={() => reset()}>{t("retry")}</Button>`.

---

### 4. Recommendations for State Completeness

1. **Add Native `loading` Support to `@moja/ui/button.tsx`**:
   ```tsx
   export interface ButtonProps extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {
     loading?: boolean;
     loadingText?: string;
   }
   ```
   When `loading` is true, automatically preserve button dimensions, display an inline spinner, and set `disabled` and `aria-busy="true"`.
2. **Add Missing Route Error Boundaries**:
   Immediately create `apps/web/app/[locale]/dashboard/(passenger)/error.tsx` and `apps/web/app/[locale]/dashboard/admin/error.tsx` preserving the sidebar and header.
3. **Replace Full-Page Spinners with Content Skeletons**:
   Replace `operator/(dashboard)/loading.tsx` with a structural skeleton replicating the header, KPI grid, and data table.
