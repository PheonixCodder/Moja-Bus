"use client";

import { useTranslations } from "next-intl";
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
import { Pause, Play, Plus, Tag } from "lucide-react";

export interface PromoListItem {
  id: string;
  name: string;
  status: string;
  benefitType: string;
  percentBps?: number | null;
  amountXOF?: number | null;
  createdAt: string | Date;
  _count: { redemptions: number; coupons: number };
}

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ACTIVE") return "default";
  if (status === "PAUSED") return "secondary";
  return "outline";
}

interface OperatorPromotionsTableProps {
  items: PromoListItem[];
  isLoading: boolean;
  selectedPromoId: string | null;
  onSelectPromo: (id: string) => void;
  onStatusChange: (id: string, status: "ACTIVE" | "PAUSED") => void;
  isStatusPending: boolean;
  onCreatePromo: () => void;
}

export function OperatorPromotionsTable({
  items,
  isLoading,
  selectedPromoId,
  onSelectPromo,
  onStatusChange,
  isStatusPending,
  onCreatePromo,
}: OperatorPromotionsTableProps) {
  const t = useTranslations("operatorDashboard.promotions.table");

  function benefitLabel(item: {
    benefitType: string;
    percentBps?: number | null;
    amountXOF?: number | null;
  }) {
    if (item.benefitType === "PERCENT_OFF")
      return t("percentOff", { percent: (item.percentBps ?? 0) / 100 });
    if (item.benefitType === "FIXED_AMOUNT_OFF")
      return t("fixedOff", { amount: item.amountXOF?.toLocaleString() ?? 0 });
    return item.benefitType;
  }

  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/60">
            <TableHead className="font-semibold text-slate-600">
              {t("promotion")}
            </TableHead>
            <TableHead className="font-semibold text-slate-600">
              {t("benefit")}
            </TableHead>
            <TableHead className="font-semibold text-slate-600">
              {t("status")}
            </TableHead>
            <TableHead className="font-semibold text-slate-600">
              {t("usage")}
            </TableHead>
            <TableHead className="font-semibold text-slate-600">
              {t("created")}
            </TableHead>
            <TableHead className="text-right font-semibold text-slate-600">
              {t("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-12 text-center text-sm text-slate-400"
              >
                {t("loading")}
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-16 text-center">
                <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
                    <Tag className="size-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {t("emptyTitle")}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {t("emptyDesc")}
                    </p>
                  </div>
                  <Button type="button" size="sm" onClick={onCreatePromo}>
                    <Plus className="size-3.5" />
                    {t("newPromo")}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow
                key={item.id}
                className={
                  selectedPromoId === item.id
                    ? "bg-slate-50"
                    : "hover:bg-slate-50/50"
                }
              >
                <TableCell>
                  <div className="font-medium text-slate-900">{item.name}</div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
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
                <TableCell className="text-sm text-slate-600">
                  <span className="font-semibold tabular-nums">
                    {t("usesCount", { count: item._count.redemptions })}
                  </span>
                  <span className="text-slate-400"> · </span>
                  <span className="tabular-nums">
                    {t("codesCount", { count: item._count.coupons })}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-slate-500">
                  {format(new Date(item.createdAt), "dd MMM yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        selectedPromoId === item.id ? "default" : "outline"
                      }
                      onClick={() => onSelectPromo(item.id)}
                    >
                      {t("manage")}
                    </Button>
                    {item.status === "ACTIVE" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isStatusPending}
                        onClick={() => onStatusChange(item.id, "PAUSED")}
                        title={t("pause")}
                      >
                        <Pause className="size-3.5" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isStatusPending}
                        onClick={() => onStatusChange(item.id, "ACTIVE")}
                        title={t("activate")}
                      >
                        <Play className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
