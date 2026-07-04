import type { PaymentProviderAdapter } from "./types";

export class MockPaymentProvider implements PaymentProviderAdapter {
  id = "MOCK" as const;

  async initiate(): Promise<{
    paymentIds: string[];
    status: "PAID";
  }> {
    return { paymentIds: [], status: "PAID" };
  }
}

function notImplemented(id: string): PaymentProviderAdapter {
  return {
    id: id as PaymentProviderAdapter["id"],
    async initiate() {
      throw new Error(
        `${id} payment provider is not configured yet. Use MOCK for beta.`,
      );
    },
  };
}

const providers: Record<string, PaymentProviderAdapter> = {
  MOCK: new MockPaymentProvider(),
  WAVE: notImplemented("WAVE"),
  ORANGE_MONEY: notImplemented("ORANGE_MONEY"),
  MTN_MOMO: notImplemented("MTN_MOMO"),
  CINETPAY: notImplemented("CINETPAY"),
  CARD: notImplemented("CARD"),
};

export function getPaymentProvider(
  id: string = process.env["PAYMENT_PROVIDER"] ?? "MOCK",
): PaymentProviderAdapter {
  return providers[id] ?? providers["MOCK"]!;
}
