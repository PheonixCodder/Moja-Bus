# Phase 9 — Context, Docs & Post-Launch

> **Status**: ⬜ Not started  
> **Depends on**: All previous phases (done after the app is built)  
> **Blocks**: Nothing — do this last

---

## Objective

Write the booth app's context files, AGENTS.md, and ui-registry. Update the monorepo progress tracker. Document all post-launch items with clear owners and timelines.

---

## 9.1 — `apps/booth-app/AGENTS.md`

```markdown
<!-- BEGIN:context-rules -->
# Context & Workspace Rules (Booth App)

This app follows the same CDD rules as the rest of the monorepo. See the root [AGENTS.md](../../AGENTS.md) for global rules.

## Booth App Specific Rules

1. **Scope**: This app is ONLY for operator booth agents at physical terminals.
   - Do NOT add ERP features (fleet, routes, schedules, company settings, financials).
   - Do NOT add passenger self-service features.
   - If you're unsure whether a feature belongs here, read `context/plans/booth-app/README.md`.

2. **tRPC**: All server calls use the `booth.*` router via `boothProcedure`.
   - NEVER call `operatorProcedure` or `adminProcedure` routes from this app.
   - If you need a new server feature, add it to `apps/web/trpc/routers/booth.ts`.

3. **Offline**: Any feature that involves seat selection for INTERCITY trips MUST
   respect the hold pool. Check `stores/hold-pool.ts` before adding seat-selection code.

4. **Notifications**: Never call `novu.trigger()` directly.
   Always enqueue via `NotificationOutbox` inside a `$transaction`.
   See `phase-8-notifications.md` for the three workflows.

5. **Locales**: French is the primary language. All user-facing strings MUST have a
   French key in `locales/fr.json`. English keys must exist in `locales/en.json` even
   if the value is empty. Fill English strings immediately after app ships.

6. **Auth**: Login is email + password. No OTP for booth agents.
   The boot gate (app/index.tsx) is the single source of truth for access control.

7. **Payments**: Cash sales go through `booth.createCashSale` only.
   Paystack sales go through `booth.initiatePaystackLink` → `booth.confirmPaystackSale`.
   NEVER confirm a booking without a payment record. This is a fraud invariant.

8. **After building UI components**: Run `/imprint` and update `context/ui-registry.md`.
9. **After completing a phase**: Mark it ✅ in `context/plans/booth-app/README.md`.
<!-- END:context-rules -->
```

---

## 9.2 — `apps/booth-app/context/overview.md`

```markdown
# Booth App — Context Overview

## What This App Does

The booth app is used by **operator staff at physical bus terminals** to:
- Sell tickets to walk-up passengers (cash or Paystack QR)
- Look up existing passengers by email or phone
- Create Moja Ride accounts for passengers who don't have one
- Scan QR tickets to check in passengers at departure
- View today's sales at their terminal
- Run an end-of-day cash reconciliation report
- Sell tickets offline using a pre-fetched seat hold pool

## Who Uses It

Operator staff with one of these roles:
`BOOTH`, `DISPATCHER`, `OPERATIONS`, `MANAGER`, `ADMIN`, `OWNER`

Staff are managed in the operator web dashboard: `apps/web → Tableau de bord → Personnel`

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React Native + Expo SDK 56 |
| Routing | Expo Router (file-based) |
| Styling | NativeWind (Tailwind for RN) |
| API | tRPC → `apps/web` (same server as all apps) |
| Auth | Better Auth (email + password) |
| State | Zustand (persisted via AsyncStorage) |
| Offline | Pre-fetched hold pool + offline queue |
| Notifications | Novu (outbox worker) |
| Camera | expo-camera (QR check-in) |
| Printing | react-native-thermal-receipt-printer-enhanced |
| Language | French primary; English scaffolded |

## Route Structure

```
app/
├── index.tsx                 ← Boot gate (5-step check)
├── terminal-select.tsx       ← Session terminal selection
├── (auth)/
│   ├── login.tsx             ← Email + password login
│   └── verify.tsx            ← OTP fallback (not currently used)
├── (tabs)/
│   ├── index.tsx             ← SELL — today's trips at terminal
│   ├── checkin.tsx           ← CHECK-IN — QR scanner
│   ├── bookings.tsx          ← BOOKINGS — today's sales
│   └── profile.tsx           ← PROFILE — staff, terminal, logout
├── sell/
│   ├── [tripId].tsx          ← Seat map / auto-assign
│   ├── passenger.tsx         ← Lookup / walk-up creation
│   ├── payment.tsx           ← Cash | Paystack QR
│   └── confirmation.tsx      ← Ticket QR + share
└── reconcile.tsx             ← End-of-day report (modal)
```

## Key Stores

| Store | Purpose |
|-------|---------|
| `stores/session.ts` | Terminal selection + company + staff context (persisted) |
| `stores/hold-pool.ts` | Offline intercity seat hold pool (persisted) |
| `stores/offline-queue.ts` | Queued offline cash sales pending sync (persisted) |
| `stores/sell-session.ts` | In-progress sale context (not persisted) |

## Boot Gate Logic

```
1. Authenticated?                       → No  → /(auth)/login
2. Operator record + eligible role?     → No  → Access Denied
3. Company ACTIVE or VERIFIED?          → No  → Company Suspended
4. Terminal selected for this session?  → No  → /terminal-select
5.                                      → Yes → /(tabs)
```

## Payment Flows

### Cash
```
[Staff confirms cash received]
  → booth.createCashSale() ← one $transaction
      → createHold (or use pool hold if offline)
      → recordCash (ExternalPayment with provider=CASH)
      → confirmBooking
      → createBoothSale (audit record)
      → enqueueNotification (booth-ticket-created)
  → Navigate to confirmation screen
```

### Paystack QR
```
[Staff initiates QR payment]
  → booth.initiatePaystackLink()
      → createHold
      → paystackInitialize() → checkout URL
  → QR displayed on screen
  → booth.pollPaymentStatus() every 3s
      → paystackVerify()
      → returns PAID | PENDING | FAILED | EXPIRED
  → On PAID: booth.confirmPaystackSale()
      → verify with Paystack again (idempotent)
      → confirmBooking
      → createBoothSale
      → enqueueNotification
  → On TIMEOUT: booth.cancelPendingHold()
```

## Offline Strategy

### Intercity (seat-specific)
- On startup/reconnect: pre-acquire 5 real DB holds per trip (TTL = 90min)
- Offline: sell only from pool; queue in `offline-queue`
- Reconnect: flush queue → handle conflicts → release unconsumed holds

### Urban (any seat, capacity-based)
- Cache last-known available count
- Decrement locally; server validates on sync
- Conflicts escalated to ERP via `booth-urban-conflict` notification

## Invariants (Never Violate)

1. No ticket is confirmed without a payment record (cash or Paystack ref)
2. All notifications enqueued inside `$transaction` (transactional outbox)
3. Offline intercity sales only use pre-acquired pool holds
4. Pool holds are real DB records — other channels see them as taken
5. Staff can only see trips departing from their selected terminal
6. Check-in validates that the ticket's origin terminal matches the booth's terminal
```

---

## 9.3 — `apps/booth-app/context/ui-registry.md`

Run `/imprint` after building all screens to auto-populate this. The initial skeleton:

```markdown
# Booth App — UI Registry

> Last updated: (run /imprint to update)

## Screens

| Screen | File | Description |
|--------|------|-------------|
| Boot Gate | `app/index.tsx` | 5-step auth + role + terminal check |
| Login | `app/(auth)/login.tsx` | Email + password form |
| Terminal Select | `app/terminal-select.tsx` | List of company terminals |
| Sell Tab | `app/(tabs)/index.tsx` | Today's trips at selected terminal |
| Trip Detail | `app/sell/[tripId].tsx` | Seat map or urban count select |
| Passenger | `app/sell/passenger.tsx` | Lookup or walk-up creation |
| Payment | `app/sell/payment.tsx` | Cash or Paystack QR |
| Confirmation | `app/sell/confirmation.tsx` | QR display + share |
| Check-In | `app/(tabs)/checkin.tsx` | QR scanner |
| Bookings | `app/(tabs)/bookings.tsx` | Today's sales list |
| Reconciliation | `app/reconcile.tsx` | End-of-day report |
| Profile | `app/(tabs)/profile.tsx` | Staff profile + terminal switch |

## Components

| Component | File | Description |
|-----------|------|-------------|
| OfflineBanner | `components/offline-banner.tsx` | Pool status + conflict count |
| SeatMap | `components/seat-map.tsx` | Interactive seat grid |
| PaystackQR | `components/paystack-qr.tsx` | QR + countdown + poll |
```

---

## 9.4 — Update `context/progress-tracker.md`

Add the booth app to the monorepo progress tracker:

```markdown
## Booth App (apps/booth-app)

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Schema + Role + Middleware | ⬜ |
| 2 | tRPC Booth Router | ⬜ |
| 3 | App Scaffold | ⬜ |
| 4 | Auth + Boot Gate + Terminal Select | ⬜ |
| 5 | Sell Flow (Online) | ⬜ |
| 6 | Offline Hold Pool | ⬜ |
| 7 | Check-In + Bookings + Reconcile + Profile | ⬜ |
| 8 | Notifications | ⬜ |
| 9 | Context + Docs | ⬜ |
| POST | English locale strings | ⬜ |
| POST | Admin booth sales dashboard (apps/web) | ⬜ |
```

---

## 9.5 — Post-Launch Items (Tracked Here)

### POST-1: English Locale Strings
**Trigger**: Immediately after the app ships to French users.  
**Scope**: Fill all empty string values in `apps/booth-app/locales/en.json`.  
**Effort**: ~2 hours (all keys already exist, just translate).  
**Note**: The language toggle in the Profile tab is already wired. Just add strings.

### POST-2: Admin Booth Sales Dashboard (`apps/web`)
**Trigger**: After the booth app has been live for 2+ weeks (data exists to show).  
**Scope**: New page in the admin web dashboard showing all booth sales across all operators.  
**Location**: `apps/web/app/[locale]/dashboard/admin/booth-sales/page.tsx`  
**Data**: Read from `BoothSale` model — all data already exists.  
**Queries needed**:
- `admin.booth.getAllSales` — paginated, filterable by company, terminal, staff, date, method
- `admin.booth.getSalesSummary` — aggregate totals by company

### POST-3: Urban Overbooking Resolution UI
**Trigger**: When the first real conflict is encountered in production.  
**Scope**: A dedicated resolution screen in the ERP trip detail for operators to cancel excess bookings.  
**Location**: Add to `apps/web/features/operator/views/trip-detail-view.tsx`  
**Note**: The conflict data is already available via `BoothSale.hasConflict`. Just needs a UI.

### POST-4: Multi-printer Support (WiFi thermal)
**Trigger**: When operators request WiFi-connected printers.  
**Scope**: Extend `apps/booth-app/lib/bluetooth-print.ts` to support TCP/IP thermal printers.  
**Library**: `react-native-thermal-receipt-printer-enhanced` supports WiFi — just not wired up in v1.

---

## 9.6 — Final Verification Before Ship

```bash
# 1. Full monorepo typecheck must exit 0
pnpm -r typecheck

# 2. Prisma migration status must show all migrations applied
pnpm --filter @moja/db exec prisma migrate status

# 3. Booth app must build without errors
pnpm --filter booth-app expo build --platform android --profile preview

# 4. Manual E2E run through the complete sell flow:
#    Login → select terminal → select trip → seat map → passenger → cash → confirm ✓
#    Login → select terminal → select trip → seat map → passenger → paystack QR → paid → confirm ✓
#    Login → select terminal → scan QR → check in ✓
#    End of day → reconcile → share report ✓
#    Profile → switch terminal → confirmation modal → new terminal selected ✓
#    Airplane mode → sell intercity (pool) → reconnect → flush ✓
#    Airplane mode → sell urban → reconnect → flush ✓

# 5. Notifications:
#    Cash sale → passenger receives email with QR ✓
#    Walk-up account created → passenger receives activation email ✓
#    Urban conflict → manager receives conflict email ✓
#    Conflict banner appears in ERP trips list ✓
#    Conflict banner appears in ERP trip detail ✓
```

---

## 9.7 — Mark Plan Complete

After all 9 phases are done, update `context/plans/booth-app/README.md`:
- Change each `⬜ Not started` to `✅ Complete`
- Add the completion date
- Update `memory.md` with `/remember save`
