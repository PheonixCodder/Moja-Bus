"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@moja/ui/components/ui/card";
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
        toast.success("Verification checklist updated successfully.");
        queryClient.invalidateQueries(trpc.admin.getCompanyForVerification.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to update checklist.");
      },
    })
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
      label: "Owner Representative Identity",
      description: "Verify government passport or national ID matches owner names.",
    },
    {
      key: "bankVerified" as const,
      label: "Payout Bank Verification",
      description: "Verify bank document details match settlement bank names.",
    },
    {
      key: "documentsVerified" as const,
      label: "Legal Registries & Tax Clearances",
      description: "Verify business tax ID and establishment documents are valid.",
    },
    {
      key: "permitVerified" as const,
      label: "Public Transport Licenses & Permits",
      description: "Verify company registration permits have correct route permissions.",
    },
  ];

  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold text-slate-900">
          KYC Verification Checklist
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Check off items individually as you review documentation. Changes are saved instantly.
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
