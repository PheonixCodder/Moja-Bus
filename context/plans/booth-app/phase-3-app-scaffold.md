# Phase 3 — App Scaffold

> **Status**: ✅ Complete  
> **Depends on**: Phase 1 (schema ready), Phase 2 (router exists)  
> **Blocks**: Phases 4–8  
> **Completed**: 2026-09-07 — app compiles, typecheck and lint pass, EAS project linked

---

## Objective

Create the complete `apps/booth-app/` directory structure, all configuration files, and register the app in the monorepo workspace and Turborepo pipeline. No feature code yet — just the shell that compiles.

---

## 3.1 — Workspace Registration

### `pnpm-workspace.yaml`

Add `apps/booth-app` to the packages list:
```yaml
packages:
  - apps/web
  - apps/traveler-app
  - apps/driver-app
  - apps/booth-app   # ← ADD
  - packages/*
```

### `turbo.json`

No changes needed — all apps are covered by the glob `apps/*` pattern in Turborepo tasks.

---

## 3.2 — `apps/booth-app/package.json`

```json
{
  "name": "booth-app",
  "version": "1.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --write ."
  },
  "dependencies": {
    "@expo/vector-icons": "^14.0.0",
    "@moja/auth": "workspace:*",
    "@moja/schemas": "workspace:*",
    "@moja/theme": "workspace:*",
    "@react-native-async-storage/async-storage": "^2.1.0",
    "@react-native-community/netinfo": "^11.4.1",
    "@tanstack/react-query": "^5.0.0",
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@trpc/server": "^11.0.0",
    "expo": "~56.0.0",
    "expo-camera": "~16.0.0",
    "expo-constants": "~17.0.0",
    "expo-font": "~13.0.0",
    "expo-linking": "~7.0.0",
    "expo-notifications": "~0.29.0",
    "expo-router": "~5.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-status-bar": "~2.0.0",
    "nativewind": "^4.1.23",
    "react": "18.3.1",
    "react-native": "0.76.9",
    "react-native-safe-area-context": "^4.14.0",
    "react-native-screens": "~4.4.0",
    "react-native-thermal-receipt-printer-enhanced": "^0.3.3",
    "react-native-toast-message": "^2.2.1",
    "superjson": "^2.2.1",
    "zustand": "^5.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@biomejs/biome": "^1.9.0",
    "@moja/typescript": "workspace:*",
    "@types/react": "~18.3.0",
    "tailwindcss": "^3.4.0",
    "typescript": "~5.8.0"
  }
}
```

---

## 3.3 — `apps/booth-app/app.json`

```json
{
  "expo": {
    "name": "Moja Ride Booth",
    "slug": "moja-ride-booth",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "mojabooth",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.mojaride.booth",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ee237c"
      },
      "package": "com.mojaride.booth",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "BLUETOOTH",
        "BLUETOOTH_ADMIN",
        "BLUETOOTH_CONNECT",
        "BLUETOOTH_SCAN",
        "ACCESS_FINE_LOCATION"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      [
        "expo-camera",
        { "cameraPermission": "Moja Ride Booth needs camera access to scan passenger QR tickets." }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ee237c"
        }
      ],
      [
        "expo-secure-store",
        { "configureAndroidBackup": true }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "eas": { "projectId": "FILL_IN_AFTER_EAS_INIT" }
    }
  }
}
```

---

## 3.4 — `apps/booth-app/tsconfig.json`

```json
{
  "extends": "@moja/typescript/react-native.json",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "jsx": "react-native",
    "lib": ["ES2022"],
    "target": "ES2022",
    "moduleResolution": "bundler",
    "noImplicitAny": true,
    "skipLibCheck": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.d.ts",
    "expo-env.d.ts",
    "nativewind-env.d.ts"
  ],
  "exclude": ["node_modules"]
}
```

---

## 3.5 — `apps/booth-app/babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      "nativewind/babel",
    ],
  };
};
```

---

## 3.6 — `apps/booth-app/metro.config.js`

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo support
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
```

---

## 3.7 — `apps/booth-app/global.css`

```css
@import "../../packages/theme/global.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Booth-specific base styles */
@layer base {
  * {
    @apply border-border;
  }
}
```

---

## 3.8 — `apps/booth-app/nativewind-env.d.ts`

```typescript
/// <reference types="nativewind/types" />
```

---

## 3.9 — `apps/booth-app/expo-env.d.ts`

```typescript
/// <reference types="expo/types" />

// NOTE: This file should not be edited and should be in your git ignore
```

---

## 3.10 — `apps/booth-app/.env.example`

```bash
# API — points to the same web server as other apps
EXPO_PUBLIC_API_URL=http://localhost:3000

# Better Auth
EXPO_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# App environment
EXPO_PUBLIC_ENV=development
```

---

## 3.11 — `apps/booth-app/.gitignore`

```
node_modules/
.expo/
dist/
npm-debug.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/
android/app/build/
ios/build/
.env
!.env.example
```

---

## 3.12 — `apps/booth-app/eas.json`

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 3.13 — `apps/booth-app/biome.jsonc`

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "extends": ["../../biome.json"],
  "files": {
    "ignore": ["node_modules", ".expo", "android", "ios", "dist"]
  }
}
```

---

## 3.14 — Assets Directory

Create placeholder files:
```
apps/booth-app/assets/
├── images/
│   ├── icon.png              (copy from traveler-app or driver-app, update later)
│   ├── adaptive-icon.png
│   ├── splash-icon.png
│   ├── favicon.png
│   └── notification-icon.png
└── fonts/
    (empty — fonts loaded via expo-font from @moja/theme)
```

---

## 3.15 — Locales Setup

**This is scaffolded for both French and English now.  
French strings are populated. English keys exist but values are empty — to be filled immediately after app ships.**

```
apps/booth-app/locales/
├── fr.json    ← Fully populated (French is the primary language)
└── en.json    ← Keys defined, values left as empty strings for now
```

**`apps/booth-app/locales/fr.json`** (all keys for v1):
```json
{
  "auth": {
    "login": {
      "title": "Connexion Agent de Guichet",
      "subtitle": "Moja Ride Guichet",
      "emailLabel": "Adresse e-mail",
      "passwordLabel": "Mot de passe",
      "submitButton": "Se connecter",
      "errorInvalid": "E-mail ou mot de passe incorrect",
      "errorNoAccess": "Vous n'avez pas accès au guichet. Contactez votre administrateur."
    }
  },
  "terminalSelect": {
    "title": "Choisir votre terminal",
    "subtitle": "Sélectionnez le terminal depuis lequel vous travaillez aujourd'hui",
    "switchTitle": "Changer de terminal",
    "switchWarning": "Changer de terminal effacera votre réserve de sièges hors ligne. Continuer ?",
    "switchConfirm": "Changer",
    "switchCancel": "Annuler"
  },
  "sell": {
    "tabLabel": "Vente",
    "title": "Voyages du jour",
    "noTrips": "Aucun voyage au départ de ce terminal aujourd'hui",
    "searchPlaceholder": "Rechercher une destination...",
    "availableSeats": "{{count}} siège(s) disponible(s)",
    "selectSeat": "Choisir un siège",
    "nextAvailable": "Prochain siège disponible",
    "offlineBanner": "HORS LIGNE — {{count}} siège(s) en réserve",
    "offlineExpired": "Réserve expirée — reconnectez-vous pour continuer"
  },
  "passenger": {
    "title": "Passager",
    "searchLabel": "Chercher par e-mail ou téléphone",
    "searchPlaceholder": "email@exemple.com ou +225...",
    "newPassenger": "Nouveau passager",
    "fullNameLabel": "Nom complet",
    "emailLabel": "Adresse e-mail",
    "phoneLabel": "Téléphone (optionnel)",
    "existingFound": "Compte trouvé",
    "createButton": "Créer le compte",
    "selectButton": "Sélectionner"
  },
  "payment": {
    "title": "Paiement",
    "methodCash": "Espèces",
    "methodPaystack": "Paiement mobile (QR)",
    "cashAmount": "Montant reçu",
    "cashConfirm": "Confirmer la réception",
    "qrTitle": "Montrez ce QR au passager",
    "qrInstruction": "Le passager scanne avec son téléphone et paye",
    "qrTimeout": "Expiration dans",
    "qrWaiting": "En attente du paiement...",
    "qrPaid": "Paiement reçu !",
    "qrExpired": "Délai expiré — recommencer",
    "qrFailed": "Paiement échoué"
  },
  "confirmation": {
    "title": "Billet confirmé !",
    "ticketSent": "Billet envoyé à {{email}}",
    "newAccountCreated": "Compte Moja Ride créé pour {{email}}",
    "printButton": "Imprimer (Bluetooth)",
    "shareButton": "Partager le billet",
    "sellAnother": "Nouvelle vente"
  },
  "checkin": {
    "tabLabel": "Enregistrement",
    "title": "Scanner le QR",
    "instruction": "Pointez la caméra sur le QR ticket du passager",
    "success": "Enregistré !",
    "errorNotFound": "Billet introuvable",
    "errorUsed": "Billet déjà utilisé",
    "errorWrongTerminal": "Ce billet n'est pas pour ce terminal",
    "errorStatus": "Statut invalide : {{status}}"
  },
  "bookings": {
    "tabLabel": "Réservations",
    "title": "Ventes d'aujourd'hui",
    "filterAll": "Toutes",
    "filterCash": "Espèces",
    "filterPaystack": "Mobile",
    "noBookings": "Aucune vente aujourd'hui"
  },
  "reconcile": {
    "title": "Récapitulatif du jour",
    "totalSales": "Total des ventes",
    "cashTotal": "Total espèces",
    "paystackTotal": "Total mobile",
    "grandTotal": "Total général",
    "offlineSales": "Ventes hors ligne",
    "walkUps": "Passagers au comptoir",
    "shareButton": "Exporter / Partager",
    "shareTitle": "Récapitulatif Guichet — {{date}}"
  },
  "profile": {
    "tabLabel": "Profil",
    "currentTerminal": "Terminal actuel",
    "switchTerminal": "Changer de terminal",
    "language": "Langue",
    "logout": "Déconnexion",
    "logoutConfirm": "Êtes-vous sûr de vouloir vous déconnecter ?"
  },
  "offline": {
    "conflictBanner": "{{count}} réservation(s) en conflit — votre responsable a été notifié"
  },
  "errors": {
    "network": "Erreur réseau. Vérifiez votre connexion.",
    "generic": "Une erreur est survenue. Réessayez.",
    "sessionExpired": "Session expirée. Veuillez vous reconnecter."
  }
}
```

**`apps/booth-app/locales/en.json`** (keys only — to be filled post-launch):
```json
{
  "auth": { "login": { "title": "", "subtitle": "", "emailLabel": "", "passwordLabel": "", "submitButton": "", "errorInvalid": "", "errorNoAccess": "" } },
  "terminalSelect": { "title": "", "subtitle": "", "switchTitle": "", "switchWarning": "", "switchConfirm": "", "switchCancel": "" },
  "sell": { "tabLabel": "", "title": "", "noTrips": "", "searchPlaceholder": "", "availableSeats": "", "selectSeat": "", "nextAvailable": "", "offlineBanner": "", "offlineExpired": "" },
  "passenger": { "title": "", "searchLabel": "", "searchPlaceholder": "", "newPassenger": "", "fullNameLabel": "", "emailLabel": "", "phoneLabel": "", "existingFound": "", "createButton": "", "selectButton": "" },
  "payment": { "title": "", "methodCash": "", "methodPaystack": "", "cashAmount": "", "cashConfirm": "", "qrTitle": "", "qrInstruction": "", "qrTimeout": "", "qrWaiting": "", "qrPaid": "", "qrExpired": "", "qrFailed": "" },
  "confirmation": { "title": "", "ticketSent": "", "newAccountCreated": "", "printButton": "", "shareButton": "", "sellAnother": "" },
  "checkin": { "tabLabel": "", "title": "", "instruction": "", "success": "", "errorNotFound": "", "errorUsed": "", "errorWrongTerminal": "", "errorStatus": "" },
  "bookings": { "tabLabel": "", "title": "", "filterAll": "", "filterCash": "", "filterPaystack": "", "noBookings": "" },
  "reconcile": { "title": "", "totalSales": "", "cashTotal": "", "paystackTotal": "", "grandTotal": "", "offlineSales": "", "walkUps": "", "shareButton": "", "shareTitle": "" },
  "profile": { "tabLabel": "", "currentTerminal": "", "switchTerminal": "", "language": "", "logout": "", "logoutConfirm": "" },
  "offline": { "conflictBanner": "" },
  "errors": { "network": "", "generic": "", "sessionExpired": "" }
}
```

> **NOTE**: English translation is the FIRST thing to complete after the French version ships. Do not merge the app to production without at least a plan to fill these within the same sprint.

---

## 3.16 — `apps/booth-app/lib/i18n.ts`

```typescript
import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import fr from "@/locales/fr.json";
import en from "@/locales/en.json";

const i18n = new I18n({ fr, en });

i18n.locale = Localization.getLocales()[0]?.languageCode ?? "fr";
i18n.enableFallback = true;
i18n.defaultLocale = "fr";

export default i18n;
export const t = (key: string, options?: object) => i18n.t(key, options);
```

---

## 3.17 — Full Directory Tree to Create

```
apps/booth-app/
├── .env.example
├── .gitignore
├── AGENTS.md                          (Phase 9)
├── app.json
├── babel.config.js
├── biome.jsonc
├── eas.json
├── expo-env.d.ts
├── global.css
├── metro.config.js
├── nativewind-env.d.ts
├── package.json
├── tsconfig.json
│
├── assets/
│   ├── images/
│   │   ├── icon.png
│   │   ├── adaptive-icon.png
│   │   ├── splash-icon.png
│   │   ├── favicon.png
│   │   └── notification-icon.png
│   └── fonts/
│
├── app/                               (Phases 4–7)
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── reconcile.tsx
│   ├── terminal-select.tsx
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── verify.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── checkin.tsx
│   │   ├── bookings.tsx
│   │   └── profile.tsx
│   └── sell/
│       ├── [tripId].tsx
│       ├── passenger.tsx
│       ├── payment.tsx
│       └── confirmation.tsx
│
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── text.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── badge.tsx
│   ├── offline-banner.tsx
│   ├── seat-map.tsx
│   └── paystack-qr.tsx
│
├── constants/
│   └── theme.ts
│
├── context/                           (Phase 9)
│   ├── overview.md
│   └── ui-registry.md
│
├── features/
│   ├── auth/
│   │   ├── boot-gate.tsx
│   │   └── login-form.tsx
│   ├── sell/
│   │   ├── trip-card.tsx
│   │   ├── seat-map-view.tsx
│   │   ├── passenger-form.tsx
│   │   ├── cash-payment-view.tsx
│   │   └── paystack-qr-view.tsx
│   ├── checkin/
│   │   └── qr-scanner-view.tsx
│   ├── reconcile/
│   │   └── reconcile-view.tsx
│   └── offline/
│       ├── hold-pool-manager.ts
│       └── offline-queue-manager.ts
│
├── hooks/
│   ├── use-load-fonts.ts
│   ├── use-network-status.ts
│   ├── use-hold-pool.ts
│   └── use-push-token.ts
│
├── lib/
│   ├── auth-client.ts
│   ├── bluetooth-print.ts
│   ├── i18n.ts
│   ├── offline-sync.ts
│   └── trpc.ts
│
├── locales/
│   ├── fr.json
│   └── en.json
│
└── stores/
    ├── session.ts
    ├── hold-pool.ts
    └── offline-queue.ts
```

---

## 3.18 — Verification Checklist

```bash
# Verify pnpm recognizes the workspace
pnpm install

# Verify the app can be resolved
pnpm --filter booth-app typecheck

# Verify no peer dependency issues
pnpm --filter booth-app why react-native
```

All must pass before Phase 4.
