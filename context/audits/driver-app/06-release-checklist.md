# 06 — Pre-Release Verification Checklist

This pre-release gate defines the verification probes required before `apps/driver-app` can be considered production-ready.

---

## Probe A: File Hygiene & Size Verification
- [ ] `test-archive-1/` and `test-archive/` completely deleted from `apps/driver-app/`.
- [ ] `.gitignore` contains all rules from `traveler-app` (ignoring `/android`, `node_modules/`, `dist/`, `.expo/`).
- [ ] Total disk footprint of `apps/driver-app/` (excluding local `node_modules`) is < 5 MB.

---

## Probe B: Branding & Asset Verification
- [ ] `assets/images/icon.png` (1024x1024) is present.
- [ ] `assets/images/adaptive-icon.png` (432x432) is present.
- [ ] `assets/images/splash.png` (1284x2778) is present.
- [ ] `assets/images/favicon.png` (32x32) is present.
- [ ] `assets/logo/` brand graphics are present.
- [ ] `app.json` has valid `"icon"`, `"android.adaptiveIcon"`, `"web.favicon"`, and `"expo-splash-screen"` entries.

---

## Probe C: Styling & UI Primitives Verification
- [ ] `postcss.config.mjs` is created and imports `@tailwindcss/postcss`.
- [ ] `@tailwindcss/postcss: ^4` is added to `package.json` devDependencies.
- [ ] `components.json` is created.
- [ ] `components/ui/` contains full `@rn-primitives` design system components (`button`, `card`, `input`, `badge`, `dialog`, `tabs`, `select`, `text`, etc.).
- [ ] `lib/utils.ts` (`cn`) and `lib/theme.ts` exist.
- [ ] `app/_layout.tsx` includes `<PortalHost />` and `ThemeProvider`.
- [ ] No `space-y-*` classes remain in any `.tsx` file (all replaced by `gap-*`).
- [ ] Tailwind utility classes compile and render styled components properly in Expo.

---

## Probe D: Navigation & Flow Verification
- [ ] Bottom navigation bar is polished with responsive layout, clear labels, and tab indicators.
- [ ] Login screen (`app/(auth)/login.tsx`) renders with correct branding, colors, and button styling.
- [ ] Driver onboarding wizard steps (`app/(auth)/register/*`) use styled form controls and cards.
- [ ] Active dispatches (`trips.tsx`), offers (`offers.tsx`), live HUD (`live.tsx`), scanner (`scanner.tsx`), and earnings (`earnings.tsx`) render with proper theme tokens.
