"use client";

import { useOperatorOnboarding } from "../hooks/useOperatorOnboarding";
import { CompanyStep } from "../components/onboarding/company-step";
import { LocationsStep } from "../components/onboarding/locations-step";
import { DocumentsStep } from "../components/onboarding/documents-step";
import { BankStep } from "../components/onboarding/bank-step";
import { ProfileStep } from "../components/onboarding/profile-step";
import { TermsStep } from "../components/onboarding/terms-step";

import {
  Building2,
  MapPin,
  FileText,
  Banknote,
  User,
  ShieldCheck,
  CheckCircle2,
  Bus,
} from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { type OnboardingStep } from "@moja/schemas";

const steps = [
  {
    id: "company",
    name: "Company",
    icon: Building2,
  },
  {
    id: "locations",
    name: "Locations",
    icon: MapPin,
  },
  {
    id: "documents",
    name: "Documents",
    icon: FileText,
  },
  {
    id: "bank",
    name: "Bank Account",
    icon: Banknote,
  },
  {
    id: "profile",
    name: "Your Profile",
    icon: User,
  },
  {
    id: "terms",
    name: "Terms",
    icon: ShieldCheck,
  },
] as const;

export function OperatorOnboardingView() {
  const {
    isSaving,
    currentStep,
    operatorData,
    saveStep,
    finalizeOnboarding,
    goToStep,
  } = useOperatorOnboarding();

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="space-y-8">
      {/* Step progress component */}
      <div className="w-full bg-slate-50 border border-border rounded-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Complete Your Operator Profile
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complete these steps to list your buses and start accepting ticket
              bookings.
            </p>
          </div>
          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>

        {/* Road Map Tracker */}
        <div className="relative pt-2 pb-2">
          {/* Road background line */}
          <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-slate-200 -translate-y-1/2 rounded" />

          {/* Steps */}
          <div className="flex justify-between items-center relative z-10">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUpcoming = index > currentStepIndex;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(step.id as OnboardingStep)}
                  disabled={isUpcoming}
                  title={isUpcoming ? "Please complete the current step first" : undefined}
                  className="flex flex-col items-center gap-2 focus:outline-none disabled:cursor-not-allowed group"
                >
                  {/* Step Marker */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-50 shadow transition-all duration-300",
                      isCompleted &&
                        "bg-green-600 border-green-600 group-hover:scale-105",
                      isCurrent &&
                        "bg-primary border-primary ring-4 ring-primary/15 group-hover:scale-105",
                      isUpcoming && "bg-slate-100 border-slate-200",
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <step.icon
                        className={cn(
                          "w-4 h-4",
                          isCurrent ? "text-white" : "text-muted-foreground",
                        )}
                      />
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider hidden sm:block",
                      isCompleted && "text-green-600",
                      isCurrent && "text-primary",
                      isUpcoming && "text-muted-foreground",
                    )}
                  >
                    {step.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="h-1.5 bg-slate-200 rounded overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-in-out"
              style={{
                width: `${(currentStepIndex / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Render Active Step Form */}
      <div className="bg-background">
        {currentStep === "company" && (
          <CompanyStep
            initialData={operatorData}
            onSave={(data) => saveStep("company", { companyData: data })}
            isSaving={isSaving}
          />
        )}

        {currentStep === "locations" && (
          <LocationsStep
            initialData={operatorData}
            onSave={(data) => saveStep("locations", { locationsData: data })}
            onBack={() => goToStep("company")}
            isSaving={isSaving}
          />
        )}

        {currentStep === "documents" && (
          <DocumentsStep
            initialData={operatorData}
            onSave={(data) => saveStep("documents", { documentsData: data })}
            onBack={() => goToStep("locations")}
            isSaving={isSaving}
          />
        )}

        {currentStep === "bank" && (
          <BankStep
            initialData={operatorData}
            onSave={(data) => saveStep("bank", { bankData: data })}
            onBack={() => goToStep("documents")}
            isSaving={isSaving}
          />
        )}

        {currentStep === "profile" && (
          <ProfileStep
            initialData={operatorData}
            onSave={(data) => saveStep("profile", { profileData: data })}
            onBack={() => goToStep("bank")}
            isSaving={isSaving}
          />
        )}

        {currentStep === "terms" && (
          <TermsStep
            onSave={(data) => saveStep("terms", { termsData: data })}
            onComplete={finalizeOnboarding}
            onBack={() => goToStep("profile")}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  );
}
