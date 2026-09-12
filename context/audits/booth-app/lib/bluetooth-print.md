# Audit: bluetooth-print.ts

## 1. File
Exact source path: [`apps/booth-app/lib/bluetooth-print.ts`](file:///C:/dev/moja-buss/apps/booth-app/lib/bluetooth-print.ts)

## 2. Status
- **Audit Status**: `AUDITED`
- **Refactor Status**: `READY`
- **Verification Status**: `PENDING`

## 3. Purpose
Hardware driver providing Bluetooth ESC/POS thermal receipt printer discovery, connection, and ticket formatting for handheld and desktop thermal POS printers.

## 4. Responsibilities
- Dynamically load `react-native-thermal-receipt-printer-enhanced` with graceful fallback when native module is missing.
- Discover paired/nearby Bluetooth thermal printers (`discoverPrinters()`).
- Connect to printer via MAC address (`connectPrinter(address)`).
- Format and print structured boarding pass tickets (`printTicket(data)`).
- Provide deep link to OS Bluetooth settings (`openBluetoothSettings()`).

## 5. Dependencies
- `react-native` (`Alert`, `Linking`, `Platform`)
- `react-native-thermal-receipt-printer-enhanced` (dynamic native module require)

## 6. Consumers / Usage
- [`app/sell/confirmation.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/confirmation.tsx) (Prints physical ticket upon completed sale)
- [`app/(tabs)/bookings.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/bookings.tsx) (Ticket reprint button)

## 7. Current Implementation
- **File Length**: 134 lines.
- **Architectural Role**: Hardware peripheral driver.
- **Key Exports**: `discoverPrinters`, `connectPrinter`, `isPrinterSupported`, `printTicket`, `openBluetoothSettings`, `type TicketData`.

## 8. UI / UX Audit
- Critical physical output of the ticketing process. In West African transit, the physical paper boarding pass is the primary passenger travel document.

## 9. Design-System Audit
- Not applicable.

## 10. Theme Audit
- Not applicable.

## 11. Logic Audit
- **Dynamic Module Guard**: Lines 37-43 catch errors requiring the native library, allowing the rest of the application to run smoothly on simulators or devices without Bluetooth printers attached.
- **Receipt Layout**: Formats ticket with company name, route, departure date, seat label, localized XOF fare, and QR/terminal reference.

## 12. State Management Audit
- Module-level `BluetoothPrinter` pointer.
- **Missing Persistence**: Does not persist the selected printer MAC address in AsyncStorage, requiring reconnection if app restarts.

## 13. Async / Side-Effect Audit
- Bluetooth I/O operations are asynchronous with error catching.

## 14. Error Handling Audit
- Returns structured `{ success: boolean; error?: string }` result on print operations, allowing caller UI to display actionable retry buttons.

## 15. Offline / Synchronization Audit
- Thermal printing is completely offline capable over local Bluetooth RFCOMM serial connection.

## 16. Performance Audit
- Formats ESC/POS commands in memory; minimal latency.

## 17. Accessibility Audit
- Enables accessibility for non-digital passengers who depend on physical tickets.

## 18. Architecture Audit
- Clean hardware abstraction boundary.

## 19. Code Quality Audit
- Unused `Alert` import at line 13.
- Hardcoded French labels in ticket template (`BILLET DE TRANSPORT`, `Passager :`, etc.).

## 20. Reference Comparison
- Matches industry-standard ESC/POS thermal printer integrations for mobile Android POS devices (e.g. Sunmi, Telpo, generic Bluetooth 58mm/80mm printers).

## 21. Problems
1. [HARDCODED STRINGS] Lines 89-113 hardcode French strings rather than reading from `i18n.t()`.
2. [UNUSED IMPORT] `Alert` is imported at line 13 but never used.
3. [NO PRINTER MEMORY] The paired printer's MAC address is not saved to AsyncStorage; the cashier has no "default printer" auto-reconnect on restart.

## 22. Severity
- **Classification**: `P1`
- **Rationale**: Critical hardware path; failure to print leaves passengers without physical boarding passes.

## 23. Recommended Changes
1. Remove unused `Alert` import.
2. Localize ticket receipt labels via `i18n`.
3. Add AsyncStorage persistence for the last-connected printer MAC address to enable automatic re-connection upon startup.

## 24. Refactoring Plan
1. Keep `printTicket` contract intact.
2. Add printer auto-reconnect helper in Phase 6.

## 25. Risks
- Moderate risk: native Bluetooth drivers can behave inconsistently across budget Android hardware.

## 26. Dependencies / Blockers
- **Upstream Dependencies**: `react-native-thermal-receipt-printer-enhanced`
- **Downstream Consumers**: `sell/confirmation.tsx`, `bookings.tsx`
- **Current Blockers**: None.

## 27. Verification Checklist
- [x] TypeScript compilation passes with zero errors (`turbo typecheck`)
- [x] Biome linting and formatting check passes
- [x] Verified simulator fallback returns gracefully without crashing

## 28. Final Audit Decision
- **Decision**: `KEEP + IMPROVE`
- **Reason**: Vital hardware module; needs auto-reconnect persistence and string localization.
