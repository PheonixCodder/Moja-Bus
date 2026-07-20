# Findings — Paystack integration (paystack-client.ts, paystack-checkout.ts, pricing-resolver.ts)

Files READ:
- apps/web/features/payments/providers/paystack-client.ts (370 lines)
- apps/web/features/payments/lib/paystack-checkout.ts (181 lines)
- apps/web/features/payments/lib/pricing-resolver.ts (140 lines)

============================================================================
🔴 F-11 — XOF amount ×100: POSSIBLE 100× OVERCHARGE (verify against Paystack IMMEDIATELY)
============================================================================
Two symmetric helpers:
- `pricing-resolver.ts` → `toPaystackAmountXOF(amountXOF) = amountXOF * 100`
- `paystack-client.ts` → `paystackInitialize` sends `amount: toPaystackAmountXOF(amountXOF)` (×100),
  currency "XOF".
- `paystack-client.ts` → `paystackVerify` reads `json.data.amount` and does `amountXOF = Math.round(amount / 100)`.
- `paystackInitiateTransfer` sends `amount: toPaystackAmountXOF(amountXOF)` (×100); `paystackVerifyTransfer`
  does `amount / 100`.

The code is INTERNALLY consistent: it charges ×100 and reconciles ÷100, so the platform's own ledger
sees the correct `chargeAmountXOF`. THE RISK IS WHAT THE CUSTOMER IS ACTUALLY CHARGED.

Paystack's API contract: the `amount` field is in the currency's SMALLEST unit (kobo for NGN, pesewas
for GHS). For XOF, the West African CFA franc has NO minor unit — 1 XOF is the smallest unit. Per
Paystack's documented behavior for XOF, you should send the whole-franc amount (e.g. `10000` for
10,000 XOF), NOT `1000000`.

If that is true, then:
- A 10,000 XOF ticket → `toPaystackAmountXOF` → sends `1000000` → Paystack charges the customer
  **1,000,000 XOF** (100× too much). The customer's bank is debited 100×. The platform ledger would
  record 10,000 XOF received (because verify ÷100), but Paystack actually took 1,000,000 XOF.

This is a POTENTIALLY CATASTROPHIC billing bug that would also desync the real Paystack balance from
the `PAYSTACK_CLEARING` ledger account (reconciliation delta would be 100× off).

CONFIDENCE / ACTION:
- I am NOT 100% certain of Paystack's exact XOF handling from memory (some Paystack integrations DO
  normalize all currencies ×100). This MUST be confirmed by (a) reading Paystack's current XOF API docs,
  and (b) a live test transaction in Paystack's test mode for an XOF amount.
- If Paystack treats XOF as no-decimal: this is a 🔴 CRITICAL 100× overcharge and must be fixed by
  removing the ×100 for XOF (or special-casing XOF).
- Even if Paystack happens to accept ×100 for XOF in practice, the code is FRAGILE: any change in
  Paystack's XOF normalization silently breaks billing. Recommend an explicit, documented XOF handling.

============================================================================
🔴 F-12 — Paystack bank list returns NIGERIAN banks, not Côte d'Ivoire
============================================================================
`paystackListBanks(country?)`:
- `supportedCountries = ["ghana","kenya","nigeria","south africa"]` — Côte d'Ivoire ("cote-dIvoire" /
  "ci") is NOT in the list.
- If the passed country is not in that list, `useCountryParam = false` → hits `https://api.paystack.co/bank`
  (the DEFAULT, which returns NIGERIAN banks).
- For the actual market (Côte d'Ivoire, XOF), operators setting up their bank account would be shown
  NIGERIAN banks (wrong country, wrong banking system). They could not select a valid CI bank →
  operator payouts (withdrawals) cannot be configured → operators cannot get paid.
- This is a 🔴 CRITICAL market-blocking bug for the product's target country. Fix: include CI in the
  supported list with the correct Paystack country code, or always pass the operator's country.

============================================================================
🟡 F-13 — `require("node:crypto")` inside paystack-client (Edge-runtime risk)
============================================================================
`verifyPaystackSignature` does `const crypto = require("node:crypto")`. This is CommonJS `require`
inside what is otherwise an ESM/Next module. It works in the Node.js runtime but WILL FAIL if the
webhook route runs in the Edge runtime (Next.js middleware/edge routes). Need to confirm the webhook
route (`app/api/webhooks/paystack/route.ts`, PENDING) is a Node runtime route (not edge). If it's edge,
signature verification throws → either all webhooks 401 (DoS on confirmations) or signature check is
bypassed. Verify in the route file. (Also: README mentions HMAC verification is mandatory — must not
be bypassed.)

============================================================================
🟡 F-14 — Verify divides by 100 (symmetric with F-11)
============================================================================
`paystackVerify`: `amountXOF = Math.round(json.data.amount / 100)`. `paystackVerifyTransfer`:
`Math.round(json.data.amount / 100)`. These are correct ONLY if the charge was sent ×100 (see F-11).
If F-11 is "fixed" by removing ×100, these must also divide by 1 (no-op) or they will UNDER-record by 100×.
The fix for F-11 must be applied consistently across initialize, verify, transfer-initiate, transfer-verify.

============================================================================
Other paystack-client observations
============================================================================
- `paystackInitialize` `channels: ["card","mobile_money"]` — fixed channels; no way to configure per
  operator. Fine for now.
- `paystackCreateTransferRecipient` / `paystackInitiateTransfer` use `currency: "XOF"` — correct.
- `paystackInitiateTransfer` returns `fee / 100` — symmetric with F-14.
- `buildPaystackReference` = `moja_${holdGroupId}_${attemptNumber}_${Date.now()}` — includes Date.now()
  (non-deterministic) so the reference is unique per attempt. Note: the same holdGroup re-init creates a
  NEW reference each attempt (good for idempotency at Paystack), but the `ExternalPayment` is re-used
  (updated with new reference). See payment-service initiatePaystack.

============================================================================
paystack-checkout.ts (UI) — no money math
============================================================================
- Pure client-side popup/redirect orchestration (`openPaystackPopup`, `redirectToPaystackCheckout`,
  fallback logic). No financial amounts computed here. ✅ No findings.
- `shouldPreferRedirectCheckout()` reads `NEXT_PUBLIC_PAYSTACK_CHECKOUT_MODE === "redirect"`.

============================================================================
pricing-resolver.ts — ✅ matches spec formula
============================================================================
- `buildPricingBreakdown`: subtotal = baseFare*seatCount; convenienceFee = round(subtotal*convBps/10000);
  commission = round(subtotal*commBps/10000); charge = subtotal+convenience; operatorNet = subtotal-commission;
  platformGross = commission+convenience. Exactly the spec formula (12-pricing, formulas.md). ✅
- `resolveCommissionBps`: distance tiers (CommissionDistanceTier), falls back to default. Matches spec. ✅
- Rounding is per-SUBTOTAL (not per-seat) → no 1-XOF drift across seats. ✅
- Uses `Math.round` (round-half-up). Spec says round; fine.
- `loadPlatformSettings` lazily creates `default` row if missing. ✅
- Only money bug here is the shared `toPaystackAmountXOF` ×100 (F-11), imported and used by paystack-client.
