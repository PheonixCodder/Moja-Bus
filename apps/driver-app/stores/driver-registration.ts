import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type LicenseCategoryType = "B" | "C" | "D" | "E";
export type EmploymentType = "EXCLUSIVE_INTERCITY" | "CONTRACTOR_URBAN" | "HYBRID";

export interface DriverRegistrationState {
  // Wizard progress tracking
  currentStep: number;
  verifiedAt: string | null;

  // Step 1: Personal Demographics & Selfie
  fullName: string;
  phone: string;
  yearsOfExperience: number;
  profileSelfieUri: string | null;
  profileSelfieLocalPreview: string | null;

  // Step 2: Commercial Driving License
  licenseNumber: string;
  licenseCategory: LicenseCategoryType;
  licenseExpiryDate: string; // ISO date string YYYY-MM-DD
  licenseFrontUri: string | null;
  licenseFrontLocalPreview: string | null;
  licenseBackUri: string | null;
  licenseBackLocalPreview: string | null;

  // Step 3: National ID & Medical Clearance
  nationalIdNumber: string;
  medicalDocUri: string | null;
  medicalDocLocalPreview: string | null;

  // Step 4: Carrier Affiliation
  carrierCode: string;
  employmentType: EmploymentType;

  // Actions
  updateData: (data: Partial<DriverRegistrationState>) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1,
  verifiedAt: null as string | null,
  fullName: "",
  phone: "",
  yearsOfExperience: 3,
  profileSelfieUri: null,
  profileSelfieLocalPreview: null as string | null,
  licenseNumber: "",
  licenseCategory: "D" as LicenseCategoryType,
  licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]!,
  licenseFrontUri: null,
  licenseFrontLocalPreview: null as string | null,
  licenseBackUri: null,
  licenseBackLocalPreview: null as string | null,
  nationalIdNumber: "",
  medicalDocUri: null,
  medicalDocLocalPreview: null as string | null,
  carrierCode: "",
  employmentType: "EXCLUSIVE_INTERCITY" as EmploymentType,
};

export const useDriverRegistrationStore = create<DriverRegistrationState>()(
  persist(
    (set) => ({
      ...initialState,
      updateData: (data) => set((state) => ({ ...state, ...data })),
      reset: () => set(initialState),
    }),
    {
      name: "moja-driver-registration-draft",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
