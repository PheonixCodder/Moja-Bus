# TypeScript Gaps & Vercel Build Error Tracker

## Status: ALL PHASES COMPLETED (100% Invariant Compliant)

---

## 1. Inventory by Pattern & File

### Category A: Base UI `@base-ui/react/select` & `<Combobox>` `onValueChange` Signatures
> **Standard**: Base UI's `<Select>` and `<Combobox>` Root define `onValueChange?: (value: Value | null, eventDetails: any) => void`. All callbacks must accept `(val: string | null)` to preserve full assignability.

| File Path | Location / Element | Expected Type | Status |
| :--- | :--- | :--- | :--- |
| `apps/web/features/admin/components/admin-referral-program-card.tsx` | Line 214 (`<Select>`) | `(value: string \| null)` | 🟢 Resolved |
| `apps/web/features/admin/views/admin-verifications-view.tsx` | Line 150 (`<Select>`) | `(value: string \| null)` | 🟢 Resolved |
| `apps/web/features/admin/components/operators.tsx` | Line 141 (`<Select>`) | `(value: string \| null)` | 🟢 Resolved |
| `apps/web/features/admin/components/travelers.tsx` | Line 146 (`<Select>`) | `(value: string \| null)` | 🟢 Resolved |
| `apps/web/features/admin/components/travelers-table.tsx` | Line 122 (`<Select>`) | `(value: string \| null)` | 🟢 Resolved |
| `apps/web/features/admin/components/travelers-grid.tsx` | Line 204 (`<Select>`) | `(value: string \| null)` | 🟢 Resolved |
| `apps/web/features/admin/components/verifications-pagination.tsx` | Line 70 (`<Select>`) | `(value: string \| null)` | 🟢 Resolved |
| `apps/web/features/admin/views/admin-inquiries-view.tsx` | Lines 145 & 289 (`<Select>`) | `(value: string \| null)` | 🟢 Resolved |
| `apps/web/features/operator/components/drivers/send-offer-dialog.tsx` | Line 137 (`<Select>`) | `(value: string \| null)` | 🟢 Resolved |
| `apps/web/features/operator/components/trips/trip-card.tsx` | Line 154 (`<Combobox>`) | `(val: string \| null)` | 🟢 Resolved |
| `apps/web/features/operator/components/trips/manifest-drawer.tsx` | Line 426 (`<Combobox>`) | `(val: string \| null)` | 🟢 Resolved |
| `apps/web/features/operator/settings/components/drawers/bank-drawer.tsx` | Line 275 (`<Combobox>`) | `(val: string \| null)` | 🟢 Resolved |
| `apps/web/features/operator/components/schedules/schedule-edit-drawer.tsx` | Lines 436, 666, 709 (`<Select>`, `<Combobox>`) | `(val: string \| null)` | 🟢 Resolved |
| `apps/web/features/operator/components/terminals/terminal-editor-sheet.tsx` | Lines 768, 828, 891 (`<Combobox>`) | `(val: string \| null)` | 🟢 Resolved |
| `apps/web/features/admin/components/content/redirect-form-dialog.tsx` | Line 200 (`<Select>`) | `(val: string \| null)` | 🟢 Resolved |
| `apps/web/features/admin/components/audit/webhooks/webhook-logs-filters.tsx` | Lines 35, 49 (`<Select>`) | `(val: string \| null)` | 🟢 Resolved |
| `apps/web/features/admin/components/dispatch-filter-bar.tsx` | Lines 95, 120 (`<Select>`, `<Combobox>`) | `(val: string \| null)` | 🟢 Resolved |
| `apps/web/features/admin/components/ledger-filters.tsx` | Lines 56, 72 (`<Select>`) | `(val: string \| null)` | 🟢 Resolved |
| `apps/web/features/admin/components/campaigns/admin-campaigns-filter-bar.tsx` | Line 47 (`<Select>`) | `(val: string \| null)` | 🟢 Resolved |

---

### Category B: Recharts Tooltip, Axis & Formatters
> **Standard**: Recharts chart callbacks (`content`, `formatter`, `tickFormatter`) are strongly typed using `TooltipContentProps`, `CustomTooltipProps`, or explicit union types.

| File Path | Location / Element | Expected Type | Status |
| :--- | :--- | :--- | :--- |
| `apps/web/features/admin/components/blog/blog-views-chart.tsx` | Line 87, 95, 99 | `TooltipContentProps`, `(val: string)`, `(value: string \| number)` | 🟢 Resolved |
| `apps/web/features/admin/components/dashboard/dashboard-revenue-chart.tsx` | Line 32, 96 | `CustomTooltipProps`, `(value: string \| number)` | 🟢 Resolved |
| `apps/web/features/operator/components/revenue/revenue-analytics-chart.tsx` | Line 74, 83 | `TooltipContentProps`, `(value: number \| bigint)` | 🟢 Resolved |
| `apps/web/features/dashboard/components/travel-insights-chart.tsx` | Line 130, 137 | `(v: string \| number)`, `(value: any, name: any)` | 🟢 Resolved |
| `apps/web/features/operator/components/drivers/driver-analytics-charts.tsx` | Line 109, 114, 190, 195 | `(m: string)`, `(v: any)`, `(s: number)` | 🟢 Resolved |
| `apps/web/features/admin/components/blog/blog-read-depth-chart.tsx` | Line 95 | `(value: any)` | 🟢 Resolved |

---

### Category C: TanStack Table Checkbox & Row Selection Callbacks
> **Standard**: Radix / UI `Checkbox` `onCheckedChange` delivers `CheckedState` (`boolean | "indeterminate"`).

| File Path | Location / Element | Expected Type | Status |
| :--- | :--- | :--- | :--- |
| `apps/web/features/admin/components/operators-columns.tsx` | Lines 108, 119 | `(value: boolean \| "indeterminate")` | 🟢 Resolved |
| `apps/web/features/admin/components/travelers-columns.tsx` | Lines 95, 106 | `(value: boolean \| "indeterminate")` | 🟢 Resolved |
| `apps/web/features/admin/components/verifications-columns.tsx` | Lines 91, 102 | `(value: boolean \| "indeterminate")` | 🟢 Resolved |

---

### Category D: Next.js `<Link>` & Native Event Handlers
> **Standard**: Direct event handlers attached to typed Next.js components receive explicit event type annotations.

| File Path | Location / Element | Expected Type | Status |
| :--- | :--- | :--- | :--- |
| `apps/web/features/admin/components/dispatch-trip-list.tsx` | Line 180 (`<Link onClick>`) | `(e: MouseEvent<HTMLAnchorElement>)` | 🟢 Resolved |
| `apps/web/features/booking/components/booking-card.tsx` | Line 98 (`<button onClick>`) | `(e: React.MouseEvent<HTMLButtonElement>)` | 🟢 Resolved |
| `apps/web/features/capture/components/capture-page-view.tsx` | Line 204 (`<form onSubmit>`) | `(e: FormEvent<HTMLFormElement>)` | 🟢 Resolved |
| `apps/web/features/admin/components/content/redirect-delete-dialog.tsx` | Line 76 (`<AlertDialogAction onClick>`) | `(e: MouseEvent<HTMLButtonElement>)` | 🟢 Resolved |
| `apps/web/features/operator/components/drivers/driver-roster-actions.tsx` | Line 400 (`<AlertDialogAction onClick>`) | `(e: MouseEvent<HTMLButtonElement>)` | 🟢 Resolved |
| `apps/web/features/operator/components/drivers/marketplace-driver-card.tsx` | Lines 286, 301 (`<Button onClick>`) | `(e: MouseEvent<HTMLButtonElement>)` | 🟢 Resolved |
| `apps/web/features/operator/components/terminals/terminal-editor-sheet.tsx` | Line 383 (`onPointerDownOutside`) | `(e: { preventDefault: () => void })` | 🟢 Resolved |
| `packages/ui/src/components/ui/input-group.tsx` | Line 57 (`<div onClick>`) | `(e: React.MouseEvent<HTMLDivElement>)` | 🟢 Resolved |
