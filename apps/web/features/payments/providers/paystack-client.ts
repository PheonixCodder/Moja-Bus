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
  subaccountCode?: string | null;
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

  if (input.subaccountCode) {
    body["subaccount"] = input.subaccountCode;
    body["bearer"] = "account";
  }

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

export async function paystackCreateSubaccount(input: {
  businessName: string;
  settlementBankCode: string;
  accountNumber: string;
}): Promise<{ subaccountCode: string }> {
  const res = await fetch("https://api.paystack.co/subaccount", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      business_name: input.businessName,
      settlement_bank: input.settlementBankCode,
      account_number: input.accountNumber,
      percentage_charge: 100,
    }),
  });

  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: {
      subaccount_code: string;
    };
  };

  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message ?? "Failed to create Paystack subaccount");
  }

  return {
    subaccountCode: json.data.subaccount_code,
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

export async function paystackListBanks(country?: string): Promise<PaystackBank[]> {
  const supportedCountries = ["ghana", "kenya", "nigeria", "south africa"];
  const normalizedCountry = country?.toLowerCase() ?? "";

  const useCountryParam = supportedCountries.includes(normalizedCountry);
  const url = useCountryParam
    ? `https://api.paystack.co/bank?country=${encodeURIComponent(normalizedCountry)}`
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

