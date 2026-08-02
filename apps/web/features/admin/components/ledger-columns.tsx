"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownLeft, ArrowUpRight, Coins, Wallet } from "lucide-react";
import { Badge } from "@moja/ui/components/ui/badge";
import { useTranslations } from "next-intl";
import { formatAdminDate, formatAdminTime } from "@/lib/format-date";
import { toSafeDisplayNumber } from "@/lib/money";

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
    header: () => {
      const t = useTranslations("adminDashboard.ledgerColumns");
      return t("dateTime");
    },
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
    header: () => {
      const t = useTranslations("adminDashboard.ledgerColumns");
      return t("transaction");
    },
    cell: ({ row }) => {
      const entry = row.original;
      const t = useTranslations("adminDashboard.ledgerColumns");
      return (
        <div className="space-y-0.5 text-xs">
          <div className="font-bold text-slate-900 uppercase font-mono tracking-wider text-[10px]">
            {entry.transaction.type.replace(/_/g, " ")}
          </div>
          <div className="text-[9px] text-slate-400 font-mono truncate max-w-[80px]">
            {t("idPrefix")} {entry.transactionId}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "ownerName",
    header: () => {
      const t = useTranslations("adminDashboard.ledgerColumns");
      return t("accountOwner");
    },
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
    header: () => {
      const t = useTranslations("adminDashboard.ledgerColumns");
      return t("accountCategory");
    },
    cell: ({ row }) => {
      const entry = row.original;
      const t = useTranslations("adminDashboard.ledgerColumns");
      return (
        <div className="space-y-0.5 text-xs">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Wallet className="size-3 text-slate-400 shrink-0" />
            {entry.account.accountCategory}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            {t("classLabel", { cls: entry.account.accountClass })}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "side",
    header: () => {
      const t = useTranslations("adminDashboard.ledgerColumns");
      return t("entrySide");
    },
    cell: ({ row }) => {
      const side = row.original.side;
      const t = useTranslations("adminDashboard.ledgerColumns");
      return (
        <div className="flex items-center">
          {side === "CREDIT" ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              <ArrowDownLeft className="size-3.5 shrink-0" />
              {t("credit")}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
              <ArrowUpRight className="size-3.5 shrink-0" />
              {t("debit")}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: () => {
      const t = useTranslations("adminDashboard.ledgerColumns");
      return t("amount");
    },
    cell: ({ row }) => {
      const entry = row.original;
      const t = useTranslations("adminDashboard.ledgerColumns");
      const formattedAmount = new Intl.NumberFormat("en-US").format(
        toSafeDisplayNumber(entry.amount)
      );
      return (
        <div className="flex items-center gap-1.5">
          <Coins className="size-3.5 text-slate-400 shrink-0" />
          <span
            className={`font-semibold font-mono text-xs ${
              entry.side === "CREDIT" ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {formattedAmount} {t("xof")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: () => {
      const t = useTranslations("adminDashboard.ledgerColumns");
      return t("descriptionReference");
    },
    cell: ({ row }) => {
      const entry = row.original;
      const t = useTranslations("adminDashboard.ledgerColumns");
      return (
        <div className="space-y-0.5 text-xs max-w-[200px] min-w-[120px]">
          <div className="text-slate-700 font-medium truncate" title={entry.description || ""}>
            {entry.description || t("na")}
          </div>
          {entry.referenceId && (
            <div className="text-[10px] text-slate-400 truncate">
              {t("refPrefix")} <span className="font-mono">{entry.referenceId}</span> ({entry.referenceType})
            </div>
          )}
        </div>
      );
    },
  },
];
