# Module 07: Internationalization, Hardware Printing & Branding

> **Audit Context**: Localization Quality, File Encoding, Bluetooth ESC/POS Printing & Brand Assets  
> **Target Files**: `apps/booth-app/locales/*`, `apps/booth-app/lib/bluetooth-print.ts`, `apps/booth-app/lib/i18n.ts`, `apps/booth-app/assets/*`, `apps/booth-app/package.json`  
> **Comparative Targets**: `apps/traveler-app/locales/*`, `apps/traveler-app/__tests__/i18n-parity.test.ts`, `apps/traveler-app/assets/*`  

---

## 1. Internationalization (i18n) Catastrophe (P1 Critical)

The primary operating language for public transportation in Côte d'Ivoire is **French**. However, `apps/booth-app/locales/fr.json` suffers from catastrophic UTF-8 encoding corruption (mojibake) across virtually every key in the file.

### Sample of Corrupted French Strings (`apps/booth-app/locales/fr.json`)

| Key | Corrupted String in Codebase | Intended French String | Meaning / Context |
| :--- | :--- | :--- | :--- |
| `auth.login.errorNoAccess` | `"Vous n'avez pas accs au guichet."` | `"Vous n'avez pas accès au guichet."` | Login error for non-booth staff |
| `terminalSelect.subtitle` | `"SǸlectionnez le terminal..."` | `"Sélectionnez le terminal..."` | Terminal selection header |
| `terminalSelect.switchWarning` | `"effacera votre rǸserve de siges hors ligne"` | `"effacera votre réserve de sièges hors ligne"` | Terminal switch warning |
| `sell.noTrips` | `"Aucun voyage au dǸpart de ce terminal"` | `"Aucun voyage au départ de ce terminal"` | Empty trip list state |
| `sell.availableSeats` | `"{{count}} sige(s) disponible(s)"` | `"{{count}} siège(s) disponible(s)"` | Seat count on trip card |
| `sell.offlineBanner` | `"HORS LIGNE ?" {{count}} sige(s) en rǸserve"` | `"HORS LIGNE — {{count}} siège(s) en réserve"` | Offline top bar indicator |
| `passenger.searchLabel` | `"Chercher par e-mail ou tǸlǸphone"` | `"Chercher par e-mail ou téléphone"` | Passenger search input label |
| `payment.methodCash` | `"Espces"` | `"Espèces"` | Cash payment method selector |
| `payment.cashConfirm` | `"Confirmer la rǸception"` | `"Confirmer la réception"` | Cash confirmation button |
| `payment.qrPaid` | `"Paiement reu !"` | `"Paiement reçu !"` | Payment success modal |
| `payment.qrFailed` | `"Paiement ǸchouǸ"` | `"Paiement échoué"` | Payment failure alert |

### Resulting Impact:
This corrupted text is rendered directly on physical POS screens, receipts, and passenger-facing displays. The application appears amateurish, untrustworthy, and broken to commercial transport operators and cashiers.

---

## 2. Legacy Branding & English Locale Defects

In `apps/booth-app/locales/en.json`:
```json
// line 59
"newAccountCreated": "A new MoovMove account has been created",
```
### Analysis:
- The app references **`MoovMove`**, an obsolete legacy project name. The brand is **Moja Ride**.
- In addition, `en.json` contains corrupted em-dashes across all offline and error banners:
  - `"Offline ?" {{count}} seat(s) in pool"`
  - `"Offline pool expired ?" reconnect to continue sales"`
  - `"Network error ?" check your connection"`

### Parity Testing Absence:
- `apps/traveler-app` includes an automated parity test suite (`apps/traveler-app/__tests__/i18n-parity.test.ts`) that runs on CI to ensure 100% key parity between `fr.json` and `en.json`.
- `apps/booth-app` has **zero tests**, allowing broken keys, missing translations, and encoding corruption to go unnoticed.

---

## 3. Hardware Thermal Printing (P1 Critical)

A core requirement of the booth terminal application is the ability to print physical paper tickets via Bluetooth ESC/POS thermal receipt printers (e.g., Zijiang POS-5802, Netum, Epson). 

### The Missing Native Dependency
In `apps/booth-app/lib/bluetooth-print.ts:37–43`:
```typescript
if (Platform.OS !== "web") {
  try {
    BluetoothPrinter = require("react-native-thermal-receipt-printer-enhanced");
  } catch {
    BluetoothPrinter = null;
  }
}
```

In `apps/booth-app/package.json`:
```json
"dependencies": {
  ...
  // "react-native-thermal-receipt-printer-enhanced" IS NOT INSTALLED!
}
```

### Resulting Defect:
1. `require("react-native-thermal-receipt-printer-enhanced")` **always throws a module-not-found error**.
2. `BluetoothPrinter` is permanently `null`.
3. `discoverPrinters()` always returns `[]`.
4. `connectPrinter()` always returns `false`.
5. `printTicket()` always shows an alert: `"Imprimante non disponible"`.

### Missing UI Integration:
In `apps/booth-app/app/sell/confirmation.tsx`:
- `printTicket()` is **not even imported or called**.
- There is no "Print Ticket" button on the confirmation screen! The screen only has "Share Ticket" and "Sell Another Ticket".
- In `apps/booth-app/app/(tabs)/profile.tsx`, there is no printer discovery or pairing interface. Staff cannot view, connect, or configure a Bluetooth printer.

---

## 4. Brand Asset Inventory & Deficits

Comparing `apps/booth-app/assets` with `apps/traveler-app/assets`:

| Asset File | Traveler App | Booth App | Status |
| :--- | :---: | :---: | :--- |
| `assets/logo/moja-logo.png` | Present (50 KB) | Present (50 KB) | OK |
| `assets/logo/moja-icon.png` | Present (69 KB) | Present (69 KB) | OK |
| `assets/logo/moja-icon.svg` | Present (18 KB) | **MISSING** | Missing vector asset |
| `assets/images/adaptive-icon.png` | Present (114 KB) | Present (114 KB) | OK |
| `assets/images/splash.png` | Present (197 KB) | Present (197 KB) | OK |
| Web Favicon Suite (`16x16`, `32x32`, `apple-touch-icon`, `site.webmanifest`) | Complete suite | Single generic `favicon.png` | Deficit for PWA builds |
