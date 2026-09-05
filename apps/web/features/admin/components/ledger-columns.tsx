"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownLeft, ArrowUpRight, Coins, Wallet } from "lucide-react";
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
          <div className="font-semibold text-foreground">
            {formatAdminDate(row.original.effectiveAt)}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
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
          <div className="font-bold text-foreground uppercase font-mono tracking-wider text-[10px]">
            {entry.transaction.type.replace(/_/g, " ")}
          </div>
          <div className="text-[9px] text-muted-foreground font-mono truncate max-w-20">
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
          <div className="font-semibold text-foreground">{entry.ownerName}</div>
          {entry.ownerEmail && (
            <div className="text-[10px] text-muted-foreground truncate max-w-36">
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
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Wallet className="size-3 text-muted-foreground shrink-0" />
            {entry.account.accountCategory}
          </div>
          <div className="text-[10px] text-muted-foreground font-medium">
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
            <span className="flex items-center gap-1 text-[11px] font-bold text-success bg-success/10 px-2 py-0.5 rounded border border-success/20">
              <ArrowDownLeft className="size-3.5 shrink-0" />
              {t("credit")}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">
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
        toSafeDisplayNumber(entry.amount),
      );
      return (
        <div className="flex items-center gap-1.5">
          <Coins className="size-3.5 text-muted-foreground shrink-0" />
          <span
            className={`font-semibold font-mono text-xs ${
              entry.side === "CREDIT" ? "text-success" : "text-destructive"
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
        <div className="space-y-0.5 text-xs max-w-48 min-w-28">
          <div
            className="text-foreground font-medium truncate"
            title={entry.description || ""}
          >
            {entry.description || t("na")}
          </div>
          {entry.referenceId && (
            <div className="text-[10px] text-muted-foreground truncate">
              {t("refPrefix")}{" "}
              <span className="font-mono">{entry.referenceId}</span> (
              {entry.referenceType})
            </div>
          )}
        </div>
      );
    },
  },
];
