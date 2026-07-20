# Phase 5 — Business Rules & Operational Correctness

**Priority:** P1 — GA Gate  
**Issues:** H2, H3, H4, H5, H6, H7, H8, H15, H17, H18, H20, H24, H25  
**Rationale:** These issues cause incorrect data display, wrong financial calculations, race conditions in core operations, and language/timezone violations. All must be resolved before GA to ensure operators can trust the numbers they see and the operations they perform.

---

## H2 — Escrow stuck when ARRIVED without actualArrival

### What Is Wrong
The `release-escrow` cron filters trips with `actualArrival: { lt: new Date(now - 24h) }`. If a trip reaches status `ARRIVED` without `actualArrival` being set (via a bug in `trips.updateStatus`), the cron never releases the escrow. The operator's `reservedBalance` is permanently locked.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-withdraw-view.tsx` | `reservedBalance` shows the stuck amount as "in escrow." Operator cannot withdraw it. |
| `operator-revenue-view.tsx` | Revenue shows the booking as confirmed but not cleared — looks like outstanding revenue. |
| `release-escrow cron` | Silent failure — no alert, no log beyond the initial booking exclusion. |
| `trips.updateStatus → ARRIVED` | If the UI sets `ARRIVED` via a fast-click without proper actualArrival, this creates the stuck state. |

### How to Fix the Issue
1. In `trips.ts → updateStatus`: when transitioning to `ARRIVED`, enforce that `actualArrival` is set:
   ```ts
   if (newStatus === "ARRIVED") {
     updateData.actualArrival = new Date();
   }
   ```
   This ensures `actualArrival` is always written on the `ARRIVED` transition.
2. In `release-escrow/route.ts`: add a fallback query for trips that are `ARRIVED` but have `actualArrival: null` for more than 48 hours — alert ops and use `updatedAt` as a fallback timestamp.
3. Add a one-time data fix: find all existing `ARRIVED` trips with `actualArrival: null` and set `actualArrival = updatedAt` (the time the status was set to ARRIVED).

### How to Fix Each Side Effect
- **Withdraw view:** Once `actualArrival` is set (via data fix), the cron will release escrow on the next run.
- **Revenue view:** The `clearedAt` field will be set by the cron after release — the booking will appear as "cleared" in revenue.

---

## H3 — Escrow fallback uses gross farePaidSum when snapshot missing

### What Is Wrong
In `release-escrow/route.ts`, when `snapshot` is null, `computeEscrowReleaseNet` returns `null`. The cron skips the hold group and logs an error (`skipped += hg.bookingIds.length`). However, the audit previously noted a fallback using gross `farePaidSum`. 

**Reading current code:** The cron now correctly returns `null` and skips — this appears fixed. But there may still be scenarios where `snapshot` is null for older bookings (pre-snapshot feature). In that case, the cron skips those bookings indefinitely — operators never get paid for them.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-withdraw-view.tsx` | `reservedBalance` permanently shows old amounts for bookings without snapshots. |
| `release-escrow cron` | `skipped` count grows each run. No operator notification. |
| `packages/db/src/services/SnapshotService.ts` | Snapshots should be created at booking confirmation time. If they weren't (due to a bug or pre-feature booking), no retroactive fix exists without backfilling. |

### How to Fix the Issue
1. Create a backfill script for bookings without a `pricingSnapshot`: compute `operatorNetXOF` from `farePaid * (1 - commissionRate)` using the platform settings at the time of booking.
2. Add an ops alert metric: whenever `skipped > 0` after a cron run, write to a monitoring table or send a Novu ops notification.
3. Document the SLA: if a snapshot is missing after 7 days, trigger a manual review.

### How to Fix Each Side Effect
- **Withdraw view:** After backfill, the cron releases the held amounts and `reservedBalance` decreases.
- **Cron:** Add a metric/log tag so the `skipped` count is visible in observability tools.

---

## H4 — Withdraw posts ledger success before Paystack ack; catch never reverses

### What Is Wrong
`trpc/routers/operator.ts → requestWithdrawal` posts the debit ledger entry (reducing `availableBalance`) and then calls Paystack's Transfer API. If Paystack returns a network error or definitive rejection, the catch block marks the withdrawal as `PENDING` or `FAILED` — but the ledger debit has already been committed. The operator's `availableBalance` is reduced without a corresponding transfer being initiated.

Additionally, the metadata update overwrites the entire `metadata` JSON field, losing the `requestedBy` field set during the initial withdrawal record creation.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-withdraw-view.tsx` | Withdrawal shows as `PENDING` but `availableBalance` is already reduced. Operator sees lower balance than expected. |
| `operator-revenue-view.tsx` | Ledger shows a WITHDRAWAL debit, but Paystack never transferred the money. |
| `docs/payment_system.md` | Claims immediate reversal on hard reject — this is inaccurate per the current code. |
| Ops reconciliation | No way to distinguish "pending Paystack transfer" from "failed Paystack transfer" in the ledger without checking the withdrawal status table. |
| `release-escrow cron` | Escrow release increases `availableBalance` — operators with stuck failed withdrawals appear to have available balance, but when they retry the withdrawal, the debit is posted again. |

### How to Fix the Issue
1. **State machine approach:** Create withdrawal in `PENDING_TRANSFER` state first (before ledger). Post the ledger debit **only** after Paystack acknowledges the transfer (webhook or synchronous success response).
2. **For network errors:** Keep the withdrawal in `PENDING_TRANSFER` — a reconciliation cron checks Paystack transfer status and either posts the ledger (on success) or marks failed (on definitive rejection) and reverses.
3. **For definitive Paystack rejection (invalid account, etc.):** Mark withdrawal `FAILED` and credit the amount back via a `WITHDRAWAL_REVERSAL` ledger entry.
4. **Metadata:** Use `JSON.stringify({...existingMetadata, ...newFields})` when updating metadata — never overwrite the full object.

### How to Fix Each Side Effect
- **Withdraw view:** Show withdrawal status as `PENDING_TRANSFER` until Paystack confirms. Do not deduct from displayed balance until confirmed.
- **Revenue ledger:** Only show WITHDRAWAL entry after Paystack confirmation.
- **payment_system.md:** Update to describe the actual state machine.

---

## H5 — Withdraw UI escrow = posted − available not liveReservedBalance

### What Is Wrong
`operator-withdraw-view.tsx` displays "In Escrow" as `postedBalance - availableBalance` computed client-side. This is incorrect when the three buckets (`posted`, `available`, `reserved`) are not in sync — which can happen after failed withdrawals, partial releases, or bugs from C1/C2.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-withdraw-view.tsx` | Operator sees wrong escrow amount — could be negative (after a withdrawal reduces `available` below `posted - reserved`) or inflated. |
| `operator-revenue-view.tsx` | KPI cards on revenue use the same snapshot — may show inconsistent data. |
| Operator trust | Operators use the escrow figure to estimate when funds will be available. Wrong escrow erodes trust. |

### How to Fix the Issue
1. In `operator-withdraw-view.tsx`: replace the client-side calculation `postedBalance - availableBalance` with the server-returned `reservedBalance` field from `getAccountSnapshot`.
2. Add a consistency check: if `posted !== available + reserved`, show a warning banner: "Your balance is being reconciled. Please check back in a few minutes."
3. Ensure `getAccountSnapshot` returns `reservedBalance` as a string (not `Number(bigint)`) — see H25.

### How to Fix Each Side Effect
- **Revenue view:** Use the same live snapshot field for KPI cards.
- **Operator trust:** Add a tooltip explaining what "In Escrow" means and when it releases.

---

## H6 — trips.list q applied after pagination

### What Is Wrong
`trpc/routers/trips.ts → list` applies the search query `q` as an in-memory filter after Prisma returns paginated results. This means:
- Page 1 returns 20 trips → filter by `q` → only 3 match → page 1 shows 3 trips.
- Page 2 returns the next 20 trips → filter → 0 match.
- Total count is wrong because it counts post-filter, not total matching records.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-trips-view.tsx` | "Showing 3 of 47 trips" is wrong — should be "Showing 3 of N matching trips." Pagination is broken for search. |
| URL state (`nuqs`) | `page` parameter in URL is meaningless when `q` is active — different pages may return the same matches. |
| `apps/web/app/dashboard/operator/(dashboard)/trips/page.tsx` | Server-side prefetch uses the same `q` param — same bug on initial load. |
| Operator search UX | Operators searching for a trip by plate number or route see seemingly random results spread across pages. |

### How to Fix the Issue
1. Move the `q` filter into the Prisma `where` clause:
   ```ts
   where: {
     companyId: ctx.companyId,
     ...(q ? {
       OR: [
         { schedule: { route: { originTerminal: { cityRelation: { name: { contains: q, mode: "insensitive" } } } } } },
         { schedule: { route: { destTerminal: { cityRelation: { name: { contains: q, mode: "insensitive" } } } } } },
         { bus: { plateNumber: { contains: q, mode: "insensitive" } } },
       ]
     } : {}),
   }
   ```
2. Use `prisma.trip.count({ where })` with the same filter to get accurate total counts.
3. Remove the post-fetch in-memory filter.

### How to Fix Each Side Effect
- **Operator trips view:** Pagination becomes accurate — "Showing X of N" is correct.
- **URL state:** `page` parameter now works correctly with `q`.
- **Server prefetch:** Update `trips/page.tsx` to pass `q` in the server prefetch call.

---

## H7 — assignBus no status guard + TOCTOU

### What Is Wrong
`trpc/routers/trips.ts → assignBus` allows bus assignment on trips in any status (including `DEPARTED`, `ARRIVED`, `CANCELLED`). Additionally, the bus compatibility check (verifying seat counts match) happens outside the transaction that updates the trip — a concurrent request could change the bus's status between the check and the assignment.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-trips-view.tsx` | Bus can be reassigned on a departed/arrived trip. Historical record is incorrect. |
| `TripSeat` table | `TripSeat` rows are based on the originally assigned bus's seats. Reassigning a bus after departure doesn't update `TripSeat` — seat map becomes inconsistent. |
| Booking / check-in | Check-in reads seat assignments. If bus is swapped, the seat a passenger booked may not exist on the new bus. |
| `release-escrow cron` | Escrow is tied to the booking, not the bus — no direct escrow impact, but historical integrity is compromised. |

### How to Fix the Issue
1. In `trips.ts → assignBus`: add a status guard:
   ```ts
   const allowedStatuses = ["SCHEDULED", "BOARDING", "DELAYED"];
   if (!allowedStatuses.includes(trip.status)) {
     throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot reassign bus after departure." });
   }
   ```
2. Move the bus compatibility check **inside** the `$transaction` with a `SELECT ... FOR UPDATE` on the trip row.
3. When reassigning, also update `TripSeat` rows: delete existing `TripSeat` rows and create new ones from the new bus's seats (only if no bookings exist yet — if bookings exist, block the reassignment).

### How to Fix Each Side Effect
- **TripSeat:** The fix above handles seat map updates.
- **Booking / check-in:** Blocked reassignment when bookings exist prevents inconsistency.
- **Operator UI:** Show a warning if bookings exist: "This trip has bookings. Bus reassignment is blocked to prevent seat conflicts."

---

## H8 — Check-in ignores trip status; token lookup global then FORBIDDEN

### What Is Wrong
`operator-booking-service.ts → checkIn` does not verify that the trip is in `BOARDING` status before allowing check-in. An operator can check in passengers on a `SCHEDULED` (not yet boarding), `DEPARTED` (already left), or even `CANCELLED` trip.

Additionally, the booking lookup by `ticketToken` or `bookingReference` is done globally (no `companyId` filter) before the company check. This creates a cross-tenant existence oracle: if a booking exists for a different company, the FORBIDDEN error reveals that the token/reference is valid — just for a different company.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-trips-view.tsx` | Check-in button is available regardless of trip status. Operators can scan tickets on the wrong trip. |
| `Booking.boardedAt` | If boardedAt is set on a cancelled trip, the historical record is corrupted. |
| Cross-tenant leak | Scanning a ticket from Company B on Company A's scanner reveals whether the ticket exists (FORBIDDEN vs NOT_FOUND). |
| `operator-revenue-view.tsx` | If boardedAt is never written (M5), check-in has no observable revenue impact — but fixing H8 requires fixing M5 too for check-in to be meaningful. |

### How to Fix the Issue
1. **Status guard:** In `checkIn`, load the trip first and assert `trip.status === "BOARDING"`:
   ```ts
   if (trip.status !== "BOARDING") {
     throw new TRPCError({ code: "BAD_REQUEST", message: "Check-in is only available when the trip is boarding." });
   }
   ```
2. **Company-scoped lookup:** Change the booking lookup to filter by `companyId` first:
   ```ts
   const booking = await prisma.booking.findFirst({
     where: { 
       OR: [{ ticketToken: token }, { bookingReference: ref }],
       companyId: ctx.companyId,  // scope to company first
     },
   });
   if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found." });
   // No FORBIDDEN for cross-tenant — just NOT_FOUND
   ```
3. Set `boardedAt = new Date()` on successful check-in (fixing M5 simultaneously).

### How to Fix Each Side Effect
- **Operator UI:** Grey out the check-in button when trip is not in `BOARDING` status. Show tooltip: "Trip must be in Boarding status to check in passengers."
- **Cross-tenant oracle:** The company-scoped lookup returns `NOT_FOUND` for all non-owned bookings, closing the oracle.

---

## H15 — Revenue analytics UTC buckets + full-table load + refund undercount

### What Is Wrong
`trpc/routers/operator.ts → getRevenueAnalytics` has three problems:
1. **UTC buckets:** Day aggregation uses `toISOString().split("T")[0]` — this is UTC. In Abidjan (UTC+0, no DST), this usually matches, but during edge cases (midnight local time) it can shift days.
2. **Full-table load:** Loads all `CONFIRMED` bookings in the date range via `findMany` — no SQL aggregation. At scale (thousands of bookings), this will timeout.
3. **Refund undercount:** Counts refunds via `entries[0]` — only the first ledger entry. Multi-seat cancellations have multiple entries.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-revenue-view.tsx` | Daily revenue chart shows wrong day assignments near midnight. Wrong refund amounts. Memory/timeout at scale. |
| `apps/web/app/dashboard/operator/(dashboard)/revenue/page.tsx` | Server prefetch of analytics can timeout on large date ranges, causing 504 errors. |
| Operator trust | Revenue numbers that don't match bank statements destroy operator confidence in the platform. |

### How to Fix the Issue
1. **UTC → Abidjan:** Use `getCalendarDateKey(date)` from `lib/timezone.ts` for all day-bucketing.
2. **SQL aggregation:** Replace `findMany` + in-memory groupBy with a `groupBy` Prisma query or a `$queryRaw` SQL aggregate:
   ```ts
   const dailyRevenue = await prisma.$queryRaw`
     SELECT DATE_TRUNC('day', "issuedAt" AT TIME ZONE 'Africa/Abidjan') as day,
            SUM("farePaid") as total
     FROM "booking"
     WHERE "companyId" = ${companyId}
       AND "status" = 'CONFIRMED'
       AND "issuedAt" >= ${startDate}
       AND "issuedAt" < ${endDate}
     GROUP BY 1
     ORDER BY 1
   `;
   ```
3. **Refund counting:** Sum all `REFUND` ledger entries (not just first) for the date range.
4. Add cursor-based pagination if the date range is large (>90 days).

### How to Fix Each Side Effect
- **Revenue view:** Once SQL aggregation is in place, chart data loads in milliseconds regardless of booking count.
- **Page prefetch:** Timeout risk is eliminated.

---

## H17 — Search/booking formatters use fr-FR + UTC

### What Is Wrong
`features/search/lib/format.ts` uses `toLocaleString("fr-FR", { timeZone: "UTC" })` for time formatting. The product rule is English UI + Abidjan timezone. This causes:
- French number formatting (1 000 vs 1,000).
- UTC times shown to passengers (Abidjan is UTC+0 but this can differ during edge cases).
- Operator booking views (which share these formatters) show French-formatted numbers.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `features/search/` | Trip departure times and prices shown in French locale. |
| `operator-bookings-view.tsx` | Uses the shared formatter — operator sees French-formatted booking amounts. |
| `features/booking/` | Booking confirmation page shows French-formatted fare. |
| Ticket PDF/QR | If the formatter is used in ticket generation, ticket shows French locale. |
| Language rule | AGENTS.md rule: "All user interface text must be strictly in English." This is a rule violation. |

### How to Fix the Issue
1. In `features/search/lib/format.ts`: replace all `"fr-FR"` with `"en-US"` and `"UTC"` with `"Africa/Abidjan"`.
2. Create a shared `lib/format.ts` with all formatting utilities and import from there throughout the app.
3. Use `lib/timezone.ts` helpers for date formatting.
4. Search the entire codebase for `"fr-FR"` and `"fr-CI"` and replace with `"en-US"` (except any intentional French-language content, which should not exist per the rules).

### How to Fix Each Side Effect
- After fixing `format.ts`, all consumers (search, bookings, tickets) automatically get correct formatting.
- Run a visual regression check on the booking and ticket flows.

---

## H18 — Schedules routeId nuqs unused; trips startDate/endDate unused

### What Is Wrong
`packages/schemas/src/` search param parsers define `routeId` for schedules and `startDate`/`endDate` for trips. The backend procedures accept these filters. But the UI views don't wire them up — the URL params are read by the parser but never passed to the tRPC query.

This means:
- Sharing a URL with `?routeId=xxx` on the schedules page shows all schedules (filter ignored).
- Sharing `?startDate=2026-07-20` on the trips page shows all trips.
- Deep-linked URLs lie about what the user is viewing.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-schedules-view.tsx` | `routeId` URL param is parsed but not passed to `trpc.schedules.list`. |
| `operator-trips-view.tsx` | `startDate`/`endDate` URL params are parsed but not passed to `trpc.trips.list`. |
| Shareable URLs | Any feature that generates a deep link (e.g., "View trips for this schedule") relies on these params — they don't work. |
| `apps/web/app/dashboard/operator/(dashboard)/trips/page.tsx` | Server prefetch doesn't use date range params — first load always shows all trips regardless of URL. |

### How to Fix the Issue
1. In `operator-schedules-view.tsx`: pass `routeId` from nuqs to the `trpc.schedules.list` input.
2. In `operator-trips-view.tsx`: pass `startDate`/`endDate` from nuqs to the `trpc.trips.list` input.
3. Add date range picker UI controls to the trips view toolbar (if not already present).
4. Add a route filter dropdown to the schedules view (if not already present).
5. Update server-side prefetch in the respective page files to include these params.

### How to Fix Each Side Effect
- **Shareable URLs:** Once the filters are wired, URLs become accurate.
- **Server prefetch:** Pass URL search params to the prefetch call using `searchParams` prop in the Server Component page.

---

## H20 — createBus ignores shared schema; busType vs layout mismatch

### What Is Wrong
`trpc/routers/fleet.ts → createBus` defines its own inline Zod schema that is weaker than `@moja/schemas/src/fleet.ts → createBusSchema`. The inline schema may not validate plate number format, year range, or capacity. Additionally, the `busTypeId` field is not validated against the layout template's bus type, allowing a layout for a 30-seat minibus to be assigned to a bus registered as a 60-seat coach.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-fleet-view.tsx` | Invalid plate numbers or years can be saved. No client-side or server-side validation error. |
| `trip-generator.ts` | Trip `totalSeats` is set from `bus.seats.length` — if the layout doesn't match the bus type, the seat count is wrong. |
| Booking / seat map | Passengers see a seat map that doesn't match the actual vehicle. |
| `operator-schedule-view.tsx` | Schedule wizard matches bus type to fare class — if bus type is wrong, fare class matching is incorrect. |

### How to Fix the Issue
1. In `fleet.ts → createBus`: replace the inline Zod schema with `createBusSchema` from `@moja/schemas`.
2. After resolving `busTypeId`, verify `busLayout.busTypeId === bus.busTypeId`:
   ```ts
   const layout = await ctx.prisma.busLayout.findUnique({ where: { id: layoutId } });
   if (layout.busTypeId !== input.busTypeId) {
     throw new TRPCError({ code: "BAD_REQUEST", message: "Layout does not match the selected bus type." });
   }
   ```

### How to Fix Each Side Effect
- **Fleet view:** Validation errors appear client-side via the React form (Zod schema is already used for the form's resolver — just needs to match the server).
- **Trip generator:** Accurate `busTypeId` ensures correct seat count.
- **Seat map:** Correct layout is assigned — passengers see the right seats.

---

## H24 — Wallet pre-check outside posting transaction (TOCTOU)

### What Is Wrong
`booking-confirmation-service.ts → confirmFromWallet` reads `walletAcctPreview.availableBalance` **before** the transaction (line 244–246). Two parallel checkout requests for the same wallet can both pass this check, then both enter the transaction. Inside the transaction, the engine reads the wallet balance again under `FOR UPDATE` lock — so the second request will fail at the engine level. However, the pre-check still triggers a Novu "low balance" notification for the second request, which is a false alarm.

Additionally, the TOCTOU window means a very narrow race where both reads succeed and both proceed to the transaction — where the engine correctly rejects the second one, but the user sees an unexpected error.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `booking-confirmation-service.ts` | False "low balance" Novu notification sent to the passenger. |
| Passenger mobile app / email | Passenger receives a spurious "Your wallet balance is too low" notification even though the booking succeeded. |
| `operator-revenue-view.tsx` | No direct impact — the engine correctly rejects the second commit. |

### How to Fix the Issue
1. Remove the pre-check at lines 244–246 in `confirmFromWallet`.
2. Move the low-balance Novu trigger to the **catch block** of the `$transaction`:
   ```ts
   try {
     const confirmed = await this.prisma.$transaction(async (tx) => { ... });
   } catch (err) {
     if (err.message.includes("Insufficient funds")) {
       // Send low-balance notification here
     }
     throw err;
   }
   ```
3. This also fixes C7's side effect for the wallet path.

### How to Fix Each Side Effect
- **False notifications:** By moving the trigger to the catch block, notifications are only sent when the balance is actually insufficient.

---

## H25 — Number(bigint) on financial balances

### What Is Wrong
`packages/db/src/services/` and various UI-facing code paths use `Number(someBigInt)` to convert `BigInt` financial balances before returning them to the client or displaying them. JavaScript's `Number` type can only represent integers up to `2^53 - 1` (9,007,199,254,740,991). For financial amounts in XOF (no decimals), this limit would require a booking worth ~9 quadrillion XOF to overflow — extremely unlikely in practice.

However, the pattern is architecturally wrong because:
1. It sets a precedent that encourages future developers to use `Number()` everywhere.
2. tRPC serializes `BigInt` as `string` by default — if the conversion is missed, the client receives a string and breaks math operations.
3. Any code using `Number(bigint)` on values returned from Prisma (`$queryRaw`) may lose precision if the DB returns values as bigint.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-withdraw-view.tsx` | `availableBalance`, `reservedBalance` displayed as numbers — silent precision loss possible on very large values. |
| `operator-revenue-view.tsx` | Revenue totals converted to Number for chart rendering — same risk. |
| `packages/db/src/services/AccountingEngine.ts` | `$queryRaw` returns `bigint` columns — these are correctly kept as `BigInt` inside the engine, but callers may convert carelessly. |
| `booking-confirmation-service.ts` | Wallet balance check: `walletAcctPreview.availableBalance < BigInt(totalToPay)` — correct usage. |

### How to Fix the Issue
1. Establish a rule: financial balances must be serialized as **strings** (`balance.toString()`) at the API boundary (tRPC procedure output).
2. Define a `FinancialAmount` type: `type FinancialAmount = string` — all procedures return amounts as strings.
3. In UI components, parse amounts back to `BigInt` for comparison and `Number` only for display (after confirming the display value is within safe integer range for XOF amounts).
4. Search the codebase for `Number(` applied to balance/amount variables and replace each:
   - If used for display: wrap in a safe display helper `formatXOF(amount: bigint | string)`.
   - If used for comparison: use `BigInt(amount)`.
5. Update `getAccountSnapshot` return type to use string balances.

### How to Fix Each Side Effect
- **Withdraw view:** Update balance display components to accept `string` amounts.
- **Revenue view:** Chart libraries typically accept `number` — convert string → Number only for chart input, after asserting `Number.isSafeInteger(Number(amount))`.
