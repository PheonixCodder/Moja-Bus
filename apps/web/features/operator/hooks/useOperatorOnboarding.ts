"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { type OnboardingStep } from "@moja/schemas";
import { useTRPC } from "@/trpc/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";

export function useOperatorOnboarding() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [onboardingStatus, setOnboardingStatus] =
    useState<string>("NOT_STARTED");
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("company");
  const [operatorData, setOperatorData] = useState<any>(null);

  const saveMutation = useMutation(
    trpc.operator.saveOnboardingStep.mutationOptions(),
  );
  const completeMutation = useMutation(
    trpc.operator.completeOnboarding.mutationOptions(),
  );

  // Fetch onboarding snapshot on mount
  const fetchSnapshot = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await queryClient.fetchQuery(
        trpc.operator.getOnboardingStatus.queryOptions(),
      );
      setOnboardingStatus(data.onboardingStatus);
      setOperatorData(data.operator);

      if (data.onboardingStatus === "COMPLETED") {
        toast.info("Your onboarding is already complete!");
        router.push("/dashboard/operator");
        return;
      }

      if (data.onboardingCurrentStep) {
        setCurrentStep(data.onboardingCurrentStep as OnboardingStep);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load onboarding status.");
      toast.error("Failed to load onboarding status.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot();
  }, []);

  // Save current step and go to next
  const saveStep = async (step: OnboardingStep, data: any) => {
    setIsSaving(true);
    try {
      const response = await saveMutation.mutateAsync({
        step,
        ...data,
      });

      setOnboardingStatus(response.onboardingStatus);
      setOperatorData(response.operator);

      // Determine the next step and update state
      if (response.onboardingCurrentStep) {
        setCurrentStep(response.onboardingCurrentStep as OnboardingStep);
      }

      toast.success("Progress saved successfully!");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to save progress.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Complete onboarding
  const finalizeOnboarding = async () => {
    setIsSaving(true);
    try {
      const response = await completeMutation.mutateAsync();
      setOnboardingStatus(response.onboardingStatus);

      toast.success("Onboarding completed! Welcome to Moja Ride!");
      router.push("/dashboard/operator");
      router.refresh();
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to complete onboarding.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Navigate manually to a previous step (only if they have started)
  const goToStep = (step: OnboardingStep) => {
    const stepOrder: OnboardingStep[] = [
      "company",
      "locations",
      "documents",
      "bank",
      "profile",
      "terms",
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    const targetIndex = stepOrder.indexOf(step);

    if (targetIndex < currentIndex) {
      setCurrentStep(step);
    } else {
      toast.warning("Please complete the current step first to continue.");
    }
  };

  return {
    isLoading,
    isSaving,
    error,
    onboardingStatus,
    currentStep,
    operatorData,
    saveStep,
    finalizeOnboarding,
    goToStep,
    refetch: fetchSnapshot,
  };
}
