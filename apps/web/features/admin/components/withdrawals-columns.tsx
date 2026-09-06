"use client";

import { CarrierAvatar } from "@moja/ui/components/ui/carrier-avatar";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@moja/ui/components/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRightCircle, ShieldAlert } from "lucide-react";
import type { useTranslations } from "next-intl";
import { formatXOF } from "@/features/operator/lib/currency";

export interface WithdrawalRow {
  id: string;
  status: string;
  externalPaymentId: string | null;
  description: string | null;
  metadata: unknown;
  createdAt: Date;
  amount: number;
  companyId: string;
  companyName: string;
}

export function createWithdrawalsColumns(
  t: ReturnType<typeof useTranslations>,
  onResolve: (row: WithdrawalRow) => void,
): ColumnDef<WithdrawalRow>[] {
  return [
    {
      accessorKey: "companyName",
      header: t("companyName"),
      cell: ({ row }) => {
        const companyName = row.getValue("companyName") as string;
        return (
          <div className="flex items-center gap-3">
            <CarrierAvatar
              name={companyName}
              size="md"
            />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {companyName}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {row.original.companyId.slice(0, 8)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "id",
      header: t("reference"),
      cell: ({ row }) => {
        const extId = row.original.externalPaymentId;
        const internalId = row.original.id;

        return (
          <div className="flex flex-col gap-0.5">
            {extId ? (
              <span className="font-mono text-xs text-foreground">
                {extId}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                {t("noExternalId")}
              </span>
            )}
            <span className="font-mono text-xs text-muted-foreground">
              {internalId.split("-")[0]}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;

        switch (status) {
          case "CREATED":
          case "POSTED":
            return (
              <Badge
                variant="outline"
                className="bg-warning/15 text-warning border-warning/30"
              >
                {t("pending")}
              </Badge>
            );
          case "SETTLED":
            return (
              <Badge
                variant="outline"
                className="bg-success/15 text-success border-success/30"
              >
                {t("settled")}
              </Badge>
            );
          case "FAILED":
          case "REVERSED":
            return (
              <Badge
                variant="outline"
                className="bg-destructive/15 text-destructive border-destructive/30"
              >
                {status === "FAILED" ? t("failed") : t("reversed")}
              </Badge>
            );
          default:
            return <Badge variant="secondary">{status}</Badge>;
        }
      },
    },
    {
      accessorKey: "createdAt",
      header: t("date"),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {format(date, "dd MMM yyyy", { locale: fr })}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(date, "HH:mm")}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">{t("amount")}</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        return (
          <div className="text-right font-mono font-medium">
            {formatXOF(amount)}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const isPending = status === "CREATED" || status === "POSTED";

        if (!isPending) return null;

        return (
          <div className="flex justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onResolve(row.original)}
                      className="h-8 text-warning hover:text-warning hover:bg-warning/10"
                    />
                  }
                >
                  <ShieldAlert className="size-4 mr-1.5" />
                  {t("resolve")}
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("resolveTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];
}
