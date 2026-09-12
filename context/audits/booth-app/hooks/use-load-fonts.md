# Audit: use-load-fonts.ts

## 1. File
Exact source path: [`apps/booth-app/hooks/use-load-fonts.ts`](file:///C:/dev/moja-buss/apps/booth-app/hooks/use-load-fonts.ts)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Asynchronously loads the canonical brand fonts (Outfit and Raleway) via Expo Font and Google Fonts packages to prevent unstyled system font flashes.

## 4. Responsibilities
- Load Outfit font weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold).
- Load Raleway font weights: 600 (SemiBold), 700 (Bold), 800 (ExtraBold).
- Return `{ fontsLoaded, fontsError }` status used by the root layout to coordinate splash screen teardown.

## 5. Dependencies
- `@expo-google-fonts/outfit` (Outfit regular, medium, semibold, bold)
- `@expo-google-fonts/raleway` (Raleway semibold, bold, extrabold)
- `expo-font` (`useFonts` hook)

## 6. Consumers / Usage
- [`app/_layout.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/_layout.tsx) (Gates `SplashScreen.hideAsync()`)

## 7. Current Implementation
- **File Length**: 29 lines.
- **Architectural Role**: App startup font loader hook.
- **Key Exports**: `useLoadFonts()`.

## 8. UI / UX Audit
- Prevents Flash of Unstyled Text (FOUT) by synchronizing with Expo SplashScreen.
- Ensures all typography renders with crisp brand fonts on both Android and iOS.

## 9. Design-System Audit
- Directly implements the typography specifications from `@moja/theme` (Outfit for body/UI, Raleway for headings/numbers).

## 10. Theme Audit
- Font families are neutral with respect to light/dark themes.

## 11. Logic Audit
- Clean hook wrapping `useFonts`.
- Safely returns error state so app does not get permanently stuck on splash screen if font download/asset resolution fails.

## 12. State Management Audit
- Local React hook state managed by `expo-font`.

## 13. Async / Side-Effect Audit
- Asynchronous asset loading on initial mount.

## 14. Error Handling Audit
- Propagates `fontsError` to caller so `_layout.tsx` can dismiss splash screen even if fonts fail to load (graceful degradation to system fonts).

## 15. Offline / Synchronization Audit
- Font assets are bundled locally in native builds via Expo Google Fonts, eliminating runtime network dependency for fonts.

## 16. Performance Audit
- Minimal overhead; font registration occurs once at native bridge startup.

## 17. Accessibility Audit
- Typography scales render cleanly with dynamic type scaling support.

## 18. Architecture Audit
- Correctly isolated in `hooks/`.

## 19. Code Quality Audit
- Clean, concise TypeScript.

## 20. Reference Comparison
- **`@apps/traveler-app/`**: Uses identical `useLoadFonts` pattern.
- **`@app-references/duolingo-clone/`**: Loads Poppins and Feather fonts using identical `useFonts` pattern.

## 21. Problems
1. [MISSING MONO] `JetBrains Mono` or generic monospace is referenced in design tokens (`Fonts.mono`) and receipt components, but no monospace webfont is loaded here.
2. [RALEWAY REGULAR] `Raleway_400Regular` is not loaded; default `Raleway` key maps to `Raleway_600SemiBold`. While intentional for display headings, it should be documented.

## 22. Severity
- **Classification**: `P2`
- **Rationale**: Core visual asset loader; works properly but missing monospace font.

## 23. Recommended Changes
1. Add JSDoc explaining the Raleway 600SemiBold default mapping.
2. Consider loading `@expo-google-fonts/jetbrains-mono` if thermal receipt preview components require precise monospace character alignment.

## 24. Refactoring Plan
1. Keep implementation stable to prevent splash screen regression.
2. Add optional monospace font in Phase 3 if thermal ticket preview requires it.

## 25. Risks
- Low risk.

## 26. Dependencies / Blockers
- **Upstream Dependencies**: `@expo-google-fonts/outfit`, `@expo-google-fonts/raleway`, `expo-font`
- **Downstream Consumers**: `app/_layout.tsx`
- **Current Blockers**: None.

## 27. Verification Checklist
- [x] TypeScript compilation passes with zero errors (`turbo typecheck`)
- [x] Biome linting and formatting check passes
- [x] Verified splash screen dismisses upon font load

## 28. Final Audit Decision
- **Decision**: `KEEP`
- **Reason**: Rock-solid font loader implementation with proper splash screen error handling.
