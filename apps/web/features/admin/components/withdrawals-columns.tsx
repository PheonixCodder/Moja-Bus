"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatXOF } from "@/features/operator/lib/currency";
import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Avatar, AvatarFallback } from "@moja/ui/components/ui/avatar";
import { ShieldAlert, ArrowRightCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@moja/ui/components/ui/tooltip";

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
  onResolve: (row: WithdrawalRow) => void
): ColumnDef<WithdrawalRow>[] {
  return [
    {
      accessorKey: "companyName",
      header: "Operator",
      cell: ({ row }) => {
        const companyName = row.getValue("companyName") as string;
        const initial = companyName ? companyName.charAt(0).toUpperCase() : "?";

        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-8 border border-border">
              <AvatarFallback className="bg-bg-muted text-xs font-medium">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-text-primary">
                {companyName}
              </span>
              <span className="text-[10px] text-text-muted font-mono">
                {row.original.companyId.slice(0, 8)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "id",
      header: "Reference",
      cell: ({ row }) => {
        const extId = row.original.externalPaymentId;
        const internalId = row.original.id;

        return (
          <div className="flex flex-col gap-0.5">
            {extId ? (
              <span className="font-mono text-xs text-text-primary">
                {extId}
              </span>
            ) : (
              <span className="text-xs text-text-muted italic">
                No external ID
              </span>
            )}
            <span className="font-mono text-[10px] text-text-muted">
              {internalId.split("-")[0]}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;

        switch (status) {
          case "CREATED":
          case "POSTED":
            return (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                Pending
              </Badge>
            );
          case "SETTLED":
            return (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                Settled
              </Badge>
            );
          case "FAILED":
          case "REVERSED":
            return (
              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
                {status === "FAILED" ? "Failed" : "Reversed"}
              </Badge>
            );
          default:
            return <Badge variant="secondary">{status}</Badge>;
        }
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {format(date, "dd MMM yyyy", { locale: fr })}
            </span>
            <span className="text-xs text-text-muted">
              {format(date, "HH:mm")}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Amount</div>,
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
                      className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    />
                  }
                >
                  <ShieldAlert className="size-4 mr-1.5" />
                  Resolve
                </TooltipTrigger>
                <TooltipContent>
                  <p>Manually resolve this stuck withdrawal</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];
}
