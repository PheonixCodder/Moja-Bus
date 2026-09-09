# Booth App — UI Component Registry

Living document. Updated after every component is built or modified.

---

## Screens

| Screen | File | Notes |
| :--- | :--- | :--- |
| `IndexScreen` (Boot Gate) | `app/index.tsx` | Auth check → operator profile load → terminal check → redirect |
| `TerminalSelectScreen` | `app/terminal-select.tsx` | Terminal picker with auto-select for single-terminal companies |
| `ReconcileScreen` | `app/reconcile.tsx` | End-of-shift summary, share/export |
| `LoginScreen` | `app/(auth)/login.tsx` | Staff email + password login |
| `SellTabScreen` | `app/(tabs)/index.tsx` | Today's trips list, search by destination |
| `CheckinTabScreen` | `app/(tabs)/checkin.tsx` | QR scanner for passenger boarding |
| `BookingsTabScreen` | `app/(tabs)/bookings.tsx` | Today's sales list, filter by payment method |
| `ProfileTabScreen` | `app/(tabs)/profile.tsx` | Terminal switch, language, logout |
| `SeatMapScreen` | `app/sell/[tripId].tsx` | Interactive seat map for trip selection |
| `PassengerScreen` | `app/sell/passenger.tsx` | Passenger lookup or new passenger form |
| `PaymentScreen` | `app/sell/payment.tsx` | Cash or Paystack QR payment |
| `ConfirmationScreen` | `app/sell/confirmation.tsx` | Ticket confirmation with print/share |
| `TabsLayout` | `app/(tabs)/_layout.tsx` | Bottom tab bar (Sell / Check-in / Bookings / Profile) |

---

## Reusable UI Components

### primitives/ui/

| Component | File | Notes |
| :--- | :--- | :--- |
| `Text` | `components/ui/Text.tsx` | Typography component — `variant` prop maps to `TextStyles` (h1, h2, h3, h4, bodyLg, bodyMd, bodySm, caption) |
| `Button` | `components/ui/Button.tsx` | Variants: primary, secondary, outline, ghost, destructive, success, warning. Haptics on press. |
| `Card` | `components/ui/Card.tsx` | Variants: default, elevated, outline, highlight. Rounded-xl with padding. |
| `Input` | `components/ui/Input.tsx` | Label + TextInput + error/hint support. Focus ring = primary pink. |
| `Badge` | `components/ui/Badge.tsx` | Variants: default, success, warning, error, info, outline, brand. |

### components/ (domain)

| Component | File | Notes |
| :--- | :--- | :--- |
| `OfflineBanner` | `components/offline-banner.tsx` | Top banner when offline — shows queued sale count + conflict alert |
| `SeatMap` | `components/seat-map.tsx` | Interactive bus seat map with availability, selection, hold states |
| `PaystackQR` | `components/paystack-qr.tsx` | QR code display with countdown timer and polling status |

---

## Design Notes

- Booth app uses **light mode only** (`./app.json` sets `"userInterfaceStyle": "light"`). All theme tokens pull from `Colors.light`.
- Primary brand color: `Palette.rose[500]` (`#ee237c`).
- Font family: Montserrat (regular, medium, semibold, bold) — loaded via `@expo-google-fonts/montserrat`.
- Touch targets: minimum 44px (standard), 48px (cockpit/high-velocity).
- No bare `<div>` elements — use React Native `<View>`, `<Text>`, `<Pressable>` / `<TouchableOpacity>`.
- All interactive components must include `accessibilityLabel` and `accessibilityRole`.
