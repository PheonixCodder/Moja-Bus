"use client";

import { Badge } from "@moja/ui/components/ui/badge";
import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { format } from "date-fns";
import { Bell, Pause, Play, Settings2 } from "lucide-react";

import { useTranslations } from "next-intl";

export type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "PAUSED"
  | "EXHAUSTED"
  | "EXPIRED"
  | "ARCHIVED";

export interface CampaignListItem {
  id: string;
  name: string;
  status: CampaignStatus;
  benefitType: string;
  percentBps?: number | null;
  amountXOF?: number | null;
  budgetXOF?: number | null;
  budgetConsumedXOF: number;
  budgetReservedXOF: number;
  isAutoApply: boolean;
  firstBookingOnly: boolean;
  createdAt: string | Date;
  _count: {
    coupons: number;
    redemptions: number;
  };
}

interface AdminCampaignsTableProps {
  items: CampaignListItem[];
  isLoading: boolean;
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string) => void;
  onStatusChange: (
    id: string,
    status: "ACTIVE" | "PAUSED",
    pauseReason?: string,
  ) => void;
  onNotifyPassengers: (id: string) => void;
  statusPending: boolean;
  notifyPending: boolean;
}

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ACTIVE") return "default";
  if (status === "PAUSED") return "secondary";
  if (status === "EXHAUSTED" || status === "EXPIRED") return "destructive";
  return "outline";
}

export function AdminCampaignsTable({
  items,
  isLoading,
  selectedCampaignId,
  onSelectCampaign,
  onStatusChange,
  onNotifyPassengers,
  statusPending,
  notifyPending,
}: AdminCampaignsTableProps) {
  const t = useTranslations("adminDashboard.campaigns.table");

  function benefitLabel(item: {
    benefitType: string;
    percentBps?: number | null;
    amountXOF?: number | null;
  }) {
    if (item.benefitType === "PERCENT_OFF")
      return t("percentOff", { pct: (item.percentBps ?? 0) / 100 });
    if (item.benefitType === "FIXED_AMOUNT_OFF")
      return t("fixedOff", { amount: item.amountXOF?.toLocaleString() ?? "0" });
    if (item.benefitType === "WALLET_CREDIT_GRANT")
      return t("creditGrant", {
        amount: item.amountXOF?.toLocaleString() ?? "0",
      });
    return item.benefitType;
  }

  return (
    <Card className="overflow-hidden border-border shadow-xs bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold text-foreground">
              {t("campaign")}
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              {t("benefit")}
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              {t("status")}
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              {t("budgetUsed")}
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              {t("redemptions")}
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              {t("created")}
            </TableHead>
            <TableHead className="text-right font-semibold text-foreground">
              {t("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                {t("loading")}
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                {t("empty")}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const spent = item.budgetConsumedXOF + item.budgetReservedXOF;
              const hasBudget = item.budgetXOF != null && item.budgetXOF > 0;
              const pct = hasBudget
                ? Math.min(100, Math.round((spent / item.budgetXOF!) * 100))
                : 0;
              const isSelected = selectedCampaignId === item.id;

              return (
                <TableRow
                  key={item.id}
                  className={`transition-colors ${
                    isSelected
                      ? "bg-primary/10 hover:bg-primary/15"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {item.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      {item.isAutoApply && (
                        <span className="inline-flex items-center rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/20">
                          {t("autoApplyTag")}
                        </span>
                      )}
                      {item.firstBookingOnly && (
                        <span className="inline-flex items-center rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/20">
                          {t("firstBookingTag")}
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {item.id.slice(-6)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-semibold text-foreground">
                      {benefitLabel(item)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={statusVariant(item.status)}
                      className="capitalize"
                    >
                      {item.status.toLowerCase()}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-sm">
                    {hasBudget ? (
                      <div className="space-y-1 min-w-32">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {spent.toLocaleString()} XOF
                          </span>
                          <span className="text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              pct >= 90
                                ? "bg-destructive"
                                : pct >= 70
                                  ? "bg-warning"
                                  : "bg-success"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t("unlimited")}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground tabular-nums">
                      {item._count.redemptions}
                    </span>
                    <span className="text-muted-foreground"> {t("uses")} · </span>
                    <span className="tabular-nums font-semibold text-foreground">
                      {item._count.coupons}
                    </span>
                    <span className="text-muted-foreground"> {t("codes")}</span>
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {format(new Date(item.createdAt), "dd MMM yyyy")}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => onSelectCampaign(item.id)}
                        className="gap-1.5 font-medium"
                      >
                        <Settings2 className="size-3.5" />
                        {t("manage")}
                      </Button>

                      {item.status === "ACTIVE" ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={notifyPending}
                            onClick={() => onNotifyPassengers(item.id)}
                            title={t("notifyPassengers")}
                            className="size-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Bell className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={statusPending}
                            onClick={() =>
                              onStatusChange(
                                item.id,
                                "PAUSED",
                                "Paused from admin dashboard",
                              )
                            }
                            title={t("pauseCampaign")}
                            className="size-8 p-0 text-warning hover:text-warning hover:bg-warning/10"
                          >
                            <Pause className="size-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={statusPending}
                          onClick={() => onStatusChange(item.id, "ACTIVE")}
                          title={t("activateCampaign")}
                          className="size-8 p-0 text-success hover:text-success hover:bg-success/10"
                        >
                          <Play className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
