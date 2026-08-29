# Driver App (`apps/driver-app`) — Comprehensive Audit

**Status**: Active Audit  
**Date**: 2026-08-29  
**Subject**: `apps/driver-app` vs `apps/traveler-app` & reference implementations  
**Target Monorepo**: Moja Ride (`@moja/*`)

---

## Executive Summary

The Driver Mobile App (`apps/driver-app`) was rapidly one-shotted and is in a severely degraded state compared to the production-ready Traveler Mobile App (`apps/traveler-app`) and reference architecture (`app-references/duolingo-clone`).

### Core Failure Dimensions

1. **Size Explosion (340 MB vs 80 MB baseline)**:
   - **56.7 MB** from a rogue, fully-nested cloned repository and duplicate workspace at `apps/driver-app/test-archive-1/`.
   - **111.2 MB** from untracked Android/Gradle build artifacts and Kotlin caches (`.gradle`, `.kotlin`, `android/app/build`).
   - A near-empty `.gitignore` (6 lines only) that failed to ignore build artifacts, archives, prebuild directories, and caches.

2. **Styling & NativeWind Pipeline Failure ("Pure Unstyled Text")**:
   - Missing `postcss.config.mjs` (Tailwind v4 PostCSS compilation is completely skipped).
   - Missing `@tailwindcss/postcss` devDependency.
   - Extensive use of unsupported CSS sibling utilities like `space-y-*` that do not compile or render on React Native views.
   - Overriding `@moja/theme/global.css` with conflicting HSL `:root` declarations in `global.css`.
   - Missing `lib/utils.ts` (`cn` helper).

3. **Logos, Assets & Splash Screen Void**:
   - Complete absence of an `assets/` directory (no driver logos, app icons, splash screens, or favicons).
   - `app.json` lacks `"icon"`, `"android.adaptiveIcon"`, `"web.favicon"`, and `"expo-splash-screen"` plugin configurations.

4. **Missing UI Design System & Component Library**:
   - `0` UI primitives in `components/ui/` (while `traveler-app` has 32 `@rn-primitives` based components).
   - Missing `components.json` configuration.
   - Missing `<PortalHost />` and `ThemeProvider` in `app/_layout.tsx`.
   - Inconsistent, hardcoded dark-mode hex colors (`#09090b`, `#18181b`, `#27272a`, `#e11d48`) scattered across every screen.

5. **Navigation & Screen Polish**:
   - 6 cramped, unstyled bottom tabs with 10px labels and overflowing layout.
   - Iconography mismatch (Lucide vs Hugeicons system in traveler app).

---

## Audit Index

- [01. System Map & Inventory](./01-system-map.md)
- [02. Annotated Findings](./02-findings.md)
- [03. Styling, Theme & Assets Deep Dive](./03-styling-and-assets-audit.md)
- [04. Size Bloat & File Hygiene Deep Dive](./04-size-and-bloat-audit.md)
- [05. Severity-Ranked Findings Catalog (P0–P3)](./05-findings-catalog.md)
- [06. Pre-Release Verification Checklist](./06-release-checklist.md)
