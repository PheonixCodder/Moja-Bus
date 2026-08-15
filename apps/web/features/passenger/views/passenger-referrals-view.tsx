"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import { Input } from "@moja/ui/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, Copy, Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { ReferralFunnelBars } from "@/features/discounts/components/referral-funnel-bars";
import { referralInvitePath } from "@/features/discounts/lib/pending-referral";
import { useTRPC } from "@/trpc/client";

export function PassengerReferralsView() {
  const t = useTranslations("passengerDashboard.referrals");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);

  const referralQuery = useQuery(trpc.discounts.myReferral.queryOptions());
  const inviteesQuery = useQuery(
    trpc.discounts.listMyInvitees.queryOptions({ limit: 50, offset: 0 }),
  );

  const applyMutation = useMutation(
    trpc.discounts.applyReferralCode.mutationOptions({
      onSuccess: async (result) => {
        if (result.welcomeCouponCode) {
          toast.success(
            t("applySuccessWelcome", { code: result.welcomeCouponCode }),
          );
        } else {
          toast.success(t("applySuccess"));
        }
        setCodeInput("");
        await Promise.all([
          queryClient.invalidateQueries(trpc.discounts.myReferral.pathFilter()),
          queryClient.invalidateQueries(trpc.discounts.listMyInvitees.pathFilter()),
        ]);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const code = referralQuery.data?.code ?? "—";
  const program = referralQuery.data?.program;
  const programActive = program?.isActive ?? false;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${referralInvitePath(code)}`
      : referralInvitePath(code);

  async function copyCode() {
    if (!programActive || code === "—") {
      toast.error(t("programInactiveShare"));
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  async function copyLink() {
    if (!programActive || code === "—") {
      toast.error(t("programInactiveShare"));
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <div className="space-y-6">
      {program && !programActive ? (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          {t("programInactive")}
        </Card>
      ) : null}

      {program && programActive ? (
        <Card className="space-y-2 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-900">{t("howItWorks")}</p>
          <p>
            {t("howItWorksBody", {
              amount: program.referrerCreditAmountXOF.toLocaleString(),
              delay: program.rewardDelayHours,
              recurring: program.recurringCreditAmountXOF.toLocaleString(),
              max: program.recurringMaxBookings,
            })}
          </p>
        </Card>
      ) : null}

      <Card className="space-y-4 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-pink-50 p-2 text-[#ee237c]">
            <Gift className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">{t("yourCode")}</h2>
            <p className="text-sm text-slate-500">{t("yourCodeHint")}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-lg font-bold tracking-widest text-slate-900">
            {referralQuery.isLoading ? "…" : code}
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!programActive}
            onClick={() => void copyCode()}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {t("copyCode")}
          </Button>
          <Button
            type="button"
            disabled={!programActive}
            onClick={() => void copyLink()}
          >
            {t("copyLink")}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-100 p-3">
            <p className="text-xs text-slate-500">{t("attributed")}</p>
            <p className="text-xl font-bold text-slate-900">
              {referralQuery.data?.attributed ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 p-3">
            <p className="text-xs text-slate-500">{t("qualified")}</p>
            <p className="text-xl font-bold text-slate-900">
              {referralQuery.data?.qualified ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 p-3">
            <p className="text-xs text-slate-500">{t("rewarded")}</p>
            <p className="text-xl font-bold text-slate-900">
              {referralQuery.data?.rewarded ?? 0}
            </p>
          </div>
        </div>
        <ReferralFunnelBars
          className="space-y-3 border-t border-slate-100 pt-4"
          steps={[
            {
              key: "attributed",
              label: t("attributed"),
              count: referralQuery.data?.attributed ?? 0,
            },
            {
              key: "qualified",
              label: t("qualified"),
              count: referralQuery.data?.qualified ?? 0,
            },
            {
              key: "rewarded",
              label: t("rewarded"),
              count: referralQuery.data?.rewarded ?? 0,
            },
          ]}
        />
      </Card>

      <Card className="space-y-3 p-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {t("inviteesTitle")}
            </h2>
            <p className="text-sm text-slate-500">{t("inviteesHint")}</p>
          </div>
          <p className="text-xs text-slate-500">
            {inviteesQuery.data?.total ?? 0}
          </p>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("inviteeName")}</TableHead>
                <TableHead>{t("inviteeStatus")}</TableHead>
                <TableHead>{t("inviteeWhen")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inviteesQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-slate-500">
                    …
                  </TableCell>
                </TableRow>
              ) : (inviteesQuery.data?.items.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-slate-500">
                    {t("inviteesEmpty")}
                  </TableCell>
                </TableRow>
              ) : (
                inviteesQuery.data?.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm font-medium text-slate-900">
                      {row.refereeName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {format(new Date(row.attributedAt), "dd MMM yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="text-base font-semibold text-slate-900">{t("haveCode")}</h2>
        <p className="text-sm text-slate-500">{t("haveCodeHint")}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            className="uppercase"
            placeholder={t("codePlaceholder")}
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            disabled={applyMutation.isPending || !programActive}
          />
          <Button
            type="button"
            disabled={
              !codeInput.trim() || applyMutation.isPending || !programActive
            }
            onClick={async () => {
              const { getDeviceHash } = await import(
                "@/features/discounts/lib/device-hash"
              );
              const deviceHash = await getDeviceHash();
              applyMutation.mutate({
                code: codeInput.trim().toUpperCase(),
                ...(deviceHash ? { deviceHash } : {}),
              });
            }}
          >
            {t("apply")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
