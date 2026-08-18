# Chapter 6: Admin Controls, Auditing & Financial Governance

## 1. Overview of Admin Financial Architecture

The Admin Financial Suite provides supervisory visibility, ledger integrity monitoring, platform fee governance, and payout controls across the entire Moja Bus ecosystem.

### Admin Dashboard Pages:
- **Ledger Sheet Explorer:** [`apps/web/app/[locale]/dashboard/admin/financials/ledger/page.tsx`](file:///C:/dev/moja-buss/apps/web/app/[locale]/dashboard/admin/financials/ledger/page.tsx)
- **Settlements & Clearing:** [`apps/web/app/[locale]/dashboard/admin/financials/settlements/page.tsx`](file:///C:/dev/moja-buss/apps/web/app/[locale]/dashboard/admin/financials/settlements/page.tsx)
- **Platform Withdrawals Monitor:** [`apps/web/app/[locale]/dashboard/admin/financials/withdrawals/page.tsx`](file:///C:/dev/moja-buss/apps/web/app/[locale]/dashboard/admin/financials/withdrawals/page.tsx)
- **Bank Access Audit Logs:** [`apps/web/app/[locale]/dashboard/admin/audit-logs/bank-access/page.tsx`](file:///C:/dev/moja-buss/apps/web/app/[locale]/dashboard/admin/audit-logs/bank-access/page.tsx)

---

## 2. Double-Entry Ledger Sheet Explorer

The ledger explorer provides real-time auditability of every debit and credit posted to the platform:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ DOUBLE-ENTRY LEDGER SHEET                                                                                              │
├──────────────┬──────────────────┬─────────────────┬──────────┬──────────────┬─────────────┬──────────────┬─────────────┤
│ Date / Time  │ Transaction ID   │ Account Class   │ Owner    │ Side         │ Amount(XOF) │ Reference    │ Description │
├──────────────┼──────────────────┼─────────────────┼──────────┼──────────────┼─────────────┼──────────────┼─────────────┤
│ 18 Aug 03:45 │ clx89... (BOOK)  │ PAYSTACK_CLEAR  │ System   │ [ DEBIT  ]   │ 10,050 XOF  │ HG_98213     │ Net Paystack│
│ 18 Aug 03:45 │ clx89... (BOOK)  │ PROCESSOR_FEES  │ Platform │ [ DEBIT  ]   │    200 XOF  │ HG_98213     │ Gateway Fee │
│ 18 Aug 03:45 │ clx89... (BOOK)  │ OPERATOR_REC    │ UTB Bus  │ [ CREDIT ]   │  9,500 XOF  │ HG_98213     │ Ticket Net  │
│ 18 Aug 03:45 │ clx89... (BOOK)  │ COMMISSION_REV  │ Moja Bus │ [ CREDIT ]   │    500 XOF  │ HG_98213     │ 5% Comm     │
│ 18 Aug 03:45 │ clx89... (BOOK)  │ CONVENIENCE_REV │ Moja Bus │ [ CREDIT ]   │    250 XOF  │ HG_98213     │ Service Fee │
└──────────────┴──────────────────┴─────────────────┴──────────┴──────────────┴─────────────┴──────────────┴─────────────┘
```

### Ledger Explorer Capabilities:
- **Filter by Side:** `ALL`, `DEBIT`, `CREDIT`.
- **Filter by Transaction Type:** `BOOKING`, `TOP_UP`, `REFUND`, `WITHDRAWAL`, `ESCROW_RELEASE`, `PROMO_CREDIT_GRANT`, `ORPHANED_PAYMENT_RESCUE`.
- **Search:** Instant text search across transaction IDs, booking references, operator names, and descriptions.
- **KPI Metrics:** Total Debit Volume, Total Credit Volume, Total Transaction Count, Active Accounts Count.

---

## 3. Platform Settings & Dynamic Fee Governance

The `PlatformSettings` singleton controls system-wide monetization and risk parameters:

```prisma
model PlatformSettings {
  id                        String   @id @default("default")
  defaultCommissionBps      Int      @default(500)   // 5.00% Platform Commission
  defaultConvenienceFeeBps  Int      @default(250)   // 2.50% Gateway Convenience Fee
  paystackFeeLocalCardBps   Int      @default(320)   // 3.20% Estimated Local Card Interchange
  paystackFeeIntlCardBps    Int      @default(380)   // 3.80% International Card Interchange
  paystackFeeMobileMoneyBps Int      @default(195)   // 1.95% Mobile Money Interchange
  minWithdrawalAmount       Int      @default(5000)  // Minimum 5,000 XOF per payout
  withdrawalFrequencyHours  Int      @default(24)    // Max 1 payout per 24h per operator
  require2FAForWithdrawals  Boolean  @default(false) // Mandatory email OTP challenge
  updatedAt                 DateTime @updatedAt
}
```

### Distance-Based Commission Tiers (`CommissionDistanceTier`)
Rather than charging a flat $5\%$, the platform can define graduated tiers based on route distance:
- $0 - 100\text{ km}$ (Urban / Sub-urban): $700\text{ bps}$ ($7.0\%$).
- $101 - 300\text{ km}$ (Intercity Standard): $500\text{ bps}$ ($5.0\%$).
- $> 300\text{ km}$ (Long-distance Express): $350\text{ bps}$ ($3.5\%$).

---

## 4. Financial Audit Logging & Compliance Trails

Every privileged financial action leaves an immutable audit trail:

1. **`PlatformSettingsAudit`**:
   - Whenever an admin adjusts commission rates or withdrawal limits, the system logs `oldValue`, `newValue`, `changedById`, and `changeReason`.
2. **`BankAccessLog`**:
   - Whenever an operator or administrator views unmasked bank account numbers or updates banking details, a record is written with user ID, IP address, and timestamp.
3. **`AdminStaffActivityLog`**:
   - Records admin payout overrides, offline refund approvals, and company verification actions.
