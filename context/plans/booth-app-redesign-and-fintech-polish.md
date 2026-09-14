# Implementation Plan — Booth App Redesign & Fintech Polish

## 1. Overview
Elevate the Moja Booth App (`apps/booth-app`) to banking and fintech standard (inspired by Revolut, Nubank, and Mercury). Polish the three main tabs (`(tabs)/index.tsx`, `(tabs)/bookings.tsx`, `(tabs)/profile.tsx`) and the checkout flow (`sell/payment.tsx`), introducing strict 30-minute departure cutoff sorting, mistouch-proof payment confirmation with a live change calculator, executive financial ledger cards, and grouped-inset profile architecture.

---

## 2. Agreed Definitions & Business Rules
- **Historical Date Filter**: Any trips with a `departureDate` before today's local date (`< today`) are excluded.
- **30-Minute Cutoff Rule**: Ticket sales close 30 minutes before boarding/departure ($T < \text{Now} + 30\text{ min}$).
- **Trip Sorting Order**:
  1. Bookable approaching trips today ($T \ge \text{Now} + 30\text{ min}$ and `availableSeats > 0`), sorted ascending by departure time.
  2. Departed / Closed trips ($T < \text{Now} + 30\text{ min}$ or `availableSeats === 0`), placed at the bottom with dimmed contrast and `"Départ clôturé"` badge.
- **Mistouch Prevention**: Tapping Cash or Mobile Money must never immediately commit a booking. A confirmation sheet with transaction recap and cash change calculation is required.
- **Independent Loading State**: Separate `loadingMethod: "cash" | "paystack" | null` to ensure clicking one payment option never displays a spinner on the other.

---

## 3. Step-by-Step Implementation

### Step 1: Translations & i18n Cleansing
- Add missing keys in `apps/booth-app/locales/fr.json` and `apps/booth-app/locales/en.json`:
  - `reconcile.subtitle`: "Rapport de caisse et clôture de shift"
  - `profile.printer`: "Imprimante thermique"
  - `sell.closedDeparture`: "Départ clôturé"
  - `sell.approachingDepartures`: "Départs ouverts"
  - `sell.pastDepartures`: "Départs passés"
  - `payment.confirmCashTitle`: "Confirmer le règlement en espèces"
  - `payment.cashTendered`: "Montant reçu"
  - `payment.changeToReturn`: "Monnaie à rendre"
  - `payment.confirmPaystackTitle`: "Initier le paiement mobile"
  - `payment.confirmPaystackDesc`: "Générer le QR code et le lien de paiement Paystack pour le passager."

### Step 2: Trips List & 30-Minute Cutoff (`(tabs)/index.tsx` & `useSellTrips.ts`)
- In `apps/booth-app/features/sell/hooks/use-sell-trips.ts`:
  - Filter out trips where `format(departureDate, 'yyyy-MM-dd') < todayDateISO`.
  - Classify trips: `isClosed = diffMinutes < 30 || trip.availableSeats === 0`.
  - Sort: active bookable trips first (by ascending departure time), closed trips last.
- In `apps/booth-app/features/sell/components/trip-card.tsx`:
  - Visually distinguish closed trips with a clean muted badge `"Clôturé"` and disabled action.

### Step 3: Mistouch-Proof Payment & Change Calculator (`sell/payment.tsx`)
- Split loading state: `loadingMethod: 'cash' | 'paystack' | null`.
- Cash confirmation modal/bottom sheet:
  - Fare recap (`priceXOF`).
  - Quick cash presets (`+5 000`, `+10 000`, `+20 000` XOF) or custom input.
  - Real-time change calculator: $\text{Change} = \text{Tendered} - \text{Price}$.
  - Primary button: "Confirmer l'encaissement (X OF)" with haptics.
- Paystack modal confirmation prompt before locking seat and opening QR view.

### Step 4: Bookings Tab Financial Ledger (`(tabs)/bookings.tsx`)
- Localize header date: `"Aujourd'hui, 13 sept. 2026 · [Terminal]"`.
- Executive KPI cards:
  - Total Cash Revenue (`XX XXX XOF`) with sales count.
  - Total Mobile Revenue (`XX XXX XOF`) with sales count.
- Modern segmented pill switcher (`Tous`, `Espèces`, `Mobile`).
- Fintech transaction rows:
  - Left: Passenger avatar/initials.
  - Center: Passenger name, booking reference (monospace `MJ-XXXXXX`), destination, time.
  - Right: Formatted amount (`+500 XOF`), green dot for cash, indigo dot for mobile.

### Step 5: Inset Grouped Profile Architecture (`(tabs)/profile.tsx`)
- Operator identity banner:
  - Avatar, full name, email, `BOOTH` role badge, company chip, live green status dot.
- Inset cards grouped by domain:
  - **Caisse**: Terminal assignment (with "Changer"), Daily reconciliation shortcut.
  - **Périphériques**: Bluetooth thermal printer with status pill (Connectée/Déconnectée) and quick test print.
  - **Préférences**: Segmented language selector (FR / EN).
  - **Session**: Refined destructive logout row inside an inset card.

### Step 6: Verification & Parity
- Run `pnpm --filter booth-app typecheck` (0 errors).
- Run `pnpm --filter booth-app test:i18n` (100% parity).
- Update `memory.md`.
