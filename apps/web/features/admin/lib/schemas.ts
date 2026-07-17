import { z } from "zod";

export const approveVerificationFormSchema = z.object({
  bankCode: z.string().min(1, "Settlement bank is required"),
});

export const rejectVerificationFormSchema = z.object({
  reason: z.string().min(5, "Rejection reason must be at least 5 characters"),
});
