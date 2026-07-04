"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { type OnboardingStep } from "@moja/schemas";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

const STEP_ORDER: OnboardingStep[] = [
  "company",
  "locations",
  "documents",
  "bank",
  "profile",
  "terms",
];

export function useOperatorOnboarding() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery(
    trpc.operator.getOnboardingStatus.queryOptions(),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("company");

  const saveMutation = useMutation(
    trpc.operator.saveOnboardingStep.mutationOptions(),
  );
  const completeMutation = useMutation(
    trpc.operator.completeOnboarding.mutationOptions(),
  );

  useEffect(() => {
    if (data.onboardingStatus === "COMPLETED") {
      toast.info("Your onboarding is already complete!");
      router.push("/dashboard/operator");
      return;
    }

    if (data.onboardingCurrentStep) {
      setCurrentStep(data.onboardingCurrentStep as OnboardingStep);
    }
  }, [data.onboardingStatus, data.onboardingCurrentStep, router]);

  const saveStep = async (step: OnboardingStep, stepData: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const response = await saveMutation.mutateAsync({
        step,
        ...stepData,
      });

      await queryClient.invalidateQueries(
        trpc.operator.getOnboardingStatus.queryFilter(),
      );

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

  const finalizeOnboarding = async () => {
    setIsSaving(true);
    try {
      await completeMutation.mutateAsync();
      await queryClient.invalidateQueries(
        trpc.operator.getOnboardingStatus.queryFilter(),
      );

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

  const goToStep = (step: OnboardingStep) => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    const targetIndex = STEP_ORDER.indexOf(step);

    if (targetIndex < currentIndex) {
      const confirmed = window.confirm(
        "Going back may discard unsaved changes on this step. Continue?",
      );
      if (!confirmed) return;
      setCurrentStep(step);
      return;
    }

    if (targetIndex > currentIndex) {
      toast.warning("Please complete the current step first to continue.");
    }
  };

  return {
    isSaving,
    onboardingStatus: data.onboardingStatus,
    currentStep,
    operatorData: data.operator,
    saveStep,
    finalizeOnboarding,
    goToStep,
  };
}
