# Memory — Passenger Mobile App Build

Last updated: 2026-07-27

## What was built

**Onboarding flow + font loading + tRPC + Settings page + Tab bar:**

- **Fonts**: Loaded Montserrat (Regular, Medium, SemiBold, Bold) via `@expo-google-fonts/montserrat` in root layout
- **AsyncStorage**: Added dependency + `onboarding-storage.ts` with `hasSeenOnboarding()` and `markOnboardingSeen()`
- **Tab Bar**: Replaced custom implementation with `react-native-motion-tabs` library MotionTabBar
- **tRPC**: Established client with `httpBatchLink` + `superjson`, forwards Better Auth session via `authClient.getCookie()`
- **Settings page**: Rebuilt with finance-app-inspired design — ProfileHeader, WalletCard, TopUpButton, QuickActions, MenuSection
- **Onboarding**: Created 5 animated scenes (Splash → Ride Moja → Track Trip → Pay Securely → Welcome) adapted from onboarding-example template with Montserrat fonts and Feather icons
- **Shared UI**: Animated NextButton (arrow → "Get Started"), TopBar (back + skip), page indicator dots
- **Routing**: New `(onboarding)` route group, root index.tsx gates onboarding before auth on first launch

## Decisions made

- `@expo-google-fonts/montserrat` for font loading (cleaner than manual TTF)
- `@/assets/*` alias for image imports
- Feather icons from `@expo/vector-icons` (not `react-native-vector-icons/MaterialIcons`)
- Brand pink `#ee237c` primary color throughout
- `react-native-safe-area-context` used for safe area insets in onboarding
- Onboarding shown only before auth, first launch only (AsyncStorage flag)
- Final "Get Started" navigates to login screen
- Light mode only throughout app

## Problems solved

- Image path resolution: Changed from relative `../../assets/images/` to alias `@/assets/images/`
- Font loading: Returns `null` while loading (could add splash screen in future)
- Onboarding scene arrangement: 5-page animation matching template's 0→0.2→0.4→0.6→0.8 value progression

## Current state

- Montserrat fonts loaded at app startup
- 5 onboarding scenes with smooth Animated transitions
- AsyncStorage flag gates onboarding (first launch only)
- Tab bar, tRPC, and settings page all wired
- `turbo test` passes (all tests)
- TypeScript compiles clean

## Next session starts with

- Test the onboarding flow end-to-end: launch app → see onboarding → tap through → land on login
- Build out Home/search page
- Build out Bookings page
- Build out Tickets page

## Open questions

- Need final Moja Ride branded illustrations (currently using placeholder images from the template)

## Web deployment fix (2026-07-28)

- Root cause of Vercel build failure: `node-linker=hoisted` in `.npmrc` creates broken NTFS junctions (or symlinks on Linux) in workspace `node_modules` directories pointing to non-existent `.pnpm/store` paths. Binaries like `prisma`, `next`, `tsx` resolve through these broken junctions and fail with `MODULE_NOT_FOUND`.
- Fix: Changed scripts in `packages/db/package.json` and `apps/web/package.json` to use direct paths (`node ../../node_modules/<pkg>/dist/bin/<cmd>`) bypassing broken junctions.
- Files changed: `packages/db/package.json` (postinstall + all prisma/tsx scripts), `apps/web/package.json` (build script)
- `.npmrc` was NOT modified — kept as `node-linker=hoisted`
