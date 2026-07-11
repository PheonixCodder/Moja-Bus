import { z } from "zod";

export const topUpWalletSchema = z.object({
  amountXOF: z.number().int().positive().min(500, "Minimum top-up is 500 FCFA"),
  paymentMethod: z.enum(["PAYSTACK", "MOBILE_MONEY", "CARD"]).default("PAYSTACK"),
});

export type TopUpWalletInput = z.infer<typeof topUpWalletSchema>;
