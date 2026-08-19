import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";
import {
  peekPendingReferralCode,
  consumePendingReferralCode,
} from "@/lib/pending-referral";

/**
 * Mounts once inside AuthenticatedNovuProvider in _layout.tsx.
 *
 * After login, checks SecureStore for a pending referral code left by
 * the /r/[code] deep-link screen, then applies it via applyReferralCode().
 *
 * Mirrors the web's PendingReferralApplier component.
 */
export function usePendingReferralApplier() {
  const { data: session } = authClient.useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const attempted = useRef(false);
  const { t } = useTranslation("referrals");

  const applyMutation = useMutation(
    trpc.discounts.applyReferralCode.mutationOptions({
      onSuccess: async (result) => {
        if (result.welcomeCouponCode) {
          Toast.show({
            type: "success",
            text1: t("applySuccess"),
            text2: t("applySuccessWelcome", { code: result.welcomeCouponCode }),
            visibilityTime: 5000,
          });
        } else {
          Toast.show({ type: "success", text1: t("applySuccess") });
        }
        await Promise.all([
          queryClient.invalidateQueries(trpc.discounts.myReferral.pathFilter()),
          queryClient.invalidateQueries(
            trpc.discounts.listMyInvitees.pathFilter(),
          ),
        ]);
      },
      onError: async (err) => {
        const msg = err.message ?? "";
        // Clear the stored code on definitive (non-transient) failures
        const definitive =
          msg.includes("Self-referral") ||
          msg.includes("inactive") ||
          msg.includes("Invalid") ||
          msg.includes("not found");
        if (definitive) {
          await consumePendingReferralCode();
        }
        // Suppress toast for "already attributed" — silent is fine (user re-opened link)
        if (
          !msg.includes("already attributed") &&
          !msg.includes("Self-referral")
        ) {
          Toast.show({
            type: "error",
            text1: msg || t("applyFailed"),
          });
        }
      },
    }),
  );

  useEffect(() => {
    // Only attempt once per session mount
    if (!session?.user?.id || attempted.current) return;
    attempted.current = true;

    void (async () => {
      const code = await peekPendingReferralCode();
      if (!code) return;

      const { getDeviceHash } = await import("@/lib/device-hash");
      const deviceHash = await getDeviceHash();

      applyMutation.mutate(
        { code, ...(deviceHash ? { deviceHash } : {}) },
        {
          onSuccess: async () => {
            await consumePendingReferralCode();
          },
        },
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per userId
  }, [session?.user?.id]);
}
