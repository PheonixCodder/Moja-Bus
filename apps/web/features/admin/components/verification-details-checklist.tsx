"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

interface VerificationDetailsChecklistProps {
  companyId: string;
  verification: {
    ownerIdentityVerified: boolean;
    bankVerified: boolean;
    documentsVerified: boolean;
    permitVerified: boolean;
  } | null;
}

export function VerificationDetailsChecklist({
  companyId,
  verification,
}: VerificationDetailsChecklistProps) {
  const t = useTranslations("adminDashboard.verificationDetailsChecklist");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [state, setState] = useState({
    ownerIdentityVerified: verification?.ownerIdentityVerified ?? false,
    bankVerified: verification?.bankVerified ?? false,
    documentsVerified: verification?.documentsVerified ?? false,
    permitVerified: verification?.permitVerified ?? false,
  });

  const mutation = useMutation(
    trpc.admin.updateCompanyVerificationChecklist.mutationOptions({
      onSuccess: () => {
        toast.success(t("checklistUpdated"));
        queryClient.invalidateQueries(
          trpc.admin.getCompanyForVerification.pathFilter(),
        );
      },
      onError: (err) => {
        toast.error(err.message || t("failedToUpdateChecklist"));
      },
    }),
  );

  const handleToggle = (key: keyof typeof state, checked: boolean) => {
    const updated = { ...state, [key]: checked };
    setState(updated);
    mutation.mutate({
      companyId,
      ...updated,
    });
  };

  const checklistItems = [
    {
      key: "ownerIdentityVerified" as const,
      label: t("ownerIdentity"),
      description: t("ownerIdentityDescription"),
    },
    {
      key: "bankVerified" as const,
      label: t("payoutBankVerification"),
      description: t("payoutBankVerificationDescription"),
    },
    {
      key: "documentsVerified" as const,
      label: t("legalRegistriesTaxClearances"),
      description: t("legalRegistriesTaxClearancesDescription"),
    },
    {
      key: "permitVerified" as const,
      label: t("publicTransportLicensesPermits"),
      description: t("publicTransportLicensesPermitsDescription"),
    },
  ];

  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold text-slate-900">
          {t("kycVerificationChecklist")}
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          {t("checklistDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        {checklistItems.map((item) => (
          <div
            key={item.key}
            className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg bg-slate-50/20 hover:bg-slate-50/50 transition-colors"
          >
            <div className="pt-0.5">
              <Checkbox
                id={`check-${item.key}`}
                checked={state[item.key]}
                onCheckedChange={(checked) => handleToggle(item.key, !!checked)}
                disabled={mutation.isPending}
              />
            </div>
            <label
              htmlFor={`check-${item.key}`}
              className="grid gap-0.5 cursor-pointer select-none"
            >
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {item.label}
              </span>
              <span className="text-[10px] text-slate-400 font-medium leading-relaxed">
                {item.description}
              </span>
            </label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
