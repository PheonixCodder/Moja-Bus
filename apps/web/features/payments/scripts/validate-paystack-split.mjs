#!/usr/bin/env node
/**
 * Paystack CIV validation checklist (run manually in test mode).
 *
 * Usage:
 *   PAYSTACK_SECRET_KEY=sk_test_... node apps/web/features/payments/scripts/validate-paystack-split.mjs
 *
 * Validates:
 * 1. Initialize with subaccount + bearer account
 * 2. Verify transaction after test payment
 * 3. Refund behavior on split transaction (document result)
 */
const secret = process.env.PAYSTACK_SECRET_KEY;
if (!secret) {
  console.error("Set PAYSTACK_SECRET_KEY to run validation.");
  process.exit(1);
}

const subaccountCode = process.env.PAYSTACK_TEST_SUBACCOUNT_CODE;
const reference = `moja_split_test_${Date.now()}`;

async function main() {
  console.log("=== Paystack CIV split validation ===\n");

  const initBody = {
    email: "test@mojaride.ci",
    amount: 10000 * 100,
    currency: "XOF",
    reference,
    channels: ["card", "mobile_money"],
    ...(subaccountCode
      ? { subaccount: subaccountCode, bearer: "account" }
      : {}),
  };

  const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(initBody),
  });
  const initJson = await initRes.json();
  console.log("Initialize:", initRes.status, JSON.stringify(initJson, null, 2));

  if (!initJson.status) {
    process.exit(1);
  }

  console.log("\nComplete payment in Paystack test UI, then press Enter to verify...");
  await new Promise((resolve) => process.stdin.once("data", resolve));

  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  const verifyJson = await verifyRes.json();
  console.log("\nVerify:", verifyRes.status, JSON.stringify(verifyJson, null, 2));

  console.log("\nCheck Paystack dashboard for split credit and fee allocation.");
  console.log("Document refund debit behavior before enabling v2 auto-split.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
