# Booth App — Context Overview

**App**: `apps/booth-app`  
**Framework**: React Native, Expo SDK 57, Expo Router, NativeWind (v4 preview), Tailwind CSS v4, react-native-css  
**Role**: Mobile app for booth/terminal ticket agents — QR ticket scanning, cash and mobile (Paystack) ticket sales, Bluetooth thermal receipt printing, shift reconciliation, offline pre-acquisition holds for intercity trips.

---

## 1. Route Structure (Expo Router)

```
apps/booth-app/app/
├── _layout.tsx                 # Root layout: global CSS, TRPC provider, font loading
├── index.tsx                   # Boot gate: auth → terminal-select → (tabs)
├── terminal-select.tsx         # Terminal picker (single-terminal companies auto-skip)
├── reconcile.tsx               # End-of-shift summary / reconciliation screen
│
├── (auth)/
│   └── login.tsx               # Staff login (email + password, or SSO magic link)
│
├── (tabs)/
│   ├── _layout.tsx             # Bottom tab bar (Sell / Check-in / Bookings / Profile)
│   ├── index.tsx               # Sell tab — today's trips list
│   ├── checkin.tsx             # Check-in tab — QR scanner for passenger boarding
│   ├── bookings.tsx            # Bookings tab — today's sales list, filter by payment method
│   └── profile.tsx             # Profile tab — terminal switch, language, logout
│
└── sell/
    ├── [tripId].tsx            # Trip select-seat screen (seat map)
    ├── passenger.tsx           # Passenger lookup / new passenger form
    ├── payment.tsx             # Payment method selector (cash | Paystack QR)
    └── confirmation.tsx        # Ticket confirmation (print / share / sell-another)
```

---

## 2. Feature Structure

```
apps/booth-app/
├── components/ui/               # Reusable primitives (Button, Card, Input, Badge, Text)
├── components/
│   ├── offline-banner.tsx      # Offline mode indicator with hold count
│   ├── seat-map.tsx            # Interactive seat map component
│   └── paystack-qr.tsx         # Paystack QR display with countdown timer
├── constants/
│   └── theme.ts                # Theme tokens (light mode, @moja/theme/tokens)
├── context/                    # CDD context files (overview, ui-registry)
├── hooks/
│   ├── use-load-fonts.ts       # Montserrat font preloading
│   ├── use-network-status.ts   # NetInfo wrapper (Phase 4)
│   ├── use-hold-pool.ts        # Hold pool consumption (Phase 4)
│   └── use-push-token.ts       # Expo push token (Phase 6)
├── lib/
│   ├── auth-client.ts          # Better Auth client with @better-auth/expo cookie sync
│   ├── trpc.tsx                # tRPC client + provider (httpBatchLink + superjson)
│   ├── i18n.ts                 # i18next config (fr primary, en secondary)
│   ├── haptics.ts              # Booth-specific haptic feedback
│   ├── utils.ts                # cn() utility
│   └── bluetooth-print.ts      # Bluetooth thermal printer API (Phase B6)
├── stores/
│   ├── session.ts              # Terminal selection + operator profile (persistent)
│   ├── hold-pool.ts            # Intercity offline holds
│   └── offline-queue.ts        # Urban cash sale queue
├── locales/
│   ├── fr.json                 # Fully populated French strings
│   └── en.json                 # Keys only, English values pending
└── assets/
    ├── images/                 # App icons, splash, notification icons
    └── fonts/                  # (empty — fonts loaded via expo-font)
```

---

## 3. Key Libraries & Patterns

| Library | Purpose |
| :--- | :--- |
| `expo-router` | File-based navigation, typed route params, layout nesting |
| `nativewind` (preview) | Tailwind utility classes for React Native |
| `@tanstack/react-query` | Cache + sync for tRPC queries |
| `@trpc/tanstack-react-query` | Modern tRPC React integration (createTRPCContext) |
| `@better-auth/expo` | Better Auth with expo-secure-store cookie persistence |
| `expo-camera` | QR ticket scanning (check-in tab) |
| `expo-haptics` | Haptic feedback mapped to booth workflows |
| `expo-bluetooth` | Bluetooth thermal receipt printer (planned) |
| `expo-localization` | Device language detection |
| `i18next` + `react-i18next` | Translation framework (French primary) |
| `zustand` | Session, hold-pool, offline-queue stores |
| `@moja/theme/tokens` | Canonical design tokens (Palette, Colors, FontFamily, Spacing, Radii) |

---

## 4. Boot Gate Logic

On cold boot (`app/index.tsx`), the booth app checks:
1. Is the Better Auth session valid? → If no: redirect to `/(auth)/login`.
2. Has an operator profile been loaded? → If no: fetch `booth.getMyProfile`, store in session store.
3. Is a terminal selected? → If no: redirect to `/terminal-select`.
4. Network unreachable after retry? → **Fail-open** (allow to tab shell with offline banner). Do NOT block booth staff indefinitely.

---

## 5. Offline & Hold Pool Strategy

- **Urban trips (cash only)**: Sales are queued in `offline-queue.ts` store. On reconnect, flushed to `booth.sellTicket` server-side. Server returns `hasConflict` if capacity was exceeded.
- **Intercity trips**: Pre-acquire holds via `booth.preAcquireHolds` (up to 10 seats, 90-minute TTL). Holds stored in `hold-pool.ts`. On sale completion, the hold ID is consumed. On terminal switch or disconnect, `booth.releaseHolds` cancels remaining holds.
- **Check-in (boarding)**: Works offline if the booking was created on the same device. The QR payload contains a signed booking reference that the scanner validates against local cache first, falling back to server.

---

## 6. Payment Flows

### Cash
1. Agent enters cash amount received.
2. Server creates booking with `BoothPaymentMethod.CASH`.
3. QR ticket generated and displayed.
4. Optional: print thermal receipt (Bluetooth).

### Paystack (Mobile)
1. Agent selects Paystack QR option.
2. `booth.initiatePaystackQR` returns a Paystack QR code (static or dynamic).
3. Passenger scans with Paystack mobile app and pays.
4. Polling: `booth.confirmPaystackPayment` checks status every 3s (max 30s).
5. On success: booking created, QR ticket + receipt.

---

## 7. Bluetooth Printing

- Uses `react-native-bluetooth-escpos-printer` (planned for Phase B6).
- Prints: company header, route info, seat, passenger name, fare, QR ticket, payment method, timestamp.
- Fallback: if no printer paired, the QR ticket is shared via React Native Share API.

---

## 8. Terminal & Shift Context

- A booth staff member is associated with a `Company` (operator).
- `booth.getTerminals` returns all active terminals for the company.
- If the company has only 1 terminal: auto-select, skip terminal-select screen.
- If multiple terminals: agent must select before accessing the tab shell.
- Terminal selection is persisted in `session.ts` store (survives app restart).
- Changing terminal triggers a confirmation: releases any offline holds, clears offline queue pending syncs.

---

## 9. Accessibility Notes

- 48px minimum touch targets (cockpit touch target size).
- All interactive elements have `accessibilityLabel` and `accessibilityRole`.
- Font sizes use `allowFontScaling: false` for ticket layouts (fixed-size receipts).
- Haptics provide tactile feedback for scan success/failure, payment completion.

---

## 10. Notification Routing

Push notifications are not yet integrated in v1. The booth app surfaces offline conflicts via an in-app banner (from `offline-queue.ts` store `CONFLICT` status). Future phases will add Novu push for shift summaries.
