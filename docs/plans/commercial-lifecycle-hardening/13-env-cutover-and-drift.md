# Env cutover & schema drift (Phase 02)

**Findings:** P0-8, P3-15  
**Decision:** D4=A — baseline IF NOT EXISTS migration

## What drifted

| Area | In `schema.prisma` | In migration history (pre–Phase 02) |
|------|--------------------|--------------------------------------|
| Discount/referral/voucher/credit/scopes | Yes (db push 2026-08-15) | **Missing** CREATE — only `maxPromotionalVouchersPerUser` + voucher schedule ALTER |
| PricingSnapshot discount columns | Yes | **Missing** until Phase 02 baseline |
| Cancel/refund Phase 00 columns | Yes | `20260816140000_phase00_cancel_refund_safety` |

Envs that ran `prisma db push` for discounts already have tables; baseline migration is a **no-op** for those objects (`IF NOT EXISTS` / `duplicate_object` guards).

## Cutover runbook (staging → prod)

1. **Backup** DB (snapshot / dump).
2. Deploy app build that includes Phase 00–02 migrations (do not rely on `db push`).
3. `pnpm --filter @moja/db exec prisma migrate deploy`
4. Confirm `_prisma_migrations` contains:
   - `20260816160000_phase02_discount_domain_baseline`
   - `20260816170000_phase02_commercial_constraints`
5. **CHECK VALIDATE** (maintenance window, after dry-run inventories):

```sql
ALTER TABLE "monetary_voucher" VALIDATE CONSTRAINT "monetary_voucher_cancellation_scope_chk";
ALTER TABLE "monetary_voucher" VALIDATE CONSTRAINT "monetary_voucher_amounts_chk";
ALTER TABLE "credit_lot" VALIDATE CONSTRAINT "credit_lot_amounts_chk";
ALTER TABLE "discount_campaign" VALIDATE CONSTRAINT "discount_campaign_hybrid_bps_chk";
ALTER TABLE "discount_campaign" VALIDATE CONSTRAINT "discount_campaign_budget_nonneg_chk";
ALTER TABLE "pricing_snapshot" VALIDATE CONSTRAINT "pricing_snapshot_discount_nonneg_chk";
ALTER TABLE "booking" VALIDATE CONSTRAINT "booking_stop_order_chk";
ALTER TABLE "refund" VALIDATE CONSTRAINT "refund_amount_nonneg_chk";
ALTER TABLE "payment" VALIDATE CONSTRAINT "payment_amount_nonneg_chk";
```

6. Repair dry-runs (see [05-phase-02](./05-phase-02-schema-migrations-data-repair.md)):
   - `repair-promo-credit-funding.ts --dry-run`
   - `repair-duplicate-initial-credit-lots.ts --dry-run`
   - `inventory-cancel-without-refund.ts`
   - `inventory-stuck-reserved-holds.ts`
7. Finance-gated `--apply` only after review; **never** auto-reverse historical voucher expense posts.

## Fresh DB CI check

```bash
pnpm --filter @moja/db exec prisma migrate deploy
pnpm --filter @moja/db exec prisma generate
# then monorepo typecheck as usual
```

Empty DB → migrate deploy must create discount domain without manual push.

## Policy notes

- **P3-16 / `HoldGroup.offerId`:** intentionally **non-unique**. Same itinerary offer can spawn multiple hold attempts; uniqueness is hold `id`, not offer.
- **P3-17 / max promotional vouchers:** enforced in `issueMonetaryVoucher` via `PlatformSettings.maxPromotionalVouchersPerUser` for promotional sources only (not cancellation / modification difference).
- **P2-15:** `payment` / `refund` → `hold_group` are `ON DELETE RESTRICT`. Soft-delete / status transitions only after money moved.
- **P2-16:** cancellation voucher `scheduleId` / `companyId` FKs are `RESTRICT`; CHECK requires both non-null when `source=CANCELLATION` (NOT VALID until cleaned).
