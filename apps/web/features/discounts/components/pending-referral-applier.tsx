"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";
import {
  clearPendingReferralCode,
  peekPendingReferralCode,
  consumePendingReferralCode,
} from "@/features/discounts/lib/pending-referral";

/**
 * After login, apply a referral code stored from /r/[code] or ?ref=.
 * Mount once in the passenger dashboard shell.
 */
export function PendingReferralApplier() {
  const { data: session } = useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const attempted = useRef(false);

  const applyMutation = useMutation(
    trpc.discounts.applyReferralCode.mutationOptions({
      onSuccess: async (result) => {
        if (result.welcomeCouponCode) {
          toast.success(
            `Invite applied. Your welcome code: ${result.welcomeCouponCode}`,
          );
        } else {
          toast.success("Invite code applied");
        }
        await Promise.all([
          queryClient.invalidateQueries(trpc.discounts.myReferral.pathFilter()),
          queryClient.invalidateQueries(trpc.discounts.listMyInvitees.pathFilter()),
        ]);
      },
      onError: (err) => {
        const msg = err.message ?? "";
        // P3-10: only clear on success or definitive invalid/self; keep for retry on transient.
        const definitive =
          msg.includes("Self-referral") ||
          msg.includes("inactive") ||
          msg.includes("Invalid") ||
          msg.includes("not found");
        if (definitive) {
          clearPendingReferralCode();
        }
        if (
          !msg.includes("already attributed") &&
          !msg.includes("Self-referral") &&
          !msg.includes("inactive")
        ) {
          toast.error(msg || "Could not apply invite code");
        }
      },
    }),
  );

  useEffect(() => {
    if (!session?.user?.id || attempted.current) return;
    const code = peekPendingReferralCode();
    if (!code) return;
    attempted.current = true;
    void (async () => {
      const { getDeviceHash } = await import(
        "@/features/discounts/lib/device-hash"
      );
      const deviceHash = await getDeviceHash();
      applyMutation.mutate(
        { code, ...(deviceHash ? { deviceHash } : {}) },
        {
          onSuccess: () => {
            consumePendingReferralCode();
          },
        },
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per session mount when pending
  }, [session?.user?.id]);

  return null;
}
