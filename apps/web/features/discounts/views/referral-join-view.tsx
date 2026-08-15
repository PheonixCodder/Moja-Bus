"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Gift, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import {
  storePendingReferralCode,
} from "@/features/discounts/lib/pending-referral";
import { useTRPC } from "@/trpc/client";

type Props = {
  code: string;
};

export function ReferralJoinView({ code }: Props) {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [applied, setApplied] = useState(false);

  const programQuery = useQuery(
    trpc.discounts.getReferralProgramPublic.queryOptions(),
  );
  const program = programQuery.data;

  useEffect(() => {
    if (code) storePendingReferralCode(code);
  }, [code]);

  const applyMutation = useMutation(
    trpc.discounts.applyReferralCode.mutationOptions({
      onSuccess: (result) => {
        setApplied(true);
        if (result.welcomeCouponCode) {
          toast.success(
            `Invite applied. Your welcome code: ${result.welcomeCouponCode}`,
          );
        } else {
          toast.success("Invite applied — welcome aboard");
        }
        router.push("/dashboard/referrals");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const loginHref = `/login?callbackUrl=${encodeURIComponent("/dashboard/referrals")}`;

  if (sessionPending || programQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[#ee237c]" />
      </div>
    );
  }

  const inactive = program && !program.isActive;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
      <Card className="space-y-5 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-pink-50 p-2.5 text-[#ee237c]">
            <Gift className="size-6" />
          </div>
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              You&apos;re invited
            </h1>
            <p className="text-sm leading-relaxed text-slate-500">
              A friend shared Moja Ride with you. Create an account or sign in to
              claim this invite, then book your first trip.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Invite code
          </p>
          <p className="mt-1 font-mono text-xl font-bold tracking-widest text-slate-900">
            {code}
          </p>
        </div>

        {inactive ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            The referral program is paused right now. You can still create an
            account — ask your friend to share again when it reopens.
          </p>
        ) : program ? (
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>
              Your friend earns{" "}
              <span className="font-semibold text-slate-900">
                {program.referrerCreditAmountXOF.toLocaleString()} XOF
              </span>{" "}
              promo credit after your first paid trip
              {program.rewardDelayHours > 0
                ? ` (after a ${program.rewardDelayHours}h review)`
                : ""}
              .
            </li>
            {program.recurringCreditAmountXOF > 0 ? (
              <li>
                They can earn up to{" "}
                {program.recurringCreditAmountXOF.toLocaleString()} XOF more on
                later trips (max {program.recurringMaxBookings}).
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
              {applyMutation.isPending ? "Applying…" : "Apply invite to my account"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/search")}>
              Browse trips
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button type="button" onClick={() => router.push(loginHref)}>
              Sign in or create account
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/search")}>
              Browse trips first
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
