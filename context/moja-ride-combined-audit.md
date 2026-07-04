# Moja Ride — Combined Verified Audit Report

**Generated:** 2026-07-03  
**Scope:** All apps, packages, operator section, passenger web/mobile, search, auth, schema  
**Sources merged:** Round 1 Deep Audit + Round 2 Supplementary Deep Audit  
**Action taken:** Verification only — no code fixes in this pass

---

## Verification Legend

| Status | Meaning |
|--------|---------|
| **CONFIRMED** | Claim matches current code behavior |
| **PARTIALLY CONFIRMED** | Core issue is real; description, mechanism, or severity differs from the original audit |
| **NOT CONFIRMED** | Claim does not hold on inspection |
| **DUPLICATE** | Same root cause as another ID — see cross-reference |

**Severity:** Critical · High · Medium · Low

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical & High — Merged Headlines](#critical--high--merged-headlines)
3. [Section 1 — Critical Bugs](#1-critical-bugs)
4. [Section 2 — Authentication & Session](#2-authentication--session-issues)
5. [Section 3 — Operator Onboarding](#3-operator-onboarding-issues)
6. [Section 4 — Fleet Management](#4-operator-dashboard--fleet-management)
7. [Section 5 — Routes](#5-operator-dashboard--routes)
8. [Section 6 — Schedules](#6-operator-dashboard--schedules)
9. [Section 7 — Dispatch Board (Trips)](#7-operator-dashboard--dispatch-board-trips)
10. [Section 8 — Terminals](#8-operator-dashboard--terminals)
11. [Section 9 — Staff](#9-operator-dashboard--staff)
12. [Section 10 — Settings](#10-operator-dashboard--settings)
13. [Section 11 — Sidebar & Navigation](#11-operator-sidebar--navigation)
14. [Section 12 — tRPC Router Issues](#12-trpc-router-issues)
15. [Section 13 — Database Schema](#13-database-schema-issues)
16. [Section 14 — Search Domain](#14-search-domain-issues)
17. [Section 15 — Passenger Dashboard](#15-passenger-dashboard-issues)
18. [Section 16 — Auth Forms (Web)](#16-auth-forms--flows-web)
19. [Section 17 — Invitation Flow](#17-invitation-flow)
20. [Section 18 — Mobile App](#18-mobile-app-issues)
21. [Section 19 — Shared Packages](#19-shared-packages-issues)
22. [Section 20 — Performance](#20-performance-issues)
23. [Section 21 — Security](#21-security-issues)
24. [Section 22 — TypeScript / Type Safety](#22-typescript--type-safety-issues)
25. [Section 23 — UX & Accessibility](#23-ux--accessibility-issues)
26. [Section 24 — Missing Features / Stubs](#24-missing-features-stubs--todos)
27. [Section 25 — Code Quality & Architecture](#25-code-quality--architecture-issues)
28. [Round 2 Part A — Headline Findings](#round-2-part-a--headline-findings)
29. [Round 2 Part B — DB Fields With No UI](#round-2-part-b--db-fields-with-no-ui-or-ui-with-no-db-backing)
30. [Round 2 Part C — Logic & Architecture](#round-2-part-c--logic--architecture-issues)
31. [Full Verification Index](#full-verification-index)
32. [Merged Priority Fix Order](#merged-priority-fix-order)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total findings indexed | 144 |
| Unique root issues (after dedup) | ~128 |
| CONFIRMED | 118 |
| PARTIALLY CONFIRMED | 14 |
| NOT CONFIRMED | 3 |
| DUPLICATE (cross-linked) | 9 |

**Production blockers (both reports agree, verified):**

- Fake file uploads (onboarding + settings) and fake storage adapter
- No real email provider for auth OTPs or staff invitations
- Settings document-type enum mismatch breaks compliance uploads
- Routes cannot be edited after creation (CRUD gap on core entity)
- `isTerminal` promotion is cosmetic — not enforced in routes or search
- Staff security: hardcoded `callerRole`, no password on ownership transfer
- `updateCompany` rejects partial settings updates; deprecated Express API for verification submit
- Missing `<Suspense>` boundaries around `useSuspenseQuery` (sidebar, fleet seat map)
- Terms/commission/privacy acceptance never persisted to database

**Corrections to original audit text (verified):**

| ID | Original claim | Verified reality |
|----|----------------|----------------|
| 1.7 | Route form not reset after create | **NOT CONFIRMED** — `resetForm()` runs in mutation `onSuccess` |
| 1.12 | `handleTripUpdate` does nothing | **PARTIALLY** — invalidates list, but `ManifestDrawer` never calls the prop |
| 1.1 | Stale `stops` / missing `useMemo` | **PARTIALLY** — `fares` not cleared when route changes (related stale-pricing bug) |
| 17.3 | `invite-role-badge.tsx` binary/broken | **NOT CONFIRMED** — valid TypeScript component |
| 14.4 | No server-side search param parsing | **PARTIALLY** — `page.tsx` uses `searchParamsCache.parse()`; hydration risk is low if schemas align |
| A.14 | All three pages lack `SidebarTrigger` | **PARTIALLY** — Staff has it; Settings and Terminals do not |
| 18.1 | Mobile app absent | **PARTIALLY** — `apps/app` exists (auth shell); no search/booking/tickets |

---

## Critical & High — Merged Headlines

| ID | Issue | Severity | Verification |
|----|-------|----------|--------------|
| 1.8, 1.10, 1.11, A.1, 10.2 | Fake uploads + Settings doc enum mismatch | Critical | CONFIRMED |
| 24.1 | No real email OTP provider | Critical | CONFIRMED |
| A.2 | Routes: create/delete only, no edit/view | Critical | CONFIRMED |
| A.3 | `isTerminal` not enforced | Critical | CONFIRMED |
| 9.1, 9.2, 9.3 | Staff: no password check, hardcoded OWNER, no invite email | Critical | CONFIRMED |
| 10.1, 10.3, 12.4 | Settings uses Express API; `updateCompany` partial updates fail | Critical | CONFIRMED |
| 4.2, 11.1 | `useSuspenseQuery` without Suspense boundaries | Critical | CONFIRMED |
| 3.4, 21.1 | Bank data stored unencrypted | Critical | CONFIRMED |
| 8.4 | Terminal delete ignores route dependencies | Critical | CONFIRMED |
| 4.3 | `deleteBus` ignores future trips | Critical | CONFIRMED |
| A.8 | Terms acceptance never persisted | High | CONFIRMED |
| A.6, 24.6 | Service exceptions: no UI, no `addException` mutation | High | CONFIRMED |
| A.9, A.10, 25.10 | Verification/status UI misleading | High | CONFIRMED |

---

## 1. Critical Bugs

### 1.1 — Schedule pricing stale when route changes
**Severity:** Critical | **Verification:** PARTIALLY CONFIRMED  
**Files:** `apps/web/features/operator/views/operator-schedules-view.tsx`  
**Evidence:** Original audit cited stale `stops` / missing `useMemo`. Verified issue: `fares` state is not cleared when `selectedRouteId` changes (only in `resetWizard()`), so pricing rows can reference stop orders from a previous route.  
**Reports:** R1 §1.1

### 1.2 — Trip generator mixes local date math with UTC timestamps
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `apps/web/lib/trip-generator.ts`  
**Evidence:** Uses local `today`/`getDay()` for calendar iteration but `Date.UTC()` for departure time and `toISOString().split("T")[0]` for exception matching — wrong calendar day if server timezone ≠ UTC.  
**Reports:** R1 §1.2

### 1.3 — Onboarding back navigation discards unsaved step data
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `apps/web/features/operator/hooks/useOperatorOnboarding.ts`, `operator-onboarding-view.tsx`  
**Evidence:** `goToStep` allows backward navigation via `setCurrentStep` only; step components unmount and lose unsaved local form state with no confirm or auto-save.  
**Reports:** R1 §1.3

### 1.4 — Double `fetchSnapshot` on onboarding mount
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `apps/web/app/dashboard/operator/onboarding/page.tsx`, `useOperatorOnboarding.ts`  
**Evidence:** Page prefetches + `fetchQuery`s `getOnboardingStatus`; hook runs `fetchSnapshot()` again in `useEffect` on mount.  
**Reports:** R1 §1.4

### 1.5 — Seat map drawer shows stale bus without remount key
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `apps/web/features/operator/views/operator-fleet-view.tsx`, `seat-map-preview.tsx`  
**Evidence:** `<SeatMapFetcher busId={seatMapBusId} />` has no `key={seatMapBusId}`; `SeatMapPreview` initializes seat state once from props.  
**Reports:** R1 §1.5

### 1.6 — Add-bus modal does not reset mutation state on reopen
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `apps/web/features/operator/components/add-bus-modal.tsx`  
**Evidence:** Form fields reset in `useEffect` but `createMutation.reset()` / `updateMutation.reset()` never called on close/reopen.  
**Reports:** R1 §1.6

### 1.7 — Route form not reset after successful create
**Severity:** High | **Verification:** NOT CONFIRMED  
**Files:** `apps/web/features/operator/views/operator-routes-view.tsx`  
**Evidence:** `RouteFormDrawer` mutation `onSuccess` calls `resetForm()` (lines ~521–524) before closing. Original audit claim does not match current code.  
**Reports:** R1 §1.7

### 1.8 — `regenerateTrips` does not verify bus ownership
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `apps/web/trpc/routers/schedules.ts`, `apps/web/lib/trip-generator.ts`  
**Evidence:** Schedule `companyId` checked; `defaultBusId` passed to generator which loads bus by `id` only without `companyId` validation.  
**Reports:** R1 §1.8

### 1.9 — `assignBusDriver` company guard uses invalid `findUnique` filters
**Severity:** Critical | **Verification:** PARTIALLY CONFIRMED  
**Files:** `apps/web/trpc/routers/trips.ts`, `packages/db/prisma/schema.prisma`  
**Evidence:** `findUnique({ where: { id: busId, companyId, status }})` — only `id` is unique on `Bus`; ownership enforcement is unreliable. UI-side concern in original audit is secondary.  
**Reports:** R1 §1.9

### 1.10 — Onboarding document upload is fake
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `apps/web/features/operator/components/onboarding/documents-step.tsx`  
**Evidence:** `setTimeout` simulates upload; fabricated S3 URLs persisted to DB. No real storage call.  
**Reports:** R1 §1.10 · **See also:** 1.11, 3.5, 10.2, A.1

### 1.11 — `FakeUploadAdapter` is the only storage implementation
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `apps/web/features/operator/lib/storage-adapter.ts`  
**Evidence:** `export const storageAdapter = new FakeUploadAdapter()` — simulated progress + fake URLs.  
**Reports:** R1 §1.11 · **DUPLICATE of:** 1.10, 10.2

### 1.12 — `onTripUpdate` prop unused inside ManifestDrawer
**Severity:** High | **Verification:** PARTIALLY CONFIRMED  
**Files:** `apps/web/features/operator/views/operator-trips-view.tsx`  
**Evidence:** `handleTripUpdate` invalidates `trips.list`, but `ManifestDrawer` never invokes `onTripUpdate` — drawer mutations invalidate directly. Prop path is dead; not fully "does nothing."  
**Reports:** R1 §1.12

### 1.13 — Fare price mutation fires on every keystroke
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `apps/web/features/operator/views/operator-schedules-view.tsx`  
**Evidence:** `handleFarePriceChange` calls `updateFareMutation.mutateAsync` from input `onChange` with no debounce.  
**Reports:** R1 §1.13 · **See also:** 25.7

---

## 2. Authentication & Session Issues

### 2.1 — Three identical `redirectIf*Authenticated` functions
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `apps/web/lib/auth-server.ts`  
**Evidence:** `redirectIfAuthenticated`, `redirectIfOperatorAuthenticated`, `redirectIfPassengerAuthenticated` have identical bodies (lines 175–208).  
**Reports:** R1 §2.1

### 2.2 — Hardcoded "Moja Ride" toast branding
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `apps/web/features/auth/hooks/use-auth.ts`  
**Evidence:** Inconsistent product naming in success toasts — polish only, not a functional bug.  
**Reports:** R1 §2.2

### 2.3 — `resetPassword` ignores `userType` for operators
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `apps/web/features/auth/components/reset-password-form.tsx`, `use-auth.ts`  
**Evidence:** Form accepts `userType` but calls `resetPassword(email, otp, password)` without it; operators redirect to passenger login.  
**Reports:** R1 §2.3 · **See also:** 16.3

### 2.4 — No OTP resend rate limiting / cooldown
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `apps/web/features/auth/components/verify-email-form.tsx`  
**Evidence:** `handleResend` has no cooldown timer or disabled period beyond `isResending`.  
**Reports:** R1 §2.4 · **See also:** 16.4

### 2.5 — `requireServerSession` returns session only, not user
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `apps/web/lib/auth-server.ts`  
**Evidence:** Returns `data.session` only; callers lose direct access to `user` object.  
**Reports:** R1 §2.5

---

## 3. Operator Onboarding Issues

### 3.1 — Slug uniqueness not validated client-side
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `company-step.tsx`, `schema.prisma`, `operator.ts`  
**Evidence:** Auto-generated slug with `@unique` on `Company.slug`; no availability check before save.  
**Reports:** R1 §3.1

### 3.2 — Prisma P2002 unique constraint errors not surfaced
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `apps/web/trpc/routers/operator.ts`  
**Evidence:** No catch for unique violations on email/phone/slug; surfaces as generic internal error.  
**Reports:** R1 §3.2

### 3.3 — `city` text vs `cityId` FK can diverge
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `locations-step.tsx`  
**Evidence:** Both fields set from combobox; free-text without selection can leave `cityId` empty while `city` has text.  
**Reports:** R1 §3.3 · **See also:** 13.5, B.13

### 3.4 — Bank account stored unencrypted
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `bank-step.tsx`, `operator.ts`, `schema.prisma`  
**Evidence:** `accountNumber`, `iban`, `swiftCode` persisted as plaintext strings.  
**Reports:** R1 §3.4 · **See also:** 13.1, 21.1

### 3.5 — Document validation passes on fake upload success
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `documents-step.tsx`  
**Evidence:** `isTypeComplete` checks `status === "success"` after fake timer; meaningless validation.  
**Reports:** R1 §3.5 · **DUPLICATE of:** 1.10

### 3.6 — `saveOnboardingStep` uses `z.any()` input
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `apps/web/trpc/routers/operator.ts`  
**Evidence:** `.input(z.any())` with deferred `safeParse` inside mutation body.  
**Reports:** R1 §3.6 · **See also:** 25.2

### 3.7 — `dateOfBirth` UTC parsing shift
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `profile-step.tsx`, `operator.ts`  
**Evidence:** `new Date("YYYY-MM-DD")` interpreted as UTC midnight; can shift displayed date.  
**Reports:** R1 §3.7

### 3.8 — Terms step: `onComplete` failure leaves limbo state
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `terms-step.tsx`  
**Evidence:** If `onSave` succeeds but `onComplete` fails, no retry UI; onboarding may be partially committed.  
**Reports:** R1 §3.8 · **See also:** A.8

---

## 4. Operator Dashboard — Fleet Management

### 4.1 — Combobox display logic fragile (dual control)
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `add-bus-modal.tsx`, `operator-fleet-view.tsx`  
**Evidence:** `ComboboxInput` `value` controlled separately from `value`/`onValueChange`; prone to desync.  
**Reports:** R1 §4.1 · **See also:** 23.2

### 4.2 — `SeatMapFetcher` uses `useSuspenseQuery` without Suspense boundary
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `operator-fleet-view.tsx`  
**Evidence:** No `<Suspense>` wrapping `SeatMapFetcher` in drawer render tree.  
**Reports:** R1 §4.2

### 4.3 — `deleteBus` does not check future trips
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `apps/web/trpc/routers/fleet.ts`  
**Evidence:** Deletes bus after company check only; no trip/booking dependency guard.  
**Reports:** R1 §4.3

### 4.4 — `toggleSeatStatus` does not update `TripSeat` records
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `fleet.ts`, `seat-map-preview.tsx`  
**Evidence:** Updates `Seat.isActive` only; future trip seat availability unchanged.  
**Reports:** R1 §4.4

### 4.5 — Delete dialog may show stale `deletingBus` plate
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `operator-fleet-view.tsx`  
**Evidence:** Toast reads `deletingBus?.registrationPlate` from closure; can be stale if list refetches.  
**Reports:** R1 §4.5

---

## 5. Operator Dashboard — Routes

### 5.1 — Leaflet CSS imported globally at module level
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `route-map-preview.tsx`  
**Evidence:** `import "leaflet/dist/leaflet.css"` pollutes global stylesheet on any import.  
**Reports:** R1 §5.1 · **See also:** 25.9

### 5.2 — DnD missing full accessibility announcements
**Severity:** Medium | **Verification:** PARTIALLY CONFIRMED  
**Files:** `operator-routes-view.tsx`  
**Evidence:** `KeyboardSensor` and `aria-label="Reorder stop"` exist; no `DndContext` live-region announcements.  
**Reports:** R1 §5.2 · **See also:** 23.1

### 5.3 — `routes.create` / `update` use `z.any()`
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `apps/web/trpc/routers/routes.ts`  
**Evidence:** Dynamic schema import after `z.any()` input.  
**Reports:** R1 §5.3 · **See also:** 25.2

### 5.4 — No waypoint offset ascending-order validation
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `operator-routes-view.tsx`  
**Evidence:** `commitOffset` only checks `>= 0`; nonsensical stop order can be saved.  
**Reports:** R1 §5.4

### 5.5 — Route waypoint update not in transaction
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `apps/web/trpc/routers/routes.ts`  
**Evidence:** `deleteMany` waypoints then separate `route.update` — not wrapped in `$transaction`.  
**Reports:** R1 §5.5

### 5.6 — No maximum stop count
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `operator-routes-view.tsx`, `packages/schemas/src/routes.ts`  
**Evidence:** Unlimited intermediate stops on client and server.  
**Reports:** R1 §5.6

---

## 6. Operator Dashboard — Schedules

### 6.1 — Wizard state not reset on browser navigation away
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `operator-schedules-view.tsx`  
**Evidence:** Wizard state is `useState` only; no URL/popstate sync; returning to page may show stale wizard.  
**Reports:** R1 §6.1

### 6.2 — `validFrom` UTC shift in edit mode
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `operator-schedules-view.tsx`  
**Evidence:** Edit save uses `new Date(editCalConfig.validFrom).toISOString()` instead of local date parser used elsewhere.  
**Reports:** R1 §6.2

### 6.3 — Fare segment order not validated server-side
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `schedules.ts`, `search-service.ts`  
**Evidence:** Fares with `fromStopOrder > toStopOrder` can be persisted; search uses range matching not exact segment.  
**Reports:** R1 §6.3 · **See also:** A.11, A.12

### 6.4 — Edit drawer closes without unsaved-changes warning
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `operator-schedules-view.tsx`  
**Evidence:** `onOpenChange={setEditDrawerOpen}` with no dirty-state check.  
**Reports:** R1 §6.4

### 6.5 — Schedule delete check and delete not in transaction
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `apps/web/trpc/routers/schedules.ts`  
**Evidence:** Counts all bookings then `trip.deleteMany` + `schedule.delete` sequentially — race window; not atomic.  
**Reports:** R1 §6.5

---

## 7. Operator Dashboard — Dispatch Board (Trips)

### 7.1 — `ManifestDrawer` fetch `useEffect` without cleanup
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `operator-trips-view.tsx`  
**Evidence:** `fetchQuery` in `useEffect` with no `cancelled` flag or abort on unmount/`tripId` change.  
**Reports:** R1 §7.1

### 7.2 — Inline bus assignment has no optimistic update
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `operator-trips-view.tsx`  
**Evidence:** `assignBusMutation` only invalidates/refetches; combobox shows stale bus during network wait.  
**Reports:** R1 §7.2

### 7.3 — `delayMinutes` allows zero at schema level
**Severity:** Medium | **Verification:** PARTIALLY CONFIRMED  
**Files:** `packages/schemas/src/trips.ts`, `operator-trips-view.tsx`  
**Evidence:** Schema uses `.min(0)` (allows 0); UI blocks `<= 0`. Server accepts 0 if UI bypassed.  
**Reports:** R1 §7.3

### 7.4 — Trip date grouping uses UTC `toISOString`
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `operator-trips-view.tsx`  
**Evidence:** Group key from `toISOString().slice(0,10)` (UTC) but display uses `toLocaleDateString` (browser TZ) — can mismatch.  
**Reports:** R1 §7.4

### 7.5 — Server allows BOARDING without bus assigned
**Severity:** Medium | **Verification:** PARTIALLY CONFIRMED  
**Files:** `trips.ts`, `operator-trips-view.tsx`  
**Evidence:** UI disables button when `!trip.busId`; `updateStatus` mutation has no server-side `busId` guard.  
**Reports:** R1 §7.5

---

## 8. Operator Dashboard — Terminals

### 8.1 — Terminal toggle has no per-row loading state
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `operator-terminals-view.tsx`  
**Evidence:** `handleToggleTerminal` awaits mutation with no disabled/loading on button.  
**Reports:** R1 §8.1 · **See also:** 23.4

### 8.2 — `terminals.create` / `update` use `z.any()`
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `apps/web/trpc/routers/terminals.ts`  
**Evidence:** Same deferred-validation pattern as other routers.  
**Reports:** R1 §8.2 · **See also:** 25.2

### 8.3 — Dead `if (false)` loading branch
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `operator-terminals-view.tsx`  
**Evidence:** Unreachable loading UI block left from refactor.  
**Reports:** R1 §8.3 · **See also:** 25.6

### 8.4 — Terminal delete ignores route/waypoint/trip dependencies
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `apps/web/trpc/routers/terminals.ts`  
**Evidence:** `companyLocation.delete` with no FK dependency check — Prisma constraint error at runtime.  
**Reports:** R1 §8.4

---

## 9. Operator Dashboard — Staff

### 9.1 — `transferOwnership` skips password verification
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `apps/web/trpc/routers/staff.ts`  
**Evidence:** Comment explicitly says password check skipped; accepts `password` param but never validates.  
**Reports:** R1 §9.1

### 9.2 — `callerRole` hardcoded to `"OWNER"`
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `operator-staff-view.tsx`  
**Evidence:** `const callerRole: StaffRole = "OWNER"` — all users see owner-level controls.  
**Reports:** R1 §9.2 · **See also:** 25.5

### 9.3 — Staff invitation sends no email
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `apps/web/trpc/routers/staff.ts`  
**Evidence:** `createInvitation` creates DB record only; comment says email adapter skipped.  
**Reports:** R1 §9.3 · **See also:** 17.1, 24.1

### 9.4 — No distinction between empty roster vs filtered empty
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `operator-staff-view.tsx`  
**Evidence:** `members.length === 0` always shows "No team members yet" even when filters exclude all results.  
**Reports:** R1 §9.4 · **See also:** 23.3

### 9.5 — Activity log has no pagination
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `operator-staff-view.tsx`, `staff.ts`  
**Evidence:** Hardcoded `limit: 30` prefetch; no load-more UI.  
**Reports:** R1 §9.5

---

## 10. Operator Dashboard — Settings

### 10.1 — "Submit for Verification" calls deprecated Express API
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `operator-settings-view.tsx`  
**Evidence:** `fetch` to `${NEXT_PUBLIC_API_URL}/api/v1/operator/onboarding/complete` instead of tRPC `completeOnboarding`.  
**Reports:** R1 §10.1 · **See also:** 25.3

### 10.2 — Logo/document upload uses fake adapter
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `operator-settings-view.tsx`, `storage-adapter.ts`  
**Evidence:** Uses `FakeUploadAdapter` — fabricated URLs persisted.  
**Reports:** R1 §10.2 · **DUPLICATE of:** 1.10, 1.11

### 10.3 — `updateCompany` requires full schema for partial updates
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `operator.ts`, `operator-settings-view.tsx`  
**Evidence:** Validates full `companyStepSchema`; UI sends partial payloads (logo-only, profile subset) — validation fails.  
**Reports:** R1 §10.3 · **See also:** 12.4

### 10.4 — Bank account masked in display but full value in form state
**Severity:** Medium | **Verification:** PARTIALLY CONFIRMED  
**Files:** `operator-settings-view.tsx`  
**Evidence:** Display masks last 4 digits; edit form loads full `accountNumber` into React state (intentional for editing, but misleading security story).  
**Reports:** R1 §10.4 · **See also:** 21.1

---

## 11. Operator Sidebar & Navigation

### 11.1 — Sidebar `useSuspenseQuery` without Suspense boundary
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `operator-sidebar.tsx`, `(dashboard)/layout.tsx`  
**Evidence:** `useSuspenseQuery(getSettings)` with prefetch but no `<Suspense>` wrapper in layout.  
**Reports:** R1 §11.1

### 11.2 — Active nav state fragile for prefixed routes
**Severity:** Low | **Verification:** PARTIALLY CONFIRMED  
**Files:** `operator-sidebar.tsx`  
**Evidence:** Overview uses exact match; others use `startsWith` — hypothetical future routes could false-highlight Overview.  
**Reports:** R1 §11.2

### 11.3 — `?action=new` query param never cleaned up
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `operator-quick-actions.tsx`, fleet/routes/schedules/terminals views  
**Evidence:** Modal opens from `action=new` but param not removed via `router.replace` on close.  
**Reports:** R1 §11.3

---

## 12. tRPC Router Issues

### 12.1 — `operatorCompanyProcedure` queries DB every request
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `apps/web/trpc/init.ts`  
**Evidence:** `operator.findFirst` on every `operatorCompanyProcedure` invocation.  
**Reports:** R1 §12.1 · **See also:** 20.1

### 12.2 — `console.log` logs user email on every tRPC request
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `apps/web/trpc/init.ts`  
**Evidence:** `console.log(">>> tRPC Request from", source, "by", session?.user?.email)` — PII in logs.  
**Reports:** R1 §12.2 · **See also:** 21.1

### 12.3 — `trips.search` redundant with public `search.search`
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `trips.ts`, `search.ts`  
**Evidence:** Both wrap `SearchService.execute` with nearly identical input; operator-scoped duplicate.  
**Reports:** R1 §12.3 · **See also:** 25.2

### 12.4 — `updateCompany` partial update failure
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `operator.ts`  
**Evidence:** Same as 10.3 — full `companyStepSchema` on partial caller payloads.  
**Reports:** R1 §12.4 · **DUPLICATE of:** 10.3

---

## 13. Database Schema Issues

### 13.1 — `BankAccount.accountNumber` has no composite unique constraint
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `packages/db/prisma/schema.prisma`  
**Evidence:** No `@unique` or `@@unique([bankName, accountNumber])` — same account could register twice across companies.  
**Reports:** R1 §13.1

### 13.2 — `Trip.routeSnapshotJson` has no versioning
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `schema.prisma`, `trip-generator.ts`  
**Evidence:** Raw JSON written at generation; no schema version field; never read in app UI.  
**Reports:** R1 §13.2 · **See also:** B.3, C.8

### 13.3 — `Booking.holdExpiresAt` never set in code
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `schema.prisma`, `search-read-repository.ts`  
**Evidence:** Queried for active holds in search occupancy; no booking creation flow sets the field.  
**Reports:** R1 §13.3 · **See also:** B.4, 24.2

### 13.4 — `User.workPhone` lacks unique constraint
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `schema.prisma`, `auth-server.ts`  
**Evidence:** `workPhone` on `User` without `@unique`; not in Better Auth `additionalFields`; set only during onboarding.  
**Reports:** R1 §13.4 · **See also:** B.12

### 13.5 — `CompanyLocation.city` and `cityId` redundant and unsynchronized
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `schema.prisma`, `locations-step.tsx`, `terminals.ts`  
**Evidence:** Both fields persisted; no invariant enforcing `city === cityRelation.name` when `cityId` set.  
**Reports:** R1 §13.5 · **See also:** 3.3, B.13

---

## 14. Search Domain Issues

### 14.1 — Search uses live trip data, not route snapshot
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `search-service.ts`, `search-read-repository.ts`  
**Evidence:** Queries live `Trip`/`TripStop`; `routeSnapshotJson` unused for display — correct for availability but inconsistent if route changes post-generation.  
**Reports:** R1 §14.1

### 14.2 — `z.coerce.number()` on search inputs
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `apps/web/trpc/routers/search.ts`  
**Evidence:** `passengers` and `maxPrice` use `z.coerce.number()` — silent string coercion.  
**Reports:** R1 §14.2

### 14.3 — Default 5000 XOF fare when no fare configured
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `search-service.ts`  
**Evidence:** `priceXOF = segmentFare?.priceXOF ?? fallbackFare?.priceXOF ?? 5000` — misleading price to passengers.  
**Reports:** R1 §14.3

### 14.4 — Potential search params hydration mismatch
**Severity:** Low | **Verification:** PARTIALLY CONFIRMED  
**Files:** `search-page-client.tsx`, `page.tsx`, `params.ts`  
**Evidence:** Server parses via `searchParamsCache` in `page.tsx`; client uses `nuqs` with shared schema — low risk if schemas stay aligned; not "missing server parsing."  
**Reports:** R1 §14.4

### 14.5 — Sort buttons lack `aria-pressed`
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `search-results.tsx`  
**Evidence:** Visual variant distinguishes selected sort; no `aria-pressed` for assistive tech.  
**Reports:** R1 §14.5

---

## 15. Passenger Dashboard Issues

### 15.1 — Dashboard stats hardcoded to zero
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `dashboard-view.tsx`  
**Evidence:** All stat values `"0"` — no API fetch for bookings/tickets.  
**Reports:** R1 §15.1

### 15.2 — Sessions panel trips is `never[]`
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `sessions-panel.tsx`  
**Evidence:** `const trips: never[] = []` — permanently empty; no data fetch.  
**Reports:** R1 §15.2

### 15.3 — Mobile app has no passenger search flow
**Severity:** Medium | **Verification:** PARTIALLY CONFIRMED  
**Files:** `apps/app/`  
**Evidence:** `apps/app` exists with auth screens; no search/booking/ticket tabs implemented. Web search at `/` is separate.  
**Reports:** R1 §15.3 · **See also:** 18.1

---

## 16. Auth Forms & Flows (Web)

### 16.1 — Operator signup sets `email` and `workEmail` identically
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `operator-signup-form.tsx`  
**Evidence:** Both arguments to `signUp` use `workEmail.trim()` — redundant duplicate fields.  
**Reports:** R1 §16.1

### 16.2 — `PhoneInput` international flag inconsistent across forms
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `signup-form.tsx`, `operator-signup-form.tsx`  
**Evidence:** Passenger form `international={false}`; operator form `international` — mixed phone formats in `User.phone`.  
**Reports:** R1 §16.2

### 16.3 — Password placeholder mojibake in login form
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `login-form.tsx`  
**Evidence:** `placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"` — UTF-8 encoding corruption.  
**Reports:** R1 §16.3

### 16.4 — Duplicate footer links in auth view/form pairs
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** Various auth views  
**Evidence:** Form card and wrapping view both render "Back to sign in" / similar links.  
**Reports:** R1 §16.4

---

## 17. Invitation Flow

### 17.1 — Create account flow does not suggest sign-in on existing email
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `invitation-view.tsx`  
**Evidence:** `signUp.email` failure shows toast only; no redirect to sign-in step when email exists.  
**Reports:** R1 §17.1

### 17.2 — Invitation accept allows unauthenticated user lookup by email
**Severity:** High | **Verification:** PARTIALLY CONFIRMED  
**Files:** `invitation.ts`  
**Evidence:** Token is primary credential; unauthenticated branch finds user by email without password. Token marked ACCEPTED in transaction — acceptable if token secret; design tradeoff.  
**Reports:** R1 §17.2

### 17.3 — `invite-role-badge.tsx` compilation concern
**Severity:** High | **Verification:** NOT CONFIRMED  
**Files:** `invite-role-badge.tsx`  
**Evidence:** Valid TypeScript component exporting `ROLE_LABELS` and `InviteRoleBadge`; not a binary file.  
**Reports:** R1 §17.3 · **See also:** 22.3

---

## 18. Mobile App Issues

### 18.1 — Mobile app is auth-only shell
**Severity:** Critical | **Verification:** PARTIALLY CONFIRMED  
**Files:** `apps/app/src/app/`  
**Evidence:** Expo app exists with login/signup/verify/reset/dashboard stubs; no search, seat selection, booking, tickets, or offline storage. Original "app absent" wording is incorrect.  
**Reports:** R1 §18.1

### 18.2 — `app.json` not audited in source reports
**Severity:** Low | **Verification:** CONFIRMED (gap in original audit)  
**Files:** `apps/app/app.json`  
**Evidence:** Bundle ID, icons, splash exist in repo but were not reviewed in original audit passes — separate review recommended.  
**Reports:** R1 §18.2

### 18.3 — Mobile auth client token refresh handling unclear
**Severity:** High | **Verification:** PARTIALLY CONFIRMED  
**Files:** `apps/app/src/lib/auth-client.ts`  
**Evidence:** Better Auth Expo integration present; no explicit offline session recovery flow visible in app code.  
**Reports:** R1 §18.3

---

## 19. Shared Packages Issues

### 19.1 — Dynamic `await import("@moja/schemas")` in routers
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** Multiple tRPC routers  
**Evidence:** Dynamic imports instead of static — loses compile-time inference, adds first-call latency.  
**Reports:** R1 §19.1 · **See also:** 25.2

### 19.2 — `@moja/config` env helpers weakly typed
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `auth-server.ts`, `packages/config`  
**Evidence:** `getOptionalEnv` / `getCsvEnv` return `string | undefined`; callers must null-check.  
**Reports:** R1 §19.2

### 19.3 — Seed layout templates use find-or-create, not upsert
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `packages/db/prisma/seed.ts`  
**Evidence:** Manual `findFirst` + `create`; existing templates skip seat template updates if definition changes.  
**Reports:** R1 §19.3 · **See also:** 25.8

---

## 20. Performance Issues

### 20.1 — Settings form reset on every `settings` refetch
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `operator-settings-view.tsx`  
**Evidence:** `useEffect([settings])` re-initializes all form fields — wipes in-progress edits on background refetch.  
**Reports:** R1 §20.1

### 20.2 — ManifestDrawer always network-fetches trip detail
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `operator-trips-view.tsx`  
**Evidence:** Uses `fetchQuery` not `ensureQueryData` — bypasses stale cache on every open.  
**Reports:** R1 §20.2

### 20.3 — Sequential `await prefetch()` on operator pages
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `fleet/page.tsx`, routes/schedules/trips/staff pages  
**Evidence:** Multiple sequential `await prefetch(...)` calls; could be `Promise.all`.  
**Reports:** R1 §20.3 · **See also:** C.10

---

## 21. Security Issues

### 21.1 — Full bank account number in client JS memory
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `operator-settings-view.tsx`  
**Evidence:** `setBankForm({ accountNumber: bank.accountNumber })` — full value in React state despite masked display.  
**Reports:** R1 §21.1 · **DUPLICATE of:** 3.4, 10.4

### 21.2 — CSRF protection beyond SameSite cookies unclear
**Severity:** Medium | **Verification:** PARTIALLY CONFIRMED  
**Files:** Better Auth + tRPC setup  
**Evidence:** Better Auth `nextCookies()` provides CSRF for auth routes; tRPC mutation CSRF posture not explicitly documented in code.  
**Reports:** R1 §21.2

### 21.3 — Wildcard trusted origins in development
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `auth-server.ts`  
**Evidence:** Dev origins include `exp://**`, `http://192.168.*.*:*/**` — overly broad if misinterpreted by Better Auth.  
**Reports:** R1 §21.3

### 21.4 — Invitation token stored plaintext in DB
**Severity:** Low | **Verification:** CONFIRMED (acceptable with note)  
**Files:** `staff.ts`  
**Evidence:** `crypto.randomBytes(32)` token stored plaintext; 256-bit entropy is adequate; hashing at rest would be improvement.  
**Reports:** R1 §21.4

---

## 22. TypeScript / Type Safety Issues

### 22.1 — `operatorData` typed as `any` in onboarding hook
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `useOperatorOnboarding.ts`  
**Evidence:** `useState<any>(null)` — all step `initialData` props untyped.  
**Reports:** R1 §22.1

### 22.2 — Systematic `as any` in Prisma update paths
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `operator.ts`, other routers  
**Evidence:** `cleanData as any` on `company.update`, `operatingHours as any`, etc.  
**Reports:** R1 §22.2 · **See also:** 25.6

### 22.3 — `ROLE_LABELS` duplicated across files
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `invite-role-badge.tsx`, `features/operator/lib/staff.ts`  
**Evidence:** Two independent `ROLE_LABELS` exports — drift risk.  
**Reports:** R1 §22.3

### 22.4 — `SearchFilters.maxPrice` typed as required `number`
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `search-service.ts`, `search.ts`  
**Evidence:** Interface says `maxPrice: number` but callers pass `undefined`; `!== undefined` check always meaningful only if optional.  
**Reports:** R1 §22.4

---

## 23. UX & Accessibility Issues

### 23.1 — Locked onboarding steps lack tooltip explanation
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `operator-onboarding-view.tsx`  
**Evidence:** Upcoming steps disabled/dimmed with no "complete current step first" tooltip.  
**Reports:** R1 §23.1

### 23.2 — Drawer/modal close buttons lack `aria-label`
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** Multiple operator components  
**Evidence:** Icon-only `<X>` close buttons without accessible labels.  
**Reports:** R1 §23.2

### 23.3 — Seat buttons use `title` not `aria-label`
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `seat-map-preview.tsx`  
**Evidence:** Hover `title` only; keyboard users lack reliable status announcement.  
**Reports:** R1 §23.3

### 23.4 — Preview calendar has no keyboard navigation
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `operator-schedules-view.tsx`  
**Evidence:** Custom calendar grid uses `<div>` elements without ARIA roles or keyboard nav.  
**Reports:** R1 §23.4

### 23.5 — Color-only status indicators
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** Multiple operator components  
**Evidence:** Status communicated primarily by colored dots/badges without icons or text for color-blind users.  
**Reports:** R1 §23.5

### 23.6 — Fleet status filter combobox has no label
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `operator-fleet-view.tsx`  
**Evidence:** Status filter combobox missing associated `<label>` element.  
**Reports:** R1 §23.6

---

## 24. Missing Features / Stubs / TODOs

### 24.1 — No real email provider for auth OTPs
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `apps/web/lib/auth-email.ts`  
**Evidence:** `sendAuthOtp` logs OTP to console with TODO comment — no email sent in production.  
**Reports:** R1 §24.1

### 24.2 — No payment system
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** General / `schema.prisma`  
**Evidence:** `Payment` model and `Booking.paymentStatus` exist; zero payment gateway integration or mock checkout UI.  
**Reports:** R1 §24.2

### 24.3 — No QR code generation for tickets
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** General  
**Evidence:** `Booking.ticketToken` in schema; no QR generation or ticket display UI.  
**Reports:** R1 §24.3

### 24.4 — No admin dashboard
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `apps/web/app/dashboard/`  
**Evidence:** No `admin` route directory or admin verification queue UI in web app.  
**Reports:** R1 §24.4

### 24.5 — Passenger bookings and tickets pages are empty shells
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `apps/web/app/dashboard/(passenger)/bookings/`, `tickets/`  
**Evidence:** Placeholder cards only; no real booking/ticket data.  
**Reports:** R1 §24.5

### 24.6 — `Review` model is a stub
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `schema.prisma`  
**Evidence:** `Review` has only `id`, `companyId`, timestamps — no rating, content, or author fields.  
**Reports:** R1 §24.6 · **See also:** B.14

### 24.7 — `PassengerProfile` model is a stub
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `schema.prisma`  
**Evidence:** Only `id` + `userId` — no preferences, saved routes, or payment methods.  
**Reports:** R1 §24.7 · **See also:** B.15

### 24.8 — No notification system
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** General  
**Evidence:** No push token management, email templates, or SMS integration beyond auth OTP stub.  
**Reports:** R1 §24.8

### 24.9 — No revenue/analytics dashboard for operators
**Severity:** High | **Verification:** CONFIRMED  
**Files:** Operator dashboard views  
**Evidence:** `OperatorDashboardView` shows placeholder stats; no revenue page or real analytics queries.  
**Reports:** R1 §24.9

---

## 25. Code Quality & Architecture Issues

### 25.1 — Monolithic view files (1500+ lines)
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `operator-schedules-view.tsx`, `operator-staff-view.tsx`, `operator-settings-view.tsx`  
**Evidence:** Components, hooks, and business logic mixed in single files.  
**Reports:** R1 §25.1

### 25.2 — `z.any()` pattern in 8+ tRPC routers
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `operator.ts`, `routes.ts`, `terminals.ts`, etc.  
**Evidence:** Systemic deferred validation pattern removes client type inference.  
**Reports:** R1 §25.2 · **See also:** 3.6, 5.3, 8.2, 19.1

### 25.3 — Deprecated `apps/api` still referenced from settings
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `apps/api/`, `operator-settings-view.tsx`  
**Evidence:** Express API exists in monorepo and is actively called for verification submit.  
**Reports:** R1 §25.3 · **See also:** 10.1

### 25.4 — `@moja/api-client` deprecated but still in monorepo
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `packages/api-client/`, `code-standards.md`  
**Evidence:** Standards say use tRPC; legacy package remains — developer confusion risk.  
**Reports:** R1 §25.4

### 25.5 — Onboarding progress bar off-by-one
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `operator-onboarding-view.tsx`  
**Evidence:** `((currentStepIndex + 1) / steps.length) * 100` — shows progress before step completion.  
**Reports:** R1 §25.5

### 25.6 — `as any` on Prisma `createMany` data
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `operator.ts`  
**Evidence:** `operatingHours: ({ hours: loc.operatingHours } as any)` and similar casts on bulk inserts.  
**Reports:** R1 §25.6 · **See also:** 22.2

### 25.7 — `updateFare` does not invalidate `schedules.list`
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `operator-schedules-view.tsx`  
**Evidence:** `updateFareMutation` has no `onSuccess` invalidation; reopening edit drawer shows stale fare prices from list cache.  
**Reports:** R1 §25.7 · **See also:** 1.13

### 25.8 — Seed seat templates have no driver area or empty spaces
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `packages/db/prisma/seed.ts`  
**Evidence:** `generateSeats` creates only passenger seat types for every grid cell.  
**Reports:** R1 §25.8

### 25.9 — `listStaff` restricted to OWNER/ADMIN only
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `init.ts`, `staff.ts`  
**Evidence:** `operatorStaffManageProcedure` requires OWNER or ADMIN; MANAGER cannot list team.  
**Reports:** R1 §25.9

### 25.10 — "Approved Operator" badge always shown
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `operator-dashboard-view.tsx`  
**Evidence:** Hardcoded "Approved Operator" badge regardless of `company.status` (DRAFT, PENDING, REJECTED, etc.).  
**Reports:** R1 §25.10 · **See also:** A.9, A.10

---

## Round 2 Part A — Headline Findings

*Items unique to Round 2 or with expanded analysis. Cross-references to Round 1 sections above where overlapping.*

### A.1 — Settings document-type keys do not match `DocumentType` enum
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `operator-settings-view.tsx` (~880–890), `schema.prisma`  
**Evidence:** UI uses `TAX_CERTIFICATE`, `OPERATING_PERMIT`, `INSURANCE_PROOF`; enum has `TAX_CLEARANCE_CERTIFICATE`, `TRANSPORT_OPERATING_PERMIT`, `INSURANCE_CERTIFICATE`. Uploads fail validation; onboarding docs invisible in Settings lookup.  
**Reports:** R2 A.1 · **DUPLICATE of:** 1.10, 3.5, 10.2

### A.2 — Routes: create and delete only, no edit or detail view
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `operator-routes-view.tsx`, `routes.ts`  
**Evidence:** `RouteCard` only has delete button; `routes.update` exists in API but no UI wiring; `RouteFormDrawer` only used for create.  
**Reports:** R2 A.2

### A.3 — `isTerminal` flag not enforced in routes or search
**Severity:** Critical | **Verification:** CONFIRMED  
**Files:** `terminals.ts`, `operator-routes-view.tsx`, `search-read-repository.ts`  
**Evidence:** `terminals.list` returns all locations; route builder and search never filter `isTerminal: true`.  
**Reports:** R2 A.3

### A.4 — No create path for custom seat layouts or bus types
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `fleet.ts`, `add-bus-modal.tsx`, `seed.ts`  
**Evidence:** Only 5 platform-default layouts from seed; no `createLayoutTemplate` or `createBusType` mutation.  
**Reports:** R2 A.4 · **See also:** 24.9 (custom layouts)

### A.5 — `RETIRED` bus status unreachable from UI
**Severity:** High | **Verification:** PARTIALLY CONFIRMED  
**Files:** `operator-fleet-view.tsx`, `fleet.ts`  
**Evidence:** Backend supports RETIRED; edit combobox and filter omit RETIRED; `stats.retired` computed but not displayed in KPI cards.  
**Reports:** R2 A.5

### A.6 — Service exceptions have no UI; `schedules.addException` missing
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `schema.prisma`, `trip-generator.ts`, `schedules.ts`, `progress-tracker.md`  
**Evidence:** Generator respects exceptions; router has no add/delete exception mutations; progress tracker falsely claims `addException` done.  
**Reports:** R2 A.6 · **DUPLICATE of:** 24.6 (stub overlap)

### A.7 — Activity log only records invitation acceptance
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `staff.ts`, `invitation.ts`  
**Evidence:** Only `activityLog.create` is in `invitation.accept` (MEMBER_JOINED); role changes, suspensions, transfers, invites not logged.  
**Reports:** R2 A.7

### A.8 — Terms/commission/privacy acceptance never persisted
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `terms-step.tsx`, `operator.ts`, signup forms, `use-auth.ts`  
**Evidence:** Signup `acceptTerms` client-only; operator terms step saves only `onboardingLastStepAt` — no `termsAcceptedAt` column anywhere.  
**Reports:** R2 A.8 · **See also:** 3.8

### A.9 — Verification pipeline checks data presence, not approval
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `operator-settings-view.tsx`  
**Evidence:** Bank step green on `bankAccount` existence not `isVerified`; docs green on `documents.length >= 2` not `status === APPROVED`.  
**Reports:** R2 A.9 · **See also:** 25.10, B.1, B.2, B.3

### A.10 — `SUSPENDED`/`REJECTED` company status mishandled in UI
**Severity:** High | **Verification:** PARTIALLY CONFIRMED  
**Files:** `operator-sidebar.tsx`, `operator-settings-view.tsx`  
**Evidence:** Sidebar shows "Draft" for SUSPENDED/REJECTED; no red/error styling; REJECTED companies cannot resubmit (`Submit` only for DRAFT). Settings shows raw status/reason partially.  
**Reports:** R2 A.10

### A.11 — `Fare.seatClass` has no matching `Seat` tier field
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `schema.prisma`  
**Evidence:** `Fare.seatClass` required; `Seat`/`SeatTemplate` have `seatType` only — no pricing tier assignment possible.  
**Reports:** R2 A.11 · **See also:** 6.3, B.8, B.9

### A.12 — Fare creation hardcodes `FIXED` and `ECONOMY`
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `operator-schedules-view.tsx`  
**Evidence:** Schedule create payload maps all fares to `type: "FIXED"`, `seatClass: "ECONOMY"`.  
**Reports:** R2 A.12

### A.13 — Waypoint arrival and departure offsets forced equal
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `routes.ts`  
**Evidence:** Both `arrivalOffsetMinutes` and `departureOffsetMinutes` set to `wp.offsetMinutes` with `// Simplification` comment.  
**Reports:** R2 A.13

### A.14 — Settings and Terminals pages lack page-level `SidebarTrigger`
**Severity:** Medium | **Verification:** PARTIALLY CONFIRMED  
**Files:** `settings/page.tsx`, `terminals/page.tsx`, `staff/page.tsx`  
**Evidence:** Staff page has standard header with `SidebarTrigger`; Settings and Terminals render views only — mobile sidebar dead-end if collapsed.  
**Reports:** R2 A.14 · **See also:** 23.5 (nav)

### A.15 — Staff page breadcrumb says "Dispatch Board"
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `staff/page.tsx`  
**Evidence:** Breadcrumb reads "Operations / Dispatch Board" — copy-paste from trips page.  
**Reports:** R2 A.15

---

## Round 2 Part B — DB Fields With No UI (or UI With No DB Backing)

| ID | Field / Concept | Severity | Verification | Evidence |
|----|-----------------|----------|--------------|----------|
| B.1 | `CompanyDocument.status` | Medium | CONFIRMED | Fetched by `getSettings`; never rendered as badge on document rows in Settings |
| B.2 | `CompanyDocument.expiresAt` / `reminderSentAt` | Medium | CONFIRMED | No expiry input at upload; no expiry warning display |
| B.3 | `BankAccount.isVerified` / `verifiedAt` / `verifiedById` | Medium | CONFIRMED | Not shown in Settings bank tab; pipeline uses existence only |
| B.4 | `Operator.isVerified` (per staff member) | Medium | CONFIRMED | Staff list shows `Operator.status` only, not `isVerified` boolean |
| B.5 | `Operator.nationalIdDocumentId` | Medium | CONFIRMED | Profile step collects ID number/type text only; no document upload for FK |
| B.6 | `Bus.notes` | Medium | CONFIRMED | Collected in `AddBusModal`; never displayed on `BusCard` or seat drawer |
| B.7 | `Company.estimatedStaffSize` | Medium | CONFIRMED | Shown on dashboard; editable in onboarding only, not in Settings legal drawer |
| B.8 | `RouteWaypoint.distanceFromOriginKm` | Medium | CONFIRMED | In `waypointSchema`; no input in route builder UI |
| B.9 | `RouteWaypoint.allowPickup` / `allowDropoff` | Medium | CONFIRMED | Hardcoded `true`/`true` on add; no per-stop toggle in UI |
| B.10 | `Schedule.name` | Medium | CONFIRMED | Omitted from creation wizard payload; only settable in edit drawer |
| B.11 | `Trip.gate` | Medium | CONFIRMED | Schema field exists; never set or shown on dispatch/manifest |
| B.12 | `Trip.notes` | Medium | CONFIRMED | Set as side-effect of delay mutation; never displayed in manifest |
| B.13 | `Trip.cancelReason` | Medium | CONFIRMED | Collected on cancel; status shows Cancelled but reason not shown afterward |
| B.14 | `TripStop.actualArrival` / `actualDeparture` | Medium | CONFIRMED | Only trip-level actual times set; no per-stop check-in UI |
| B.15 | `Booking.boardedAt` / `completedAt` | Medium | CONFIRMED | Manifest shows `checkedInAt` only; other lifecycle timestamps not surfaced |
| B.16 | `CompanyLocation.operatingHours` | Medium | CONFIRMED | Collected in onboarding locations step; not in terminals management drawer |
| B.17 | `User.image` / `Operator.profilePhotoUrl` | Medium | CONFIRMED | Avatars use initials fallback only; `AvatarImage` not used with stored URLs |
| B.18 | `City.region` / `district` / `isMajorHub` | Medium | CONFIRMED | Passenger search shows hub badge; operator city pickers show name only |
| B.19 | `routes.getCities` missing `isActive` filter | Medium | CONFIRMED | `locations.searchCities` filters `isActive: true`; `routes.getCities` does not |

---

## Round 2 Part C — Logic & Architecture Issues

### C.1 — Onboarding route lacks explicit role/auth guard
**Severity:** High | **Verification:** CONFIRMED  
**Files:** `onboarding/page.tsx`, `onboarding/layout.tsx`, `(dashboard)/layout.tsx`  
**Evidence:** Onboarding is outside `(dashboard)` group; no session check on page — non-operator gets `FORBIDDEN` from tRPC instead of redirect.  
**Reports:** R2 C.1

### C.2 — Inconsistent header architecture; shared `PageHeader` unused on operator side
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** Operator `page.tsx` files, `page-header.tsx`  
**Evidence:** Passenger dashboard uses `PageHeader`; operator pages hand-roll headers with varying padding/background; views add second toolbars.  
**Reports:** R2 C.2

### C.3 — Settings tab selection not URL-synced
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `operator-settings-view.tsx`  
**Evidence:** `useState<SettingsSection>("profile")` — refresh loses active tab; no deep-linking.  
**Reports:** R2 C.3

### C.4 — No ad-hoc / one-off trip creation
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `trips.ts`  
**Evidence:** No `trips.create` mutation; all trips from schedule generator only.  
**Reports:** R2 C.4

### C.5 — Duplicate seat-grid implementations
**Severity:** Medium | **Verification:** CONFIRMED  
**Files:** `seat-map-preview.tsx`, `operator-trips-view.tsx` (`ManifestSeatGrid`)  
**Evidence:** Two independent row/col grid renderers with different interaction modes.  
**Reports:** R2 C.5 · **See also:** 25.8 (if counted under quality)

### C.6 — No printable/exportable manifest
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `operator-trips-view.tsx`  
**Evidence:** No print stylesheet, PDF export, or Print Manifest button in `ManifestDrawer`.  
**Reports:** R2 C.6

### C.7 — No duplicate-schedule protection
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `schedules.ts` `create`  
**Evidence:** No uniqueness check for same route + departureTime + overlapping calendar.  
**Reports:** R2 C.7

### C.8 — Route edits do not reconcile already-generated trips
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `trip-generator.ts`, `routes.ts`  
**Evidence:** `routeSnapshotJson` and materialized `TripStop` frozen at generation; route update does not reconcile existing trips.  
**Reports:** R2 C.8 · **See also:** 13.2, A.2

### C.9 — Inconsistent page `<title>` branding
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** Operator `page.tsx` metadata  
**Evidence:** Mix of em dash `— Moja Ride Operator` vs hyphen `- Moja Ride Operator Dashboard`.  
**Reports:** R2 C.9

### C.10 — Inconsistent `await prefetch()` on Overview and Onboarding
**Severity:** Low | **Verification:** CONFIRMED  
**Files:** `(dashboard)/page.tsx`, `onboarding/page.tsx`  
**Evidence:** `prefetch()` not awaited then separate `fetchQuery` for same key; other pages use `await prefetch`.  
**Reports:** R2 C.10 · **See also:** 20.3

---

## Full Verification Index

| ID | Severity | Verification | Primary file |
|----|----------|--------------|--------------|
| 1.1 | Critical | PARTIALLY | operator-schedules-view.tsx |
| 1.2 | Critical | CONFIRMED | trip-generator.ts |
| 1.3 | Critical | CONFIRMED | operator-onboarding-view.tsx |
| 1.4 | High | CONFIRMED | useOperatorOnboarding.ts |
| 1.5 | High | CONFIRMED | operator-fleet-view.tsx |
| 1.6 | High | CONFIRMED | add-bus-modal.tsx |
| 1.7 | High | NOT CONFIRMED | operator-routes-view.tsx |
| 1.8 | Critical | CONFIRMED | schedules.ts |
| 1.9 | Critical | PARTIALLY | trips.ts |
| 1.10 | Critical | CONFIRMED | documents-step.tsx |
| 1.11 | Critical | CONFIRMED | storage-adapter.ts |
| 1.12 | High | PARTIALLY | operator-trips-view.tsx |
| 1.13 | High | CONFIRMED | operator-schedules-view.tsx |
| 2.1 | Medium | CONFIRMED | auth-server.ts |
| 2.2 | Low | CONFIRMED | use-auth.ts |
| 2.3 | High | CONFIRMED | reset-password-form.tsx |
| 2.4 | Medium | CONFIRMED | verify-email-form.tsx |
| 2.5 | Low | CONFIRMED | auth-server.ts |
| 3.1 | High | CONFIRMED | company-step.tsx |
| 3.2 | High | CONFIRMED | operator.ts |
| 3.3 | Medium | CONFIRMED | locations-step.tsx |
| 3.4 | Critical | CONFIRMED | bank-step.tsx |
| 3.5 | High | CONFIRMED | documents-step.tsx |
| 3.6 | High | CONFIRMED | operator.ts |
| 3.7 | Medium | CONFIRMED | profile-step.tsx |
| 3.8 | Medium | CONFIRMED | terms-step.tsx |
| 4.1 | Medium | CONFIRMED | add-bus-modal.tsx |
| 4.2 | Critical | CONFIRMED | operator-fleet-view.tsx |
| 4.3 | Critical | CONFIRMED | fleet.ts |
| 4.4 | High | CONFIRMED | seat-map-preview.tsx |
| 4.5 | Low | CONFIRMED | operator-fleet-view.tsx |
| 5.1 | High | CONFIRMED | route-map-preview.tsx |
| 5.2 | Medium | PARTIALLY | operator-routes-view.tsx |
| 5.3 | High | CONFIRMED | routes.ts |
| 5.4 | Medium | CONFIRMED | operator-routes-view.tsx |
| 5.5 | High | CONFIRMED | routes.ts |
| 5.6 | Low | CONFIRMED | operator-routes-view.tsx |
| 6.1 | High | CONFIRMED | operator-schedules-view.tsx |
| 6.2 | Medium | CONFIRMED | operator-schedules-view.tsx |
| 6.3 | Medium | CONFIRMED | schedules.ts |
| 6.4 | Medium | CONFIRMED | operator-schedules-view.tsx |
| 6.5 | High | CONFIRMED | schedules.ts |
| 7.1 | High | CONFIRMED | operator-trips-view.tsx |
| 7.2 | Medium | CONFIRMED | operator-trips-view.tsx |
| 7.3 | Medium | PARTIALLY | trips.ts |
| 7.4 | Medium | CONFIRMED | operator-trips-view.tsx |
| 7.5 | Medium | PARTIALLY | trips.ts |
| 8.1 | Medium | CONFIRMED | operator-terminals-view.tsx |
| 8.2 | High | CONFIRMED | terminals.ts |
| 8.3 | Low | CONFIRMED | operator-terminals-view.tsx |
| 8.4 | Critical | CONFIRMED | terminals.ts |
| 9.1 | Critical | CONFIRMED | staff.ts |
| 9.2 | Critical | CONFIRMED | operator-staff-view.tsx |
| 9.3 | Critical | CONFIRMED | staff.ts |
| 9.4 | Medium | CONFIRMED | operator-staff-view.tsx |
| 9.5 | Medium | CONFIRMED | operator-staff-view.tsx |
| 10.1 | Critical | CONFIRMED | operator-settings-view.tsx |
| 10.2 | Critical | CONFIRMED | operator-settings-view.tsx |
| 10.3 | Critical | CONFIRMED | operator.ts |
| 10.4 | Medium | PARTIALLY | operator-settings-view.tsx |
| 11.1 | Critical | CONFIRMED | operator-sidebar.tsx |
| 11.2 | Low | PARTIALLY | operator-sidebar.tsx |
| 11.3 | Medium | CONFIRMED | operator-quick-actions.tsx |
| 12.1 | High | CONFIRMED | init.ts |
| 12.2 | Low | CONFIRMED | init.ts |
| 12.3 | Low | CONFIRMED | trips.ts |
| 12.4 | Critical | DUPLICATE | operator.ts |
| 13.1 | Medium | CONFIRMED | schema.prisma |
| 13.2 | Medium | CONFIRMED | schema.prisma |
| 13.3 | Low | CONFIRMED | schema.prisma |
| 13.4 | High | CONFIRMED | schema.prisma |
| 13.5 | High | CONFIRMED | schema.prisma |
| 14.1 | Medium | CONFIRMED | search-service.ts |
| 14.2 | Low | CONFIRMED | search.ts |
| 14.3 | Medium | CONFIRMED | search-service.ts |
| 14.4 | Low | PARTIALLY | page.tsx |
| 14.5 | Low | CONFIRMED | search-results.tsx |
| 15.1 | High | CONFIRMED | dashboard-view.tsx |
| 15.2 | High | CONFIRMED | sessions-panel.tsx |
| 15.3 | Medium | PARTIALLY | apps/app |
| 16.1 | Low | CONFIRMED | operator-signup-form.tsx |
| 16.2 | Low | CONFIRMED | signup-form.tsx |
| 16.3 | Low | CONFIRMED | login-form.tsx |
| 16.4 | Low | CONFIRMED | auth views |
| 17.1 | High | CONFIRMED | invitation-view.tsx |
| 17.2 | High | PARTIALLY | invitation.ts |
| 17.3 | High | NOT CONFIRMED | invite-role-badge.tsx |
| 18.1 | Critical | PARTIALLY | apps/app |
| 18.2 | Low | CONFIRMED | app.json |
| 18.3 | High | PARTIALLY | auth-client.ts |
| 19.1 | Medium | CONFIRMED | tRPC routers |
| 19.2 | Low | CONFIRMED | packages/config |
| 19.3 | Medium | CONFIRMED | seed.ts |
| 20.1 | Low | CONFIRMED | operator-settings-view.tsx |
| 20.2 | Low | CONFIRMED | operator-trips-view.tsx |
| 20.3 | Medium | CONFIRMED | fleet/page.tsx |
| 21.1 | High | CONFIRMED | operator-settings-view.tsx |
| 21.2 | Medium | PARTIALLY | auth setup |
| 21.3 | High | CONFIRMED | auth-server.ts |
| 21.4 | Low | CONFIRMED | staff.ts |
| 22.1 | Medium | CONFIRMED | useOperatorOnboarding.ts |
| 22.2 | High | CONFIRMED | operator.ts |
| 22.3 | Low | CONFIRMED | invite-role-badge.tsx |
| 22.4 | Low | CONFIRMED | search-service.ts |
| 23.1 | Medium | CONFIRMED | operator-onboarding-view.tsx |
| 23.2 | Medium | CONFIRMED | multiple |
| 23.3 | Low | CONFIRMED | seat-map-preview.tsx |
| 23.4 | Low | CONFIRMED | operator-schedules-view.tsx |
| 23.5 | Medium | CONFIRMED | multiple |
| 23.6 | Low | CONFIRMED | operator-fleet-view.tsx |
| 24.1 | Critical | CONFIRMED | auth-email.ts |
| 24.2 | Critical | CONFIRMED | general |
| 24.3 | Critical | CONFIRMED | general |
| 24.4 | Critical | CONFIRMED | dashboard routes |
| 24.5 | Critical | CONFIRMED | passenger pages |
| 24.6 | Medium | CONFIRMED | schema.prisma |
| 24.7 | Medium | CONFIRMED | schema.prisma |
| 24.8 | Medium | CONFIRMED | general |
| 24.9 | High | CONFIRMED | operator-dashboard-view.tsx |
| 25.1 | Medium | CONFIRMED | operator views |
| 25.2 | High | CONFIRMED | tRPC routers |
| 25.3 | High | CONFIRMED | apps/api |
| 25.4 | Low | CONFIRMED | api-client |
| 25.5 | Low | CONFIRMED | operator-onboarding-view.tsx |
| 25.6 | High | CONFIRMED | operator.ts |
| 25.7 | High | CONFIRMED | operator-schedules-view.tsx |
| 25.8 | Medium | CONFIRMED | seed.ts |
| 25.9 | Medium | CONFIRMED | init.ts |
| 25.10 | High | CONFIRMED | operator-dashboard-view.tsx |
| A.1 | Critical | CONFIRMED | operator-settings-view.tsx |
| A.2 | Critical | CONFIRMED | operator-routes-view.tsx |
| A.3 | Critical | CONFIRMED | terminals.ts |
| A.4 | High | CONFIRMED | fleet.ts |
| A.5 | High | PARTIALLY | operator-fleet-view.tsx |
| A.6 | High | CONFIRMED | schedules.ts |
| A.7 | High | CONFIRMED | staff.ts |
| A.8 | High | CONFIRMED | operator.ts |
| A.9 | High | CONFIRMED | operator-settings-view.tsx |
| A.10 | High | PARTIALLY | operator-sidebar.tsx |
| A.11 | Medium | CONFIRMED | schema.prisma |
| A.12 | Medium | CONFIRMED | operator-schedules-view.tsx |
| A.13 | Medium | CONFIRMED | routes.ts |
| A.14 | Medium | PARTIALLY | settings/page.tsx |
| A.15 | Low | CONFIRMED | staff/page.tsx |
| B.1–B.19 | Medium | CONFIRMED | schema.prisma + UI |
| C.1 | High | CONFIRMED | onboarding/page.tsx |
| C.2 | Medium | CONFIRMED | operator pages |
| C.3 | Medium | CONFIRMED | operator-settings-view.tsx |
| C.4 | Medium | CONFIRMED | trips.ts |
| C.5 | Medium | CONFIRMED | seat-map-preview.tsx |
| C.6 | Low | CONFIRMED | operator-trips-view.tsx |
| C.7 | Low | CONFIRMED | schedules.ts |
| C.8 | Low | CONFIRMED | routes.ts |
| C.9 | Low | CONFIRMED | operator page.tsx |
| C.10 | Low | CONFIRMED | onboarding/page.tsx |

---

## Merged Priority Fix Order

Deduplicated from both audit reports. Verification status noted for top items.

### Immediate — Block Production Launch

1. Implement real email provider (`auth-email.ts`) — **24.1 CONFIRMED**
2. Implement real file upload; remove `FakeUploadAdapter` — **1.10, 1.11, 10.2 CONFIRMED**
3. Fix Settings `DocumentType` enum mismatch — **A.1 CONFIRMED**
4. Fix `updateCompany` to accept partial updates (`companyStepSchema.partial()`) — **10.3, 12.4 CONFIRMED**
5. Wrap `OperatorSidebar` and `SeatMapFetcher` in `<Suspense>` — **11.1, 4.2 CONFIRMED**
6. Fix hardcoded `callerRole = "OWNER"` — **9.2 CONFIRMED**
7. Implement password verification on `transferOwnership` — **9.1 CONFIRMED**
8. Send staff invitation emails — **9.3 CONFIRMED**
9. Guard `deleteBus` against active/future trips — **4.3 CONFIRMED**
10. Guard terminal delete against route/trip dependencies — **8.4 CONFIRMED**
11. Verify `defaultBusId` company ownership in `regenerateTrips` — **1.8 CONFIRMED**
12. Replace settings verification submit with tRPC — **10.1 CONFIRMED**
13. Fix `assignBusDriver` bus lookup (use `findFirst` with companyId) — **1.9 PARTIALLY CONFIRMED**
14. Enforce or remove `isTerminal` promotion semantics — **A.3 CONFIRMED**
15. Add route edit/detail UI — **A.2 CONFIRMED**

### High Priority — Before Beta

16. Encrypt or vault bank account fields — **3.4 CONFIRMED**
17. Replace `z.any()` with static Zod schemas on all routers — **25.2 CONFIRMED**
18. Replace dynamic schema imports with static imports — **19.1 CONFIRMED**
19. Add `useEffect` cleanup in `ManifestDrawer` — **7.1 CONFIRMED**
20. Parallelize sequential `prefetch` calls — **20.3, C.10 CONFIRMED**
21. Wrap route waypoint updates in `$transaction` — **5.5 CONFIRMED**
22. Debounce fare price `onChange` handler — **1.13, 25.7 CONFIRMED**
23. Clear `fares` when schedule route changes — **1.1 PARTIALLY CONFIRMED**
24. Fix UTC/local date handling in trip generator — **1.2 CONFIRMED**
25. Onboarding back-navigation: auto-save or confirm dialog — **1.3 CONFIRMED**
26. Fix verification/status UI (`A.9`, `A.10`, `25.10`) — **CONFIRMED**
27. Persist terms/commission/privacy acceptance — **A.8 CONFIRMED**
28. Build service exception mutations + UI — **A.6 CONFIRMED**
29. Add route edit UI and reconcile stale trips on route change — **A.2, C.8 CONFIRMED**
30. Add `SidebarTrigger` to Settings and Terminals pages — **A.14 PARTIALLY CONFIRMED**
31. Add onboarding auth/role guard — **C.1 CONFIRMED**
32. Log staff actions to activity feed — **A.7 CONFIRMED**
33. Expose `RETIRED` bus status in UI — **A.5 PARTIALLY CONFIRMED**
34. Add custom seat layout creation — **A.4 CONFIRMED**

### Medium / Polish (Post-Beta)

35. Part B field surfacing (document status, bank verified, trip notes, etc.)
36. Part C design-system cleanup (headers, titles, settings URL tabs)
37. Accessibility pass (aria labels, color+text status, DnD announcements)
38. Remove deprecated `apps/api` and `@moja/api-client` after migration
39. Split monolithic view files — **25.1 CONFIRMED**
40. Mobile passenger features (search, booking, tickets) — **18.1 PARTIALLY CONFIRMED**

---

*End of combined verified audit. No code changes were made during this verification pass.*
