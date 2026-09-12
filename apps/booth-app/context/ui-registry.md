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
| `Text` | `components/ui/text.tsx` | Typography component bound to TextClassContext with font-sans & font-heading |
| `Button` | `components/ui/button.tsx` | 48px min touch target, built-in haptics on press, spinner, variants (default, secondary, outline, ghost, destructive, success, warning) |
| `Card` | `components/ui/card.tsx` | Variants: default, elevated, muted. Pressable support with built-in haptics and elevation shadows |
| `Input` | `components/ui/input.tsx` | 48px touch target, left/right icon slots, clear button support, focus styling |
| `Badge` | `components/ui/badge.tsx` | First-class domain variants: default, secondary, destructive, outline, intercity, urban, cash, offline |
| `Skeleton` | `components/ui/skeleton.tsx` | 60fps native-driver animated pulsing placeholder for loading states |

### components/ (domain)

| Component | File | Notes |
| :--- | :--- | :--- |
| `OfflineBanner` | `components/offline-banner.tsx` | Top banner when offline — shows queued sale count, live sync spinner, conflict alert |
| `SeatMap` | `components/seat-map.tsx` | Bus cockpit cap, tactile seat buttons (48px targets), availability, selection, hold, and driver seat states |
| `PaystackQR` | `components/paystack-qr.tsx` | Elevated card container with QR display, live countdown timer, link copy, and polling status |

---

## Design Notes

- Booth app uses **light mode only** (`./app.json` sets `"userInterfaceStyle": "light"`). All theme tokens pull from `Colors.light` and `@moja/theme`.
- Primary brand color: `Palette.rose[500]` (`#ee237c`).
- Font family: Outfit (heading) & Raleway (body) — loaded via `@expo-google-fonts/outfit` and `@expo-google-fonts/raleway`.
- Touch targets: minimum 48px standard for booth cashier fast-paced operation.
- No bare `<div>` elements — use React Native `<View>`, `<Text>`, `<Pressable>`.
- All interactive components must include `accessibilityLabel` and `accessibilityRole`.
