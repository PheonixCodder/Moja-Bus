import {
  type OnboardingStep,
  type CompanyStepInput,
  type LocationsStepInput,
  type DocumentsStepInput,
  type BankStepInput,
  type ProfileStepInput,
  type TermsStepInput,
} from "@moja/schemas";

const API_BASE_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  // Get the token from better-auth if configured as bearer, or rely on cookies
  // Better Auth stores session cookies, so credentials: "include" is required.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function getOnboardingSnapshot() {
  return fetchWithAuth("/api/v1/operator/onboarding");
}

export interface SaveStepPayload {
  step: OnboardingStep;
  companyData?: CompanyStepInput;
  locationsData?: LocationsStepInput;
  documentsData?: DocumentsStepInput;
  bankData?: BankStepInput;
  profileData?: ProfileStepInput;
  termsData?: TermsStepInput;
}

export async function saveOnboardingStep(payload: SaveStepPayload) {
  return fetchWithAuth("/api/v1/operator/onboarding/step", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function completeOnboarding() {
  return fetchWithAuth("/api/v1/operator/onboarding/complete", {
    method: "POST",
  });
}
