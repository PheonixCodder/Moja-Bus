# Graph Report - driver-app  (2026-08-30)

## Corpus Check
- 104 files · ~36,290 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 655 nodes · 1044 edges · 87 communities (24 shown, 63 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d5f0ce25`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- haptics.ts
- expo
- profile-view.tsx
- telemetry.ts
- devDependencies
- constants/theme.ts
- live-view.tsx
- en/manifest.json
- offers-view.tsx
- app/_layout.tsx
- compilerOptions
- fr/manifest.json
- Driver App — Context Overview
- dependencies
- auth-client.ts
- screens/login.tsx
- trpc.tsx
- urgent-dispatch-gate.tsx
- metro.config.js
- eas-build-pre-install.cjs
- i18n-parity.test.ts
- auth-field.tsx
- @better-auth/expo
- class-variance-authority
- clsx
- expo
- expo-camera
- expo-clipboard
- expo-constants
- expo-dev-client
- expo-device
- expo-file-system
- @expo-google-fonts/montserrat
- expo-haptics
- expo-image-manipulator
- expo-image-picker
- expo-linear-gradient
- expo-linking
- expo-localization
- expo-location
- @expo/metro-runtime
- expo-network
- expo-router
- expo-splash-screen
- expo-status-bar
- expo-system-ui
- expo-task-manager
- @expo/vector-icons
- @hugeicons/core-free-icons
- @hugeicons/react-native
- i18next
- lucide-react-native
- @moja/schemas
- @moja/shared
- @moja/theme
- @moja/types
- nativewind
- nativewind-env.d.ts
- @novu/react-native
- expo-notifications
- posthog-react-native
- react
- react-dom
- react-i18next
- react-native
- @react-native-async-storage/async-storage
- @react-native-community/datetimepicker
- react-native-css
- react-native-otp-entry
- react-native-qrcode-svg
- react-native-safe-area-context
- react-native-screens
- react-native-svg
- react-native-toast-message
- react-native-web
- rn-international-phone-number
- @rnmapbox/maps
- superjson
- tailwindcss
- @tanstack/react-query
- @trpc/client
- @trpc/tanstack-react-query
- zustand
- { useSession, signUp, signOut }

## God Nodes (most connected - your core abstractions)
1. `DriverFeedback` - 24 edges
2. `expo-router` - 23 edges
3. `Button()` - 19 edges
4. `colors` - 18 edges
5. `expo` - 16 edges
6. `Card()` - 14 edges
7. `permissions` - 12 edges
8. `authClient` - 11 edges
9. `useDriverRegistrationStore` - 11 edges
10. `compilerOptions` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Button()` --calls--> `cn()`  [EXTRACTED]
  components/ui/Button.tsx → lib/utils.ts
- `Input()` --calls--> `cn()`  [EXTRACTED]
  components/ui/Input.tsx → lib/utils.ts
- `LiveView()` --calls--> `setTelemetryAuthToken()`  [EXTRACTED]
  features/live/screens/live-view.tsx → lib/telemetry.ts
- `LiveView()` --calls--> `stopBackgroundLocationTracking()`  [EXTRACTED]
  features/live/screens/live-view.tsx → lib/telemetry.ts
- `RegisterStep4CarrierScreen()` --calls--> `useWizardGuard()`  [EXTRACTED]
  app/(auth)/register/carrier.tsx → hooks/use-wizard-guard.ts

## Import Cycles
- None detected.

## Communities (87 total, 63 thin omitted)

### Community 0 - "haptics.ts"
Cohesion: 0.07
Nodes (47): EMPLOYMENT_OPTIONS, EmploymentType, styles, EMPLOYMENT_TYPE_KEYS, RegisterStep4CarrierScreen(), styles, RegisterStep3DocumentsScreen(), styles (+39 more)

### Community 1 - "expo"
Cohesion: 0.04
Nodes (48): backgroundColor, foregroundImage, adaptiveIcon, package, permissions, projectId, typedRoutes, expo (+40 more)

### Community 2 - "profile-view.tsx"
Cohesion: 0.07
Nodes (30): Badge(), BadgeProps, Card(), CardProps, EarningsView(), styles, LiveLocationData, SpeedometerGauge() (+22 more)

### Community 3 - "telemetry.ts"
Cohesion: 0.09
Nodes (34): TripsView(), activeTelemetryHealth, connectTelemetrySocket(), chunkQueue(), FLUSH_SWEEP_INTERVAL_MS, HARSH_BRAKE_MAX_WINDOW_SEC, HARSH_BRAKE_MIN_DECEL_MS2, HARSH_BRAKE_MIN_DROP_KMH (+26 more)

### Community 4 - "devDependencies"
Cohesion: 0.06
Nodes (35): @babel/core, babel-plugin-module-resolver, babel-preset-expo, @biomejs/biome, @moja/typescript, devDependencies, @babel/core, babel-plugin-module-resolver (+27 more)

### Community 5 - "constants/theme.ts"
Cohesion: 0.09
Nodes (24): styles, TabConfig, TABS, { width: SCREEN_WIDTH }, colors, fontFamily, fontSize, fontWeight (+16 more)

### Community 6 - "live-view.tsx"
Cohesion: 0.10
Nodes (22): DELAY_REASONS, DelayModal(), DelayModalProps, styles, LiveView(), styles, DriverNavigationMap(), DriverNavigationMapProps (+14 more)

### Community 7 - "en/manifest.json"
Cohesion: 0.09
Nodes (24): LANGUAGES, LanguageScreen(), styles, getCurrentLanguage(), SupportedLocale, switchLanguage(), USER_LOCALE_STORAGE_KEY, boarded (+16 more)

### Community 8 - "offers-view.tsx"
Cohesion: 0.10
Nodes (19): NotificationBell(), NotificationTokenResponse, PublicRouter, TrpcQuery, TypedTRPC, CounterSheet(), CounterSheetProps, styles (+11 more)

### Community 9 - "app/_layout.tsx"
Cohesion: 0.11
Nodes (19): plugins, NotificationHandler(), setup(), NotificationTokenResponse, PublicRouter, PushTokenRegistrar(), RootLayout(), TrpcQuery (+11 more)

### Community 10 - "compilerOptions"
Cohesion: 0.09
Nodes (21): expo-env.d.ts, .expo/types/**/*.ts, @moja/typescript/react-native.json, nativewind-env.d.ts, node_modules, **/*.ts, **/*.tsx, compilerOptions (+13 more)

### Community 11 - "fr/manifest.json"
Cohesion: 0.11
Nodes (17): boarded, boardedCount, callPassenger, emptyNone, emptySearch, emptyTitle, loading, manifest (+9 more)

### Community 12 - "Driver App — Context Overview"
Cohesion: 0.12
Nodes (14): Context Loading Order, Driver App Agent Rules (apps/driver-app), Key Rules, 1. Route Structure (Expo Router), 2. Feature Structure, 3. Key Libraries & Patterns, 4. GPS Telemetry Ingest, 5. Document Onboarding (Registration Wizard) (+6 more)

### Community 13 - "dependencies"
Cohesion: 0.12
Nodes (17): better-auth, @expo/dom-webview, expo-font, expo-secure-store, expo-web-browser, dependencies, better-auth, @expo/dom-webview (+9 more)

### Community 14 - "auth-client.ts"
Cohesion: 0.17
Nodes (12): AuthState, fetchDriverStatus(), IndexScreen(), checkAuth(), TabLayout(), usePendingOffersCount(), TabBar(), authClient (+4 more)

### Community 15 - "screens/login.tsx"
Cohesion: 0.17
Nodes (9): AuthButton(), AuthButtonProps, styles, AuthStep, buildE164(), LoginView(), animateForward(), handleSendOtp() (+1 more)

### Community 16 - "trpc.tsx"
Cohesion: 0.28
Nodes (12): ensureAuthCookiesFresh(), getAuthCookieHeader(), getExpoOriginHeader(), syncAuthCookiesFromResponse(), AuthSessionKeepAlive(), baseURL, buildAuthHeaders(), fetchWithAuth() (+4 more)

### Community 17 - "urgent-dispatch-gate.tsx"
Cohesion: 0.31
Nodes (7): UrgentDispatchGate(), UrgentResponse, formatDeparture(), styles, UrgentDispatchModal(), UrgentDispatchModalProps, UrgentDispatchPayload

### Community 18 - "metro.config.js"
Cohesion: 0.29
Nodes (6): config, cssConfig, { getDefaultConfig }, path, reactNativeIndexPath, { withNativeWind }

### Community 19 - "eas-build-pre-install.cjs"
Cohesion: 0.29
Nodes (4): fs, npmrcPath, path, workspaceYaml

### Community 20 - "i18n-parity.test.ts"
Cohesion: 0.50
Nodes (3): keyPaths(), localesDir, readKeys()

## Knowledge Gaps
- **323 isolated node(s):** `localesDir`, `FakeResult`, `RESULT`, `name`, `slug` (+318 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `expo-router` connect `haptics.ts` to `profile-view.tsx`, `constants/theme.ts`, `live-view.tsx`, `offers-view.tsx`, `app/_layout.tsx`, `auth-client.ts`, `screens/login.tsx`, `urgent-dispatch-gate.tsx`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `plugins` connect `app/_layout.tsx` to `haptics.ts`, `expo`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `expo` connect `expo` to `app/_layout.tsx`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **What connects `localesDir`, `FakeResult`, `RESULT` to the rest of the system?**
  _323 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `haptics.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0741687979539642 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._
- **Should `profile-view.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06859903381642513 - nodes in this community are weakly interconnected._