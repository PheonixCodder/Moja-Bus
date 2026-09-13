# Implementation Plan — Booth App Sell Tab Redesign (Counter POS Cockpit)

**Target**: `apps/booth-app/app/(tabs)/index.tsx`  
**Related Modules**: `apps/booth-app/features/sell/`, `apps/booth-app/locales/{fr,en}.json`  
**Design Foundations**: `@moja/theme`, `@rn-primitives`, `@hugeicons/react-native`, `/mobile-app-ui-design`, `/react-native`, `/react-native-architecture`  
**Date**: 2026-09-13  

---

## 1. Executive Summary & Goals

The Sell Tab in `apps/booth-app` is the high-velocity cockpit for bus station cashiers in Côte d'Ivoire selling tickets to walk-up travelers. The current interface has unparsed translation tokens (`10 {available} / {total} seats`), lacks terminal and shift context (cash drawer balance, tickets sold), provides no quick destination filters, and displays clinical, flat cards in an empty scroll view.

This redesign transforms the Sell Tab into an intentional, high-density, tactile **Point-of-Sale (POS) Cockpit** drawing direct inspiration from `apps/traveler-app` (prominent greeting + wallet/cash badge + hero cards) and `app-references/duolingo-clone` (gamified/tactile shift KPI metrics, high-contrast chips, clear visual hierarchy).

---

## 2. Component Hierarchy & Architecture

```
apps/booth-app/
├── app/(tabs)/index.tsx                     # Main Sell Screen Controller & Virtualized List
└── features/sell/
    ├── components/
    │   ├── sell-header.tsx                  # Cashier greeting + terminal badge + cash drawer balance pill
    │   ├── shift-stats-strip.tsx            # 3-metric KPI widget (Tickets Sold, Cash in Drawer, Offline Pool)
    │   ├── next-departure-card.tsx          # Spotlight Hero Card for next departure (<60m) with seat gauge
    │   ├── destination-filter-bar.tsx       # Horizontal destination chips (Tous, Départs Imminents, Cities)
    │   ├── trip-card.tsx                    # Tactile departure card with route line, bus info, and price tag
    │   └── trip-card-skeleton.tsx           # Polished skeleton loading state
    ├── hooks/
    │   └── use-sell-trips.ts                # Data aggregation, destination extraction, filtering, and sorting
    └── types.ts                             # Shared domain types for sell screen
```

---

## 3. Detailed Component Specifications

### A. `SellHeader` (`features/sell/components/sell-header.tsx`)
- **Station & Cashier Profile**:
  - Carrier / Company name + Location (`Gare Centrale Adjamé, Abidjan`).
  - Cashier Greeting: `Bonjour, [Nom] 👋`.
- **Shift Drawer Pill (Interactive)**:
  - Displays total physical cash collected in drawer today (`90 000 FCFA`).
  - Tapping triggers `BoothFeedback.selection()` and navigates to `/reconcile` (End-of-Shift reconciliation).
- **Network / Pool Status Pill**:
  - `🟢 En ligne` or `🟡 Pool: 5 sièges` with hold count badge.

### B. `ShiftStatsStrip` (`features/sell/components/shift-stats-strip.tsx`)
- 3 tactile, rounded-2xl micro cards in a row:
  1. **Billets Vendus**: Count of confirmed sales today (`booth.getDailyReconciliation` / local store).
  2. **Caisse Espèces**: Total physical cash to be reconciled.
  3. **Pool Hors-Ligne**: Active pre-acquired holds available for offline selling.

### C. `NextDepartureCard` (`features/sell/components/next-departure-card.tsx`)
- Spotlight hero card if a bus departs within the next 60 minutes:
  - High-urgency badge: `⚡ DÉPART DANS 25 MIN` (rose / amber theme).
  - Departure time (`17:00`) + Route (`Abidjan ➔ Bouaké`) + Fare (`5 000 FCFA`).
  - Bus info: `Car #1234 • Quai 3 • VIP Climatisé`.
  - **Visual Capacity Gauge**: Horizontal bar indicating occupied vs available seats (`38/45 places occupées • 7 restantes`).
  - **1-Tap "Vendre ce trajet" CTA**: Big primary tactile button routing straight to seat selection.

### D. `DestinationFilterBar` (`features/sell/components/destination-filter-bar.tsx`)
- Search input with clear button and hugeicons magnifying glass.
- Horizontal scrollable chips dynamically generated from today's trip destination cities:
  - `Tous` (with trip count badge)
  - `Départs Imminents` (filter for trips departing in $\le 60\text{ min}$)
  - Destination city names (`Bouaké`, `Yamoussoukro`, `San-Pédro`, etc.).
- Active chip: `bg-primary text-white shadow-xs`, Inactive: `bg-muted/50 text-muted-foreground`.

### E. `TripCard` (`features/sell/components/trip-card.tsx`)
- **Fixed Translation String**: Replaces broken `{available} / {total}` with localized `{{count}} places libres` or `Complet`.
- **Departure & Countdown**: Formatted time (`21:30`) + relative countdown badge (`Dans 1h 45`).
- **Route Line**: Origin terminal $\to$ Destination city/terminal with `ArrowRight01Icon`.
- **Metadata Badges**:
  - Service type (`Interurbain` / `Urbain`).
  - Bus plate (`Car #5678`) and Gate/Quai if set.
  - Price Tag: `5 000 FCFA` bold prominent badge.
- **Seat Availability Meter**:
  - Green pill ($> 10$ seats available).
  - Amber pill ($\le 5$ seats remaining, "Dernières places").
  - Red pill ($0$ seats, "Complet").
- **Card Action**: Elevated tactile card with 48px touch target and smooth haptic feedback.

---

## 4. Performance & React Native Virtualization Guards

1. **Virtualization Architecture**:
   - The top widgets (`SellHeader`, `ShiftStatsStrip`, `NextDepartureCard`, `DestinationFilterBar`) will be rendered inside `FlatList`'s `ListHeaderComponent` to ensure buttery 60 FPS scrolling with zero nested scroll view conflicts.
   - `FlatList` configured with `keyExtractor={(item) => item.id}`, `getItemLayout` for predictable offsets, `initialNumToRender={8}`, `maxToRenderPerBatch={10}`, `windowSize={5}`, and `removeClippedSubviews={Platform.OS === "android"}`.
2. **Memoization**:
   - `TripCard` wrapped in `React.memo` with strict prop comparison.
   - Handlers wrapped in `useCallback`.
3. **i18n Parity**:
   - All new translation keys added symmetrically to `locales/fr.json` and `locales/en.json`.
   - Guaranteed clean pass of `__tests__/i18n-parity.test.ts`.

---

## 5. Verification Checklist

- [ ] `pnpm --filter booth-app run test:i18n` passes with 0 key mismatches.
- [ ] `pnpm --filter booth-app typecheck` passes with 0 errors.
- [ ] No regression on trip selection navigation (`/sell/[tripId]`).
