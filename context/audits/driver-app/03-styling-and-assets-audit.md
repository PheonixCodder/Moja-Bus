# 03 — Styling, Theme & Assets Deep Dive

This document details the exact configuration differences and fixes required to bring `apps/driver-app` up to the visual and architectural parity of `apps/traveler-app` and `app-references/duolingo-clone`.

---

## 1. NativeWind & Tailwind v4 Pipeline Breakdown

### The Root Cause of "Pure Unstyled Text"
In Tailwind CSS v4 + NativeWind (`nativewind: preview` + `react-native-css`), style compilation happens through PostCSS during Metro bundling.

1. **`postcss.config.mjs` was omitted in `apps/driver-app`**:
   Metro invokes PostCSS, but without a configuration file specifying `@tailwindcss/postcss`, Tailwind v4 NEVER processes `global.css` or the classNames in `.tsx` files.
2. **Missing devDependency**:
   `apps/driver-app/package.json` lacked `@tailwindcss/postcss: ^4`.
3. **Invalid Utility Selectors**:
   NativeWind v4 does not support space utilities (`space-x-*`, `space-y-*`) because React Native's layout engine (Yoga) does not support CSS adjacent sibling selectors. All layouts must use `flex-row` / `flex-col` with `gap-*`.

---

## 2. Asset & Branding Requirements

`apps/traveler-app` contains a dedicated asset structure under `assets/images/` and `assets/logo/`:

```
apps/driver-app/assets/ (To be created)
├── images/
│   ├── icon.png                 # App launcher icon (1024x1024)
│   ├── adaptive-icon.png        # Android adaptive icon foreground (432x432)
│   ├── splash.png               # App splash screen image (1284x2778)
│   └── favicon.png              # Web favicon (32x32)
└── logo/
    ├── moja-logo.png            # Moja Ride primary wordmark
    └── moja-driver-icon.png     # Driver brand emblem
```

---

## 3. `app.json` Configuration Rectification

```json
{
  "expo": {
    "name": "Moja Driver",
    "slug": "driver-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "driver-app",
    "userInterfaceStyle": "automatic",
    "assetBundlePatterns": ["**/*"],
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#09090b"
      },
      "package": "com.mojaride.driver"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-localization",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash.png",
          "resizeMode": "contain",
          "backgroundColor": "#09090b",
          "imageWidth": 320
        }
      ],
      "expo-status-bar",
      "expo-notifications",
      ["expo-location", { "locationAlwaysAndWhenInUsePermission": "..." }],
      ["expo-camera", { "cameraPermission": "..." }],
      ["@rnmapbox/maps", { "RNMapboxMapsVersion": "11.23.1" }]
    ]
  }
}
```

---

## 4. UI Design System Parity (`components/ui/`)

To match `apps/traveler-app`, the following `@rn-primitives` components need to be ported:
- `button.tsx`
- `card.tsx`
- `input.tsx`
- `badge.tsx`
- `dialog.tsx`
- `tabs.tsx`
- `select.tsx`
- `separator.tsx`
- `text.tsx`
- `avatar.tsx`
- `alert.tsx`
- `alert-dialog.tsx`
- `progress.tsx`
- `skeleton.tsx`
- `switch.tsx`
