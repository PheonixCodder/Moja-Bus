# Phase 7 — Low Priority Issues

**Priority:** P3 — Polish & Cleanup  
**Issues:** L1–L15  
**Rationale:** These issues are acceptable for initial scale-out but should be resolved before the platform reaches significant volume. They cover performance optimization, accessibility, UX consistency, and technical debt cleanup.

---

## L1 — Trip `get` heavy seats+bookings

| Item | Detail |
|------|--------|
| **Location** | `trips.get` |
| **Problem** | The trip manifest query loads the full seat map and all bookings in a single query. At scale (60-seat bus, 60 bookings), this is a large payload. |
| **Side Effect** | Slow manifest drawer open on high-traffic days. Risk of timeout on large trips. |
| **Fix** | Split into two queries: (a) `trips.getManifest` for confirmed bookings (used by the manifest drawer), (b) `trips.getSeatMap` for the seat visualization (loaded lazily when the seat tab is opened). |
| **Side Effect Fix** | Update the manifest drawer to use the split queries. Lazy-load seat map on tab switch. |
| **Status** | ✅ Resolved — `trips.get` split into `getManifest` (manifest drawer) + lazy `getSeatMap` (Seat Map tab); the manifest now opens without loading the full seat map. |

---

## L2 — Check-in race mostly idempotent

| Item | Detail |
|------|--------|
| **Location** | `operator-booking-service.ts → checkIn` |
| **Problem** | Two simultaneous check-in scans of the same ticket can both succeed — both set `boardedAt` to slightly different timestamps. |
| **Side Effect** | Duplicate check-in entries in the audit log. Minor UX inconsistency (two success toasts on different devices). |
| **Fix** | Use a conditional `updateMany`: `WHERE bookingId = X AND boardedAt IS NULL`. If count is 0, the passenger is already checked in — return a "Already checked in" response (not an error). |
| **Side Effect Fix** | Show "Already checked in at HH:MM" instead of an error on duplicate scan. |
| **Status** | ✅ Resolved — `booking.updateMany` in `operator-booking-service.ts` already includes `checkedInAt: null` in its WHERE and returns `alreadyCheckedIn: true` when 0 rows match, so concurrent scans are idempotent. |

---

## L3 — Trip cancel Novu amount may overstate

| Item | Detail |
|------|--------|
| **Location** | `lib/cancel-trip-with-refunds.ts` |
| **Problem** | Novu notification payload uses `refundResult?.amountXOF ?? 0`. If the refund failed (amountXOF is 0 but the booking is cancelled), the passenger receives "Your refund: 0 XOF" which is confusing — should say "Refund processing failed, contact support." |
| **Side Effect** | Passenger thinks they got a 0 XOF refund and are confused or upset. |
| **Fix** | In the Novu payload: if `refundResult.success === false`, set `refundStatus: "failed"` and omit `refundAmountXOF`. Update the Novu workflow template to handle the `failed` status with appropriate copy. |
| **Side Effect Fix** | Update the `passenger-trip-cancelled` Novu workflow in the Novu dashboard. |
| **Status** | ✅ Resolved — Novu payload now sends `refundStatus: "success" | "failed"` and omits `refundAmountXOF` on failure (`cancel-trip-with-refunds.ts:179-202`), so passengers no longer see a misleading "0 XOF" refund. The `passenger-trip-cancelled` Novu template must render the `failed` status copy. |

---

## L4 — Settings/notifications section incomplete

| Item | Detail |
|------|--------|
| **Location** | `operator-settings-view.tsx` |
| **Problem** | The notifications section in settings may not reflect the actual schema fields. Some toggles may not save or may save to non-existent fields. |
| **Side Effect** | Operators configure notifications but nothing changes. Trust in the settings page is damaged. |
| **Fix** | Audit each notification toggle against the DB schema and Novu workflow. Remove toggles that don't have backend support. Add a "coming soon" badge to incomplete toggles. |
| **Side Effect Fix** | Ensure all saved preferences are actually used to gate Novu workflow delivery. |
| **Status** | ✅ Resolved — Notification settings render Novu's hosted `<Preferences />` component (`operator-settings-view.tsx` → `notification-preferences.tsx`), which persists preferences to Novu and gates delivery. No custom toggles writing to non-existent fields; the audit's concern does not apply. |

---

## L5 — Operator search dialog coverage gaps

| Item | Detail |
|------|--------|
| **Location** | Operator search command dialog |
| **Problem** | The search dialog (if present) doesn't index all operator entities — some trips, bookings, or staff may not appear in search results. |
| **Side Effect** | Operators cannot find records by name/ID via search — must navigate manually. |
| **Fix** | Audit what entities are indexed. Add missing entities (bookings by reference, trips by route name, staff by name/email). |
| **Side Effect Fix** | None — additive feature. |
| **Status** | ✅ Resolved — `operator.globalSearch` (bookings by ref/name/phone, trips by route, staff by name/email, all IAM-gated) wired into the command palette with debounced server search and Bookings/Trips/Staff result groups. |

---

## L6 — Missing export CSV on bookings/revenue

| Item | Detail |
|------|--------|
| **Location** | `operator-bookings-view.tsx`, `operator-revenue-view.tsx` |
| **Problem** | No CSV export for bookings or revenue data. Operators cannot do their own reconciliation. |
| **Side Effect** | Operators use screenshots or manual entry for accounting. Revenue reconciliation with external accountants is impossible. |
| **Fix** | Add a `trpc.operator.exportBookings` and `trpc.operator.exportRevenue` procedure that returns a CSV string (or streams a file via API route). Add export buttons to the views. |
| **Side Effect Fix** | This is also listed as a new feature (F2) — implement here as part of Phase 7 or move to new features. |
| **Status** | ✅ Resolved — `exportBookingsCsv` and `exportLedgerCsv` procedures exist and are wired to download buttons in the bookings and ledger views (F2). |

---

## L7 — Missing bulk check-in / bulk cancel

| Item | Detail |
|------|--------|
| **Location** | `operator-trips-view.tsx` manifest |
| **Problem** | No way to check in all passengers at once or cancel multiple bookings in bulk. Each must be done one at a time. |
| **Side Effect** | For full buses (60 passengers), individual check-in takes significant time at boarding. |
| **Fix** | Add "Check In All" button on the manifest (marks all `CONFIRMED` bookings as boarded). Add multi-select with bulk cancel option (with confirmation). |
| **Side Effect Fix** | Also listed as new feature (F7) — implement here or in new features. |
| **Status** | ✅ Resolved — `bulkCheckInBookings`/`bulkCancelBookings` mutations (idempotent check-in + per-booking refunds) + manifest drawer toolbar (Check In All, multi-select, bulk cancel with reason). |

---

## L8 — Accessibility: combobox/drawer labels incomplete

| Item | Detail |
|------|--------|
| **Location** | Multiple components (bus assign combobox, manifest drawer, cancel dialog) |
| **Problem** | Some interactive elements lack proper `aria-label`, `aria-expanded`, or focus trapping. Screen reader users cannot operate the operator dashboard. |
| **Side Effect** | WCAG non-compliance. Excludes operators with disabilities. |
| **Fix** | Audit all comboboxes, drawers, and dialogs with an accessibility scanner (e.g., axe-core). Add missing ARIA attributes. Ensure focus is trapped in modals. Test with keyboard navigation. |
| **Side Effect Fix** | None — purely additive. |
| **Status** | ✅ Resolved — aria-labels added to the bus-assign combobox + single/bulk cancel-reason inputs; the manifest Drawer is now `modal` (focus trap + ESC/scroll-lock). The ticket scanner is a separate Radix Dialog, so there is no nesting conflict. |

---

## L9 — Missing skeletons on several pages (fallback={null})

| Item | Detail |
|------|--------|
| **Location** | Multiple pages using `<Suspense fallback={null}>` |
| **Problem** | Pages with `fallback={null}` show blank content during data loading. Users don't know if data is loading or if there's nothing to show. |
| **Side Effect** | Poor UX on slow connections. Users may click away thinking the page is broken. |
| **Fix** | Replace `fallback={null}` with appropriate skeleton components. Use `<Skeleton>` from the UI package for lists, tables, and cards. |
| **Side Effect Fix** | None — purely visual improvement. |
| **Status** | ✅ Resolved — No `<Suspense fallback={null}>` remains; operator/admin pages use dedicated skeleton fallbacks (`OperatorTripsViewFallback`, `SectionSkeleton`, etc.). |

---

## L10 — context docs partially stale vs post-trips-P0

| Item | Detail |
|------|--------|
| **Location** | `context/progress-tracker.md`, `context/build-plan.md` |
| **Problem** | Context docs were written before the trips P0 remediations. They reference issues as open that have since been fixed. |
| **Side Effect** | New agents reading context docs may re-open fixed issues or implement duplicate fixes. |
| **Fix** | Update `context/progress-tracker.md` and `context/build-plan.md` to reflect current state. Mark previously-fixed items as complete. Update with Phase 1–7 plan. |
| **Side Effect Fix** | Also update `memory.md` to reference the phase documents. |
| **Status** | ✅ Resolved — `tracker.md`, `phase-7-low-issues.md`, and `memory.md` updated to reflect actual code state (L1/L5/L7 were implemented but previously listed ⬜). |

---

## L11 — Reviews model unused in operator UI

| Item | Detail |
|------|--------|
| **Location** | DB schema `Review` model |
| **Problem** | `Review` model exists in the schema (passengers can leave reviews) but there is no operator UI to read, respond to, or manage reviews. |
| **Side Effect** | Reviews accumulate in the DB but operators are unaware. Negative reviews go unaddressed. |
| **Fix** | Add a "Reviews" tab to the operator dashboard with: average rating, recent reviews, ability to respond. |
| **Side Effect Fix** | This is primarily a new feature — add to the new-features backlog (F11 equivalent). Mark as L11 to track the DB model is ready. |
| **Status** | ✅ Resolved — `Review.response`/`respondedAt` added to the schema (generated + pushed); `operator.listReviews`/`respondToReview` procedures + a Reviews nav item, page, and view (average rating, distribution, respond/edit). |

---

## L12 — TripStop actualArrival/Departure unused

| Item | Detail |
|------|--------|
| **Location** | `schema.prisma TripStop` |
| **Problem** | `TripStop.actualArrival` and `actualDeparture` fields exist for real-time tracking but are never written. |
| **Side Effect** | Live trip tracking (real-time ETA, stop-by-stop progress) is impossible without these fields. Passenger apps cannot show "Bus is at stop 3 of 5." |
| **Fix** | This is primarily a future operations tracking feature. For now, document that these fields are reserved for the live tracking system. No immediate code change. |
| **Side Effect Fix** | None in current phase. |
| **Status** | ✅ Resolved — `actualArrival`/`actualDeparture` are now written (trip status transitions + `release-escrow` H2 backfill) and rendered in the admin trip-audit timeline. |

---

## L13 — SeatStatus enum vs TripSeat.isActive duality

| Item | Detail |
|------|--------|
| **Location** | `schema.prisma SeatStatus`, `TripSeat.isActive` |
| **Problem** | Two overlapping concepts: a `SeatStatus` enum (AVAILABLE, OCCUPIED, BLOCKED) and `TripSeat.isActive` boolean. The UI primarily uses booking overlap to determine seat availability rather than either of these fields. This creates confusion about which field is authoritative. |
| **Side Effect** | Future developers may implement seat availability checks using the wrong field — causing double-booking or ghost availability. |
| **Fix** | Document the authoritative availability model: a seat is available if `TripSeat` exists AND no `CONFIRMED` or `PENDING_PAYMENT` booking claims that seat for the trip. `SeatStatus` enum should be deprecated or removed. `TripSeat.isActive` marks whether the physical seat is usable (e.g., broken seat blocked by operator). |
| **Side Effect Fix** | Add a comment in `schema.prisma` explaining the model. Update any code that reads `SeatStatus` to use the authoritative model. |
| **Status** | ✅ Resolved — `SeatStatus` enum marked DEPRECATED and `TripSeat.isActive` documented as physical-usability-only in `schema.prisma`; authoritative availability = TripSeat exists + no CONFIRMED/PENDING_PAYMENT booking overlap. No code references `SeatStatus`, so nothing to migrate. |

---

## L14 — Onboarding "bank complete" without recipient

| Item | Detail |
|------|--------|
| **Location** | Onboarding flow / `operator-onboarding-view.tsx` |
| **Problem** | The onboarding checklist may mark "Bank account added" as complete when the bank account number is saved but `paystackTransferRecipientCode` is null (not yet verified with Paystack). This gives a false sense of completion. |
| **Side Effect** | Operator thinks onboarding is done but their first withdrawal will fail (C8). |
| **Fix** | Update the onboarding check to require `bank.isVerified === true && bank.paystackTransferRecipientCode !== null` for the bank step to be marked complete. Show a sub-step: "Add bank account" → "Verify bank account." |
| **Side Effect Fix** | This also fixes the C8 user experience path — operators are prompted to verify before the first withdrawal. |
| **Status** | ✅ Resolved (Option A) — `getOnboardingStatus` now exposes `bankVerified` (isVerified && paystackTransferRecipientCode from the default bank); `BankStep` shows an honest two-stage sub-step ("Bank details added" → "Pending verification — withdrawals enabled after admin approval") without blocking the wizard. The literal audit guard would have frozen onboarding until admin KYC (recipients are admin-created), so the withdraw-side `bankVerified` gate is kept as the enforcement point. |

---

## L15 — withdrawPage 0-index confusion

| Item | Detail |
|------|--------|
| **Location** | `operator-withdraw-view.tsx` |
| **Problem** | The withdrawal history pagination uses 0-based page index internally but displays it as 1-based in the URL. This can cause off-by-one errors if the client and server disagree on the base. |
| **Side Effect** | Navigating to page 2 via URL `?page=2` may actually show page 3 data (if client sends `page - 1` to the server). |
| **Fix** | Standardize on 1-based page numbers in URL and API. Convert to 0-based internally only in the Prisma `skip` calculation: `skip = (page - 1) * pageSize`. Add a test: page=1 in URL → skip=0 in DB query. |
| **Side Effect Fix** | Check all other pagination implementations in the app for the same issue. |
| **Status** | ✅ Resolved — Withdrawal pagination uses a 1-based `withdrawPage` URL param and converts to a 0-based DB offset (`currentPage = currentPageParam - 1`); display math is correct. |
