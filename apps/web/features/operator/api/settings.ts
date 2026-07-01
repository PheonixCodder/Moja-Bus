import type { DocumentType } from "@moja/schemas";

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

function getHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch: string | null;
  swiftCode: string | null;
  iban: string | null;
  isVerified: boolean;
}

export interface CompanyDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  website: string | null;
  description: string | null;
  businessType: string;
  registrationNumber: string;
  taxId: string;
  yearEstablished: number | null;
  logoUrl: string | null;
  estimatedStaffSize: number;
  status: "DRAFT" | "PENDING_VERIFICATION" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  bankAccount: BankAccount | null;
  documents: CompanyDocument[];
}

export interface OperatorSettings {
  company: Company;
  operator: {
    id: string;
    onboardingStatus: string;
    onboardingCurrentStep: string;
  };
}

export async function getSettings(): Promise<OperatorSettings> {
  const res = await fetch(`${API_BASE}/api/v1/operator/settings`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to load settings");
  return data;
}

export async function updateCompany(
  payload: Partial<
    Omit<Company, "id" | "status" | "bankAccount" | "documents">
  >,
): Promise<Company> {
  const res = await fetch(`${API_BASE}/api/v1/operator/settings/company`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      data.error ?? data.message ?? "Failed to update company details",
    );
  return data;
}

export async function updateBank(
  payload: Omit<BankAccount, "id" | "isVerified">,
): Promise<BankAccount> {
  const res = await fetch(`${API_BASE}/api/v1/operator/settings/bank`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      data.error ?? data.message ?? "Failed to update bank account",
    );
  return data;
}

export async function addDocument(payload: {
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  expiresAt?: string | null;
}): Promise<CompanyDocument> {
  const res = await fetch(`${API_BASE}/api/v1/operator/settings/documents`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      data.error ?? data.message ?? "Failed to upload document details",
    );
  return data;
}

export async function deleteDocument(
  id: string,
): Promise<{ success: boolean }> {
  const res = await fetch(
    `${API_BASE}/api/v1/operator/settings/documents/${id}`,
    {
      method: "DELETE",
      headers: getHeaders(),
      credentials: "include",
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error ?? data.message ?? "Failed to delete document");
  return data;
}
