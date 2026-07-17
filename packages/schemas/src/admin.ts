import { z } from "zod";

export const adminVerifyCompanySchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  bankCode: z.string().min(1, "Settlement bank code is required"),
});

export const adminRejectCompanySchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  reason: z.string().min(1, "Rejection reason is required"),
});

export const adminListUsersSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const adminUpdateUserRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["TRAVELER", "OPERATOR", "ADMIN"]),
});

export const adminListOperationsSchema = z.object({
  companyId: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const adminListCompaniesSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING_VERIFICATION", "VERIFIED", "ACTIVE", "SUSPENDED", "REJECTED"]).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const adminGetCompanySchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
});

export const adminUpdateVerificationChecklistSchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  ownerIdentityVerified: z.boolean(),
  bankVerified: z.boolean(),
  documentsVerified: z.boolean(),
  permitVerified: z.boolean(),
});

export const adminListLedgerEntriesSchema = z.object({
  search: z.string().optional(),
  side: z.enum(["DEBIT", "CREDIT"]).optional(),
  type: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});



