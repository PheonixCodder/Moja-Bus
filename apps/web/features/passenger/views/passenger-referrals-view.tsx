"use client";

import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import { Input } from "@moja/ui/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { ReferralFunnelBars } from "@/features/discounts/components/referral-funnel-bars";
import { useTRPC } from "@/trpc/client";

export function PassengerReferralsView() {
  const t = useTranslations("passengerDashboard.referrals");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);

  const referralQuery = useQuery(trpc.discounts.myReferral.queryOptions());
  const applyMutation = useMutation(
    trpc.discounts.applyReferralCode.mutationOptions({
      onSuccess: async () => {
        toast.success(t("applySuccess"));
        setCodeInput("");
        await queryClient.invalidateQueries(trpc.discounts.myReferral.pathFilter());
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const code = referralQuery.data?.code ?? "—";
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${encodeURIComponent(code)}`
      : `/?ref=${encodeURIComponent(code)}`;

  async function copyCode() {
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
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <div className="space-y-6">
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
          <Button type="button" variant="outline" onClick={() => void copyCode()}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {t("copyCode")}
          </Button>
          <Button type="button" onClick={() => void copyLink()}>
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
        <h2 className="text-base font-semibold text-slate-900">{t("haveCode")}</h2>
        <p className="text-sm text-slate-500">{t("haveCodeHint")}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            className="uppercase"
            placeholder={t("codePlaceholder")}
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            disabled={applyMutation.isPending}
          />
          <Button
            type="button"
            disabled={!codeInput.trim() || applyMutation.isPending}
            onClick={() =>
              applyMutation.mutate({ code: codeInput.trim().toUpperCase() })
            }
          >
            {t("apply")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
