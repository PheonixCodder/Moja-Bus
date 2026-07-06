declare module "@paystack/inline-js" {
  export default class PaystackPop {
    newTransaction(config: {
      key: string;
      access_code?: string;
      email?: string;
      amount?: number;
      reference?: string;
      onLoad?: () => void;
      onError?: (error: { message: string }) => void;
      onSuccess: (transaction: { reference?: string }) => void;
      onCancel: () => void;
    }): unknown;

    cancelTransaction(transaction: unknown): void;
  }
}
