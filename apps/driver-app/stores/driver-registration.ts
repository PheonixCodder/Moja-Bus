import { create } from "zustand";

export type LicenseCategoryType = "B" | "C" | "D" | "E";
export type EmploymentType = "EXCLUSIVE_INTERCITY" | "CONTRACTOR_URBAN" | "HYBRID";


export interface DriverRegistrationState {
  // Step 1: Personal Demographics & Selfie
  fullName: string;
  phone: string;
  yearsOfExperience: number;
  profileSelfieUri: string | null;

  // Step 2: Commercial Driving License
  licenseNumber: string;
  licenseCategory: LicenseCategoryType;
  licenseExpiryDate: string; // ISO date string YYYY-MM-DD
  licenseFrontUri: string | null;
  licenseBackUri: string | null;

  // Step 3: National ID & Medical Clearance
  nationalIdNumber: string;
  medicalDocUri: string | null;

  // Step 4: Carrier Affiliation
  carrierCode: string;
  employmentType: EmploymentType;

  // Actions
  updateData: (data: Partial<DriverRegistrationState>) => void;
  reset: () => void;
}

const initialState = {
  fullName: "",
  phone: "",
  yearsOfExperience: 3,
  profileSelfieUri: null,
  licenseNumber: "",
  licenseCategory: "D" as LicenseCategoryType,
  licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]!,
  licenseFrontUri: null,
  licenseBackUri: null,
  nationalIdNumber: "",
  medicalDocUri: null,
  carrierCode: "",
  employmentType: "EXCLUSIVE_INTERCITY" as EmploymentType,
};

export const useDriverRegistrationStore = create<DriverRegistrationState>(
  (set) => ({
    ...initialState,
    updateData: (data) => set((state) => ({ ...state, ...data })),
    reset: () => set(initialState),
  })
);
