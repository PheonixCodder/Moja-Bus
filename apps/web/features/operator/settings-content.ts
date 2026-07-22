export const SETTINGS_TABS = [
  { value: "profile", label: "Company Profile", icon: "Building2" },
  { value: "bank", label: "Bank Accounts", icon: "CreditCard" },
  { value: "documents", label: "Documents", icon: "FileText" },
  { value: "verification", label: "Verification", icon: "ShieldCheck" },
  { value: "health", label: "Health Score", icon: "Heart" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["value"];

export const COMPANY_PROFILE_FIELDS = [
  "name", "email", "phone", "website", "description", "estimatedStaffSize"
] as const;

export const LEGAL_FIELDS = [
  "businessType", "registrationNumber", "taxId", "yearEstablished"
] as const;

export const BANK_FIELDS = [
  "bankName", "bankCode", "accountNumber", "accountName", "branch", "swiftCode", "iban"
] as const;

export const DOCUMENT_TYPES = [
  "BUSINESS_REGISTRATION_CERTIFICATE",
  "TRANSPORT_OPERATING_PERMIT",
  "INSURANCE_CERTIFICATE",
  "TAX_COMPLIANCE_CERTIFICATE"
] as const;

export const SETTINGS_ROUTES = {
  profile: "/dashboard/operator/settings?tab=profile",
  bank: "/dashboard/operator/settings?tab=bank",
  documents: "/dashboard/operator/settings?tab=documents",
  verification: "/dashboard/operator/settings?tab=verification",
  health: "/dashboard/operator/settings?tab=health",
} as const;