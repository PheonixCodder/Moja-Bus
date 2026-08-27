import { createHmac, timingSafeEqual } from "node:crypto";
import { getOptionalEnv, getRequiredEnv } from "@moja/config";
import { toPaystackAmountXOF } from "../lib/pricing-resolver";

export type PaystackInitializeResult = {
  reference: string;
  accessCode: string;
  authorizationUrl: string;
};

export type PaystackVerifyResult = {
  status: "success" | "failed" | "pending";
  reference: string;
  amountXOF: number;
  channel: string | null;
  feesXOF: number | null;
  paidAt: string | null;
  raw: unknown;
};

function paystackSecretKey(): string {
  return getRequiredEnv("PAYSTACK_SECRET_KEY");
}

export function paystackPublicKey(): string {
  return getRequiredEnv("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY");
}

export function isPaystackConfigured(): boolean {
  return Boolean(
    getOptionalEnv("PAYSTACK_SECRET_KEY") &&
      getOptionalEnv("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"),
  );
}

export function buildPaystackReference(
  holdGroupId: string,
  attemptNumber: number,
) {
  return `moja_${holdGroupId}_${attemptNumber}_${Date.now()}`;
}

export async function paystackInitialize(input: {
  email: string;
  amountXOF: number;
  reference: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
}): Promise<PaystackInitializeResult> {
  // No `channels` param — Paystack shows every method enabled on the
  // dashboard for XOF (card, mobile money, bank transfer, ...).
  const body: Record<string, unknown> = {
    email: input.email,
    amount: toPaystackAmountXOF(input.amountXOF),
    currency: "XOF",
    reference: input.reference,
    metadata: input.metadata,
    callback_url: input.callbackUrl,
  };

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: {
      reference: string;
      access_code: string;
      authorization_url: string;
    };
  };

  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message ?? "Failed to initialize Paystack payment");
  }

  return {
    reference: json.data.reference,
    accessCode: json.data.access_code,
    authorizationUrl: json.data.authorization_url,
  };
}

export async function paystackVerify(
  reference: string,
): Promise<PaystackVerifyResult> {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecretKey()}`,
      },
    },
  );

  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: {
      status: string;
      reference: string;
      amount: number;
      channel?: string;
      fees?: number;
      paid_at?: string;
    };
  };

  if (!res.ok || !json.data) {
    throw new Error(json.message ?? "Failed to verify Paystack payment");
  }

  const amountXOF = Math.round(json.data.amount / 100);

  return {
    status:
      json.data.status === "success"
        ? "success"
        : json.data.status === "failed"
          ? "failed"
          : "pending",
    reference: json.data.reference,
    amountXOF,
    channel: json.data.channel ?? null,
    feesXOF: json.data.fees != null ? Math.round(json.data.fees / 100) : null,
    paidAt: json.data.paid_at ?? null,
    raw: json.data,
  };
}

export function verifyPaystackSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = getOptionalEnv("PAYSTACK_SECRET_KEY");
  if (!secret || !signature) return false;

  // Paystack uses HMAC SHA512. Phase 32 (F-PS-13) — constant-time compare
  // (house pattern from signed-access-tokens.ts); a plain `===` leaks
  // prefix-match timing on a money-path authentication boundary.
  const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(hash, "utf8");
  const received = Buffer.from(signature, "utf8");
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export const PAYSTACK_RECIPIENT_CURRENCY = "XOF" as const;

function paystackErrorMessage(
  code?: string | null,
  message?: string | null,
): string {
  switch (code) {
    case "invalid_account_number":
      return "This account number was not recognized for the selected bank. Check the number (14-digit RIB for banks, or your phone number for mobile money) and try again.";
    case "invalid_bank_code":
      return "The selected bank is not supported for payouts. Please choose another bank.";
    case "missing_params":
      return "Payouts to this account are not supported yet. Please contact support.";
    default:
      return message ?? "We could not verify this account. Please try again.";
  }
}

export async function paystackCreateTransferRecipient(input: {
  name: string;
  accountNumber: string;
  bankCode: string;
  type: string;
  currency?: string;
}): Promise<{ recipientCode: string; accountName: string | null }> {
  const res = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      account_number: input.accountNumber,
      bank_code: input.bankCode,
      type: input.type,
      currency: input.currency ?? PAYSTACK_RECIPIENT_CURRENCY,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    code?: string;
    data?: {
      recipient_code: string;
      details?: { account_name?: string | null };
    };
  };

  if (!res.ok || !json.status || !json.data) {
    throw new Error(
      paystackErrorMessage(
        json.code,
        json.message ?? "Failed to create Paystack transfer recipient",
      ),
    );
  }

  return {
    recipientCode: json.data.recipient_code,
    accountName: json.data.details?.account_name ?? null,
  };
}

/**
 * Registers a Paystack transfer recipient for an operator bank account using
 * the app's XOF/Côte d'Ivoire market settings, and runs a soft check comparing
 * the resolved account holder name (when Paystack returns one) with the
 * operator-entered name. XOF has no `/bank/resolve` support, so the recipient
 * creation call itself is what validates the account number.
 */
export async function paystackRegisterRecipient(input: {
  accountNumber: string;
  bankCode: string;
  bankType?: string | null;
  accountName: string;
}): Promise<{
  recipientCode: string;
  resolvedAccountName: string | null;
  accountNameMatched: boolean;
}> {
  const type = input.bankType || "bceao";
  const result = await paystackCreateTransferRecipient({
    name: input.accountName,
    accountNumber: input.accountNumber,
    bankCode: input.bankCode,
    type,
    currency: PAYSTACK_RECIPIENT_CURRENCY,
  });

  const resolvedAccountName = result.accountName;
  const accountNameMatched =
    !resolvedAccountName ||
    normalizeAccountName(resolvedAccountName) ===
      normalizeAccountName(input.accountName);

  return {
    recipientCode: result.recipientCode,
    resolvedAccountName,
    accountNameMatched,
  };
}

function normalizeAccountName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s.,'`-]+/g, "");
}

export async function paystackInitiateTransfer(input: {
  amountXOF: number;
  recipientCode: string;
  reason: string;
  reference?: string;
}): Promise<{ transferCode: string; status: string; fee: number }> {
  const res = await fetch("https://api.paystack.co/transfer", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: toPaystackAmountXOF(input.amountXOF),
      recipient: input.recipientCode,
      reason: input.reason,
      reference: input.reference,
      currency: "XOF",
    }),
    signal: AbortSignal.timeout(30_000),
  });

  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: {
      transfer_code: string;
      status: string;
      fee?: number;
    };
  };

  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message ?? "Failed to initiate Paystack transfer");
  }

  return {
    transferCode: json.data.transfer_code,
    status: json.data.status,
    fee: (json.data.fee ?? 0) / 100, // Convert from kobo/cents to main currency
  };
}

export type PaystackBank = {
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  active: boolean;
  is_deleted: boolean;
  country: string;
  currency: string;
  type: string;
  id: number;
};

export async function paystackListBanks(opts?: {
  country?: string;
  currency?: string;
}): Promise<PaystackBank[]> {
  // Paystack's List Banks `country` param only accepts
  // ghana | kenya | nigeria | south africa. Côte d'Ivoire (XOF) is NOT a
  // supported `country` value, so the documented way to fetch a market's banks
  // is by `currency` (e.g. GET /bank?currency=XOF) — see Paystack
  // "Creating Transfer Recipients" guide. Default the app to XOF/CI.
  const supportedCountries = ["ghana", "kenya", "nigeria", "south africa"];
  const country = opts?.country?.toLowerCase();
  const currency = opts?.currency?.toUpperCase();

  const params = new URLSearchParams();
  if (currency) {
    params.set("currency", currency);
  } else if (country && supportedCountries.includes(country)) {
    params.set("country", country);
  } else if (country) {
    // Unknown country string (e.g. "cote d'ivoire") — fall back to XOF so we
    // still return the correct market's banks instead of silently Nigeria.
    params.set("currency", "XOF");
  } else {
    params.set("currency", "XOF"); // app default market: Côte d'Ivoire
  }

  const query = params.toString();
  const url = query
    ? `https://api.paystack.co/bank?${query}`
    : "https://api.paystack.co/bank";
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${paystackSecretKey()}`,
      "Content-Type": "application/json",
    },
  });

  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: PaystackBank[];
  };

  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message ?? "Failed to fetch banks list from Paystack");
  }

  return json.data;
}

export async function paystackVerifyTransfer(reference: string): Promise<{
  status: "success" | "failed" | "reversed" | "pending";
  transferCode: string;
  amountXOF: number;
  reason?: string;
  id?: number;
}> {
  const res = await fetch(
    `https://api.paystack.co/transfer/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${paystackSecretKey()}`,
      },
      signal: AbortSignal.timeout(30_000),
    },
  );

  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: {
      status: string;
      transfer_code: string;
      amount: number;
      failures?: string;
      id?: number;
    };
  };

  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message ?? "Failed to verify Paystack transfer");
  }

  const amountXOF = Math.round(json.data.amount / 100);

  const responseObj: {
    status: "success" | "failed" | "reversed" | "pending";
    transferCode: string;
    amountXOF: number;
    reason?: string;
    id?: number;
  } = {
    status:
      json.data.status === "success"
        ? "success"
        : json.data.status === "reversed"
          ? "reversed"
          : json.data.status === "failed"
            ? "failed"
            : "pending",
    transferCode: json.data.transfer_code,
    amountXOF,
  };

  if (json.data.failures) {
    responseObj.reason = json.data.failures;
  }
  if (json.data.id != null) {
    responseObj.id = json.data.id;
  }

  return responseObj;
}
