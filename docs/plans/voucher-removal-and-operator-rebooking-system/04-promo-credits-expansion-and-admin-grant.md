# Promo Credits Expansion & Admin Goodwill Grants

## 1. Unified Marketing Liability Model

Instead of maintaining a separate `MonetaryVoucher` table and separate voucher checkout handlers for goodwill/support issues, all platform-funded grants are unified under **Promo Credits (`CreditLot`)**.

### Advantages:
1. **Zero Redundancy:** A single ledger, single expiration sweep, and single checkout burn mechanism.
2. **Automatic Application:** Promo credits auto-deduct at checkout without requiring travelers to copy, paste, or memorize voucher codes.
3. **Non-Withdrawable:** Promo credits strictly burn against ticket fares, preventing fraud and unauthorized cash withdrawals.

---

## 2. New Admin Promo Grant Endpoint

In [`apps/web/trpc/routers/discounts-admin.ts`](file:///C:/dev/moja-buss/apps/web/trpc/routers/discounts-admin.ts):

```typescript
grantPromoCredits: adminProcedure
  .input(z.object({
    userId: z.string(),
    amountXOF: z.number().int().positive(),
    source: z.enum(["GOODWILL", "MARKETING_GRANT", "ADMIN_MANUAL"]),
    reason: z.string().min(3),
    expiresAt: z.date().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    return promoGrantService.grantCredits({
      prisma: ctx.prisma,
      adminId: ctx.user.id,
      ...input,
    });
  }),
```

---

## 3. Traveler Profile UI Enhancement

In [`apps/web/features/admin/views/admin-traveler-profile-view.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/views/admin-traveler-profile-view.tsx):
- Add a **"Grant Promo Credits"** action button in the traveler header.
- Opens a clean dialog modal where the admin inputs:
  - **Amount (XOF)** (e.g. `2,000 XOF`)
  - **Reason / Type:** Customer Support Goodwill, Marketing Promo, or Manual Grant
  - **Internal Notes:** (e.g. *"Compensating for delay on Trip #TRIP-123"*)
  - **Expiration Date:** Optional (defaults to 180 days or platform policy)
- Submitting credits immediately adds an active `CreditLot` to the user's account and logs an audit trail event.
