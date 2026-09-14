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
  licenseCategories: LicenseCategoryType[];
  licenseExpiryDate: string; // ISO date string YYYY-MM-DD
  licenseFrontUri: string | null;
  licenseFrontLocalPreview: string | null;
  licenseBackUri: string | null;
  licenseBackLocalPreview: string | null;

  // Step 3: National ID, Medical Clearance & CACR
  nationalIdNumber: string;
  medicalDocUri: string | null;
  medicalDocLocalPreview: string | null;
  cacrNumber: string;
  cacrExpiryDate: string;
  cacrFrontUri: string | null;
  cacrFrontLocalPreview: string | null;
  cacrBackUri: string | null;
  cacrBackLocalPreview: string | null;

  // Step 4: Carrier Affiliation
  carrierCode: string;
  employmentType: EmploymentType;

  // Actions
  updateData: (data: Partial<DriverRegistrationState>) => void;
  hydrateFromServer: (draft: Record<string, unknown>, stepNumber?: number) => void;
  reset: () => void;
  /** Set to true right before navigating to /register/status so that the
   *  wizard guard on step 4 doesn't redirect back to step 1 after reset(). */
  submitted: boolean;
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
  licenseCategories: ["D"] as LicenseCategoryType[],
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
  cacrNumber: "",
  cacrExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]!,
  cacrFrontUri: null,
  cacrFrontLocalPreview: null as string | null,
  cacrBackUri: null,
  cacrBackLocalPreview: null as string | null,
  carrierCode: "",
  employmentType: "EXCLUSIVE_INTERCITY" as EmploymentType,
  submitted: false,
};

export const useDriverRegistrationStore = create<DriverRegistrationState>()(
  persist(
    (set) => ({
      ...initialState,
      updateData: (data) => set((state) => ({ ...state, ...data })),
      hydrateFromServer: (draft, stepNumber) =>
        set((state) => ({
          ...state,
          ...(stepNumber ? { currentStep: stepNumber } : {}),
          fullName: (draft["fullName"] as string) ?? state.fullName,
          phone: (draft["phone"] as string) ?? state.phone,
          yearsOfExperience:
            typeof draft["yearsOfExperience"] === "number"
              ? draft["yearsOfExperience"]
              : state.yearsOfExperience,
          profileSelfieUri:
            (draft["profileSelfieUri"] as string) ?? state.profileSelfieUri,
          licenseNumber:
            (draft["licenseNumber"] as string) ?? state.licenseNumber,
          licenseCategories: Array.isArray(draft["licenseCategories"])
            ? (draft["licenseCategories"] as LicenseCategoryType[])
            : state.licenseCategories,
          licenseCategory:
            (draft["licenseCategory"] as LicenseCategoryType) ??
            (Array.isArray(draft["licenseCategories"]) && draft["licenseCategories"][0]
              ? (draft["licenseCategories"][0] as LicenseCategoryType)
              : state.licenseCategory),
          licenseExpiryDate:
            (draft["licenseExpiryDate"] as string) ?? state.licenseExpiryDate,
          licenseFrontUri:
            (draft["licenseFrontUri"] as string) ?? state.licenseFrontUri,
          licenseBackUri:
            (draft["licenseBackUri"] as string) ?? state.licenseBackUri,
          nationalIdNumber:
            (draft["nationalIdNumber"] as string) ?? state.nationalIdNumber,
          medicalDocUri:
            (draft["medicalDocUri"] as string) ?? state.medicalDocUri,
          cacrNumber: (draft["cacrNumber"] as string) ?? state.cacrNumber,
          cacrExpiryDate:
            (draft["cacrExpiryDate"] as string) ?? state.cacrExpiryDate,
          cacrFrontUri: (draft["cacrFrontUri"] as string) ?? state.cacrFrontUri,
          cacrBackUri: (draft["cacrBackUri"] as string) ?? state.cacrBackUri,
          carrierCode: (draft["carrierCode"] as string) ?? state.carrierCode,
          employmentType:
            (draft["employmentType"] as EmploymentType) ?? state.employmentType,
        })),
      reset: () => set(initialState),
    }),
    {
      name: "moja-driver-registration-draft",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
