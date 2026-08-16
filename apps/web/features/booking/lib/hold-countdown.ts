"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export type HoldCountdownState =
  | { expired: true; label: string }
  | { expired: false; label: string };

export function getHoldCountdown(
  holdExpiresAt: Date | null,
  nowMs: number,
  labels: { expired: string; payWithin: (mmss: string) => string },
): HoldCountdownState | null {
  if (!holdExpiresAt) {
    return null;
  }

  const remainingMs = holdExpiresAt.getTime() - nowMs;
  if (remainingMs <= 0) {
    return { expired: true, label: labels.expired };
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mmss = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return {
    expired: false,
    label: labels.payWithin(mmss),
  };
}

export function useHoldCountdown(
  holdExpiresAt: Date | null,
): HoldCountdownState | null {
  const t = useTranslations("booking.hold");
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!holdExpiresAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [holdExpiresAt]);

  return getHoldCountdown(holdExpiresAt, nowMs, {
    expired: t("expired"),
    payWithin: (mmss) => t("payWithin", { time: mmss }),
  });
}

export function isHoldActive(
  holdExpiresAt: Date | null,
  nowMs = Date.now(),
): boolean {
  if (!holdExpiresAt) {
    return false;
  }
  return holdExpiresAt.getTime() > nowMs;
}
