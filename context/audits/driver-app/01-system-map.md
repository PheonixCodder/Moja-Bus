# 01 — System Map & Inventory

This document maps the complete inventory of `apps/driver-app`, comparing its configuration and architecture against `apps/traveler-app` and the reference implementation (`app-references/duolingo-clone`).

---

## 1. Directory Structure Comparison

| Path / Feature | `apps/traveler-app` (Gold Standard) | `apps/driver-app` (Audited) | Status / Gap |
| :--- | :--- | :--- | :--- |
| **`assets/`** | `assets/images/`, `assets/logo/` (11 icons & logos) | **Missing entirely** | ❌ P0: Missing app icon, splash, adaptive icons |
| **`components/ui/`** | 32 primitives (`button`, `card`, `input`, etc.) | **Missing entirely** | ❌ P0: No reusable design system components |
| **`components.json`** | Present (shadcn / RN-reusables config) | **Missing** | ❌ P1: Primitives tooling cannot locate paths |
| **`postcss.config.mjs`**| Present (`@tailwindcss/postcss`) | **Missing** | ❌ P0: Tailwind v4 PostCSS compilation skipped |
| **`lib/utils.ts`** | `cn()` helper via `clsx` + `twMerge` | **Missing** | ❌ P1: No class merge utility for components |
| **`lib/theme.ts`** | `THEME`, `NAV_THEME` definitions | **Missing** | ❌ P2: Navigation themes unconfigured |
| **`constants/`** | `theme.ts` constants | **Missing** | ❌ P2: Missing constants module |
| **`test-archive-1/`** | None | **56.7 MB nested clone** | ❌ P0: Massive repo clone bloat |
| **`android/` build** | Ignored by `.gitignore` (CNG managed) | **111.2 MB unignored build caches** | ❌ P0: Untracked Gradle/Kotlin bloat |
| **`.gitignore`** | 43 lines (ignores node_modules, android, dist) | 6 lines (only ignores expo-env) | ❌ P0: Root cause of directory bloat |

---

## 2. Route Map & Screen Inventory

```
apps/driver-app/app/
├── _layout.tsx                 # Root layout (Missing ThemeProvider, PortalHost)
├── index.tsx                   # Cold boot gate (raw fetch, ActivityIndicator)
├── notifications.tsx           # Push notifications log
│
├── (auth)/
│   ├── login.tsx               # Phone OTP login (space-y-*, raw touchables, unstyled)
│   ├── preferences.tsx         # Post-verification service mode gate
│   └── register/               # Onboarding wizard (raw unstyled forms)
│       ├── index.tsx           # Step 1: Personal info & selfie camera
│       ├── carrier.tsx         # Step 2: Carrier selection
│       ├── documents.tsx       # Step 3: Identity & medical uploads
│       ├── license.tsx         # Step 4: License category & photo upload
│       └── status.tsx          # Step 5: Pending verification status
│
├── (tabs)/
│   ├── _layout.tsx             # 6-tab bottom bar (cramped, default TabBar, 10px labels)
│   ├── trips.tsx               # My Trips & assignment feeds
│   ├── offers.tsx              # Job offer board & counter-offer modal
│   ├── live.tsx                # Live trip HUD & telemetry tracker
│   ├── scanner.tsx             # Passenger QR scanner & offline queue
│   ├── earnings.tsx            # Shift ledger & weekly payouts
│   └── profile.tsx             # Driver passport & document manager
│
└── trip/[id]/
    └── manifest.tsx            # Passenger manifest modal
```

---

## 3. Dependency Inventory Comparison

```json
// apps/driver-app/package.json Gaps:
{
  "dependencies": {
    "nativewind": "preview",
    "tailwindcss": "4.1.11", // ⚠️ Misaligned from monorepo "^4"
    "lucide-react-native": "^1.21.0" // ⚠️ Traveler app uses @hugeicons
  },
  "devDependencies": {
    // ❌ Missing: "@tailwindcss/postcss": "^4"
    // ❌ Missing: "prettier", "prettier-plugin-tailwindcss"
  }
}
```

---

## 4. App Config Comparison (`app.json`)

```json
// Comparison:
{
  "expo": {
    "icon": "./assets/images/icon.png",             // ✅ Traveler | ❌ Driver: Missing
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png", // ✅ Traveler | ❌ Driver: Missing
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/images/favicon.png"      // ✅ Traveler | ❌ Driver: Missing
    },
    "plugins": [
      [
        "expo-splash-screen",                       // ✅ Traveler | ❌ Driver: Missing
        {
          "image": "./assets/images/splash.png",
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "imageWidth": 320
        }
      ]
    ]
  }
}
```
