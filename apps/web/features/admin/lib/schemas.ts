import { z } from "zod";

export const rejectVerificationFormSchema = z.object({
  reason: z.string().min(5, "Rejection reason must be at least 5 characters"),
});
