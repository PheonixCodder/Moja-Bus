export type CompanyStatusValue =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "ACTIVE"
  | "SUSPENDED"
  | "REJECTED";

export type CompanyStatusPresentation = {
  label: string;
  shortLabel: string;
  badgeClassName: string;
  description: string;
  canSubmitForVerification: boolean;
  canResubmit: boolean;
  isFullyVerified: boolean;
};

const STATUS_MAP: Record<CompanyStatusValue, CompanyStatusPresentation> = {
  DRAFT: {
    label: "Setup in progress",
    shortLabel: "Draft",
    badgeClassName:
      "bg-muted text-muted-foreground border-border",
    description:
      "Complete your company profile, bank details, and compliance documents, then submit for verification.",
    canSubmitForVerification: true,
    canResubmit: false,
    isFullyVerified: false,
  },
  PENDING_VERIFICATION: {
    label: "Pending review",
    shortLabel: "Pending",
    badgeClassName:
      "bg-warning/10 text-warning border-warning/20",
    description:
      "Your registration has been submitted and is pending review by the Moja Ride team. You can continue setting up terminals, routes, and schedules.",
    canSubmitForVerification: false,
    canResubmit: false,
    isFullyVerified: false,
  },
  VERIFIED: {
    label: "Verified operator",
    shortLabel: "Verified",
    badgeClassName:
      "bg-success/10 text-success border-success/20",
    description:
      "Your company is verified. You can manage fleet, routes, schedules, and sell digital tickets.",
    canSubmitForVerification: false,
    canResubmit: false,
    isFullyVerified: true,
  },
  ACTIVE: {
    label: "Verified operator",
    shortLabel: "Active",
    badgeClassName:
      "bg-success/10 text-success border-success/20",
    description:
      "Your company is active and authorized to operate on Moja Ride.",
    canSubmitForVerification: false,
    canResubmit: false,
    isFullyVerified: true,
  },
  SUSPENDED: {
    label: "Account suspended",
    shortLabel: "Suspended",
    badgeClassName:
      "bg-warning/15 text-warning border-warning/30",
    description:
      "Your operator account has been suspended. Contact Moja Ride support for assistance.",
    canSubmitForVerification: false,
    canResubmit: false,
    isFullyVerified: false,
  },
  REJECTED: {
    label: "Verification rejected",
    shortLabel: "Rejected",
    badgeClassName:
      "bg-destructive/10 text-destructive border-destructive/20",
    description:
      "Your verification was rejected. Review the feedback, update your profile and documents, then resubmit.",
    canSubmitForVerification: false,
    canResubmit: true,
    isFullyVerified: false,
  },
};

export function getCompanyStatusPresentation(
  status: string | null | undefined,
): CompanyStatusPresentation {
  if (status && status in STATUS_MAP) {
    return STATUS_MAP[status as CompanyStatusValue];
  }
  return STATUS_MAP.DRAFT;
}

export const REQUIRED_DOC_TYPES = [
  "BUSINESS_REGISTRATION_CERTIFICATE",
  "TRANSPORT_OPERATING_PERMIT",
] as const;

export function areRequiredDocumentsApproved(
  documents: Array<{ type: string; status: string }>,
): boolean {
  return REQUIRED_DOC_TYPES.every((docType) =>
    documents.some((d) => d.type === docType && d.status === "APPROVED"),
  );
}

export function getDocumentsVerificationState(
  documents: Array<{ type: string; status: string }>,
): "missing" | "pending" | "approved" {
  const hasAllTypes = REQUIRED_DOC_TYPES.every((docType) =>
    documents.some((d) => d.type === docType),
  );
  if (!hasAllTypes) return "missing";
  if (areRequiredDocumentsApproved(documents)) return "approved";
  return "pending";
}

export function getBankVerificationState(
  bankAccount: { isVerified: boolean } | null | undefined,
): "missing" | "pending" | "verified" {
  if (!bankAccount) return "missing";
  if (bankAccount.isVerified) return "verified";
  return "pending";
}

export function getCompanyProfileState(
  company:
    | { registrationNumber?: string | null; taxId?: string | null }
    | null
    | undefined,
): "missing" | "complete" {
  if (!company) return "missing";
  if (company.registrationNumber && company.taxId) return "complete";
  return "missing";
}
