"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  storePendingReferralCode,
  referralInvitePath,
} from "@/features/discounts/lib/pending-referral";

/**
 * Captures legacy `/?ref=CODE` links and sends users to `/r/CODE`.
 */
export function HomeReferralCapture() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref?.trim()) return;
    storePendingReferralCode(ref);
    router.replace(referralInvitePath(ref));
  }, [router, searchParams]);

  return null;
}
