"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownLeft, ArrowUpRight, Coins, Wallet } from "lucide-react";
import { Badge } from "@moja/ui/components/ui/badge";
import { formatAdminDate, formatAdminTime } from "@/lib/format-date";

export interface LedgerEntryRow {
  id: string;
  transactionId: string;
  accountId: string;
  side: "DEBIT" | "CREDIT";
  amount: bigint;
  currency: string;
  status: string;
  sequenceNumber: number;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  effectiveAt: Date;
  ownerName: string;
  ownerEmail: string;
  account: {
    accountCategory: string;
    accountClass: string;
  };
  transaction: {
    type: string;
  };
}

export const ledgerColumns: ColumnDef<LedgerEntryRow>[] = [
  {
    accessorKey: "effectiveAt",
    header: "Date & Time",
    cell: ({ row }) => {
      const date = new Date(row.original.effectiveAt);
      return (
        <div className="space-y-0.5 text-xs">
          <div className="font-semibold text-slate-800">
            {formatAdminDate(row.original.effectiveAt)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {formatAdminTime(row.original.effectiveAt)}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "transactionId",
    header: "Transaction",
    cell: ({ row }) => {
      const entry = row.original;
      return (
        <div className="space-y-0.5 text-xs">
          <div className="font-bold text-slate-900 uppercase font-mono tracking-wider text-[10px]">
            {entry.transaction.type.replace(/_/g, " ")}
          </div>
          <div className="text-[9px] text-slate-400 font-mono truncate max-w-[80px]">
            ID: {entry.transactionId}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "ownerName",
    header: "Account Owner",
    cell: ({ row }) => {
      const entry = row.original;
      return (
        <div className="space-y-0.5 text-xs">
          <div className="font-semibold text-slate-800">{entry.ownerName}</div>
          {entry.ownerEmail && (
            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
              {entry.ownerEmail}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "accountCategory",
    header: "Account Category",
    cell: ({ row }) => {
      const entry = row.original;
      return (
        <div className="space-y-0.5 text-xs">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Wallet className="size-3 text-slate-400 shrink-0" />
            {entry.account.accountCategory}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            Class: {entry.account.accountClass}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "side",
    header: "Entry Side",
    cell: ({ row }) => {
      const side = row.original.side;
      return (
        <div className="flex items-center">
          {side === "CREDIT" ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              <ArrowDownLeft className="size-3.5 shrink-0" />
              CREDIT
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
              <ArrowUpRight className="size-3.5 shrink-0" />
              DEBIT
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const entry = row.original;
      const formattedAmount = new Intl.NumberFormat("en-US").format(
        Number(entry.amount)
      );
      return (
        <div className="flex items-center gap-1.5">
          <Coins className="size-3.5 text-slate-400 shrink-0" />
          <span
            className={`font-semibold font-mono text-xs ${
              entry.side === "CREDIT" ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {formattedAmount} XOF
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description & Reference",
    cell: ({ row }) => {
      const entry = row.original;
      return (
        <div className="space-y-0.5 text-xs max-w-[200px] min-w-[120px]">
          <div className="text-slate-700 font-medium truncate" title={entry.description || ""}>
            {entry.description || "N/A"}
          </div>
          {entry.referenceId && (
            <div className="text-[10px] text-slate-400 truncate">
              Ref: <span className="font-mono">{entry.referenceId}</span> ({entry.referenceType})
            </div>
          )}
        </div>
      );
    },
  },
];
