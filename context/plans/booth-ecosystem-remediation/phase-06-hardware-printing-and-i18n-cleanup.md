# Phase 06: Hardware Thermal Printing, i18n Cleansing & Release Gates

> **Phase Focus**: Implement Bluetooth ESC/POS Thermal Printing, Cleanse French UTF-8 Mojibake, Add i18n CI Parity Tests, and Final Release Probes  
> **Defects Resolved**: `BTH-P1-03`, `BTH-P1-06`, `BTH-P2-06`, `BTH-P2-07`, `BTH-P3-01`, `BTH-P3-02`, `BTH-P3-03`, `BTH-P3-05`  

---

## 1. Problem Definition & Root Causes

1. **Uninstalled Thermal Printer Library (`BTH-P1-03`)**: `bluetooth-print.ts` requires `"react-native-thermal-receipt-printer-enhanced"`, which is not declared in `package.json`. Thermal printing fails 100% of the time.
2. **Missing Printer Pairing Interface (`BTH-P2-06`)**: No screen exists for scanning, pairing, or testing Bluetooth printers.
3. **Severe French Mojibake (`BTH-P1-06`)**: `locales/fr.json` contains corrupted multi-byte characters (`SǸlectionnez`, `accs`, `reu`) throughout the entire file.
4. **Legacy "MoovMove" Branding (`BTH-P3-01`)**: `locales/en.json:59` references the obsolete platform name `"MoovMove"`.
5. **Cross-Boundary TypeScript Leak (`BTH-P2-07`)**: `tsconfig.json` aliases `"@/*": ["./*", "../web/*"]`, pulling web server compiler errors into mobile typechecks.

---

## 2. Implementation Specifications

### Step 1: Install Bluetooth ESC/POS Thermal Printer Library
File: `apps/booth-app/package.json`
- Install an active Bluetooth ESC/POS thermal printer package (e.g. `react-native-esc-pos-printer` or `react-native-bluetooth-escpos-printer`).
- Update `app.json` with required Android Bluetooth permissions:
  ```json
  "permissions": [
    "BLUETOOTH",
    "BLUETOOTH_ADMIN",
    "BLUETOOTH_CONNECT",
    "BLUETOOTH_SCAN",
    "ACCESS_FINE_LOCATION"
  ]
  ```

### Step 2: Implement Bluetooth Printer Settings Screen
File: `apps/booth-app/features/terminal/screens/printer-settings-sheet.tsx`
- Surface in `(tabs)/profile.tsx` under "Périphériques & Imprimante".
- Features:
  1. "Rechercher des imprimantes" (Scan for nearby Bluetooth devices).
  2. Paired devices list showing MAC address and device name.
  3. "Connecter" (Connect) with persistent storage of selected printer in `sessionStore`.
  4. "Imprimer un ticket test" (Print test ticket) to verify paper feed, font width, and alignment.

### Step 3: Wire Print Action into Confirmation Screen
File: `apps/booth-app/app/sell/confirmation.tsx`
- Add primary button: "Imprimer le billet" (Print Ticket).
- Add secondary switch: "Impression automatique" (Auto-print upon payment confirmation).
- Formats ESC/POS receipt layout:
  - Header: Operator name, tax ID (NCC/IFU), origin terminal.
  - Body: Passenger name, booking reference (`MJ-XXXX`), route, departure time, seat number.
  - Barcode / QR code: Scannable 2D QR containing the ticket token.
  - Footer: Receipt issuance timestamp and Moja Ride legal notice.

### Step 4: Cleanse French Locale File
File: `apps/booth-app/locales/fr.json`
- Rewrite the entire file in pristine UTF-8 French.
- Replace all corrupted strings:
  - `"SǸlectionnez"` → `"Sélectionnez"`
  - `"rǸserve expirǸe"` → `"réserve expirée"`
  - `"siges"` → `"sièges"`
  - `"accs"` → `"accès"`
  - `"tǸlǸphone"` → `"téléphone"`
  - `"Espces"` → `"Espèces"`
  - `"Paiement reu !"` → `"Paiement reçu !"`
  - `"Paiement ǸchouǸ"` → `"Paiement échoué"`
  - Fix all corrupted em-dashes (`?` → `—`).

### Step 5: Cleanse English Locale & Remove "MoovMove"
File: `apps/booth-app/locales/en.json`
- Line 59: Replace `"A new MoovMove account has been created"` with `"A new Moja Ride account has been created"`.
- Replace all corrupted em-dashes with standard `—`.

### Step 6: Create Automated i18n Parity Test Suite
File: `apps/booth-app/__tests__/i18n-parity.test.ts`
```typescript
import assert from "node:assert/strict";
import test from "node:test";
import en from "../locales/en.json";
import fr from "../locales/fr.json";

function getKeys(obj: Record<string, any>, prefix = ""): string[] {
  return Object.keys(obj).flatMap((key) => {
    const val = obj[key];
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    return typeof val === "object" && val !== null
      ? getKeys(val, newPrefix)
      : [newPrefix];
  });
}

test("i18n key parity between en and fr", () => {
  const enKeys = new Set(getKeys(en));
  const frKeys = new Set(getKeys(fr));

  const missingInFr = [...enKeys].filter((k) => !frKeys.has(k));
  const missingInEn = [...frKeys].filter((k) => !enKeys.has(k));

  assert.equal(
    missingInFr.length,
    0,
    `Keys missing in fr.json: ${missingInFr.join(", ")}`,
  );
  assert.equal(
    missingInEn.length,
    0,
    `Keys missing in en.json: ${missingInEn.join(", ")}`,
  );
});

test("fr.json contains zero corrupted mojibake characters", () => {
  const rawFr = JSON.stringify(fr);
  assert.equal(rawFr.includes(""), false, "fr.json contains  character");
  assert.equal(rawFr.includes("Ǹ"), false, "fr.json contains Ǹ character");
});
```

### Step 7: Isolate TypeScript Paths
File: `apps/booth-app/tsconfig.json`
```diff
  "paths": {
-   "@/*": ["./*", "../web/*"]
+   "@/*": ["./*"]
  },
```

---

## 3. Pre-Release Quality Gates (Probes A–G)

| Probe | Target Workflow | Success Criterion |
| :--- | :--- | :--- |
| **Probe A** | Auth Lifecycle | Staff logs in via Phone OTP; token persists across force-quit; fails open offline. |
| **Probe B** | Operator ERP Invite | Operator invites cashier as `BOOTH`; invite email arrives; role sheet retains `BOOTH`. |
| **Probe C** | Cash POS Sale | Cashier selects trip → picks seat → creates passenger → confirms cash sale → prints receipt. |
| **Probe D** | Paystack QR Flow | Customer scans QR → pays → `confirmPaystackSale` fires → booking confirmed in DB. |
| **Probe E** | Offline Hold Sync | Airplane mode → cashier sells from hold pool → reconnects → flushes with zero data loss. |
| **Probe F** | Gate QR Check-in | Scanner scans traveler app QR (URL token) → passenger stamped checked-in. |
| **Probe G** | i18n & Typecheck | `pnpm --filter booth-app typecheck` exits 0; `i18n-parity.test.ts` passes 100%. |
