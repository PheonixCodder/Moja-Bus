"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { type OnboardingStep } from "@moja/schemas";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

const STEP_ORDER: OnboardingStep[] = [
  "COMPANY",
  "DOCUMENTS",
  "BANK",
  "PROFILE",
  "TERMS",
];

export function useOperatorOnboarding() {
  const t = useTranslations("onboarding.toast");
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery(
    trpc.operator.getOnboardingStatus.queryOptions(),
  );

  const [isSaving, setIsSaving] = useState(false);

  // Track time spent on current step for analytics
  const stepEnteredAtRef = useRef<number>(Date.now());

  const saveMutation = useMutation(
    trpc.operator.saveOnboardingStep.mutationOptions(),
  );
  const completeMutation = useMutation(
    trpc.operator.completeOnboarding.mutationOptions(),
  );
  const reopenMutation = useMutation(
    trpc.operator.reopenOnboardingStep.mutationOptions(),
  );
  const logEventMutation = useMutation(
    trpc.operator.logOnboardingEvent.mutationOptions(),
  );

  // Server is the source of truth for the current step
  const currentStep = (data?.progress?.currentStep ?? "COMPANY") as OnboardingStep;

  // Log STEP_ENTERED and reset timer each time currentStep changes
  useEffect(() => {
    stepEnteredAtRef.current = Date.now();
    logEventMutation.mutate({
      step: currentStep,
      eventType: "STEP_ENTERED",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const getTimeSpent = () =>
    Math.floor((Date.now() - stepEnteredAtRef.current) / 1000);

  const saveStep = async (
    step: OnboardingStep,
    stepData: Record<string, unknown>,
  ) => {
    setIsSaving(true);
    const timeSpentSeconds = getTimeSpent();
    try {
      await saveMutation.mutateAsync({
        step,
        timeSpentSeconds,
        ...stepData,
      } as any);

      await queryClient.invalidateQueries(
        trpc.operator.getOnboardingStatus.queryFilter(),
      );

      logEventMutation.mutate({
        step,
        eventType: "STEP_COMPLETED",
        timeSpentSeconds,
      });

      toast.success(t("progressSaved"));
      return true;
    } catch (err: any) {
      logEventMutation.mutate({
        step,
        eventType: "VALIDATION_FAILED",
        timeSpentSeconds,
        metadata: { message: String(err?.message ?? "Unknown error") },
      });
      toast.error(err.message || t("saveFailed"));
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

      logEventMutation.mutate({
        step: "TERMS",
        eventType: "STEP_COMPLETED",
        timeSpentSeconds: getTimeSpent(),
      });

      toast.success(t("onboardingComplete"));
      router.push("/dashboard/operator/welcome");
      router.refresh();
      return true;
    } catch (err: any) {
      toast.error(err.message || t("finalizeFailed"));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const goToStep = async (step: OnboardingStep) => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    const targetIndex = STEP_ORDER.indexOf(step);

    if (targetIndex < currentIndex) {
      const confirmed = window.confirm(t("goBackConfirm"));
      if (!confirmed) return;

      logEventMutation.mutate({
        step: currentStep,
        eventType: "STEP_SKIPPED",
        timeSpentSeconds: getTimeSpent(),
      });
      // Re-open the step server-side so the roadmap actually moves back
      try {
        await reopenMutation.mutateAsync({ step });
        await queryClient.invalidateQueries(
          trpc.operator.getOnboardingStatus.queryFilter(),
        );
      } catch (err: any) {
        toast.error(err.message || t("saveFailed"));
      }
      return;
    }

    if (targetIndex > currentIndex) {
      toast.warning(t("completeFirst"));
    }
  };

  return {
    isSaving,
    onboardingStatus: data?.onboardingStatus,
    currentStep,
    progress: data?.progress,
    operatorData: data?.operator,
    saveStep,
    finalizeOnboarding,
    goToStep,
  };
}
