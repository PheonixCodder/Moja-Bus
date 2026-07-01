import { z } from "zod";

export const businessTypeEnum = z.enum([
  "SOLE_PROPRIETORSHIP",
  "LLC",
  "CORPORATION",
  "PARTNERSHIP",
  "COOPERATIVE",
  "OTHER",
]);
export type BusinessType = z.infer<typeof businessTypeEnum>;

export const documentTypeEnum = z.enum([
  "BUSINESS_REGISTRATION_CERTIFICATE",
  "TAX_CLEARANCE_CERTIFICATE",
  "BUSINESS_LICENSE",
  "TRANSPORT_OPERATING_PERMIT",
  "INSURANCE_CERTIFICATE",
  "AUTHORIZED_REPRESENTATIVE_LETTER",
  "BANK_STATEMENT",
  "OTHER",
]);
export type DocumentType = z.infer<typeof documentTypeEnum>;

export const staffRoleEnum = z.enum([
  "OWNER",
  "ADMIN",
  "MANAGER",
  "OPERATIONS",
  "FINANCE",
  "SUPPORT",
]);
export type StaffRole = z.infer<typeof staffRoleEnum>;

export const companyStepSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(6, "Invalid phone number"),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  description: z.string().optional(),
  businessType: businessTypeEnum,
  registrationNumber: z.string().min(2, "Registration number is required"),
  taxId: z.string().min(2, "Tax ID is required"),
  yearEstablished: z.coerce
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .optional()
    .nullable(),
  estimatedStaffSize: z.coerce.number().int().min(1),
  logoUrl: z.string().optional().or(z.literal("")),
});
export type CompanyStepInput = z.infer<typeof companyStepSchema>;

export const locationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1, "City is required"),
  cityId: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().default("Cote d'Ivoire"),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  phone: z.string().min(1, "Phone number is required"),
  managerName: z.string().optional().nullable(),
  managerPhone: z.string().optional().nullable(),
  managerEmail: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false),
  operatingHours: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});
export type LocationInput = z.infer<typeof locationSchema>;

export const locationsStepSchema = z.object({
  locations: z
    .array(locationSchema)
    .min(1, "At least one location is required"),
});
export type LocationsStepInput = z.infer<typeof locationsStepSchema>;

export const documentSchema = z.object({
  type: documentTypeEnum,
  fileName: z.string().min(1),
  fileUrl: z.string().url("Invalid file URL"),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
});
export type DocumentInput = z.infer<typeof documentSchema>;

export const documentsStepSchema = z.object({
  documents: z
    .array(documentSchema)
    .min(1, "At least one document is required"),
});
export type DocumentsStepInput = z.infer<typeof documentsStepSchema>;

export const bankStepSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  accountName: z.string().min(1, "Account name is required"),
  branch: z.string().optional().nullable(),
  swiftCode: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
});
export type BankStepInput = z.infer<typeof bankStepSchema>;

export const profileStepSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  personalPhone: z.string().optional().nullable(),
  role: staffRoleEnum.default("OWNER"),
  dateOfBirth: z.string().optional().nullable(),
  nationalIdNumber: z.string().optional().nullable(),
  nationalIdType: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  profilePhotoUrl: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
});
export type ProfileStepInput = z.infer<typeof profileStepSchema>;

export const termsStepSchema = z.object({
  acceptTerms: z.boolean().refine((v) => v === true, "Must accept terms"),
  acceptCommission: z
    .boolean()
    .refine((v) => v === true, "Must accept commission terms"),
  acceptPrivacy: z
    .boolean()
    .refine((v) => v === true, "Must accept privacy policy"),
});
export type TermsStepInput = z.infer<typeof termsStepSchema>;

export const onboardingStepValues = [
  "company",
  "locations",
  "documents",
  "bank",
  "profile",
  "terms",
] as const;
export const onboardingStepSchema = z.enum(onboardingStepValues);
export type OnboardingStep = z.infer<typeof onboardingStepSchema>;

export const saveOnboardingStepSchema = z.object({
  step: onboardingStepSchema,
  companyData: companyStepSchema.optional(),
  locationsData: locationsStepSchema.optional(),
  documentsData: documentsStepSchema.optional(),
  bankData: bankStepSchema.optional(),
  profileData: profileStepSchema.optional(),
  termsData: termsStepSchema.optional(),
});
export type SaveOnboardingStepInput = z.infer<typeof saveOnboardingStepSchema>;
