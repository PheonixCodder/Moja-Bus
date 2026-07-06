export const PAYSTACK_CHECKOUT_LOAD_TIMEOUT_SEC = 5;

export type PaystackPopupConfig = {
  publicKey: string;
  accessCode: string;
  reference: string;
  authorizationUrl: string;
};

export type PaystackNewTransactionConfig = {
  key: string;
  access_code: string;
  onLoad?: () => void;
  onError?: (error: { message: string }) => void;
  onSuccess: (transaction: { reference?: string }) => void;
  onCancel: () => void;
};

export type PaystackPopInstance = {
  newTransaction: (config: PaystackNewTransactionConfig) => unknown;
  cancelTransaction: (transaction: unknown) => void;
};

export class PaystackPaymentCancelledError extends Error {
  constructor() {
    super("Payment was cancelled");
    this.name = "PaystackPaymentCancelledError";
  }
}

export function shouldUseRedirectFallback(error: unknown): boolean {
  if (error instanceof PaystackPaymentCancelledError) {
    return false;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("cancel")) {
      return false;
    }
    if (
      message.includes("blocked") ||
      message.includes("refused to connect") ||
      message.includes("iframe")
    ) {
      return true;
    }
  }
  return true;
}

/** Use hosted redirect only when explicitly configured. */
export function shouldPreferRedirectCheckout(): boolean {
  return process.env["NEXT_PUBLIC_PAYSTACK_CHECKOUT_MODE"] === "redirect";
}

export function buildPaystackNewTransactionConfig(
  config: PaystackPopupConfig,
  callbacks: Pick<
    PaystackNewTransactionConfig,
    "onLoad" | "onError" | "onSuccess" | "onCancel"
  >,
): PaystackNewTransactionConfig {
  return {
    key: config.publicKey,
    access_code: config.accessCode,
    ...callbacks,
  };
}

export function redirectToPaystackCheckout(authorizationUrl: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.location.href = authorizationUrl;
}

export async function openPaystackCheckout(
  config: PaystackPopupConfig,
): Promise<{ reference: string } | null> {
  if (shouldPreferRedirectCheckout()) {
    redirectToPaystackCheckout(config.authorizationUrl);
    return null;
  }

  return openPaystackPopupWithFallback(config);
}

export async function openPaystackPopup(
  config: PaystackPopupConfig,
): Promise<{ reference: string }> {
  const PaystackPop = (await import("@paystack/inline-js"))
    .default as new () => PaystackPopInstance;
  const popup = new PaystackPop();

  return new Promise((resolve, reject) => {
    let settled = false;
    let loaded = false;
    let redirectTimer: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (redirectTimer) {
        clearInterval(redirectTimer);
        redirectTimer = null;
      }
    };

    const settleSuccess = (reference: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ reference });
    };

    const settleCancel = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new PaystackPaymentCancelledError());
    };

    const settleRedirect = () => {
      if (settled) return;
      settled = true;
      cleanup();
      redirectToPaystackCheckout(config.authorizationUrl);
    };

    popup.newTransaction(
      buildPaystackNewTransactionConfig(config, {
        onLoad: () => {
          loaded = true;
          cleanup();
        },
        onSuccess: (result) => {
          const reference = result.reference ?? config.reference;
          if (!reference) {
            if (settled) return;
            settled = true;
            cleanup();
            reject(new Error("Missing payment reference"));
            return;
          }
          settleSuccess(reference);
        },
        onCancel: () => {
          settleCancel();
        },
        onError: () => {
          settleRedirect();
        },
      }),
    );

    let elapsedSec = 0;
    redirectTimer = setInterval(() => {
      elapsedSec += 1;
      if (loaded || settled) {
        cleanup();
        return;
      }
      if (elapsedSec >= PAYSTACK_CHECKOUT_LOAD_TIMEOUT_SEC) {
        settleRedirect();
      }
    }, 1000);
  });
}

export async function openPaystackPopupWithFallback(
  config: PaystackPopupConfig,
): Promise<{ reference: string } | null> {
  try {
    return await openPaystackPopup(config);
  } catch (error) {
    if (shouldUseRedirectFallback(error)) {
      redirectToPaystackCheckout(config.authorizationUrl);
      return null;
    }
    throw error;
  }
}
