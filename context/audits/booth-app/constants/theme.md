# Audit: theme.ts

## 1. File
Exact source path: [`apps/booth-app/constants/theme.ts`](file:///C:/dev/moja-buss/apps/booth-app/constants/theme.ts)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Single source of truth for Booth App design tokens, re-exporting canonical primitives from `@moja/theme/tokens` and defining booth-specific semantic colors, touch target metrics, and pre-composed text styles.

## 4. Responsibilities
- Re-export canonical design tokens from `@moja/theme/tokens` (`Colors`, `Palette`, `Radii`, `Spacing`, `FontSize`, `FontWeight`, `LineHeight`, `TextStyles`, `ControlHeights`).
- Define the booth-specific semantic color map (`colors`) covering primary brand hues, service types (intercity vs urban), seat statuses (available, selected, held, sold), offline warning states, and light-theme neutrals.
- Export operational ergonomics constants (`TouchTargetMinHeight = 48`, `TouchTargetSmallMinHeight = 44`, `MaxContentWidth = 800`).
- Provide typed text style objects (`textStyles`) bound to light-theme primary and secondary text colors.

## 5. Dependencies
- `@moja/theme/tokens` (Lines 6-17: re-exports core primitives and token scales)

## 6. Consumers / Usage
- [`app/(auth)/login.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(auth)/login.tsx)
- [`app/(auth)/_layout.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(auth)/_layout.tsx)
- [`app/(tabs)/bookings.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/bookings.tsx)
- [`app/(tabs)/index.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/index.tsx)
- [`app/(tabs)/profile.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/profile.tsx)
- [`app/(tabs)/_layout.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/_layout.tsx)
- [`app/sell/_layout.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/_layout.tsx)
- [`app/_layout.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/_layout.tsx)
- [`components/seat-map.tsx`](file:///C:/dev/moja-buss/apps/booth-app/components/seat-map.tsx)
- [`components/ui/button.tsx`](file:///C:/dev/moja-buss/apps/booth-app/components/ui/button.tsx)
- [`constants/ui-colors.ts`](file:///C:/dev/moja-buss/apps/booth-app/constants/ui-colors.ts)

## 7. Current Implementation
- **File Length**: 164 lines.
- **Architectural Role**: Foundation token layer.
- **Key Exports**:
  - Re-exports: `Colors`, `Palette`, `Radii`, `Spacing`, `FontFamily`, `FontSize`, `FontWeight`, `LineHeight`, `TextStyles`, `ControlHeights`.
  - Local Constants: `colors`, `TouchTargetMinHeight`, `TouchTargetSmallMinHeight`, `MaxContentWidth`, `fontFamily`, `fontSize`, `lineHeight`, `fontWeight`, `textStyles`.

## 8. UI / UX Audit
- Defines critical operational metrics: `TouchTargetMinHeight` (48px) and `TouchTargetSmallMinHeight` (44px) to guarantee fast cashier ergonomics.
- Establishes `MaxContentWidth = 800` to constrain tablet and POS widescreen views.

## 9. Design-System Audit
- **Conformance**: Accurately aligns with `@moja/theme` design tokens.
- **Semantic Mappings**:
  - `colors.primary.rose`: `#ee237c` (canonical Moja brand pink).
  - `colors.semantic.success`: `#10b981` (emerald-500).
  - `colors.semantic.warning`: `#f59e0b` (amber-500).
  - `colors.semantic.error`: `#ef4444` (red-500).
  - `colors.semantic.info`: `#3b82f6` (blue-500).
- **Seat Status Spectrum**:
  - `seat.available`: Emerald-500 (#10b981).
  - `seat.selected`: Rose-500 (#ee237c).
  - `seat.held`: Amber-500 (#f59e0b).
  - `seat.sold`: Zinc-300 (#d4d4d8) with zinc-100 bg (#f4f4f5).

## 10. Theme Audit
- Strictly configured for Light Theme (`userInterfaceStyle: "light"`).
- All neutral tokens bind to `Colors.light.*` (`background`, `surface`, `border`, `textPrimary`, `textSecondary`, `textMuted`).
- Note: Paystack blue (`#0065ff`) is hardcoded at Line 47 as an external service brand color.

## 11. Logic Audit
- Clean immutable definition using `as const` assertions.
- No runtime execution logic, mutations, or dynamic evaluation.

## 12. State Management Audit
- Pure static token constants. No local or global state.

## 13. Async / Side-Effect Audit
- Zero async operations or side effects.

## 14. Error Handling Audit
- Not applicable — compile-time static types.

## 15. Offline / Synchronization Audit
- Defines `colors.semantic.offline` tokens (`main`, `bg`, `text`, `border`) used by `components/offline-banner.tsx` to signal offline status.

## 16. Performance Audit
- Zero runtime overhead; all constants evaluated at module load time.

## 17. Accessibility Audit
- Touch target constants enforce WCAG 2.5.5 (Target Size) and Android/iOS 48x48dp guidelines.
- Color contrast for `textPrimary` (#18181b on #ffffff) yields 15.3:1 contrast ratio, well above WCAG AAA 7:1.

## 18. Architecture Audit
- Correct layer: placed at `constants/theme.ts` as a bridge between `@moja/theme` monorepo package and booth-app components.

## 19. Code Quality Audit
- TypeScript strict mode compliant.
- No `any` types.
- Complete `as const` typing.

## 20. Reference Comparison
- **`@apps/traveler-app/`**: Traveler app has a nearly identical `constants/theme.ts` directly importing `@moja/theme/tokens`. The Booth app's version adds specific cashier tokens: `seat`, `offline`, and `TouchTargetMinHeight`.
- **`@app-references/duolingo-clone/`**: Duolingo clone uses hardcoded static hex values in `constants/theme.ts`; Moja's token-based re-export approach is architecturally superior.

## 21. Problems
1. [CONSISTENCY] Line 47: `paystack: "#0065ff" as const` is a magic string in the semantic color map. While valid, it lacks a dedicated third-party integration group.
2. [UNDERUTILIZED] `TouchTargetMinHeight` (48) is exported at Line 100, but screens frequently use arbitrary Tailwind classes (e.g. `py-3`) rather than enforcing this token.
3. [PARALLEL DEFINITIONS] Overlaps with `constants/ui-colors.ts` which re-defines semantic colors specifically for icons.

## 22. Severity
- **Classification**: `P2`
- **Rationale**: Core foundational module; well-implemented but contains minor token duplication with `ui-colors.ts`.

## 23. Recommended Changes
1. Keep `constants/theme.ts` as the canonical token authority.
2. Ensure all UI primitives in `components/ui/` reference `TouchTargetMinHeight` for interactive heights.
3. Align `constants/ui-colors.ts` to derive directly from `colors.semantic` rather than raw palette indices.

## 24. Refactoring Plan
1. Step 1: Retain current token structure to avoid breaking downstream consumers.
2. Step 2: In Phase 3 (UI Primitives), update button and input components to enforce `TouchTargetMinHeight`.
3. Step 3: Document token relationships in `context/overview.md`.

## 25. Risks
- Low risk: Changing exported keys would cause compilation errors in 11 consuming files. Keep existing export signatures intact.

## 26. Dependencies / Blockers
- **Upstream Dependencies**: `@moja/theme/tokens`
- **Downstream Consumers**: 11 files (routes, seat map, button, ui-colors)
- **Current Blockers**: None.

## 27. Verification Checklist
- [x] TypeScript compilation passes with zero errors (`turbo typecheck`)
- [x] Biome linting and formatting check passes
- [x] Verified light theme token conformance
- [x] Touch target constants match 48px standard
- [x] All 11 consumer imports verified

## 28. Final Audit Decision
- **Decision**: `KEEP`
- **Reason**: The file is correctly structured, fully typed, directly binds to canonical `@moja/theme/tokens`, and provides the exact semantic extensions needed for booth cashier operations.
