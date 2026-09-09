# Phase 1 — Schema, Role & Middleware

> **Status**: ✅ Complete  
> **Depends on**: Nothing — this is the foundation  
> **Blocks**: All other phases

---

## Objective

Add the `BOOTH` role to the staff role system, create the `BoothSale` audit model, run the database migration, and add the `boothProcedure` tRPC middleware. No app code yet — just the backend foundation.

---

## 1.1 — Add `BOOTH` to `StaffRole` enum

**File**: `packages/db/prisma/schema.prisma`

Find the `StaffRole` enum and add `BOOTH` at the end:

```prisma
enum StaffRole {
  OWNER
  ADMIN
  MANAGER
  OPERATIONS
  FINANCE
  SUPPORT
  TREASURY
  DISPATCHER
  CONDUCTOR
  DRIVER
  BOOTH   // Terminal booth agent — sell tickets, check in passengers, reconcile cash
}
```

---

## 1.2 — Add `BoothPaymentMethod` enum

**File**: `packages/db/prisma/schema.prisma`

Add immediately after the existing payment-related enums (after `RefundRecordStatus`):

```prisma
enum BoothPaymentMethod {
  CASH
  PAYSTACK_LINK
}
```

---

## 1.3 — Add `BoothSale` model

**File**: `packages/db/prisma/schema.prisma`

Add at the end of the file, before the closing (after `OutboxMessage`):

```prisma
// ============================================
// BOOTH APP — COUNTER SALES
// ============================================
// Records every booking made via the booth app.
// Provides full audit trail for cash reconciliation,
// staff accountability, and terminal-level reporting.

model BoothSale {
  id        String @id @default(cuid())

  // Booking link (1:1 — every booth sale has exactly one booking)
  bookingId String  @unique
  booking   Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  // Company scoping (always set — invariant: booth agent always belongs to a company)
  companyId String

  // Terminal where this sale was made
  terminalId String
  terminal   CompanyLocation @relation("BoothSaleTerminal", fields: [terminalId], references: [id])

  // Staff member who made the sale (Operator.id — not User.id)
  staffId String
  staff   Operator @relation("BoothSaleStaff", fields: [staffId], references: [id])

  // Payment tracking
  paymentMethod BoothPaymentMethod

  // CASH sales: amount physically collected by staff
  cashAmountXOF Int?

  // PAYSTACK_LINK sales: the Paystack payment reference for audit
  paystackRef String?

  // Offline flag — true if booking was created while booth had no connectivity
  // These are always pre-hold-pool bookings; holdId is set before offline sale
  wasOffline Boolean @default(false)

  // Walk-up passenger tracking
  // walkedUpPassenger: true if staff created/found a passenger at the counter
  walkedUpPassenger       Boolean @default(false)
  // passengerAccountCreated: true if a brand-new TRAVELER account was created
  passengerAccountCreated Boolean @default(false)

  // Urban overbooking conflict — set true by server on sync if capacity exceeded
  hasConflict     Boolean @default(false)
  conflictDetails String? // e.g. "Trip capacity exceeded by 2 at time of sync"

  confirmedAt DateTime @default(now())
  createdAt   DateTime @default(now())

  @@index([companyId])
  @@index([terminalId])
  @@index([staffId])
  @@index([confirmedAt])
  @@index([wasOffline])
  @@index([hasConflict])
  @@map("booth_sale")
}
```

---

## 1.4 — Add relations to existing models

**File**: `packages/db/prisma/schema.prisma`

### On `Booking` model — add after the existing relations block:
```prisma
  boothSale BoothSale? // Present only for bookings made via the booth app
```

### On `Operator` model — add after existing relations:
```prisma
  boothSales BoothSale[] @relation("BoothSaleStaff")
```

### On `CompanyLocation` model — add after existing relations:
```prisma
  boothSales BoothSale[] @relation("BoothSaleTerminal")
```

---

## 1.5 — Run migration

```bash
pnpm --filter @moja/db exec prisma migrate dev --name add_booth_role_and_booth_sale
pnpm --filter @moja/db exec prisma generate
```

**Expected migration file created at**:
`packages/db/prisma/migrations/YYYYMMDDHHMMSS_add_booth_role_and_booth_sale/migration.sql`

**What the migration SQL will contain**:
```sql
-- Add BOOTH to StaffRole enum
ALTER TYPE "StaffRole" ADD VALUE 'BOOTH';

-- Add BoothPaymentMethod enum
CREATE TYPE "BoothPaymentMethod" AS ENUM ('CASH', 'PAYSTACK_LINK');

-- Create booth_sale table
CREATE TABLE "booth_sale" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "paymentMethod" "BoothPaymentMethod" NOT NULL,
    "cashAmountXOF" INTEGER,
    "paystackRef" TEXT,
    "wasOffline" BOOLEAN NOT NULL DEFAULT false,
    "walkedUpPassenger" BOOLEAN NOT NULL DEFAULT false,
    "passengerAccountCreated" BOOLEAN NOT NULL DEFAULT false,
    "hasConflict" BOOLEAN NOT NULL DEFAULT false,
    "conflictDetails" TEXT,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booth_sale_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on bookingId (1:1 with Booking)
CREATE UNIQUE INDEX "booth_sale_bookingId_key" ON "booth_sale"("bookingId");

-- Indexes
CREATE INDEX "booth_sale_companyId_idx" ON "booth_sale"("companyId");
CREATE INDEX "booth_sale_terminalId_idx" ON "booth_sale"("terminalId");
CREATE INDEX "booth_sale_staffId_idx" ON "booth_sale"("staffId");
CREATE INDEX "booth_sale_confirmedAt_idx" ON "booth_sale"("confirmedAt");
CREATE INDEX "booth_sale_wasOffline_idx" ON "booth_sale"("wasOffline");
CREATE INDEX "booth_sale_hasConflict_idx" ON "booth_sale"("hasConflict");

-- FK constraints
ALTER TABLE "booth_sale" ADD CONSTRAINT "booth_sale_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booth_sale" ADD CONSTRAINT "booth_sale_terminalId_fkey"
  FOREIGN KEY ("terminalId") REFERENCES "company_location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booth_sale" ADD CONSTRAINT "booth_sale_staffId_fkey"
  FOREIGN KEY ("staffId") REFERENCES "operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

## 1.6 — Add `ROLE_TEMPLATES["BOOTH"]` to schemas

**File**: `packages/schemas/src/` — find the file containing `ROLE_TEMPLATES` (likely `permissions.ts` or `roles.ts`)

Add:
```typescript
ROLE_TEMPLATES["BOOTH"] = [
  "booth:sell",            // Can sell tickets at the counter
  "booth:checkin",         // Can scan QR codes and check in passengers
  "booth:reconcile",       // Can view own daily cash reconciliation report
  "booth:lookup-passenger", // Can search for or create walk-up passenger accounts
  // Explicitly EXCLUDED — booth agents must NEVER have:
  // fleet:*, routes:*, schedules:*, finance:*, settings:*,
  // staff:*, admin:*, company:*, documents:*, bank:*
] as const;
```

Also add `BOOTH` to any TypeScript union types for `StaffRole`:
```typescript
export type StaffRole =
  | "OWNER" | "ADMIN" | "MANAGER" | "OPERATIONS"
  | "FINANCE" | "SUPPORT" | "TREASURY" | "DISPATCHER"
  | "CONDUCTOR" | "DRIVER"
  | "BOOTH"; // ← ADD
```

---

## 1.7 — Add `boothProcedure` middleware to tRPC

**File**: `apps/web/trpc/init.ts`

Add after the existing `operatorCompanyProcedure`:

```typescript
// ─────────────────────────────────────────────
// BOOTH PROCEDURE
// Requires: authenticated + Operator record with a booth-eligible role
// + company must be ACTIVE or VERIFIED
// Sets ctx.operator and ctx.companyId
// ─────────────────────────────────────────────

const BOOTH_ELIGIBLE_ROLES: StaffRole[] = [
  "BOOTH",
  "DISPATCHER",
  "OPERATIONS",
  "MANAGER",
  "ADMIN",
  "OWNER",
];

export const boothProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const operator = await ctx.prisma.operator.findFirst({
      where: {
        userId: ctx.user.id,
        isActive: true,
        deletedAt: null,
        role: { in: BOOTH_ELIGIBLE_ROLES },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!operator) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have booth access. Contact your company administrator.",
      });
    }

    if (!["ACTIVE", "VERIFIED"].includes(operator.company.status)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Your company account is not active. Contact Moja Ride support.",
      });
    }

    return next({
      ctx: {
        ...ctx,
        operator,
        companyId: operator.companyId,
      },
    });
  },
);
```

---

## 1.8 — Register booth router stub in `_app.ts`

**File**: `apps/web/trpc/routers/_app.ts`

Add import and registration (stub — full router comes in Phase 2):

```typescript
import { boothRouter } from "./booth";

export const appRouter = createTRPCRouter({
  // ... existing routers
  booth: boothRouter,
});
```

Create the stub file `apps/web/trpc/routers/booth.ts`:
```typescript
import { createTRPCRouter } from "../init";

// Full implementation in Phase 2
export const boothRouter = createTRPCRouter({});
```

---

## 1.9 — Verification Checklist

After completing this phase, run:

```bash
# 1. Verify migration ran
pnpm --filter @moja/db exec prisma migrate status

# 2. Verify Prisma client generated correctly
pnpm --filter @moja/db exec prisma generate

# 3. Verify web app still typechecks
pnpm --filter web typecheck

# 4. Verify schemas package still typechecks
pnpm --filter @moja/schemas typecheck

# 5. Verify db package
pnpm --filter @moja/db typecheck
```

**All must exit 0 before moving to Phase 2.**

---

## 1.10 — Edge Cases & Notes

- The `StaffRole.BOOTH` enum value must be added via `ALTER TYPE ... ADD VALUE` — PostgreSQL does not allow removing enum values once added. The migration is **irreversible** without data loss.
- `BOOTH`-eligible roles include `DISPATCHER`, `OPERATIONS`, `MANAGER`, `ADMIN`, `OWNER` so that existing higher-role staff can use the booth app without needing a role change. Only the `BOOTH` role is exclusively for booth agents.
- `BoothSale.cashAmountXOF` is nullable because PAYSTACK_LINK sales don't have a cash amount. Validate in the tRPC procedure that it is non-null for CASH sales.
- `BoothSale.paystackRef` is nullable because CASH sales don't have a Paystack reference. Validate in the tRPC procedure that it is non-null for PAYSTACK_LINK sales.
- The `hasConflict` field on `BoothSale` is set to `true` by the server during offline sync when urban trip capacity is exceeded. It is NOT set by the client.
