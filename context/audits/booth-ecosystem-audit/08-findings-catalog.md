# Module 08: Severity-Ranked Findings Catalog

> **Audit Context**: Comprehensive Deficiency Register for the Booth Ecosystem  
> **Severity Hierarchy**:  
> - **P0 (Blocker)**: Halts core operations, causes data loss or ghost financial bookings. Fix immediately.  
> - **P1 (Critical)**: Broken core user flow, security vulnerability, or validation crash.  
> - **P2 (Major)**: Missing functional capabilities, architectural drift, or reliability flaws.  
> - **P3 (Polish)**: Visual inconsistencies, copy/i18n defects, or minor UX friction.  

---

## 1. P0 Blocker Register

| ID | Module | Title | Root Cause | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **BTH-P0-01** | Auth | **Password Login Against Disabled Server Auth** | `login.tsx` calls `authClient.signIn.email`, but `auth-server.ts:91` sets `emailAndPassword: { enabled: false }`. | Cashiers cannot log in. App is completely dead on arrival. |
| **BTH-P0-02** | Auth | **Production Origin Rejection (`mojabooth://`)** | `trusted-origins.ts:31` lists only `traveler-app://` and `driver-app://`. | Better Auth blocks all mobile requests from production booth app builds. |
| **BTH-P0-03** | IAM | **`BOOTH` Excluded from `INVITABLE_STAFF_ROLES`** | `packages/schemas/src/permissions.ts:34` omits `BOOTH`. | Operators cannot invite booth cashiers; tRPC rejects with 400 Bad Request. |
| **BTH-P0-04** | IAM | **Silent Elevation of Booth Staff to Admin** | `role-sheet.tsx:84` coerces `member.role === "BOOTH"` to `"ADMIN"`. | Saving a booth staff member in the ERP promotes them to full company Administrator. |
| **BTH-P0-05** | Sales | **Destination Terminal Empty String Aborts Sales** | `sell/[tripId].tsx:93` calls `setTerminals(terminal.id, "")`; `payment.tsx:55` early-returns on falsy destination. | Confirming a cash or Paystack sale silently does nothing. Tapping button has zero effect. |
| **BTH-P0-06** | Payments | **Paystack Ghost Bookings (Unconfirmed Sales)** | `payment.tsx:273` routes to confirmation on payment without calling `booth.confirmPaystackSale`. | Customer is charged money, but booking expires after 10m and seat is resold to someone else. |

---

## 2. P1 Critical Register

| ID | Module | Title | Root Cause | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **BTH-P1-01** | Sales | **Passenger Search Validation Crash** | `passenger.tsx:68` passes `fullName: ""` to `booth.lookupOrCreatePassenger` which requires `min(2)`. | Searching for an existing passenger by email/phone crashes with Zod validation error. |
| **BTH-P1-02** | Check-in | **Ticket QR Scanner Rejects URL Tokens** | `booth.checkInPassenger` does exact DB string match instead of using `parseTicketToken`. | Scanning passenger QR codes containing ticket URLs fails with "Ticket not found". |
| **BTH-P1-03** | Hardware | **Thermal Receipt Printer Library Not Installed** | `bluetooth-print.ts` requires `"react-native-thermal-receipt-printer-enhanced"`, which is not in `package.json`. | Printing physical receipts throws runtime exceptions and fails 100% of the time. |
| **BTH-P1-04** | Offline | **Offline Conflict Sync Uses Wrong Identifiers** | `offline-sync.ts:116` passes `holdId` instead of `boothSaleId` to `reportUrbanConflict`. | Updates 0 rows in DB; manager conflict notifications contain null staff/terminal data. |
| **BTH-P1-05** | Offline | **False Offline Status on Cellular Networks** | `use-network-status.ts:20` evaluates `!(isConnected && isInternetReachable)` when reachability is `null`. | Cashiers on 4G cellular networks are falsely locked into offline mode. |
| **BTH-P1-06** | i18n | **Catastrophic UTF-8 Mojibake in French Locale** | `locales/fr.json` was saved with corrupted multi-byte encoding. | App displays illegible corrupted text (`SǸlectionnez`, `accs`, `reu`) to French cashiers. |
| **BTH-P1-07** | Auth | **Cold Boot Network Lockout** | `app/index.tsx:44` redirects to `/(auth)/login` if `getMyProfile` fails due to bad network. | Violates fail-open policy; offline cashiers cannot use the POS when network is down. |

---

## 3. P2 Major Register

| ID | Module | Title | Root Cause | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **BTH-P2-01** | UI | **84% Component Primitive Deficit** | `booth-app` has only 5 hand-rolled components vs 32 shadcn primitives in `traveler-app`. | Substandard, non-accessible UI; missing select sheets, dialogs, and loaders. |
| **BTH-P2-02** | UI | **Missing `components.json` Configuration** | `apps/booth-app` lacks shadcn/ui configuration file. | Incompatible with monorepo design system CLI and standard component generators. |
| **BTH-P2-03** | IAM | **Missing Terminal Scoping for Staff** | `Operator` model has no `assignedTerminalId` relationship. | Cashiers can select any terminal in the country, destroying terminal-level cash accountability. |
| **BTH-P2-04** | IAM | **Admins Forbidden from Assigning Booth Role** | `ASSIGNABLE_ROLES` in `packages/schemas` omits `BOOTH` from `ADMIN` and `MANAGER`. | Field managers who hire cashiers cannot grant them the booth agent role. |
| **BTH-P2-05** | Architecture | **Monolithic Screen Layouts** | Screens in `app/sell/` contain inline API calls, validation, and rendering. | Difficult to test and maintain; violates the feature-driven architecture used in `traveler-app`. |
| **BTH-P2-06** | Hardware | **Missing Printer Pairing & Settings UI** | No printer discovery or Bluetooth management screen in `(tabs)/profile.tsx`. | Staff have no way to scan for, select, or configure their thermal receipt printer. |
| **BTH-P2-07** | Types | **Cross-Boundary TypeScript Bleed** | `tsconfig.json` paths alias `"@/*": ["./*", "../web/*"]`. | Typecheck in `booth-app` compiles web server code, breaking `pnpm typecheck`. |

---

## 4. P3 Polish Register

| ID | Module | Title | Root Cause | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **BTH-P3-01** | Copy | **Legacy "MoovMove" Branding in Locale** | `locales/en.json:59` references obsolete `MoovMove` platform name. | Confuses English-speaking passengers with obsolete company branding. |
| **BTH-P3-02** | UI | **Raw Database CUIDs Rendered in Profile** | `booth.getMyProfile` omits `companyName`, profile tab renders raw CUID string. | Ugly, unpolished display of database hashes on staff profile screen. |
| **BTH-P3-03** | UX | **Error Retry Button Reads "Something went wrong"** | `terminal-select.tsx:68` uses `t("errors.generic")` as button label. | Confusing button text that reads like an error message rather than an action. |
| **BTH-P3-04** | UI | **Touch Targets Under 48px Cockpit Minimum** | Filter chips and buttons use small padding (`py-1.5`). | Increased mis-taps during high-velocity ticket queue processing. |
| **BTH-P3-05** | i18n | **Missing Automated i18n Parity Tests** | No test suite comparing `fr.json` and `en.json` keys. | Untracked translation key divergence between English and French. |
