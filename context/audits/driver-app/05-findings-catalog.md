# 05 — Severity-Ranked Findings Catalog (P0–P3)

This catalog ranks all audited findings in `apps/driver-app` by severity level.

---

## Severity Index

| Severity | Count | Focus Area |
| :--- | :--- | :--- |
| **P0 — Blocker** | 5 | PostCSS failure, missing assets, missing splash, 170MB directory bloat, `.gitignore` gap |
| **P1 — Critical** | 4 | Missing `components/ui/`, missing `lib/utils.ts`, broken `space-y-*` layout, missing `<PortalHost />` |
| **P2 — Major** | 4 | Inconsistent hardcoded colors, crowded 6-tab navigation, missing `components.json`, missing `lib/theme.ts` |
| **P3 — Polish** | 3 | Lucide icon inconsistency, raw ActivityIndicators, unthemed boot screen |

---

## Detailed Gap Register

### P0 — Blockers (Must fix first)

| ID | Domain | Description | File / Location |
| :--- | :--- | :--- | :--- |
| **GAP-P0-01** | Styling | Missing `postcss.config.mjs` and `@tailwindcss/postcss` devDependency, causing all NativeWind styles to fail compilation. | `apps/driver-app/postcss.config.mjs`, `package.json` |
| **GAP-P0-02** | Assets | Missing `assets/` folder, app icon, adaptive icon, and splash graphics. | `apps/driver-app/assets/` |
| **GAP-P0-03** | Config | `app.json` lacks icon, adaptive icon, web favicon, and splash plugin configurations. | `apps/driver-app/app.json` |
| **GAP-P0-04** | Bloat | 56.7 MB duplicate repository clone in `test-archive-1/` and 111.2 MB unignored Android build caches. | `apps/driver-app/test-archive-1/`, `android/` |
| **GAP-P0-05** | Git | Inadequate 6-line `.gitignore` that fails to ignore build artifacts, caches, and test archives. | `apps/driver-app/.gitignore` |

---

### P1 — Critical (Core functionality & UI)

| ID | Domain | Description | File / Location |
| :--- | :--- | :--- | :--- |
| **GAP-P1-01** | UI Library | Missing `components/ui/` directory with reusable `@rn-primitives` design system components. | `apps/driver-app/components/ui/` |
| **GAP-P1-02** | Layout Engine | Unsupported CSS sibling utilities (`space-y-*`) used across screens, breaking React Native layout. | `app/(auth)/login.tsx` |
| **GAP-P1-03** | Utilities | Missing `lib/utils.ts` (`cn()` helper) for merging class names. | `apps/driver-app/lib/utils.ts` |
| **GAP-P1-04** | Root Shell | Missing `<PortalHost />` in `app/_layout.tsx`, breaking dialogs, tooltips, and modal primitives. | `apps/driver-app/app/_layout.tsx` |

---

### P2 — Major (Architecture & Design Consistency)

| ID | Domain | Description | File / Location |
| :--- | :--- | :--- | :--- |
| **GAP-P2-01** | Design Tokens | Scattered hardcoded hex colors (`#09090b`, `#18181b`, `#27272a`, `#e11d48`) instead of `@moja/theme` tokens. | `global.css`, `app/(tabs)/*` |
| **GAP-P2-02** | Navigation | Cramped 6-tab bottom bar with 10px text and no animated active indicators. | `app/(tabs)/_layout.tsx` |
| **GAP-P2-03** | Registry | Missing `components.json` configuration file. | `apps/driver-app/components.json` |
| **GAP-P2-04** | Theme Config | Missing `lib/theme.ts` with navigation theme mappings. | `apps/driver-app/lib/theme.ts` |

---

### P3 — Polish (UX & Aesthetic Quality)

| ID | Domain | Description | File / Location |
| :--- | :--- | :--- | :--- |
| **GAP-P3-01** | Iconography | Mixed Lucide icons instead of Hugeicons design system used across traveler app. | `app/(tabs)/_layout.tsx`, `components/` |
| **GAP-P3-02** | Feedback | Raw `ActivityIndicator` usage instead of branded loading skeletons. | `app/index.tsx`, `app/(auth)/login.tsx` |
| **GAP-P3-03** | Status Bar | Unthemed status bar and root background in `app/_layout.tsx`. | `apps/driver-app/app/_layout.tsx` |
