"use client";

import { useOperatorOnboarding } from "../hooks/useOperatorOnboarding";
import { CompanyStep } from "../components/onboarding/company-step";
import { DocumentsStep } from "../components/onboarding/documents-step";
import { BankStep } from "../components/onboarding/bank-step";
import { ProfileStep } from "../components/onboarding/profile-step";
import { TermsStep } from "../components/onboarding/terms-step";

import {
  Building2,
  FileText,
  Banknote,
  User,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@moja/ui/lib/utils";
import { type OnboardingStep } from "@moja/schemas";

const steps = [
  { id: "COMPANY",   name: "Company",      icon: Building2   },
  { id: "DOCUMENTS", name: "Documents",    icon: FileText    },
  { id: "BANK",      name: "Bank Account", icon: Banknote    },
  { id: "PROFILE",   name: "Your Profile", icon: User        },
  { id: "TERMS",     name: "Terms",        icon: ShieldCheck },
] as const;

export function OperatorOnboardingView() {
  const {
    isSaving,
    currentStep,
    progress,
    operatorData,
    bankVerified,
    saveStep,
    finalizeOnboarding,
    goToStep,
  } = useOperatorOnboarding();

  const percentage = progress?.percentage ?? 0;

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
            Business Setup: {percentage}% Complete
          </span>
        </div>

        {/* Road Map Tracker */}
        <div className="relative pt-2 pb-2">
          <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-slate-200 -translate-y-1/2 rounded" />

          <div className="flex justify-between items-center relative z-10">
            {steps.map((step) => {
              const isCompleted =
                progress?.completedSteps?.includes(step.id) ?? false;
              const isCurrent = step.id === currentStep;
              const isUpcoming = !isCompleted && !isCurrent;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(step.id as OnboardingStep)}
                  disabled={isUpcoming}
                  title={
                    isUpcoming
                      ? "Please complete the current step first"
                      : undefined
                  }
                  className="flex flex-col items-center gap-2 focus:outline-none disabled:cursor-not-allowed group"
                >
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

        {/* Progress bar — server-calculated percentage */}
        <div className="mt-6">
          <div className="h-1.5 bg-slate-200 rounded overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-in-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Render Active Step Form */}
      <div className="bg-background">
        {currentStep === "COMPANY" && (
          <CompanyStep
            initialData={operatorData}
            onSave={(data) => saveStep("COMPANY", { companyData: data })}
            isSaving={isSaving}
          />
        )}

        {currentStep === "DOCUMENTS" && (
          <DocumentsStep
            initialData={operatorData}
            onSave={(data) => saveStep("DOCUMENTS", { documentsData: data })}
            onBack={() => goToStep("COMPANY")}
            isSaving={isSaving}
          />
        )}

        {currentStep === "BANK" && (
          <BankStep
            initialData={operatorData}
            bankVerified={bankVerified}
            onSave={(data) => saveStep("BANK", { bankData: data })}
            onBack={() => goToStep("DOCUMENTS")}
            isSaving={isSaving}
          />
        )}

        {currentStep === "PROFILE" && (
          <ProfileStep
            initialData={operatorData}
            onSave={(data) => saveStep("PROFILE", { profileData: data })}
            onBack={() => goToStep("BANK")}
            isSaving={isSaving}
          />
        )}

        {currentStep === "TERMS" && (
          <TermsStep
            onSave={(data) => saveStep("TERMS", { termsData: data })}
            onComplete={finalizeOnboarding}
            onBack={() => goToStep("PROFILE")}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  );
}
