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

export function buildPaystackReference(holdGroupId: string, attemptNumber: number) {
  return `moja_${holdGroupId}_${attemptNumber}_${Date.now()}`;
}

export async function paystackInitialize(input: {
  email: string;
  amountXOF: number;
  reference: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
}): Promise<PaystackInitializeResult> {
  const body: Record<string, unknown> = {
    email: input.email,
    amount: toPaystackAmountXOF(input.amountXOF),
    currency: "XOF",
    reference: input.reference,
    metadata: input.metadata,
    callback_url: input.callbackUrl,
    channels: ["card", "mobile_money"],
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

  // Paystack uses HMAC SHA512 — use Web Crypto in edge or node crypto
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("node:crypto") as typeof import("node:crypto");
  const hash = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}

export async function paystackCreateTransferRecipient(input: {
  businessName: string;
  accountNumber: string;
  bankCode: string;
}): Promise<{ recipientCode: string }> {
  const res = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.businessName,
      account_number: input.accountNumber,
      bank_code: input.bankCode,
      currency: "XOF",
    }),
    signal: AbortSignal.timeout(30_000),
  });

  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: {
      recipient_code: string;
    };
  };

  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message ?? "Failed to create Paystack transfer recipient");
  }

  return {
    recipientCode: json.data.recipient_code,
  };
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

export async function paystackResolveAccount(input: {
  accountNumber: string;
  bankCode: string;
}): Promise<{ accountNumber: string; accountName: string }> {
  const res = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${input.accountNumber}&bank_code=${input.bankCode}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecretKey()}`,
        "Content-Type": "application/json",
      },
    }
  );

  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: {
      account_number: string;
      account_name: string;
    };
  };

  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message ?? "Could not resolve bank account details");
  }

  return {
    accountNumber: json.data.account_number,
    accountName: json.data.account_name,
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
  const res = await fetch(`https://api.paystack.co/transfer/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${paystackSecretKey()}`,
    },
    signal: AbortSignal.timeout(30_000),
  });

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

