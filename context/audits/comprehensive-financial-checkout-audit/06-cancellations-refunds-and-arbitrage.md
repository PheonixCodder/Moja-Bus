# 06 — Cancellations, Refunds & Arbitrage Vulnerabilities

**Scope:** Inspection of `CancellationService`, `cancellation-policy.ts`, Promo Credit Restorations, Cash Laundering Risks, and Offline Terminal Voucher Reconciliation.

---

## 1. Promo-to-Fiat Cash Laundering Vulnerability (Critical Finding)

One of the most dangerous vulnerabilities in two-sided marketplaces with promotional currency is **promo-to-cash arbitrage**.

### The Vulnerability Anatomy
1. Suppose a passenger receives 10,000 XOF in non-withdrawable promotional marketing credits (e.g. from a referral promotion or voucher campaign).
2. The passenger books a 10,000 XOF ticket on an Abidjan to San Pedro bus, paying 10,000 XOF in Promo Credits.
3. 2 hours before the bus departs, the passenger goes to their Dashboard and clicks **Cancel Booking**.
4. In `cancellation-service.ts`:
   - If the cancellation channel is `WALLET`:
     - Does the system return promo credits to `creditLot` or does it credit `PASSENGER_WALLET`?
   - Let's look at `cancellation-service.ts` lines 193–237:
     ```typescript
     const {
       refundAmountXOF,
       cashRefundXOF,
       creditRestoreXOF,
       operatorNetXOF: proportionalOperatorNet,
       commissionXOF: proportionalCommission,
     } = computeRefundQuote({ ... });

     // Restore promo credits:
     if (creditRestoreXOF > 0 && lockedBooking.userId) {
       await txClient.creditLot.create({ ... }); // Restores promo lot
     }

     // BUT for zeroCashSettlement:
     if (zeroCashSettlement && cashRefundXOF === 0) {
       await txClient.booking.update({ ... });
       return { refund: null };
     }
     ```
   - **The Exploit in Partial Promo Bookings**:
     Suppose the ticket was 10,000 XOF, and paid with **9,000 Promo Credits + 1,000 Cash**.
     - `computeRefundQuote` in `cancellation-policy.ts`:
       ```typescript
       const totalCreditPool = pricingSnapshot.creditAppliedXOF ?? 0; // 9000
       const totalCashPool = postDiscountSubtotal - totalCreditPool; // 1000
       ```
     - For a single seat, `cashRefundXOF = 1000`, `creditRestoreXOF = 9000`.
     - In `cancellation-service.ts`:
       - `refundAmountXOF` = `cashRefundXOF` (1,000 XOF).
       - It credits `PASSENGER_WALLET` with 1,000 XOF, and restores 9,000 to `creditLot`.
     - **This path is safe from cash conversion!**
     - **HOWEVER:** If the booking was confirmed via `confirmFromWallet` with `convenienceFeeXOF` wiped to 0 and `creditAppliedXOF = 1025`:
       - The refund quote calculates `creditRestoreXOF = 1025`, but the user originally only had a 1,000 XOF ticket!
       - The platform mints an extra **25 XOF in phantom marketing liability** upon every cancellation cycle!

---

## 2. Offline Refund Voucher Leakage

In Côte d'Ivoire, many bus passengers do not have active bank cards or mobile money wallets and cancel tickets at physical station booths (`channel = "CASH"` or `channel = "VOUCHER"`).

In `cancellation-service.ts` lines 398–430:
```typescript
const reimbursementPayable = await accountService.getOfflineRefundPayableAccount();
const engine = new AccountingEngine("REFUND", { ... });

// Debits Operator Liability
engine.addDebit({ accountId: opAcct.id, amount: proportionalOperatorNet, ... });

// Debits Platform Commission
engine.addDebit({ accountId: platformCommissionAcct.id, amount: commissionAmount, ... });

// Credits Offline Refund Payable
engine.addCredit({ accountId: reimbursementPayable.id, amount: refundAmountXOF, ... });
```

### The Incomplete Settlement Problem:
When a ticket is cancelled offline, `OFFLINE_REFUND_PAYABLE` increases. This represents cash that the station cashier must physically disburse to the traveler.
* **The Gap:** There is no counter-balancing reconciliation when the cashier physically hands over cash!
* If the passenger walks away without collecting cash, `OFFLINE_REFUND_PAYABLE` remains permanently elevated on Moja Ride's balance sheet.
* Furthermore, if an operator staff member voids the refund or rebooks the passenger manually at the booth, the double-entry ledger is not notified, resulting in permanent ledger drift between physical cash and system liabilities.
