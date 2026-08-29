# TypeScript & Vercel Build Typecheck Audit

## Executive Summary
This audit tracks all TypeScript strictness gaps, contextual typing mismatches, and build-time type errors that emerge during fresh Next.js production builds (e.g. on Vercel CI/CD) versus local typechecks.

---

## Root Cause Analysis: Why Local `tsc` Passed while Vercel Failed

1. **Base UI vs Radix UI Callback Signatures**:
   - The `@moja/ui` package uses `@base-ui/react` (MUI Base UI v1) for components like `<Select>`, `<Dialog>`, etc.
   - `@base-ui/react/select`'s `Root` component specifies `onValueChange?: (value: Value | null, eventDetails: Select.ValueChangeEventDetails) => void`.
   - Explicitly typing `(value: string) => ...` fails in strict Next.js builds because Base UI permits `null` (when selection is cleared). The valid type is `(value: string | null)` or allowing Base UI's contextual generic inference.

2. **Next.js Generated Route & Component Types (`.next/types/**/*.ts`)**:
   - `next build` generates dynamic route and component types during compilation. On clean CI environments (Vercel), these are generated on-the-fly and checked with Next.js's internal compiler plugin (`@moja/typescript/next.json`).
   - Local `tsc --noEmit` without a prior clean build relies on cached or ambient declarations.

3. **Recharts SVG & Axis Generics**:
   - `recharts` `<Tooltip>`, `<XAxis>`, and `<YAxis>` callbacks (`content`, `formatter`, `tickFormatter`) have loosely typed or contravariant generics (`(value: any, name: any)` or `TooltipContentProps`).

4. **TanStack Table Header/Cell Parameter Inferences**:
   - Checkbox `onCheckedChange` receives `CheckedState` (`boolean | "indeterminate"`). Without explicit types or proper casting, strict build workers reject implicit inferences.

---

## Audit Index & Modules

- [01-tracker.md](./01-tracker.md) — Comprehensive File Tracker & Error Inventory
- [02-type-system-standards.md](./02-type-system-standards.md) — Type safety standards for Base UI, Recharts, and TanStack Table
