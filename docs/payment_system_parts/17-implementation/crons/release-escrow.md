# Cron: Release Escrow

[⬅️ Back to Crons Overview](./README.md)

---

**File:** `apps/web/app/api/cron/release-escrow/route.ts`

The `release-escrow` cron job is the engine that actually pays the operators. It shifts money from the `reservedBalance` (where it cannot be withdrawn) to the `availableBalance`.

## The Business Rule
Funds are held in escrow to protect passengers against operator defaults (e.g., the bus breaks down or never arrives).
The platform rule is: **Funds are released exactly 24 hours after the Trip's `actualArrival` timestamp.** This gives passengers a 24-hour window to file a dispute and request a refund.

## Internal Algorithm

1. **Querying**: 
   - Finds all `Booking` rows where `status = CONFIRMED`, `clearedAt = NULL`.
   - Joins `Trip` where `status = ARRIVED` and `actualArrival < (NOW() - 24 HOURS)`.
   - Batches to 500 bookings to avoid database timeouts.

2. **Grouping by HoldGroup**:
   - Bookings are grouped by `HoldGroup`. This is strictly necessary because the `PricingSnapshot` exists at the HoldGroup level, not the individual booking level.

3. **The Math (Preventing Fractional XOF Leaks)**:
   - If a user bought 3 seats for 30,000 XOF, and the operator net was 27,000, we need to release 9,000 per seat.
   - What if the math was 27,001? (9000.33 per seat). We cannot release 9000.33 XOF.
   - **Solution**: The script calculates `standardNet = round(operatorNetXOF / seatCount)`. 
   - It checks if this run is releasing the *last* seat of the group (accounting for seats that were previously `CANCELLED` and refunded).
   - If it is the last seat, `netToRelease = operatorNetXOF - (alreadyRefundedCount * standardNet)`. This absorbs the fractional remainder into the final seat release.

4. **Batching by Company**:
   - The nets are summed up per `companyId`.

5. **Execution**:
   - Opens a `prisma.$transaction`.
   - Loads the operator's `OPERATOR_RECEIVABLE` account.
   - Executes:
     ```typescript
     prisma.financialAccount.update({
       where: { id: operatorAcct.id },
       data: {
         reservedBalance: { decrement: totalNet },
         availableBalance: { increment: totalNet },
       },
     })
     ```
   - Marks all processed `Booking` rows with `clearedAt = NOW()`.

## Failure Modes
If the cron crashes midway through the 500 batch, the outer transaction rolls back. The `clearedAt` fields are never set, and the balances are never updated. On the next cron invocation, it will safely pick up the exact same 500 bookings and try again. It is perfectly idempotent.
