# Category D Audit: Refunds, Cancellations & Escrow Clearance

## Scope Inspected
- Cancellation Engine: [`cancellation-service.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/services/cancellation-service.ts)
- Cancellation Policy Math: [`cancellation-policy.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/lib/cancellation-policy.ts)
- Escrow Release Cron: [`release-escrow/route.ts`](file:///C:/dev/moja-buss/apps/web/app/api/cron/release-escrow/route.ts) & [`escrow-release.ts`](file:///C:/dev/moja-buss/apps/web/lib/escrow-release.ts)
- Offline Cash Reimbursement Fulfilment: [`offline-refund-fulfilment.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/services/offline-refund-fulfilment.ts)

---

## Detailed Findings

### 1. [CRITICAL] Money Laundering / Arbitrage: Promo Credits Converted to Real Fiat Cash via Cancellation
- **Location:** [`apps/web/features/payments/services/cancellation-service.ts:279-339`](file:///C:/dev/moja-buss/apps/web/features/payments/services/cancellation-service.ts#L279-L339) and [`cancellation-policy.ts:31-56`](file:///C:/dev/moja-buss/apps/web/features/payments/lib/cancellation-policy.ts#L31-L56)
- **The Flaw:** When a passenger books a trip using a combination of Promo Credits and Moja Wallet (e.g. 5,000 XOF Promo Credits + 5,000 XOF Wallet Cash for a 10,000 XOF ticket), and subsequently cancels the booking:
  - `computeRefundQuote` calculates `refundAmountXOF = 10,000 XOF` (based on gross base fare `subtotalBaseXOF`).
  - `CancellationService` posts a double-entry transaction:
    - DEBIT `OPERATOR_RECEIVABLE` (clawing back 9,500 XOF from operator)
    - DEBIT `COMMISSION_REVENUE` (clawing back 500 XOF from platform commission)
    - **CREDIT `PASSENGER_WALLET` with the FULL 10,000 XOF in spendable/withdrawable fiat balance!**
- **Exploit Scenario:**
  1. Fraudulent user acquires 10,000 XOF in promotional credits via referral programs or marketing campaigns.
  2. User books an intercity bus ticket for 10,000 XOF paid 100% with Promo Credits.
  3. User immediately clicks "Cancel Booking" on their passenger dashboard.
  4. The cancellation service refunds 10,000 XOF directly into the user's **Moja Wallet (`PASSENGER_WALLET`)**.
  5. The promotional credits have now been converted into **real withdrawable fiat currency**.
  6. The bus operator's receivable account is plunged negative (-9,500 XOF) and the platform's commission is reduced (-500 XOF) to fund this cash payout.

---

### 2. [HIGH] 100% Free Promo Bookings Destroy Customer Credits on Cancellation
- **Location:** [`apps/web/features/payments/services/cancellation-service.ts:175-180`](file:///C:/dev/moja-buss/apps/web/features/payments/services/cancellation-service.ts#L175-L180)
- **The Flaw:** If a ticket was booked with 100% promotional discount or credits where cash charge was 0, `CancellationService` treats it as `zeroCashSettlement`:
  ```ts
  if (zeroCashSettlement) {
    return { refund: null };
  }
  ```
  While this prevents the cash laundering bug for 0 XOF cash transactions, it **never restores the redeemed `CreditLot` or decrements the coupon redemption count**.
- **Impact:** If an operator cancels a scheduled bus trip due to mechanical failure, passengers who used their promo credits or discount coupons lose them permanently with zero refund and zero voucher reactivation.

---

### 3. [MEDIUM] Offline CASH Refund Voiding Leaves Phantom Clawbacks in Operator Account
- **Location:** [`apps/web/features/payments/services/offline-refund-fulfilment.ts:84-114`](file:///C:/dev/moja-buss/apps/web/features/payments/services/offline-refund-fulfilment.ts#L84-L114)
- **The Flaw:** When an offline cash refund is requested at cancellation, `CancellationService` immediately debits `OPERATOR_RECEIVABLE` and credits `OFFLINE_REFUND_PAYABLE` (status `PENDING_FULFILMENT`).
  - If the station staff or admin later marks the refund as **`VOIDED`** via `markOfflineRefundVoid`, the status is updated to `"VOIDED"`, but **no accounting reversal is posted**.
- **Impact:** The operator's account remains permanently docked for ticket revenue they were not responsible for refunding, and the platform retains a phantom liability in `OFFLINE_REFUND_PAYABLE`.

---

### 4. [LOW] Escrow Release Fallback Path Uses Gross Paid Fares Without Snapshot
- **Location:** [`apps/web/app/api/cron/release-escrow/route.ts:140-152`](file:///C:/dev/moja-buss/apps/web/app/api/cron/release-escrow/route.ts#L140-L152)
- **The Flaw:** When releasing escrow for legacy bookings missing `PricingSnapshot`, the cron uses a fallback formula:
  $$Net = \text{Math.round}\left(\frac{\text{farePaidSum} \times (10000 - \text{commissionBps})}{10000}\right)$$
  If discounts were applied to `farePaidSum` that were platform-funded, the operator receives net of the discounted fare rather than net of the base ticket price agreed in the commercial contract.
