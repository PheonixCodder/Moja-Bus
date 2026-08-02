import { z } from "zod";

export const contactInquiryStatusEnum = z.enum([
  "NEW",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
]);

export const submitInquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().min(1, "Email is required").email().max(200),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  subject: z.string().trim().min(1, "Subject is required").max(100),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

export type SubmitInquiryInput = z.infer<typeof submitInquirySchema>;

export const adminListInquiriesSchema = z.object({
  search: z.string().optional(),
  status: contactInquiryStatusEnum.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const adminGetInquirySchema = z.object({
  id: z.string().min(1, "Inquiry ID is required"),
});

export const adminUpdateInquiryStatusSchema = z.object({
  id: z.string().min(1, "Inquiry ID is required"),
  status: contactInquiryStatusEnum,
  adminNote: z.string().trim().max(2000).optional(),
});
