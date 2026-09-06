"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Gift, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { storePendingReferralCode } from "@/features/discounts/lib/pending-referral";
import { useTRPC } from "@/trpc/client";
import { useTranslations } from "next-intl";

type Props = {
  code: string;
};

export function ReferralJoinView({ code }: Props) {
  const t = useTranslations("discounts.referralJoin");
  const trpc = useTRPC();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [applied, setApplied] = useState(false);

  const programQuery = useQuery(
    trpc.discounts.getReferralProgramPublic.queryOptions(),
  );
  const program = programQuery.data;

  useEffect(() => {
    storePendingReferralCode(code);
  }, [code]);

  const applyMutation = useMutation(
    trpc.discounts.applyReferralCode.mutationOptions({
      onSuccess: (res) => {
        setApplied(true);
        const msg = res.welcomeCouponCode
          ? t("successWithCoupon", { code: res.welcomeCouponCode })
          : t("success");
        toast.success(msg);
        router.push("/search");
      },
      onError: (err) => {
        toast.error(err.message || "Could not apply referral code");
      },
    }),
  );

  if (sessionPending || programQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const inactive = program && !program.isActive;
  const loginHref = `/login?redirect=${encodeURIComponent(`/invite/${encodeURIComponent(code)}`)}`;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
      <Card className="space-y-5 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2.5 text-primary">
            <Gift className="size-6" />
          </div>
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {t("invitedTitle")}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("invitedDesc")}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("inviteCode")}
          </p>
          <p className="mt-1 font-mono text-xl font-bold tracking-widest text-foreground">
            {code}
          </p>
        </div>

        {inactive ? (
          <p className="rounded-lg bg-warning/15 px-3 py-2 text-sm text-warning">
            {t("pausedNotice")}
          </p>
        ) : program ? (
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>
              {t("friendEarns")}{" "}
              <span className="font-semibold text-foreground">
                {program.referrerCreditAmountXOF.toLocaleString()} XOF
              </span>{" "}
              {t("friendEarnsSuffix")}
              {program.rewardDelayHours > 0
                ? ` (${program.rewardDelayHours}h)`
                : ""}
              .
            </li>
            {program.recurringCreditAmountXOF > 0 ? (
              <li>
                {t("earnUpTo")}{" "}
                {program.recurringCreditAmountXOF.toLocaleString()} XOF (max{" "}
                {program.recurringMaxBookings}).
              </li>
            ) : null}
          </ul>
        ) : null}

        {session?.user ? (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              disabled={inactive || applied || applyMutation.isPending}
              onClick={() => {
                void (async () => {
                  const { getDeviceHash } = await import(
                    "@/features/discounts/lib/device-hash"
                  );
                  const deviceHash = await getDeviceHash();
                  applyMutation.mutate({
                    code,
                    ...(deviceHash ? { deviceHash } : {}),
                  });
                })();
              }}
            >
              {applyMutation.isPending
                ? "Applying…"
                : "Apply invite to my account"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/search")}
            >
              {t("browseTrips")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button type="button" onClick={() => router.push(loginHref)}>
              {t("signInOrCreate")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/search")}
            >
              {t("browseTripsFirst")}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
