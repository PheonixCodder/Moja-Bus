import { createHmac, timingSafeEqual } from "node:crypto";
import { getOptionalEnv } from "@moja/config";
import { TRPCError } from "@trpc/server";

const QUOTE_TTL_MS = 5 * 60 * 1000;
const QUOTE_VERSION = 1 as const;

export type CheckoutQuotePayload = {
  v: typeof QUOTE_VERSION;
  offerId: string;
  seatCount: number;
  paymentMethod: "WALLET" | "PAYSTACK";
  code: string | null;
  monetaryVoucherId: string | null;
  autoApply: boolean;
  useCredits: boolean;
  waiveConvenienceFee: boolean;
  chargeAmountXOF: number;
  postDiscountSubtotalXOF: number;
  convenienceFeeXOF: number;
  ticketDiscountXOF: number;
  feeDiscountXOF: number;
  creditAppliedXOF: number;
  voucherAppliedXOF: number;
  exp: number;
};

function quoteSecret(): string {
  const secret =
    getOptionalEnv("BETTER_AUTH_SECRET") ??
    getOptionalEnv("CHECKOUT_QUOTE_SECRET");
  if (!secret) {
    throw new Error(
      "BETTER_AUTH_SECRET or CHECKOUT_QUOTE_SECRET is required for checkout quotes",
    );
  }
  return secret;
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

export function signCheckoutQuote(
  input: Omit<CheckoutQuotePayload, "v" | "exp"> & { exp?: number },
): string {
  const payload: CheckoutQuotePayload = {
    v: QUOTE_VERSION,
    offerId: input.offerId,
    seatCount: input.seatCount,
    paymentMethod: input.paymentMethod,
    code: input.code,
    monetaryVoucherId: input.monetaryVoucherId,
    autoApply: input.autoApply,
    useCredits: input.useCredits,
    waiveConvenienceFee: input.waiveConvenienceFee,
    chargeAmountXOF: input.chargeAmountXOF,
    postDiscountSubtotalXOF: input.postDiscountSubtotalXOF,
    convenienceFeeXOF: input.convenienceFeeXOF,
    ticketDiscountXOF: input.ticketDiscountXOF,
    feeDiscountXOF: input.feeDiscountXOF,
    creditAppliedXOF: input.creditAppliedXOF,
    voucherAppliedXOF: input.voucherAppliedXOF,
    exp: input.exp ?? Date.now() + QUOTE_TTL_MS,
  };
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = b64url(
    createHmac("sha256", quoteSecret()).update(body).digest(),
  );
  return `${body}.${sig}`;
}

export function verifyCheckoutQuote(quoteId: string): CheckoutQuotePayload {
  const parts = quoteId.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid or missing checkout quote. Refresh pricing and try again.",
    });
  }
  const [body, sig] = parts;
  const expected = createHmac("sha256", quoteSecret()).update(body).digest();
  let actual: Buffer;
  try {
    actual = fromB64url(sig);
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid or missing checkout quote. Refresh pricing and try again.",
    });
  }
  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid or missing checkout quote. Refresh pricing and try again.",
    });
  }

  let payload: CheckoutQuotePayload;
  try {
    payload = JSON.parse(fromB64url(body).toString("utf8")) as CheckoutQuotePayload;
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid or missing checkout quote. Refresh pricing and try again.",
    });
  }

  if (payload.v !== QUOTE_VERSION || typeof payload.exp !== "number") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Checkout quote is outdated. Refresh pricing and try again.",
    });
  }
  if (Date.now() > payload.exp) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Checkout quote expired. Refresh pricing and try again.",
    });
  }
  return payload;
}

/** True when hold discount inputs match the signed quote (method + instruments). */
export function quoteMatchesHoldInput(
  quote: CheckoutQuotePayload,
  input: {
    offerId: string;
    seatCount: number;
    code?: string | undefined;
    monetaryVoucherId?: string | undefined;
    autoApply?: boolean | undefined;
    useCredits?: boolean | undefined;
  },
): boolean {
  const code = input.code?.toUpperCase() ?? null;
  return (
    quote.offerId === input.offerId &&
    quote.seatCount === input.seatCount &&
    quote.code === code &&
    quote.monetaryVoucherId === (input.monetaryVoucherId ?? null) &&
    quote.autoApply === (input.autoApply ?? true) &&
    quote.useCredits === (input.useCredits ?? true)
  );
}
