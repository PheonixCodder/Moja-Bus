# Plan: Moja Ride Universal Theme & Font Migration (Outfit + Raleway & Flawless Light/Dark)

**Status:** Plan Phase — Awaiting User Ratification  
**Date:** 2026-09-09  
**Scope:** `packages/theme`, `packages/ui`, `apps/web`, `apps/driver-app`, `apps/traveler-app`, `apps/booth-app`  
**Execution Tracking Directory:** `context/plans/monorepo-font-and-theme-overhaul-2026-09-09/`

---

## Executive Summary

This plan executes a system-wide typography and styling overhaul across all six monorepo projects:
1. **Total Elimination of Montserrat**: Replaced everywhere with **Outfit** (Primary Sans Body & Interface) and **Raleway** (Display & Headings), establishing 100% font harmony between Web (`apps/web`) and the 3 React Native apps (`apps/driver-app`, `apps/traveler-app`, `apps/booth-app`).
2. **Flawless Mobile Light & Dark Modes**:
   - **`driver-app`**: Enterprise-grade, OLED-optimized **permanently Dark Mode** (`#09090b` canvas, `#18181b` card, `#fafafa` foreground).
   - **`traveler-app`**: Clean, pristine **permanently Light Mode** (`#ffffff` canvas, `#18181b` text, Moja Pink `#ee237c`).
   - **`booth-app`**: High-contrast, daylight kiosk **permanently Light Mode** (`#ffffff` canvas, standardized semantic tokens).
3. **OS-Level Native Invariant Alignment**: Syncing `app.json` `userInterfaceStyle` to eliminate white/dark flash during cold boot splash launch.
4. **Token & Icon Standardization**: Creating missing `constants/ui-colors.ts` in `booth-app`, removing all raw inline hex strings for icons, activity indicators, and switches.
5. **Universal Typography Utilities**: Centralizing `@utility h1` through `@utility micro` in `packages/theme/global.css` using dynamic CSS variables (`var(--foreground)`, `var(--muted-foreground)`), giving every app clean, adaptive headings and body text without duplicate CSS.

---

## Phased Execution Roadmap

| Phase | Target Module | Scope of Changes | Verification Criteria |
| :--- | :--- | :--- | :--- |
| **Phase 1** | `packages/theme` | Update `tokens.ts` (FontFamily to Outfit/Raleway, universal `Fonts` export), update `global.css` typography utilities to Outfit & Raleway, fix CSS alpha compatibility. | Typecheck `packages/theme` exits 0. |
| **Phase 2** | `apps/driver-app` | Remove `@expo-google-fonts/montserrat`, install `@expo-google-fonts/outfit` & `raleway`, update `use-load-fonts.ts`, set `app.json` `"userInterfaceStyle": "dark"`, map `@theme` font variables to Outfit/Raleway. | `pnpm --filter driver-app typecheck` exits 0. |
| **Phase 3** | `apps/traveler-app` | Remove `@expo-google-fonts/montserrat`, install `@expo-google-fonts/outfit` & `raleway`, update `use-load-fonts.ts`, set `app.json` `"userInterfaceStyle": "light"`, map `@theme` font variables to Outfit/Raleway. | `pnpm --filter traveler-app typecheck` exits 0. |
| **Phase 4** | `apps/booth-app` | Remove `@expo-google-fonts/montserrat`, install `@expo-google-fonts/outfit` & `raleway`, update `use-load-fonts.ts`, create `constants/ui-colors.ts`, eliminate raw hex in icons & spinners, clean up duplicate `@utility` blocks in `global.css`. | `pnpm --filter booth-app typecheck` exits 0. |
| **Phase 5** | Verification & Sign-off | Run monorepo-wide typecheck (`pnpm -r typecheck`), run lint/formatting (`pnpm format`), verify zero references to Montserrat remain. | Zero errors monorepo-wide. |
