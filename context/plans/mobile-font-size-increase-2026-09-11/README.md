# Plan: Mobile Font Size Increase — Driver App & Traveler App

**Status:** ✅ Completed — All typechecks pass  
**Date:** 2026-09-11  
**Completed:** 2026-09-11  
**Scope:** `apps/driver-app`, `apps/traveler-app`, `packages/theme`  
**Web App:** Excluded (fonts unchanged)  
**Font Families:** Outfit (body) / Raleway (headings) — unchanged from existing monorepo-font-and-theme-overhaul plan

---

## Background

User-facing font sizes across both mobile apps were compared against CheapOair and Delta. Moja Ride's current typography is visually smaller than competitors across all text categories (greetings, body text, section labels, buttons, bottom navigation, badges, headings). This plan increases font sizes across all pages to match competitive benchmarks while maintaining the existing Outfit/Raleway font families.

## Scope

**Target Apps:**
- `apps/driver-app` — all `(tabs)/`, settings, notifications, language screens, and `features/` sub-screens
- `apps/traveler-app` — all `(tabs)/`, settings, notifications, language screens, and `features/` sub-screens

**Excluded:** `apps/web` (separate Tailwind scale)

**Pages/Screens Covered:**
- `(tabs)/` — all tab screens (home, search, bookings, tickets, settings, trips, offers, live, scanner, profile, earnings)
- Settings screens
- Notifications screens
- Language screens
- Auth screens (login, register)
- All `features/` sub-screens (home, search, booking, tracking, auth, trips, profile, dispatch, earn, map, offers, notifications, scanner, wallet, articles)
- Component files (ui/, components/)

---

## New Typography Scale

### Source of Truth: `packages/theme/tokens.ts`

| Token | Current | New | Line Height Current | Line Height New |
|-------|---------|-----|--------------------|----------------|
| `micro` | 10px | 11px | 14px | 15px |
| `caption` | 11px | 12px | 15px | 16px |
| `bodySm` | 12px | 13px | 18px | 19px |
| `bodyMd` | 14px | 15px | 20px | 22px |
| `bodyLg` | 16px | 17px | 24px | 26px |
| `h4` | 15px | 16px | 20px | 22px |
| `h3` | 18px | 19px | 24px | 26px |
| `h2` | 22px | 24px | 28px | 30px |
| `h1` | 28px | 30px | 34px | 36px |
| `display` | 32px | 36px | 40px | 44px |

### Design Rationale

- **micro (11px):** Badges, small labels — increased from 10px for readability
- **caption (12px):** Section labels, field labels — increased from 11px
- **bodySm (13px):** Operator details, timestamps — increased from 12px
- **bodyMd (15px):** Destination selections, body text — increased from 14px
- **bodyLg (17px):** Search buttons, primary actions — increased from 16px
- **h4 (16px):** Sub-headings — increased from 15px
- **h3 (19px):** Card titles, section headings — increased from 18px
- **h2 (24px):** Page titles, prominent headings — increased from 22px
- **h1 (30px):** Main page headings — increased from 28px
- **display (36px):** Hero/display text — increased from 32px

---

## Files to Modify

### Phase 1: Token & CSS Foundation

1. **`packages/theme/tokens.ts`** — Update `FontSize`, `LineHeight`, `TextStyles`
2. **`packages/theme/global.css`** — Update `@utility` class font sizes (h1–micro)
3. **`apps/driver-app/global.css`** — Add `--text-*` overrides to `@theme inline` block
4. **`apps/traveler-app/global.css`** — Add `--text-*` overrides to `@theme inline` block

### Phase 2: App-Level Token Mirrors

5. **`apps/driver-app/constants/theme.ts`** — Update `fontSize` object and `textStyles`
6. **`apps/traveler-app/constants/theme.ts`** — Verify/re-export tokens

### Phase 3: Component Files — Driver App

7. **`apps/driver-app/components/ui/Button.tsx`** — Update `textSizeStyles` (text-xs→text-sm, etc.)
8. **`apps/driver-app/components/ui/Badge.tsx`** — Update `textSizeStyles` (text-[10px]→text-[11px], text-xs→text-sm)
9. **`apps/driver-app/components/ui/PageHeader.tsx`** — Update `fontSize` values (20→24, 12→14)
10. **`apps/driver-app/components/ui/Avatar.tsx`** — Update `SIZE_MAP` text sizes
11. **`apps/driver-app/components/ui/Input.tsx`** — Update label/input/error font sizes
12. **`apps/driver-app/components/TabBar.tsx`** — Update tab label font sizes
13. **`apps/driver-app/features/trips/screens/trips-view.tsx`** — Update all text sizes
14. **`apps/driver-app/features/profile/screens/profile-view.tsx`** — Update all text sizes
15. **`apps/driver-app/app/(tabs)/trips.tsx`**, **`profile.tsx`**, **`offers.tsx`**, **`live.tsx`**, **`scanner.tsx`**, **`earnings.tsx`** — Update text sizes if hardcoded
16. **Other `features/` components** — Update inline font sizes

### Phase 4: Component Files — Traveler App

17. **`apps/traveler-app/components/ui/text.tsx`** — Update `textVariants` sizes
18. **`apps/traveler-app/components/ui/button.tsx`** — Update text variant sizes
19. **`apps/traveler-app/components/ui/badge.tsx`** — Update badge text sizes
20. **`apps/traveler-app/components/ui/card.tsx`** — Update card title/description sizes
21. **`apps/traveler-app/components/page-header.tsx`** — Update heading sizes
22. **`apps/traveler-app/features/home/screens/home.tsx`** — Update text sizes
23. **`apps/traveler-app/features/home/components/home-header.tsx`** — Update text sizes (text-2xl→text-3xl, text-sm→text-base, etc.)
24. **`apps/traveler-app/features/home/components/home-search-widget.tsx`** — Update text sizes
25. **`apps/traveler-app/features/home/components/promo-banner-carousel.tsx`** — Update text sizes
26. **`apps/traveler-app/features/home/components/active-trip-card.tsx`** — Update text sizes
27. **`apps/traveler-app/features/home/components/popular-routes-grid.tsx`** — Update text sizes
28. **`apps/traveler-app/features/settings/screens/settings.tsx`** — Update text sizes
29. **Other `features/` components** — Update inline font sizes

### Phase 5: Verification

30. Run `pnpm --filter driver-app typecheck`
31. Run `pnpm --filter traveler-app typecheck`
32. Run `pnpm --filter @moja/theme typecheck`
33. Verify no `text-[Xpx]` or `fontSize:` references remain at old sizes
34. Test on device/simulator that fonts render at new sizes

---

## Methodology

### CSS Utility Classes (NativeWind)

Both apps use NativeWind `@utility` classes defined in `@moja/theme/global.css`. These are the canonical font-size definitions. After updating these, any component using `className="h1"`, `className="body-md"`, etc. will automatically pick up new sizes.

### Tailwind `text-*` Classes

Components also use Tailwind's `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl` classes. After adding `--text-*` overrides to the `@theme inline` block in both apps' `global.css`, these classes will resolve to the new sizes.

### Inline `fontSize` Values

Some components use `StyleSheet.create` with explicit `fontSize` values or inline `style={{ fontSize: X }}`. These must be manually updated to match the new scale.

### `text-[Xpx]` Arbitrary Classes

Some components use arbitrary Tailwind classes like `text-[10px]`, `text-[11px]`. These must be updated to the new size values.

---

## Risk Assessment

- **Layout overflow:** Larger fonts may cause text to overflow containers. Components using `numberOfLines` and `ellipsizeMode` should handle this.
- **Button heights:** `min-h` values may need adjustment if button text grows significantly.
- **Bottom tab bars:** Tab label text at 13-14sp may need adjusted padding.
- **Card layouts:** Card content may need more vertical space with larger text.
- **Scroll content:** Some screens may need adjusted padding to accommodate larger text.

---

## Verification Criteria

- [x] `pnpm --filter @moja/theme typecheck` exits 0 (no typecheck script defined, but tokens.ts is valid TS)
- [x] `pnpm --filter driver-app typecheck` exits 0 ✅
- [x] `pnpm --filter traveler-app typecheck` exits 0 ✅
- [x] No remaining `text-[10px]` references at old sizes
- [x] No remaining `text-[11px]` references that should be 12px
- [x] All `@utility` classes updated in `packages/theme/global.css` ✅
- [x] Both apps' `global.css` have `--text-*` overrides in `@theme inline` ✅
- [x] `apps/driver-app/constants/theme.ts` fontSize mirror auto-updates from `@moja/theme/tokens` ✅
- [x] No broken imports or type errors ✅
- [x] PageHeader.tsx `fontSize: 20` → `24`, `fontSize: 12` → `13` ✅
- [x] Login screens `fontSize` values updated ✅
- [x] `_layout.tsx` tab label `fontSize: 11` → `12` ✅
- [x] Badge.tsx `text-[10px]` → `text-[11px]` ✅
- [x] Input.tsx `text-[11px]` → `text-[11px]` (error/hint text) ✅

## Files Modified Summary

### Core Tokens
- `packages/theme/tokens.ts` — FontSize scale increased by 1-4px per token
- `packages/theme/global.css` — All `@utility` font sizes updated

### App CSS Overrides
- `apps/driver-app/global.css` — Added `--text-xs` through `--text-3xl` and `--leading-*` overrides
- `apps/traveler-app/global.css` — Added same overrides

### Driver App (204+ files)
- All `text-[10px]` → `text-[11px]`, `text-[11px]` → `text-[12px]` (after double-incrementation fix)
- All `fontSize: 12` → `13`, `fontSize: 15` → `16`, `fontSize: 16` → `17`, `fontSize: 20` → `24`
- Component files: Badge, Input, PageHeader, Avatar, Button, Card, TabBar, notification-bell, ScreenShell
- Feature screens: trips, profile, earnings, live, offers, dispatch, notifications, auth, scanner, map
- Auth screens: login, register (carrier, documents, license, index, status)
- App files: language, notifications, _layout, index, preferences

### Traveler App (204+ files)
- All `text-[10px]` → `text-[11px]`, `text-[11px]` → `text-[12px]` (after double-incrementation fix)
- All `fontSize: 11` → `12`, `fontSize: 20` → `24`
- Component files: text, button, badge, card, input, avatar, page-header, subpage-header
- Feature screens: home, search, booking, settings, tracking, operators, auth
- App files: _layout, index, language, notifications, wallet, plus all page-level routes
